
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
    
    const { priceId, successUrl, cancelUrl } = body;
    
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

    // Log all headers for debugging
    console.log("Request headers:");
    for (const [key, value] of req.headers.entries()) {
      console.log(`${key}: ${key === 'authorization' ? 'REDACTED' : value}`);
    }

    // Get the user from the auth header
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const authHeader = req.headers.get('Authorization');
    
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
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: 'Authentication required', details: 'No authorization header provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the supabase client with the auth header
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { 
        headers: { Authorization: authHeader } 
      },
    });

    // Attempt direct token validation
    let userInfo = null;
    try {
      console.log("Attempting to extract user from JWT token");
      const jwt = authHeader.replace('Bearer ', '');
      
      // First try using getUser
      const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
      
      if (userError) {
        console.error("Error validating token with getUser:", userError);
        // Don't throw yet, we'll try the session approach
      } else if (user) {
        userInfo = user;
        console.log("User authenticated successfully via token:", user.id);
      }
    } catch (tokenError) {
      console.error("Error processing token:", tokenError);
      // Continue to next approach
    }

    // If token approach failed, try session
    if (!userInfo) {
      try {
        console.log("Attempting to get session");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting session:", sessionError);
          return new Response(
            JSON.stringify({ error: 'Authentication error', details: 'Invalid session' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (!session || !session.user) {
          console.error("No user found in session");
          return new Response(
            JSON.stringify({ error: 'No authenticated user found' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        userInfo = session.user;
        console.log("User authenticated via session:", userInfo.id);
      } catch (sessionError) {
        console.error("Error during session retrieval:", sessionError);
        return new Response(
          JSON.stringify({ error: 'Authentication process failed', details: sessionError instanceof Error ? sessionError.message : String(sessionError) }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!userInfo || !userInfo.id || !userInfo.email) {
      console.error("Could not authenticate user properly");
      return new Response(
        JSON.stringify({ error: 'User authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Creating checkout session for user:", userInfo.id);
    console.log("With price ID:", priceId);
    
    // Create the checkout session
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl || `${Deno.env.get('SUPABASE_URL')}/dashboard?success=true`,
        cancel_url: cancelUrl || `${Deno.env.get('SUPABASE_URL')}/dashboard?cancelled=true`,
        client_reference_id: userInfo.id,
        subscription_data: {
          trial_period_days: 3,
          metadata: {
            user_id: userInfo.id,
          },
        },
        customer_email: userInfo.email,
      });

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
