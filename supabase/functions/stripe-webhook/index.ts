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
    
    // Create Stripe event by verifying signature - using async/await pattern
    let event;
    try {
      // Use constructEventAsync instead of constructEvent for Deno/Edge runtime
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log("Signature verification successful");
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed:`, err.message);
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
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
        
        // Extract customer ID from the session
        const stripeCustomerId = session.customer;
        const clientReferenceId = session.client_reference_id;
        
        console.log("Session details:", {
          stripeCustomerId,
          clientReferenceId,
          hasSubscription: !!session.subscription,
          mode: session.mode,
          paymentStatus: session.payment_status
        });
        
        if (!clientReferenceId) {
          console.error("Missing client_reference_id in checkout session");
          return new Response(JSON.stringify({ error: 'Missing client_reference_id in checkout session' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        if (session.subscription && session.payment_status === 'paid') {
          console.log("Fetching subscription details for ID:", session.subscription);
          
          try {
            const subscription = await stripe.subscriptions.retrieve(session.subscription);
            console.log("Subscription retrieved:", {
              id: subscription.id,
              status: subscription.status,
              currentPeriodEnd: subscription.current_period_end,
              items: subscription.items.data.length
            });
            
            // Determine plan type based on subscription interval
            const priceId = subscription.items.data[0].price.id;
            console.log("Price ID:", priceId);
            
            // Get product details to determine the plan type
            const priceDetails = await stripe.prices.retrieve(priceId);
            const productId = priceDetails.product;
            const product = await stripe.products.retrieve(productId as string);
            
            // Determine plan type from product metadata or name
            const planType = product.metadata.plan_type || 
                           (product.name.toLowerCase().includes('annual') ? 'annual' : 'monthly');
            
            console.log("Determined plan type:", planType);
            
            // Create subscription record in Supabase
            console.log("Creating subscription record for user:", clientReferenceId);
            const subscriptionData = {
              user_id: clientReferenceId,
              subscription_id: subscription.id,
              status: subscription.status,
              price_id: priceId,
              quantity: subscription.items.data[0].quantity,
              cancel_at_period_end: subscription.cancel_at_period_end,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
              trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
              stripe_customer_id: stripeCustomerId, 
              plan_type: planType,
              stripe_subscription_id: subscription.id
            };
            
            console.log("Upserting subscription data:", JSON.stringify(subscriptionData));
            
            const { data, error } = await supabase
              .from('subscriptions')
              .upsert(subscriptionData)
              .select();
            
            if (error) {
              console.error("Error upserting subscription record:", error);
              throw error;
            }
            
            console.log(`Subscription record created/updated for user ${clientReferenceId}:`, data);
          } catch (error) {
            console.error("Error processing subscription:", error);
            throw error;
          }
        } else {
          console.log("No subscription found in session or payment not complete:", {
            subscription: session.subscription,
            paymentStatus: session.payment_status
          });
        }
        break;
      }
      case 'customer.subscription.updated': {
        console.log("Processing customer.subscription.updated event");
        const subscription = event.data.object;
        const userId = subscription.metadata?.user_id;
        
        // Get customer ID and determine plan type
        const stripeCustomerId = subscription.customer;
        
        // Get product details to determine the plan type
        const priceId = subscription.items.data[0].price.id;
        const priceDetails = await stripe.prices.retrieve(priceId);
        const productId = priceDetails.product;
        const product = await stripe.products.retrieve(productId as string);
        
        // Determine plan type from product metadata or name
        const planType = product.metadata.plan_type || 
                       (product.name.toLowerCase().includes('annual') ? 'annual' : 'monthly');
        
        console.log("Subscription update - Customer ID:", stripeCustomerId, "Plan Type:", planType);
        
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
            stripe_customer_id: stripeCustomerId,
            plan_type: planType,
            stripe_subscription_id: subscription.id,
          });
          
          if (error) {
            console.error("Error updating subscription record:", error);
            throw error;
          }
          
          console.log(`Subscription updated for user ${userId} with customer ID ${stripeCustomerId} and plan type ${planType}`);
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
