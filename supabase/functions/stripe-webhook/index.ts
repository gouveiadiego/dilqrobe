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
      return new Response("Webhook signature missing", { status: 400 });
    }

    // Get raw body
    const body = await req.text();
    
    // Verify the event - IMPORTANT: Using constructEventAsync instead of constructEvent
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
        const supabaseUserId = session.metadata?.supabaseUserId;
        
        if (!supabaseUserId) {
          console.error("No Supabase user ID found in session metadata");
          break;
        }
        
        console.log(`Checkout session completed for user ${supabaseUserId}`);
        console.log("Session data:", JSON.stringify(session, null, 2));
        
        // Fetch existing subscription or create a new one
        const { data: existingSubscription } = await supabaseAdmin
          .from("subscriptions")
          .select("*")
          .eq("user_id", supabaseUserId)
          .maybeSingle();
          
        // Get subscription details from Stripe if needed
        let subscriptionDetails = null;
        if (session.subscription) {
          subscriptionDetails = await stripe.subscriptions.retrieve(session.subscription);
          console.log("Retrieved subscription details:", JSON.stringify(subscriptionDetails, null, 2));
        }
        
        // Update subscription status in database
        const subscriptionData = {
          user_id: supabaseUserId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          status: "active",
          plan_type: "pro",
          price_id: session.line_items?.data[0]?.price?.id || existingSubscription?.price_id,
          current_period_start: new Date(session.created * 1000).toISOString(),
          current_period_end: subscriptionDetails ? 
            new Date(subscriptionDetails.current_period_end * 1000).toISOString() : 
            existingSubscription?.current_period_end
        };
        
        const { error: upsertError } = await supabaseAdmin
          .from("subscriptions")
          .upsert(subscriptionData, { onConflict: 'user_id' });
          
        if (upsertError) {
          console.error("Error updating subscription:", upsertError);
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
          .eq("stripe_subscription_id", subscription.id);
          
        console.log(`Subscription updated for user ${supabaseUserId}`);
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        
        // Update subscription status in database
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "canceled"
          })
          .eq("stripe_subscription_id", subscription.id);
          
        console.log(`Subscription canceled: ${subscription.id}`);
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
