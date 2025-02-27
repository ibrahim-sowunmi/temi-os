import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { randomUUID } from 'crypto';
import { prisma } from '@/app/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia', // Latest API version
});

export async function POST(request: Request) {
  console.log("POST /api/stripe/payment-intent - Started");
  try {
    const body = await request.json();
    console.log('Received payment intent request payload:', body);
    
    const { 
      amount, 
      currency,
      metadata = {},
      merchantId,
      workerId,
      readerId,
      locationId,
    } = body;

    // Validate required fields
    if (!amount) {
      console.log("POST /api/stripe/payment-intent - Missing amount");
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400 }
      );
    }

    if (!currency) {
      console.log("POST /api/stripe/payment-intent - Missing currency");
      return NextResponse.json(
        { error: 'Currency is required' },
        { status: 400 }
      );
    }

    if (!merchantId) {
      console.log("POST /api/stripe/payment-intent - Missing merchantId");
      return NextResponse.json(
        { error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    if (!workerId) {
      console.log("POST /api/stripe/payment-intent - Missing workerId");
      return NextResponse.json(
        { error: 'Worker ID is required' },
        { status: 400 }
      );
    }

    if (!readerId) {
      console.log("POST /api/stripe/payment-intent - Missing readerId");
      return NextResponse.json(
        { error: 'Reader ID is required' },
        { status: 400 }
      );
    }

    // Fetch the merchant to get their Stripe Connect ID
    console.log(`POST /api/stripe/payment-intent - Fetching merchant: ${merchantId}`);
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { stripeConnectId: true, businessName: true }
    });

    if (!merchant) {
      console.log(`POST /api/stripe/payment-intent - Merchant not found: ${merchantId}`);
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    if (!merchant.stripeConnectId) {
      console.log(`POST /api/stripe/payment-intent - Merchant ${merchantId} doesn't have a Stripe Connect ID`);
      return NextResponse.json(
        { error: 'Merchant is not properly connected to Stripe' },
        { status: 400 }
      );
    }

    console.log(`POST /api/stripe/payment-intent - Using Stripe Connect ID: ${merchant.stripeConnectId}`);

    // Generate a unique order ID if not provided
    const orderId = metadata.orderId || `order_${randomUUID().replace(/-/g, '')}`;

    // Configure payment intent for terminal payment
    const paymentIntentConfig: Stripe.PaymentIntentCreateParams = {
      amount,
      currency,
      payment_method_types: ['card_present'],
      capture_method: 'automatic',
      metadata: {
        paymentType: 'terminal',
        merchantId,
        workerId,
        readerId,
        locationId,
        orderId,
        merchantName: merchant.businessName || 'Unknown',
        ...metadata
      }
    };

    console.log('The payment intent config is:', paymentIntentConfig);
    
    // Create the payment intent on behalf of the connected account
    const paymentIntent = await stripe.paymentIntents.create(
      paymentIntentConfig,
      { stripeAccount: merchant.stripeConnectId }
    );

    console.log('Created payment intent:', {
      id: paymentIntent.id,
      payment_method_types: paymentIntent.payment_method_types,
      status: paymentIntent.status,
      stripeAccount: merchant.stripeConnectId,
      metadata: paymentIntent.metadata
    });

    const responseOrderId = paymentIntentConfig.metadata?.orderId || orderId;

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      message: 'Payment intent created successfully'
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Error creating payment intent', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 