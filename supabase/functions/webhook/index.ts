
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.1.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }
  
  try {
    const body = await req.text()
    let event
    
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 })
    }
    
    console.log(`Received event: ${event.type}`)
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id || session.metadata?.userId
        
        if (!userId) {
          console.error('No user ID found in session')
          return new Response('No user ID found in session', { status: 400 })
        }
        
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        
        // Store the customer and subscription data
        const { error } = await supabase
          .from('customers')
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            subscription_id: subscriptionId,
            status: 'active',
            created_at: new Date().toISOString()
          })
        
        if (error) {
          console.error('Error inserting customer data:', error)
          return new Response('Error processing webhook', { status: 500 })
        }
        
        break
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Get customer from the subscription
        const { data: customers, error } = await supabase
          .from('customers')
          .select('user_id')
          .eq('subscription_id', subscription.id)
        
        if (error || !customers || customers.length === 0) {
          console.error('Customer not found for subscription:', subscription.id)
          break
        }
        
        // Update the subscription status
        await supabase
          .from('customers')
          .update({
            status: subscription.status,
            updated_at: new Date().toISOString()
          })
          .eq('subscription_id', subscription.id)
        
        break
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Update the subscription status
        await supabase
          .from('customers')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('subscription_id', subscription.id)
        
        break
      }
    }
    
    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(`Webhook Error: ${error.message}`, { status: 500 })
  }
})
