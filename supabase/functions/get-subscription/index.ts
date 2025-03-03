
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the current user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get the user's subscription
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (subscriptionError) {
      // Check if the error is because there's no subscription yet
      if (subscriptionError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ subscription: { status: 'none' } }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      console.error('Error fetching subscription:', subscriptionError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscription data' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!subscriptionData) {
      return new Response(
        JSON.stringify({ subscription: { status: 'none' } }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // If there's a Stripe subscription ID, get the latest data from Stripe
    if (subscriptionData.stripe_subscription_id) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscriptionData.stripe_subscription_id
        )

        // Update our database with the latest status
        await supabase
          .from('subscriptions')
          .update({
            status: stripeSubscription.status,
            current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          })
          .eq('id', subscriptionData.id)

        // Return the updated subscription data
        return new Response(
          JSON.stringify({
            subscription: {
              status: stripeSubscription.status,
              plan_type: subscriptionData.plan_type,
              current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
              trial_start: stripeSubscription.trial_start 
                ? new Date(stripeSubscription.trial_start * 1000).toISOString() 
                : null,
              trial_end: stripeSubscription.trial_end 
                ? new Date(stripeSubscription.trial_end * 1000).toISOString() 
                : null,
            }
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      } catch (stripeError) {
        console.error('Error retrieving Stripe subscription:', stripeError)
        
        // If subscription not found in Stripe, update our database
        if (stripeError.code === 'resource_missing') {
          await supabase
            .from('subscriptions')
            .update({ status: 'canceled' })
            .eq('id', subscriptionData.id)
          
          return new Response(
            JSON.stringify({
              subscription: {
                status: 'canceled',
                plan_type: subscriptionData.plan_type,
                current_period_end: subscriptionData.current_period_end,
              }
            }),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }
        
        // Return database data if we can't get Stripe data
        return new Response(
          JSON.stringify({
            subscription: {
              status: subscriptionData.status,
              plan_type: subscriptionData.plan_type,
              current_period_end: subscriptionData.current_period_end,
              trial_end: subscriptionData.trial_end,
            }
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Return the subscription data from our database
    return new Response(
      JSON.stringify({
        subscription: {
          status: subscriptionData.status,
          plan_type: subscriptionData.plan_type,
          current_period_end: subscriptionData.current_period_end,
          trial_end: subscriptionData.trial_end,
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in get-subscription function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
