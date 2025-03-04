
// Import just what we need for HTTP server
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// Define CORS headers
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
    // Import dependencies dynamically to prevent bundling issues with frontend code
    const { createClient } = await import('https://esm.sh/v135/@supabase/supabase-js@2.38.0?no-dts');
    const Stripe = await import('https://esm.sh/v135/stripe@12.4.0?no-dts').then(mod => mod.default);

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
        case 'checkout.session.completed':
          const checkoutSession = event.data.object;
          console.log('Checkout session completed:', checkoutSession);
          
          // Get customer email from the checkout session
          const customerEmail = checkoutSession.customer_details?.email;
          if (!customerEmail) {
            console.error('Customer email not found in checkout session');
            break;
          }
          
          console.log(`Looking for user with email: ${customerEmail}`);
          
          // Find user by email
          const { data: users, error: userError } = await supabase.auth.admin.listUsers();
          
          if (userError) {
            console.error('Erro ao buscar usuários:', userError.message);
            break;
          }
          
          const user = users.users.find(u => u.email === customerEmail);
          
          if (!user) {
            console.error('Usuário não encontrado para o email:', customerEmail);
            break;
          }
          
          console.log(`Usuário encontrado: ${user.id} para o email: ${customerEmail}`);
          
          // If there's a subscription ID in the checkout session, make sure to save it
          if (checkoutSession.subscription) {
            // Fetch the subscription to get more details
            const subscription = await stripe.subscriptions.retrieve(checkoutSession.subscription);
            
            console.log(`Assinatura encontrada: ${subscription.id}, status: ${subscription.status}`);
            console.log(`Trial: ${subscription.trial_start ? 'Sim' : 'Não'}, 
              Início: ${subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : 'N/A'}, 
              Fim: ${subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : 'N/A'}`);
            
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
              });
            
            if (subError) {
              console.error('Erro ao atualizar assinatura:', subError.message);
            } else {
              console.log(`Assinatura atualizada para o usuário: ${user.id}`);
            }
          } else {
            console.log('No subscription found in checkout session');
          }
          break;
          
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          const subscription = event.data.object
          
          // Get Stripe customer
          const customer = await stripe.customers.retrieve(subscription.customer)
          
          // Find user by email
          const { data: subUsers, error: subUserError } = await supabase.auth.admin.listUsers()
          
          if (subUserError) {
            console.error('Erro ao buscar usuários:', subUserError.message)
            break
          }
          
          // Find user with the same email as the Stripe customer
          const subUser = subUsers.users.find(u => u.email === customer.email)
          
          if (!subUser) {
            console.error('Usuário não encontrado para o email:', customer.email)
            break
          }

          console.log(`Usuário encontrado: ${subUser.id} para o email: ${customer.email}`)
          console.log(`Status da assinatura: ${subscription.status}, está em avaliação: ${subscription.status === 'trialing' ? 'Sim' : 'Não'}`)

          // Update subscription in database
          const { error: subError } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: subUser.id,
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
            console.log(`Assinatura atualizada para o usuário: ${subUser.id}`)
            console.log(`Período de avaliação: ${subscription.trial_start ? 'De ' + new Date(subscription.trial_start * 1000).toISOString() + ' até ' + new Date(subscription.trial_end * 1000).toISOString() : 'Não aplicável'}`)
          }
          break;
          
        case 'customer.subscription.paused':
          const pausedSubscription = event.data.object;
          
          console.log(`Assinatura pausada: ${pausedSubscription.id}`);
          
          // Update subscription status to paused
          const { error: pauseError } = await supabase
            .from('subscriptions')
            .update({ status: 'paused' })
            .eq('stripe_subscription_id', pausedSubscription.id);
          
          if (pauseError) {
            console.error('Erro ao atualizar assinatura pausada:', pauseError.message);
          } else {
            console.log(`Status da assinatura atualizado para: paused`);
          }
          break;
          
        case 'customer.subscription.deleted':
          const canceledSubscription = event.data.object;
          
          console.log(`Assinatura cancelada: ${canceledSubscription.id}`);
          
          // Update subscription status to canceled
          const { error: cancelError } = await supabase
            .from('subscriptions')
            .update({ status: 'canceled' })
            .eq('stripe_subscription_id', canceledSubscription.id);
          
          if (cancelError) {
            console.error('Erro ao cancelar assinatura:', cancelError.message);
          } else {
            console.log(`Status da assinatura atualizado para: canceled`);
          }
          break;
          
        default:
          console.log(`Evento não processado: ${event.type}`);
      }

      return new Response(
        JSON.stringify({ received: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (error) {
      console.error('Erro ao processar webhook:', error.message);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
  } catch (error) {
    console.error('Erro geral no webhook:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
