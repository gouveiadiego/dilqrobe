
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { stripe } from '../_shared/stripe.ts';

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response(JSON.stringify({ error: 'Stripe signature missing' }), {
      status: 400,
    });
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
  if (!webhookSecret) {
    return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
      status: 500,
    });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.subscription && session.client_reference_id) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          
          await supabase.from('subscriptions').upsert({
            user_id: session.client_reference_id,
            subscription_id: subscription.id,
            status: subscription.status,
            price_id: subscription.items.data[0].price.id,
            quantity: subscription.items.data[0].quantity,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          });

          console.log(`Subscription record created/updated for user ${session.client_reference_id}`);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.user_id;
        
        if (userId) {
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            subscription_id: subscription.id,
            status: subscription.status,
            price_id: subscription.items.data[0].price.id,
            quantity: subscription.items.data[0].quantity,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          });
          
          console.log(`Subscription updated for user ${userId}`);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.user_id;
        
        if (userId) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              ended_at: new Date().toISOString(),
            })
            .eq('subscription_id', subscription.id);
            
          console.log(`Subscription canceled for user ${userId}`);
        }
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
    });
  } catch (error) {
    console.error(`Webhook error: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }
});
