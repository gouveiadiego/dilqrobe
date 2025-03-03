
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
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
})

// Product and price IDs from Stripe dashboard
const PRODUCTS = {
  MONTHLY: {
    priceId: 'price_monthly', // Replace with your actual monthly price ID
    trialDays: 3,
  },
  YEARLY: {
    priceId: 'price_yearly', // Replace with your actual yearly price ID
    trialDays: 3,
  }
}

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

    // Get the request body
    const { priceType, userId, returnUrl } = await req.json()
    
    // Validate inputs
    if (!priceType || !userId || !returnUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify the user exists
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      console.error('User not found:', userError)
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user already has a Stripe customer ID
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    let customerId = subscriptionData?.stripe_customer_id

    // If not, create a new Stripe customer
    if (!customerId) {
      const newCustomer = await stripe.customers.create({
        email: userData.email || `user-${userId}@example.com`,
        name: userData.full_name || undefined,
        metadata: {
          userId: userId,
        },
      })
      customerId = newCustomer.id

      // Store the customer ID in your database
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          status: 'incomplete',
          plan_type: priceType,
        })
    }

    // Determine which price to use based on priceType
    const priceId = priceType === 'yearly' 
      ? PRODUCTS.YEARLY.priceId 
      : PRODUCTS.MONTHLY.priceId
    
    const trialDays = priceType === 'yearly'
      ? PRODUCTS.YEARLY.trialDays
      : PRODUCTS.MONTHLY.trialDays

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: trialDays,
      },
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${returnUrl}?canceled=true`,
    })

    // Return the checkout session URL
    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
