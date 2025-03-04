
// Simple imports for Edge Function - only what's absolutely needed
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import Stripe from 'https://esm.sh/stripe@12.4.0'

// Configurar cabeçalhos CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Lidar com requisições OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Inicializar cliente Supabase com chave de serviço para acesso completo ao banco de dados
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Inicializar Stripe com a chave secreta
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY não está definida')
      throw new Error('Configuração do Stripe incompleta')
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    // Obter dados da requisição
    const requestData = await req.json()
    const { priceId, successUrl, cancelUrl, email } = requestData

    // Verificar se o ID de preço foi fornecido
    if (!priceId) {
      console.error('ID de preço não fornecido na requisição')
      throw new Error('ID de preço não fornecido')
    }

    // Verificar se temos os URLs de sucesso e cancelamento
    if (!successUrl || !cancelUrl) {
      console.error('URLs de sucesso ou cancelamento não fornecidos')
      throw new Error('URLs de redirecionamento incompletos')
    }

    // Registrar dados para debug
    console.log(`Criando checkout para: ${email}, preço: ${priceId}`)
    console.log(`URLs: sucesso=${successUrl}, cancelamento=${cancelUrl}`)

    // Criar uma sessão de checkout do Stripe
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
          trial_period_days: 3, // Define o período de avaliação como 3 dias
        },
      })

      console.log(`Sessão de checkout criada: ${session.id}`)
      console.log(`URL de checkout: ${session.url}`)

      // Retornar a URL da sessão de checkout
      return new Response(
        JSON.stringify({ 
          checkoutUrl: session.url,
          sessionId: session.id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } catch (stripeError) {
      console.error('Erro na API do Stripe:', stripeError)
      throw new Error(`Erro do Stripe: ${stripeError.message}`)
    }
  } catch (error) {
    console.error('Erro no checkout do Stripe:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
