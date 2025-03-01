import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/app/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia', // Latest API version
});

export async function POST(request: Request) {
  console.log("POST /api/stripe/terminal/display - Started");
  try {
    const body = await request.json();
    console.log('Received terminal display request payload:', body);
    
    const { 
      paymentIntentId,
      quantity = 1,
      readerId,
      merchantId
    } = body;

    // Validate required fields
    if (!paymentIntentId) {
      console.log("POST /api/stripe/terminal/display - Missing paymentIntentId");
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    if (!readerId) {
      console.log("POST /api/stripe/terminal/display - Missing readerId");
      return NextResponse.json(
        { error: 'Reader ID is required' },
        { status: 400 }
      );
    }

    if (!merchantId) {
      console.log("POST /api/stripe/terminal/display - Missing merchantId");
      return NextResponse.json(
        { error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    // Fetch the merchant to get their Stripe Connect ID
    console.log(`POST /api/stripe/terminal/display - Fetching merchant: ${merchantId}`);
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { stripeConnectId: true }
    });

    if (!merchant) {
      console.log(`POST /api/stripe/terminal/display - Merchant not found: ${merchantId}`);
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    if (!merchant.stripeConnectId) {
      console.log(`POST /api/stripe/terminal/display - Merchant ${merchantId} doesn't have a Stripe Connect ID`);
      return NextResponse.json(
        { error: 'Merchant is not properly connected to Stripe' },
        { status: 400 }
      );
    }

    console.log(`POST /api/stripe/terminal/display - Using Stripe Connect ID: ${merchant.stripeConnectId}`);

    try {
      // 1. Retrieve the payment intent to ensure it exists
      console.log(`POST /api/stripe/terminal/display - Retrieving payment intent: ${paymentIntentId}`);
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId,
        { stripeAccount: merchant.stripeConnectId }
      );
      
      if (paymentIntent.status === 'succeeded') {
        console.log(`POST /api/stripe/terminal/display - Payment already processed: ${paymentIntentId}`);
        return NextResponse.json({
          error: 'Payment was already processed',
          status: paymentIntent.status
        }, { status: 400 });
      }

      // 2. Check if payment intent is in a valid state for processing
      const validStates = ['requires_payment_method', 'requires_confirmation'];
      if (!validStates.includes(paymentIntent.status)) {
        console.log(`POST /api/stripe/terminal/display - Invalid payment intent state: ${paymentIntent.status}`);
        return NextResponse.json({
          error: `Payment intent is in invalid state: ${paymentIntent.status}`,
          status: paymentIntent.status
        }, { status: 400 });
      }

      // Extract product name or description from metadata
      const itemDescription = paymentIntent.metadata?.productName || 
                              paymentIntent.description ||
                              'Item';

      // 3. Display cart on terminal
      console.log(`POST /api/stripe/terminal/display - Setting display on reader: ${readerId}`);
      const readerSession = await stripe.terminal.readers.setReaderDisplay(
        readerId,
        {
          type: 'cart',
          cart: {
            line_items: [{
              description: itemDescription,
              amount: paymentIntent.amount,
              quantity: quantity,
            }],
            total: paymentIntent.amount,
            currency: paymentIntent.currency
          }
        },
        { stripeAccount: merchant.stripeConnectId }
      );

      const response = {
        success: true,
        paymentIntentId,
        readerId,
        status: 'display_ready',
        message: 'Cart displayed on terminal',
      };
      
      console.log('POST /api/stripe/terminal/display - Success:', response);
      return NextResponse.json(response);

    } catch (error) {
      console.error('Error displaying cart on terminal:', error);
      return NextResponse.json({ 
        error: 'Error displaying cart on terminal',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing terminal display request:', error);
    return NextResponse.json(
      { error: 'Invalid request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
} 