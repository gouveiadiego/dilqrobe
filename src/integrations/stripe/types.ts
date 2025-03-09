import Stripe from 'stripe';

export type StripeCustomer = Stripe.Customer;
export type StripePrice = Stripe.Price;
export type StripeProduct = Stripe.Product;
export type StripeSubscription = Stripe.Subscription;

export interface CreateCheckoutSessionParams {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
}

export interface CreatePortalSessionParams {
  customerId: string;
  returnUrl: string;
}