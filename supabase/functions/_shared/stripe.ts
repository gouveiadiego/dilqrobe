
import Stripe from 'https://esm.sh/stripe@12.1.1?target=deno';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';

if (!stripeSecretKey) {
  console.error("STRIPE_SECRET_KEY environment variable is not set");
} else {
  console.log("STRIPE_SECRET_KEY is configured");
}

console.log("Initializing Stripe with API version 2023-10-16");

let stripeInstance = null;

try {
  if (stripeSecretKey) {
    stripeInstance = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });
    console.log("Stripe initialized successfully");
  } else {
    console.error("Stripe initialization skipped due to missing secret key");
  }
} catch (error) {
  console.error("Error initializing Stripe:", error);
}

export const stripe = stripeInstance;
