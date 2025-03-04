
// Follow the Deno deployment guide for Supabase:
// https://deno.com/deploy/docs

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// CORS headers configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle OPTIONS requests for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Import dependencies inside the handler to avoid bundling issues
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.38.0/dist/module/index.js?no-dts");
    const { default: Stripe } = await import("https://esm.sh/stripe@12.4.0/dist/stripe.js?no-dts");

    // Initialize Supabase client with service role key for full database access
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize Stripe with the secret key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not defined');
      throw new Error('Stripe configuration incomplete');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Get request data
    const requestData = await req.json();
    const { priceId, successUrl, cancelUrl, email } = requestData;

    // Verify if price ID was provided
    if (!priceId) {
      console.error('Price ID not provided in request');
      throw new Error('Price ID not provided');
    }

    // Verify if we have success and cancel URLs
    if (!successUrl || !cancelUrl) {
      console.error('Success or cancel URLs not provided');
      throw new Error('Redirect URLs incomplete');
    }

    // Log data for debugging
    console.log(`Creating checkout for: ${email}, price: ${priceId}`);
    console.log(`URLs: success=${successUrl}, cancel=${cancelUrl}`);

    // Create a Stripe checkout session
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
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: email,
        subscription_data: {
          trial_period_days: 3, // 3-day trial period
        },
      });

      console.log(`Checkout session created: ${session.id}`);
      console.log(`Checkout URL: ${session.url}`);

      // Return the checkout session URL
      return new Response(
        JSON.stringify({ 
          checkoutUrl: session.url,
          sessionId: session.id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (stripeError) {
      console.error('Stripe API error:', stripeError);
      throw new Error(`Stripe error: ${stripeError.message}`);
    }
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
