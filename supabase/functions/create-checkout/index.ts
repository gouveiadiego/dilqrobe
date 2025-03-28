
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
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header is required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the user from the auth header
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: userError }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { priceId, successUrl, cancelUrl } = await req.json();

    if (!priceId || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating checkout session for user ${user.id} with priceId ${priceId}`);

    // Get user profile to access name and email
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("full_name, cpf")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    // Check if subscription exists for this user
    const { data: existingSubscription } = await supabaseClient
      .from("subscriptions")
      .select("stripe_customer_id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId: string | null = null;
    let shouldCreateCustomer = true;
    
    // If there's an existing subscription with a customer ID, we'll try to use it
    if (existingSubscription?.stripe_customer_id) {
      try {
        // Verify the customer exists in Stripe
        const customer = await stripe.customers.retrieve(existingSubscription.stripe_customer_id);
        if (customer && !customer.deleted) {
          customerId = existingSubscription.stripe_customer_id;
          shouldCreateCustomer = false;
          console.log(`Using existing customer ID: ${customerId}`);
        }
      } catch (error) {
        console.log(`Error retrieving customer, will create a new one: ${error.message}`);
        // If there's an error retrieving the customer, we'll create a new one
        shouldCreateCustomer = true;
      }
    }

    // Create a new customer if needed
    if (shouldCreateCustomer) {
      try {
        // Create a new customer
        const newCustomer = await stripe.customers.create({
          email: user.email,
          name: profile?.full_name || user.email?.split("@")[0],
          metadata: {
            supabaseUserId: user.id,
            cpf: profile?.cpf || "",
          },
        });
        customerId = newCustomer.id;
        console.log(`Created new customer: ${customerId}`);
      } catch (error) {
        console.error("Error creating customer:", error);
        return new Response(
          JSON.stringify({ error: `Error creating Stripe customer: ${error.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!customerId) {
      return new Response(
        JSON.stringify({ error: "Failed to create or retrieve a Stripe customer" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Register or update subscription in database
    const subscriptionData = {
      user_id: user.id,
      stripe_customer_id: customerId,
      status: "incomplete",
      plan_type: "pro",
      price_id: priceId,
    };

    if (existingSubscription) {
      // Update existing record
      await supabaseClient
        .from("subscriptions")
        .update(subscriptionData)
        .eq("user_id", user.id);
      
      console.log(`Updated subscription record for user ${user.id} with price_id ${priceId}`);
    } else {
      // Insert new record
      await supabaseClient
        .from("subscriptions")
        .insert(subscriptionData);
      
      console.log(`Pre-registered subscription for user ${user.id} with price_id ${priceId}`);
    }

    // Create checkout session
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        billing_address_collection: "auto",
        tax_id_collection: {
          enabled: true,
        },
        customer_update: {
          address: "auto",
          name: "auto",
        },
        metadata: {
          supabaseUserId: user.id,
          priceId: priceId,
        },
      });

      console.log(`Created checkout session: ${session.id} for user ${user.id}`);
      
      return new Response(
        JSON.stringify({ url: session.url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Stripe checkout error:", error);
      return new Response(
        JSON.stringify({ error: `Stripe checkout error: ${error.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
