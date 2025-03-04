
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
      // Instead of throwing an error, for testing purposes, let's create a mock response
      // This allows the frontend to continue development without Stripe
      
      // Log the request for debugging
      const requestData = await req.json();
      console.log("Received checkout request:", requestData);
      
      // Create a mock checkout URL for development/testing
      const mockCheckoutUrl = `${requestData.successUrl.split('?')[0]}?stripe_mock=true`;
      
      return new Response(
        JSON.stringify({ 
          checkoutUrl: mockCheckoutUrl,
          sessionId: "mock_session_id",
          isMock: true,
          message: "Using mock checkout because STRIPE_SECRET_KEY is not configured"
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Parse request data
    const requestData = await req.json();
    const { priceId, successUrl, cancelUrl, email } = requestData;

    // Validate request data
    if (!priceId) {
      console.error('Price ID not provided in request');
      throw new Error('ID de preço não fornecido');
    }

    if (!successUrl || !cancelUrl) {
      console.error('Success or cancel URLs not provided');
      throw new Error('URLs de redirecionamento incompletas');
    }

    // Log for debugging
    console.log(`Creating checkout for: ${email}, price: ${priceId}`);
    console.log(`URLs: success=${successUrl}, cancel=${cancelUrl}`);

    // Determine if priceId is actually a product ID, and if so, retrieve the default price
    let actualPriceId = priceId;
    if (priceId.startsWith('prod_')) {
      // It's a product ID, we need to find its default price
      const product = await stripe.products.retrieve(priceId);
      if (product.default_price) {
        actualPriceId = String(product.default_price);
        console.log(`Retrieved price ID ${actualPriceId} from product ${priceId}`);
      } else {
        console.error(`Product ${priceId} doesn't have a default price`);
        throw new Error('Produto sem preço padrão definido');
      }
    }

    // Create Stripe checkout session
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
