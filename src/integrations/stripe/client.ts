
// Frontend Stripe client
import { loadStripe } from '@stripe/stripe-js';
import { CreateCheckoutSessionParams, CreatePortalSessionParams } from './types';
import { supabase } from '@/integrations/supabase/client';

// Initialize Stripe Promise for frontend with proper error handling
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Create a placeholder if the API key is missing
export const stripePromise = stripePublishableKey 
  ? loadStripe(stripePublishableKey)
  : Promise.resolve(null);

export const createCheckoutSession = async ({
  priceId,
  successUrl,
  cancelUrl,
  customerId,
}: CreateCheckoutSessionParams) => {
  try {
    // Check if we have Stripe configured before trying to create a checkout session
    if (!stripePublishableKey) {
      console.warn('Stripe publishable key is not configured. Checkout session cannot be created.');
      throw new Error('Stripe is not configured');
    }

    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        priceId,
        successUrl,
        cancelUrl,
        customerId,
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

export const createPortalSession = async ({
  customerId,
  returnUrl,
}: CreatePortalSessionParams) => {
  try {
    // Check if we have Stripe configured before trying to create a portal session
    if (!stripePublishableKey) {
      console.warn('Stripe publishable key is not configured. Portal session cannot be created.');
      throw new Error('Stripe is not configured');
    }
    
    const { data, error } = await supabase.functions.invoke("create-portal-session", {
      body: {
        customerId,
        returnUrl,
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
};
