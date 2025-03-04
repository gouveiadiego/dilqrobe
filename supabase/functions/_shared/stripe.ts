
import Stripe from 'https://esm.sh/stripe@12.1.1?target=deno';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY env var not found');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});
