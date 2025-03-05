
// Import necessary modules
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { stripe } from '../_shared/stripe.ts';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received webhook request');
    
    // Get the signature from the headers
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('No Stripe signature found in request headers');
      return new Response(
        JSON.stringify({ error: 'No Stripe signature found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the request body as text
    const body = await req.text();
    console.log(`Webhook body length: ${body.length} characters`);
    
    // Get the webhook secret from environment variable
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      console.error('No webhook secret found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Construct the event safely with async verification
    let event;
    try {
      console.log('Verifying Stripe signature...');
      // Use async version of constructEvent
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
      console.log(`Webhook verified! Event type: ${event.type}`);
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle the event based on its type
    if (event.type === 'checkout.session.completed') {
      console.log('Processing checkout.session.completed event');
      const session = event.data.object;
      
      // Extract necessary data from the session
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      const clientReferenceId = session.client_reference_id;
      const userEmail = session.customer_email;
      
      console.log('Session details:', {
        customerId,
        subscriptionId,
        clientReferenceId,
        userEmail
      });
      
      if (!clientReferenceId) {
        console.error('No client_reference_id found in session');
        return new Response(
          JSON.stringify({ error: 'No client_reference_id found in session' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (!subscriptionId) {
        console.error('No subscription ID found in session');
        return new Response(
          JSON.stringify({ error: 'No subscription ID found in session' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Get subscription details from Stripe
      console.log(`Fetching subscription details for: ${subscriptionId}`);
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      console.log('Subscription details retrieved:', {
        status: subscription.status,
        plan: subscription.items.data[0]?.plan.id
      });
      
      // Connect to Supabase using Service Role Key (circumvents RLS policies)
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Supabase URL or service key not configured');
        return new Response(
          JSON.stringify({ error: 'Supabase credentials not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Store subscription data in Supabase
      console.log(`Storing subscription in Supabase for user: ${clientReferenceId}`);
      
      const { data, error } = await supabase
        .from('subscriptions')
        .upsert({
          id: subscription.id,
          user_id: clientReferenceId,
          customer_id: customerId,
          status: subscription.status,
          price_id: subscription.items.data[0]?.price.id,
          quantity: subscription.items.data[0]?.quantity,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          created_at: new Date(subscription.created * 1000).toISOString(),
          ended_at: subscription.ended_at 
            ? new Date(subscription.ended_at * 1000).toISOString() 
            : null,
          trial_start: subscription.trial_start 
            ? new Date(subscription.trial_start * 1000).toISOString() 
            : null,
          trial_end: subscription.trial_end 
            ? new Date(subscription.trial_end * 1000).toISOString() 
            : null
        }, { onConflict: 'id' })
        .select();
      
      if (error) {
        console.error('Error storing subscription in Supabase:', error);
        return new Response(
          JSON.stringify({ error: `Error storing subscription: ${error.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Subscription stored successfully:', data);
      
    } else if (event.type === 'customer.subscription.updated') {
      console.log('Processing customer.subscription.updated event');
      const subscription = event.data.object;
      
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Supabase URL or service key not configured');
        return new Response(
          JSON.stringify({ error: 'Supabase credentials not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Update subscription in database
      console.log(`Updating subscription ${subscription.id} in Supabase`);
      
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          price_id: subscription.items.data[0]?.price.id,
          quantity: subscription.items.data[0]?.quantity,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          ended_at: subscription.ended_at 
            ? new Date(subscription.ended_at * 1000).toISOString() 
            : null,
          trial_start: subscription.trial_start 
            ? new Date(subscription.trial_start * 1000).toISOString() 
            : null,
          trial_end: subscription.trial_end 
            ? new Date(subscription.trial_end * 1000).toISOString() 
            : null
        })
        .eq('id', subscription.id)
        .select();
      
      if (error) {
        console.error('Error updating subscription in Supabase:', error);
        return new Response(
          JSON.stringify({ error: `Error updating subscription: ${error.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Subscription updated successfully:', data);
      
    } else if (event.type === 'customer.subscription.deleted') {
      console.log('Processing customer.subscription.deleted event');
      const subscription = event.data.object;
      
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Supabase URL or service key not configured');
        return new Response(
          JSON.stringify({ error: 'Supabase credentials not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Update subscription in database as canceled
      console.log(`Marking subscription ${subscription.id} as deleted in Supabase`);
      
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          cancel_at_period_end: subscription.cancel_at_period_end,
          ended_at: new Date(subscription.ended_at * 1000).toISOString(),
        })
        .eq('id', subscription.id)
        .select();
      
      if (error) {
        console.error('Error updating subscription as deleted in Supabase:', error);
        return new Response(
          JSON.stringify({ error: `Error updating subscription as deleted: ${error.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Subscription marked as deleted successfully:', data);
    }
    
    // Return a response to acknowledge receipt of the event
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Unexpected error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: `Webhook Error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
