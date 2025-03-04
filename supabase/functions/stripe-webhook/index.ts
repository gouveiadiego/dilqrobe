
// Import just what we need for HTTP server
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle OPTIONS requests for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Import dependencies directly inside the handler to avoid bundling issues
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2?no-dts");
    const Stripe = await import("https://esm.sh/stripe@12?no-dts").then(mod => mod.default);

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY não está definida')
      return new Response(
        JSON.stringify({ error: 'Configuração do Stripe incompleta' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!endpointSecret) {
      console.error('STRIPE_WEBHOOK_SECRET não está definida')
      return new Response(
        JSON.stringify({ error: 'Configuração do webhook incompleta' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Assinatura não fornecida' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    try {
      const body = await req.text()
      let event

      try {
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
      } catch (err) {
        console.error(`Erro de assinatura do webhook: ${err.message}`)
        return new Response(
          JSON.stringify({ error: 'Assinatura inválida' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
      }

      console.log(`Evento recebido: ${event.type}`)

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Process Stripe events
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          const subscription = event.data.object
          
          // Get Stripe customer
          const customer = await stripe.customers.retrieve(subscription.customer)
          
          // Find user by email
          const { data: users, error: userError } = await supabase.auth.admin.listUsers()
          
          if (userError) {
            console.error('Erro ao buscar usuários:', userError.message)
            break
          }
          
          // Find user with the same email as the Stripe customer
          const user = users.users.find(u => u.email === customer.email)
          
          if (!user) {
            console.error('Usuário não encontrado para o email:', customer.email)
            break
          }

          console.log(`Usuário encontrado: ${user.id} para o email: ${customer.email}`)
          console.log(`Status da assinatura: ${subscription.status}, está em avaliação: ${subscription.status === 'trialing' ? 'Sim' : 'Não'}`)

          // Update subscription in database
          const { error: subError } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: user.id,
              stripe_customer_id: subscription.customer,
              stripe_subscription_id: subscription.id,
              status: subscription.status, // Can be 'trialing' during trial period
              plan_type: 'premium',
              price_id: subscription.items.data[0].price.id,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              trial_start: subscription.trial_start 
                ? new Date(subscription.trial_start * 1000).toISOString() 
                : null,
              trial_end: subscription.trial_end 
                ? new Date(subscription.trial_end * 1000).toISOString() 
                : null,
            })
          
          if (subError) {
            console.error('Erro ao atualizar assinatura:', subError.message)
          } else {
            console.log(`Assinatura atualizada para o usuário: ${user.id}`)
            console.log(`Período de avaliação: ${subscription.trial_start ? 'De ' + new Date(subscription.trial_start * 1000).toISOString() + ' até ' + new Date(subscription.trial_end * 1000).toISOString() : 'Não aplicável'}`)
          }
          break
          
        case 'customer.subscription.deleted':
          const canceledSubscription = event.data.object
          
          console.log(`Assinatura cancelada: ${canceledSubscription.id}`)
          
          // Update subscription status to canceled
          const { error: cancelError } = await supabase
            .from('subscriptions')
            .update({ status: 'canceled' })
            .eq('stripe_subscription_id', canceledSubscription.id)
          
          if (cancelError) {
            console.error('Erro ao cancelar assinatura:', cancelError.message)
          } else {
            console.log(`Status da assinatura atualizado para: canceled`)
          }
          break
          
        default:
          console.log(`Evento não processado: ${event.type}`)
      }

      return new Response(
        JSON.stringify({ received: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } catch (error) {
      console.error('Erro ao processar webhook:', error.message)
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }
  } catch (error) {
    console.error('Erro geral no webhook:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
