
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import Stripe from "https://esm.sh/stripe@13.9.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("Webhook signature missing");
      return new Response("Webhook signature missing", { status: 400 });
    }

    // Get raw body
    const body = await req.text();
    
    // Verify the event
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? ""
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Initialize Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Handle the event
    console.log(`Processing event: ${event.type}`);
    
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("Checkout session completed:", JSON.stringify(session, null, 2));
        
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        
        if (!customerId || !subscriptionId) {
          console.error("Missing customer ID or subscription ID in session");
          break;
        }
        
        // Get customer to find the Supabase user ID
        const customer = await stripe.customers.retrieve(customerId);
        const supabaseUserId = customer.metadata?.supabaseUserId;
        
        if (!supabaseUserId) {
          console.error("No Supabase user ID found in customer metadata");
          break;
        }
        
        console.log(`Found user ID ${supabaseUserId} for customer ${customerId}`);
        
        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        console.log("Subscription details:", JSON.stringify(subscription, null, 2));
        
        // Get price ID from subscription
        const priceId = subscription.items.data[0]?.price.id;
        
        // Update subscription in database with all details
        const subscriptionData = {
          user_id: supabaseUserId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: "active",
          plan_type: "pro",
          price_id: priceId,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        };
        
        // Upsert subscription data
        const { error } = await supabaseAdmin
          .from("subscriptions")
          .upsert(subscriptionData, { onConflict: 'user_id' });
          
        if (error) {
          console.error("Error updating subscription:", error);
        } else {
          console.log(`Subscription activated for user ${supabaseUserId}`);
        }
        break;
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        
        // Get the Supabase user ID from the subscription's customer
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const supabaseUserId = customer.metadata?.supabaseUserId;
        
        if (!supabaseUserId) {
          console.error("No Supabase user ID found in customer metadata");
          break;
        }
        
        // Update subscription in database
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq("user_id", supabaseUserId);
          
        console.log(`Subscription updated for user ${supabaseUserId}`);
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        
        // Get the Supabase user ID from the subscription's customer
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const supabaseUserId = customer.metadata?.supabaseUserId;
        
        if (!supabaseUserId) {
          console.error("No Supabase user ID found in customer metadata");
          break;
        }
        
        // Update subscription status in database
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "canceled"
          })
          .eq("user_id", supabaseUserId);
          
        console.log(`Subscription canceled for user ${supabaseUserId}`);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error.message);
    return new Response(`Webhook Error: ${error.message}`, { status: 500 });
  }
});
