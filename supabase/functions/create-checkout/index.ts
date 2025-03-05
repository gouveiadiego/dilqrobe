
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { stripe } from '../_shared/stripe.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  console.log("Received create-checkout request");
  
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    let body;
    try {
      body = await req.json();
      console.log("Request body parsed:", JSON.stringify(body));
    } catch (e) {
      console.error("Error parsing request body:", e);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { priceId, successUrl, cancelUrl, userId, userEmail } = body;
    
    if (!priceId) {
      console.error("No priceId provided in request");
      return new Response(
        JSON.stringify({ error: 'Price ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the stripe instance is initialized properly
    if (!stripe) {
      console.error("Stripe instance is not initialized");
      return new Response(
        JSON.stringify({ error: 'Stripe is not properly configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user information - use direct info first if provided
    let userInfo = null;
    
    // Case 1: Check if userId and userEmail were passed directly in the request body
    if (userId && userEmail) {
      console.log("Using user information provided in request body:", { userId, userEmail });
      userInfo = { id: userId, email: userEmail };
    } 
    // Case 2: Try to get user from auth header
    else {
      console.log("Attempting to get user from authorization header");
      const authHeader = req.headers.get('Authorization');
      
      // Get Supabase environment variables
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Missing Supabase environment variables", { 
          hasUrl: !!supabaseUrl, 
          hasAnonKey: !!supabaseAnonKey 
        });
        return new Response(
          JSON.stringify({ error: 'Server configuration error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log("Creating Supabase client with URL:", supabaseUrl);
      console.log("Auth header present:", !!authHeader);
      
      if (!authHeader) {
        console.error("No authorization header provided and no direct user info in request");
        return new Response(
          JSON.stringify({ 
            error: 'Authentication required', 
            details: 'No authorization header or user info provided' 
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create the supabase client with the auth header
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { 
          headers: { Authorization: authHeader } 
        },
      });

      // Try to get user info
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Error getting user from auth header:", error);
          throw error;
        }
        
        if (!user) {
          console.error("No user found in auth header");
          throw new Error("No user found in authentication header");
        }
        
        userInfo = user;
        console.log("User authenticated successfully from auth header:", user.id);
      } catch (authError) {
        console.error("Authentication error:", authError);
        return new Response(
          JSON.stringify({ 
            error: 'Authentication failed', 
            details: authError instanceof Error ? authError.message : String(authError) 
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!userInfo || !userInfo.id || !userInfo.email) {
      console.error("Could not determine user information");
      return new Response(
        JSON.stringify({ error: 'User information missing or incomplete' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Creating checkout session for user:", userInfo.id);
    console.log("With price ID:", priceId);
    
    // Check if user already has a Stripe customer ID
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let stripeCustomerId = null;
    
    // Try to find an existing customer ID for this user
    try {
      const { data: subscriptionData, error } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userInfo.id)
        .maybeSingle();
      
      if (!error && subscriptionData && subscriptionData.stripe_customer_id) {
        stripeCustomerId = subscriptionData.stripe_customer_id;
        console.log("Found existing Stripe customer ID:", stripeCustomerId);
      }
    } catch (err) {
      console.error("Error checking for existing customer:", err);
      // Continue with checkout even if this fails
    }
    
    // Create the checkout session
    try {
      // CRITICAL: Always use the user ID as the client_reference_id
      const sessionParams: any = {
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl || `${req.headers.get('origin') || Deno.env.get('SUPABASE_URL')}/dashboard?success=true`,
        cancel_url: cancelUrl || `${req.headers.get('origin') || Deno.env.get('SUPABASE_URL')}/dashboard?cancelled=true`,
        client_reference_id: userInfo.id, // Using user ID as client_reference_id
        subscription_data: {
          trial_period_days: 3,
          metadata: {
            user_id: userInfo.id,
          },
        }
      };
      
      // If we have an existing customer, use it, otherwise set the email
      if (stripeCustomerId) {
        sessionParams.customer = stripeCustomerId;
      } else {
        sessionParams.customer_email = userInfo.email;
      }
      
      console.log("Creating checkout session with params:", JSON.stringify({
        ...sessionParams,
        customer_email: sessionParams.customer_email ? "[REDACTED]" : undefined,
      }));
      
      const session = await stripe.checkout.sessions.create(sessionParams);

      console.log("Checkout session created successfully:", session.id);
      
      return new Response(
        JSON.stringify({ sessionId: session.id, url: session.url }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (stripeError) {
      console.error('Stripe error creating checkout session:', stripeError);
      return new Response(
        JSON.stringify({ 
          error: 'Error creating checkout session with Stripe', 
          details: stripeError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error) {
    console.error('Unexpected error creating checkout session:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected error occurred', 
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
