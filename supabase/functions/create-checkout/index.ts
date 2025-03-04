
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

    // Try to create a checkout session with test or live mode price
    try {
      // First determine if we have a product ID or price ID
      let actualPriceId = priceId;
      
      if (priceId.startsWith('prod_')) {
        // It's a product ID, we need to find its default price
        console.log(`Retrieving default price for product ${priceId}`);
        try {
          const product = await stripe.products.retrieve(priceId);
          if (product.default_price) {
            actualPriceId = String(product.default_price);
            console.log(`Retrieved price ID ${actualPriceId} from product ${priceId}`);
          } else {
            console.error(`Product ${priceId} doesn't have a default price`);
            return new Response(
              JSON.stringify({ 
                error: "O produto não tem um preço padrão definido",
                type: "product_error"
              }),
              {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
              }
            );
          }
        } catch (productError: any) {
          console.error(`Error retrieving product ${priceId}:`, productError);
          return new Response(
            JSON.stringify({ 
              error: `Erro ao buscar o produto: ${productError.message}`,
              type: "stripe_error"
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          );
        }
      }

      // Create Stripe checkout session with updated price of R$19.00
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
    } catch (stripeError: any) {
      console.error('Stripe API error:', stripeError);
      
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
  } catch (error: any) {
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
