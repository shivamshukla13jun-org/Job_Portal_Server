// paymentGateway.ts
import Razorpay from 'razorpay';
// Import additional payment libraries as needed, e.g., Stripe, PayPal
import { IJobportalPlan } from '../types/plan';
import { IUser } from '@/models/admin/user.model';

interface PaymentGatewayOptions {
  razorpay?: {
    key_id: string;
    key_secret: string;
  };
  // Add other gateway options here if needed
  // stripe?: { apiKey: string };
  // paypal?: { clientId: string; clientSecret: string };
}

// Initialize instances for each payment gateway
const paymentGateways = {
  razorpay: new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID as string,
    key_secret: process.env.RAZORPAY_KEY_SECRET as string,
  }),
  // Add initialization for other gateways
  /*
  stripe: new Stripe(process.env.STRIPE_API_KEY as string),
  paypal: new PayPal({ 
    clientId: process.env.PAYPAL_CLIENT_ID as string,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET as string 
  }),
  */
};

// Define a union type for supported gateways
type SupportedGateways = 'razorpay' | 'stripe' | 'paypal'; // Add more as needed

// Generic payment options interface
interface PaymentOptions {
  amount: number;
  currency: string;
  description: string;
  user: IUser;
  plan: IJobportalPlan;
}

// Main function to handle payment subscriptions
export async function createSubscription(
  gateway: SupportedGateways,
  options: PaymentOptions
): Promise<any> {
  switch (gateway) {
    case 'razorpay':
      return createRazorpaySubscription(options);
    // Add more cases for other gateways
    /*
    case 'stripe':
      return createStripeSubscription(options);
    case 'paypal':
      return createPayPalSubscription(options);
    */
    default:
      throw new Error('Unsupported payment gateway');
  }
}

// Razorpay subscription function
async function createRazorpaySubscription(options: PaymentOptions) {
  const { amount, currency, description, user, plan } = options;

  return new Promise((resolve, reject) => {
    const subscriptionOptions = {
      amount: amount * 100, // Razorpay requires the amount in paise (INR)
      currency: currency,
      notes: {
        notes_key_1: description,
        email: user.email,
        notes_key_2: `Subscription for ${plan.name}`,
      },
    };

    paymentGateways.razorpay.orders.create(subscriptionOptions, (err, subscription) => {
      if (err) {
        console.error('Razorpay Subscription Error:', err);
        return reject(err);
      }
      resolve(subscription);
    });
  });
}

// Placeholder for Stripe subscription function
/*
async function createStripeSubscription(options: PaymentOptions) {
  const { amount, currency, description, user, plan } = options;
  const stripe = paymentGateways.stripe;
  
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency,
          product_data: { name: description },
          unit_amount: amount * 100, // Stripe requires amount in cents for USD
        },
        quantity: 1,
      }],
      mode: 'subscription',
      customer_email: user.email,
    });
    return session;
  } catch (error) {
    console.error('Stripe Subscription Error:', error);
    throw error;
  }
}
*/

// Placeholder for PayPal subscription function
/*
async function createPayPalSubscription(options: PaymentOptions) {
  const { amount, currency, description, user, plan } = options;
  const paypal = paymentGateways.paypal;

  // Implement PayPal subscription creation based on SDK/API
  // ...
}
*/
