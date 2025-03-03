
// Follow this setup guide to integrate the Deno runtime with Supabase Functions:
// https://supabase.com/docs/guides/functions/deno-runtime#using-typescript-with-supabase-functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0"
import Stripe from 'https://esm.sh/stripe@12.5.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Initialize Stripe
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || ''
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '' // You'll need to add this secret
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get the request body as text for signature verification
    const body = await req.text()
    let event

    // Verify the webhook signature
    if (webhookSecret) {
      const signature = req.headers.get('stripe-signature')
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`)
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    } else {
      // For testing without a webhook secret
      event = JSON.parse(body)
    }

    // Process the event based on its type
    console.log(`Processing webhook event: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const customerId = session.customer
        const subscriptionId = session.subscription

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        
        // Get the customer's user_id from our database
        const { data: userData, error: userError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (userError || !userData) {
          console.error('User not found:', userError)
          break
        }

        // Update the subscription in our database
        await supabase
          .from('subscriptions')
          .update({
            stripe_subscription_id: subscriptionId,
            status: subscription.status,
            price_id: subscription.items.data[0].price.id,
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('user_id', userData.user_id)

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        const customerId = invoice.customer
        const subscriptionId = invoice.subscription

        if (!subscriptionId) break // Not a subscription invoice

        // Get the customer's user_id from our database
        const { data: userData, error: userError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (userError || !userData) {
          console.error('User not found:', userError)
          break
        }

        // Update the subscription in our database
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
          })
          .eq('user_id', userData.user_id)
          .eq('stripe_subscription_id', subscriptionId)

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId = subscription.customer

        // Get the customer's user_id from our database
        const { data: userData, error: userError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (userError || !userData) {
          console.error('User not found:', userError)
          break
        }

        // Update the subscription in our database
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('user_id', userData.user_id)
          .eq('stripe_subscription_id', subscription.id)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer

        // Get the customer's user_id from our database
        const { data: userData, error: userError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (userError || !userData) {
          console.error('User not found:', userError)
          break
        }

        // Update the subscription in our database
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
          })
          .eq('user_id', userData.user_id)
          .eq('stripe_subscription_id', subscription.id)

        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
