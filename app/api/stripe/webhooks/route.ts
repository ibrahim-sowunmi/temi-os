import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/app/lib/prisma';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  console.log('🔔 [Stripe Webhook] Received webhook event');
  
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('❌ [Stripe Webhook] Missing signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify the event came from Stripe
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`❌ [Stripe Webhook] Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    console.log(`✅ [Stripe Webhook] Verified event: ${event.type}`);

    // Handle specific event types
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event);
        break;
      case 'account.application.authorized':
        await handleAccountAuthorized(event);
        break;
      case 'account.application.deauthorized':
        await handleAccountDeauthorized(event);
        break;
      case 'account.external_account.created':
        await handleExternalAccountCreated(event);
        break;
      case 'account.external_account.updated':
        await handleExternalAccountUpdated(event);
        break;
      case 'account.external_account.deleted':
        await handleExternalAccountDeleted(event);
        break;
      // Add other event types as needed
      default:
        console.log(`🔍 [Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ [Stripe Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

// Handler for the account.updated event
async function handleAccountUpdated(event: Stripe.Event) {
  const account = event.data.object as Stripe.Account;
  console.log(`📝 [Stripe Webhook] Account updated event for account: ${account.id}`);
  
  try {
    // Find the merchant associated with this Stripe Connect account
    const merchant = await prisma.merchant.findFirst({
      where: { stripeConnectId: account.id }
    });

    if (!merchant) {
      console.log(`⚠️ [Stripe Webhook] No merchant found for Stripe account: ${account.id}`);
      return;
    }

    // Check if account requirements are now satisfied
    // (This is important for knowing if the merchant has completed onboarding)
    const requirementsSatisfied = isAccountRequirementsSatisfied(account);
    
    // Update merchant record with latest account status
    await prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        isOnboarded: requirementsSatisfied
      }
    });

    console.log(`✅ [Stripe Webhook] Updated merchant ${merchant.id} onboarding status: ${requirementsSatisfied}`);
  } catch (error) {
    console.error('❌ [Stripe Webhook] Error handling account.updated event:', error);
    throw error; // Re-throw to be caught by the main handler
  }
}

// Helper to check if account requirements are satisfied
function isAccountRequirementsSatisfied(account: Stripe.Account): boolean {
  // Check if there are any currently_due requirements
  const hasCurrentlyDueRequirements = 
    account.requirements?.currently_due && account.requirements.currently_due.length > 0;
  
  // Check if there are any past_due requirements
  const hasPastDueRequirements = 
    account.requirements?.past_due && account.requirements.past_due.length > 0;
  
  // Account is considered complete if there are no currently_due or past_due requirements
  return !hasCurrentlyDueRequirements && !hasPastDueRequirements;
}

// Handler for the account.application.authorized event
async function handleAccountAuthorized(event: Stripe.Event) {
  const account = event.data.object as Stripe.Account;
  console.log(`🔐 [Stripe Webhook] Account authorized: ${account.id}`);
  
  // Implement your business logic for when an account authorizes your application
}

// Handler for the account.application.deauthorized event
async function handleAccountDeauthorized(event: Stripe.Event) {
  const account = event.data.object as Stripe.Account;
  console.log(`🔒 [Stripe Webhook] Account deauthorized: ${account.id}`);
  
  try {
    // Update your database to reflect that this account has deauthorized your platform
    const merchant = await prisma.merchant.findFirst({
      where: { stripeConnectId: account.id }
    });

    if (merchant) {
      await prisma.merchant.update({
        where: { id: merchant.id },
        data: {
          isOnboarded: false
        }
      });
    }
  } catch (error) {
    console.error('❌ [Stripe Webhook] Error handling deauthorization:', error);
    throw error;
  }
}

// Handler for external account events
async function handleExternalAccountCreated(event: Stripe.Event) {
  const externalAccount = event.data.object as Stripe.BankAccount | Stripe.Card;
  console.log(`💳 [Stripe Webhook] External account created for ${externalAccount.account}`);
  
  // Implement your business logic for when a bank account or card is added
}

async function handleExternalAccountUpdated(event: Stripe.Event) {
  const externalAccount = event.data.object as Stripe.BankAccount | Stripe.Card;
  console.log(`💳 [Stripe Webhook] External account updated for ${externalAccount.account}`);
  
  // Implement your business logic for when a bank account or card is updated
}

async function handleExternalAccountDeleted(event: Stripe.Event) {
  const externalAccount = event.data.object as Stripe.BankAccount | Stripe.Card;
  console.log(`💳 [Stripe Webhook] External account deleted for ${externalAccount.account}`);
  
  // Implement your business logic for when a bank account or card is removed
} 