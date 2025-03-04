
// Import just what we need for HTTP server
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
    // Import dependencies directly inside the handler to avoid bundling issues
    const { createClient } = await import("https://esm.sh/v135/@supabase/supabase-js@2.38.0?no-dts");
    const Stripe = await import("https://esm.sh/v135/stripe@12.4.0?no-dts").then(mod => mod.default);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Stripe key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not defined');
      return new Response(
        JSON.stringify({ 
          error: "A chave STRIPE_SECRET_KEY não está configurada. Por favor, configure-a no console do Supabase.",
          type: "configuration_error"
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Parse request data
    const requestData = await req.json();
    const { priceId, successUrl, cancelUrl, email } = requestData;

    // Validate request data
    if (!priceId) {
      console.error('Price ID not provided in request');
      return new Response(
        JSON.stringify({ 
          error: "ID de preço não fornecido",
          type: "validation_error"
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    if (!successUrl || !cancelUrl) {
      console.error('Success or cancel URLs not provided');
      return new Response(
        JSON.stringify({ 
          error: "URLs de redirecionamento incompletas",
          type: "validation_error"
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Log for debugging
    console.log(`Creating checkout for: ${email}, price/product: ${priceId}`);
    console.log(`URLs: success=${successUrl}, cancel=${cancelUrl}`);

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Set the price ID for the R$19 monthly plan (to be used if we have a product ID)
    const MONTHLY_PRICE_ID = "price_1QyjH8EJEe6kPCYCvdPmQNZS";

    try {
      // First determine if we have a product ID or price ID
      let actualPriceId = priceId;
      
      if (priceId.startsWith('prod_')) {
        console.log(`Using fixed price ID ${MONTHLY_PRICE_ID} instead of product ID ${priceId}`);
        actualPriceId = MONTHLY_PRICE_ID;
      }

      console.log(`Using price ID for checkout: ${actualPriceId}`);

      // Create Stripe checkout session with the price of R$19.00
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: actualPriceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: email,
        subscription_data: {
          trial_period_days: 3, // Ensure 3-day trial is applied
        },
      });

      console.log(`Checkout session created: ${session.id}`);
      console.log(`Checkout URL: ${session.url}`);

      // Return success response
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
      
      // Check if we're in development mode and should return a mock response
      if (Deno.env.get('ENVIRONMENT') === 'development' || stripeSecretKey.includes('test')) {
        console.log('Development mode detected, providing mock checkout URL');
        return new Response(
          JSON.stringify({ 
            checkoutUrl: successUrl, // Redirect directly to success URL for testing
            sessionId: 'mock_session_id',
            isMock: true
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
      
      // Handle test/live mode mismatch
      if (stripeError.message && stripeError.message.includes('live mode')) {
        return new Response(
          JSON.stringify({ 
            error: "O produto foi criado no modo 'live' do Stripe, mas você está usando uma chave de API de teste. Por favor, use o ID de um produto no modo teste ou mude para a chave de API 'live'.",
            type: "mode_mismatch_error"
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
      
      // For any other Stripe errors
      return new Response(
        JSON.stringify({ 
          error: `Erro do Stripe: ${stripeError.message}`,
          type: "stripe_error"
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
  } catch (error) {
    console.error('Function execution error:', error);
    return new Response(
      JSON.stringify({ 
        error: `Erro interno: ${error.message}`,
        type: "server_error"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
