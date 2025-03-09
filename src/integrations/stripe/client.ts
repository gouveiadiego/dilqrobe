// Frontend Stripe client
import { loadStripe } from '@stripe/stripe-js';
import { CreateCheckoutSessionParams, CreatePortalSessionParams } from './types';
import { supabase } from '@/integrations/supabase/client';

// Initialize Stripe Promise for frontend
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const createCheckoutSession = async ({
  priceId,
  successUrl,
  cancelUrl,
  customerId,
}: CreateCheckoutSessionParams) => {
  try {
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