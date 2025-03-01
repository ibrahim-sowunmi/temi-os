import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/app/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia', // Latest API version
});

export async function POST(request: Request) {
  console.log("POST /api/stripe/terminal/process - Started");
  try {
    const body = await request.json();
    console.log('Received terminal process request payload:', body);
    
    const {
      paymentIntentId,
      readerId,
      merchantId
    } = body;

    // Validate required fields
    if (!paymentIntentId) {
      console.log("POST /api/stripe/terminal/process - Missing paymentIntentId");
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    if (!readerId) {
      console.log("POST /api/stripe/terminal/process - Missing readerId");
      return NextResponse.json(
        { error: 'Reader ID is required' },
        { status: 400 }
      );
    }

    if (!merchantId) {
      console.log("POST /api/stripe/terminal/process - Missing merchantId");
      return NextResponse.json(
        { error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    // Fetch the merchant to get their Stripe Connect ID
    console.log(`POST /api/stripe/terminal/process - Fetching merchant: ${merchantId}`);
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { stripeConnectId: true }
    });

    if (!merchant) {
      console.log(`POST /api/stripe/terminal/process - Merchant not found: ${merchantId}`);
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    if (!merchant.stripeConnectId) {
      console.log(`POST /api/stripe/terminal/process - Merchant ${merchantId} doesn't have a Stripe Connect ID`);
      return NextResponse.json(
        { error: 'Merchant is not properly connected to Stripe' },
        { status: 400 }
      );
    }

    console.log(`POST /api/stripe/terminal/process - Using Stripe Connect ID: ${merchant.stripeConnectId}`);

    try {
      // 1. Retrieve the payment intent to ensure it exists
      console.log(`POST /api/stripe/terminal/process - Retrieving payment intent: ${paymentIntentId}`);
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId,
        { stripeAccount: merchant.stripeConnectId }
      );

      if (paymentIntent.status === 'succeeded') {
        console.log(`POST /api/stripe/terminal/process - Payment already processed: ${paymentIntentId}`);
        return NextResponse.json({
          success: true,
          paymentIntentId,
          status: paymentIntent.status,
          message: 'Payment was already processed'
        });
      }

      // Check if payment intent is configured for in-person payments
      if (!paymentIntent.payment_method_types?.includes('card_present')) {
        console.log(`POST /api/stripe/terminal/process - Updating payment intent to accept card_present payments`);
        // Update the payment intent to accept card_present
        const updatedIntent = await stripe.paymentIntents.update(
          paymentIntentId, 
          {
            payment_method_types: ['card_present'],
            capture_method: 'automatic'
          },
          { stripeAccount: merchant.stripeConnectId }
        );
        console.log('Updated payment intent to accept card_present payments');
      }

      // 2. Process the payment through the terminal
      console.log(`POST /api/stripe/terminal/process - Processing payment through terminal: ${readerId}`);
      const terminalPayment = await stripe.terminal.readers.processPaymentIntent(
        readerId,
        {
          payment_intent: paymentIntentId,
          process_config: {
            skip_tipping: false,
          } as any,
        },
        { stripeAccount: merchant.stripeConnectId }
      );
      console.log('Terminal payment initiated:', terminalPayment);

      // 3. Wait for the payment to be completed
      let attempts = 0;
      const maxAttempts = 7; // 7 seconds timeout (1 check per second)
      let currentPayment = await stripe.paymentIntents.retrieve(
        paymentIntentId,
        { stripeAccount: merchant.stripeConnectId }
      );

      while (attempts < maxAttempts) {
        console.log(`Payment status check ${attempts + 1}:`, currentPayment.status);

        if (currentPayment.status === 'succeeded') {
          console.log(`POST /api/stripe/terminal/process - Payment succeeded: ${paymentIntentId}`);
          return NextResponse.json({
            success: true,
            paymentIntentId,
            status: currentPayment.status,
            message: 'Payment processed successfully'
          });
        }

        // Handle terminal states
        if (['canceled', 'requires_confirmation'].includes(currentPayment.status)) {
          console.log(`POST /api/stripe/terminal/process - Payment cancelled: ${paymentIntentId}`);
          // Clear the terminal display
          await stripe.terminal.readers.cancelAction(
            readerId,
            { stripeAccount: merchant.stripeConnectId }
          );
          
          await stripe.paymentIntents.cancel(
            paymentIntentId,
            { stripeAccount: merchant.stripeConnectId }
          );

          return NextResponse.json({
            success: true,
            paymentIntentId,
            status: currentPayment.status,
            message: 'Payment was cancelled'
          });
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        currentPayment = await stripe.paymentIntents.retrieve(
          paymentIntentId,
          { stripeAccount: merchant.stripeConnectId }
        );
        attempts++;
      }

      // If we get here, we've timed out - clean up the terminal and cancel payment
      console.log(`POST /api/stripe/terminal/process - Payment timed out: ${paymentIntentId}`);

      // Clear the terminal display
      await stripe.terminal.readers.cancelAction(
        readerId,
        { stripeAccount: merchant.stripeConnectId }
      );

      // Cancel the payment intent
      await stripe.paymentIntents.cancel(
        paymentIntentId,
        { stripeAccount: merchant.stripeConnectId }
      );

      return NextResponse.json({
        success: true,
        paymentIntentId,
        status: 'timeout',
        message: 'Payment timed out and terminal has been cleared'
      });

    } catch (processingError) {
      console.error('Error collecting terminal payment:', processingError);
      
      // If processing fails, ensure terminal is cleared and payment is cancelled
      try {
        console.log(`POST /api/stripe/terminal/process - Error cleanup for payment: ${paymentIntentId}`);
        // Clear terminal display
        await stripe.terminal.readers.cancelAction(
          readerId,
          { stripeAccount: merchant.stripeConnectId }
        );

        // Cancel payment intent if it exists and isn't already cancelled
        const paymentStatus = await stripe.paymentIntents.retrieve(
          paymentIntentId,
          { stripeAccount: merchant.stripeConnectId }
        );
        
        if (paymentStatus.status !== 'canceled') {
          await stripe.paymentIntents.cancel(
            paymentIntentId,
            { stripeAccount: merchant.stripeConnectId }
          );
        }
      } catch (cleanupError) {
        console.error('Failed to cleanup after error:', cleanupError);
      }

      // Return 500 only for unexpected errors
      return NextResponse.json(
        {
          error: 'Error collecting terminal payment',
          details: processingError instanceof Error ? processingError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error processing terminal payment request:', error);
    return NextResponse.json(
      { error: 'Invalid request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
} 