
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { stripe } from '../_shared/stripe.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    console.error('Stripe signature missing');
    return new Response(JSON.stringify({ error: 'Stripe signature missing' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
  if (!webhookSecret) {
    console.error('Webhook secret not configured');
    return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.text();
    console.log("Received webhook event");
    
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log("Webhook event type:", event.type);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase URL or service key not configured');
      return new Response(JSON.stringify({ error: 'Supabase credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case 'checkout.session.completed': {
        console.log("Processing checkout.session.completed event");
        const session = event.data.object;
        if (session.subscription && session.client_reference_id) {
          console.log("Fetching subscription details for ID:", session.subscription);
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          
          console.log("Upserting subscription record for user:", session.client_reference_id);
          const { data, error } = await supabase.from('subscriptions').upsert({
            user_id: session.client_reference_id,
            subscription_id: subscription.id,
            status: subscription.status,
            price_id: subscription.items.data[0].price.id,
            quantity: subscription.items.data[0].quantity,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          });
          
          if (error) {
            console.error("Error upserting subscription record:", error);
            throw error;
          }

          console.log(`Subscription record created/updated for user ${session.client_reference_id}`);
        }
        break;
      }
      case 'customer.subscription.updated': {
        console.log("Processing customer.subscription.updated event");
        const subscription = event.data.object;
        const userId = subscription.metadata?.user_id;
        
        if (userId) {
          console.log("Updating subscription record for user:", userId);
          const { error } = await supabase.from('subscriptions').upsert({
            user_id: userId,
            subscription_id: subscription.id,
            status: subscription.status,
            price_id: subscription.items.data[0].price.id,
            quantity: subscription.items.data[0].quantity,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          });
          
          if (error) {
            console.error("Error updating subscription record:", error);
            throw error;
          }
          
          console.log(`Subscription updated for user ${userId}`);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        console.log("Processing customer.subscription.deleted event");
        const subscription = event.data.object;
        const userId = subscription.metadata?.user_id;
        
        if (userId) {
          console.log("Marking subscription as canceled for user:", userId);
          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              ended_at: new Date().toISOString(),
            })
            .eq('subscription_id', subscription.id);
            
          if (error) {
            console.error("Error marking subscription as canceled:", error);
            throw error;
          }
            
          console.log(`Subscription canceled for user ${userId}`);
        }
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(`Webhook error: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
