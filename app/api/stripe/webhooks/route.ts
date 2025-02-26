import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/app/lib/prisma';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Type definition for Stripe event types
type StripeEventType = 
  | 'account.updated'
  | 'account.application.authorized'
  | 'account.application.deauthorized'
  | 'account.external_account.created'
  | 'account.external_account.updated'
  | 'account.external_account.deleted'
  | 'terminal.reader.updated'
  | 'terminal.reader.deleted'
  | 'terminal.location.updated'
  | 'terminal.location.deleted';

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
    switch (event.type as StripeEventType) {
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
      // Terminal reader events
      case 'terminal.reader.updated':
        await handleTerminalReaderUpdated(event);
        break;
      case 'terminal.reader.deleted':
        await handleTerminalReaderDeleted(event);
        break;
      // Terminal location events
      case 'terminal.location.updated':
        await handleTerminalLocationUpdated(event);
        break;
      case 'terminal.location.deleted':
        await handleTerminalLocationDeleted(event);
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

// Terminal Reader Handlers
async function handleTerminalReaderUpdated(event: Stripe.Event) {
  const reader = event.data.object as Stripe.Terminal.Reader;
  const stripeAccount = event.account as string;
  
  console.log(`📱 [Stripe Webhook] Terminal reader updated: ${reader.id} for account ${stripeAccount}`);
  
  try {
    // First, find the merchant associated with this Stripe Connect account
    const merchant = await prisma.merchant.findFirst({
      where: { stripeConnectId: stripeAccount }
    });

    if (!merchant) {
      console.log(`⚠️ [Stripe Webhook] No merchant found for Stripe account: ${stripeAccount}`);
      return;
    }

    // Find the terminal reader in our database
    const terminalReader = await prisma.terminal.findFirst({
      where: {
        stripeTerminalId: reader.id,
        merchantId: merchant.id
      }
    });

    if (!terminalReader) {
      console.log(`⚠️ [Stripe Webhook] No terminal reader found for Stripe reader ID: ${reader.id}`);
      return;
    }

    // Create base update data
    const updateData: any = {};
    
    // Update name if it changed
    if (reader.label && reader.label !== terminalReader.name) {
      updateData.name = reader.label;
    }
    
    // Update location if needed
    if (reader.location) {
      // Try to find the location in our database
      const location = await prisma.location.findFirst({
        where: {
          stripeLocationId: reader.location,
          merchantId: merchant.id
        }
      });

      if (location) {
        // Use the same connection pattern as in the PUT endpoint
        updateData.location = {
          connect: {
            id: location.id
          }
        };
      } else {
        console.log(`⚠️ [Stripe Webhook] Location ${reader.location} not found in database`);
      }
    }

    // Only update if there are changes
    if (Object.keys(updateData).length > 0) {
      // Update the reader in our database
      await prisma.terminal.update({
        where: { id: terminalReader.id },
        data: updateData
      });
      console.log(`✅ [Stripe Webhook] Updated terminal reader ${terminalReader.id} in database`);
    } else {
      console.log(`ℹ️ [Stripe Webhook] No changes needed for terminal reader ${terminalReader.id}`);
    }
  } catch (error: any) {
    console.error(`❌ [Stripe Webhook] Error handling terminal.reader.updated event: ${error?.message || 'Unknown error'}`);
    throw error;
  }
}

async function handleTerminalReaderDeleted(event: Stripe.Event) {
  const reader = event.data.object as Stripe.Terminal.Reader;
  const stripeAccount = event.account as string;
  
  console.log(`🗑️ [Stripe Webhook] Terminal reader deleted: ${reader.id} for account ${stripeAccount}`);
  
  try {
    // First, find the merchant associated with this Stripe Connect account
    const merchant = await prisma.merchant.findFirst({
      where: { stripeConnectId: stripeAccount }
    });

    if (!merchant) {
      console.log(`⚠️ [Stripe Webhook] No merchant found for Stripe account: ${stripeAccount}`);
      return;
    }

    // Find the terminal reader in our database
    const terminalReader = await prisma.terminal.findFirst({
      where: {
        stripeTerminalId: reader.id,
        merchantId: merchant.id
      }
    });

    if (!terminalReader) {
      console.log(`⚠️ [Stripe Webhook] No terminal reader found for Stripe reader ID: ${reader.id}`);
      return;
    }

    // Delete the reader from our database
    await prisma.terminal.delete({
      where: { id: terminalReader.id }
    });

    console.log(`✅ [Stripe Webhook] Deleted terminal reader ${terminalReader.id} from database`);
  } catch (error: any) {
    console.error(`❌ [Stripe Webhook] Error handling terminal.reader.deleted event: ${error?.message || 'Unknown error'}`);
    throw error;
  }
}

// Terminal Location Handlers
async function handleTerminalLocationUpdated(event: Stripe.Event) {
  const location = event.data.object as Stripe.Terminal.Location;
  const stripeAccount = event.account as string;
  
  console.log(`🏬 [Stripe Webhook] Terminal location updated: ${location.id} for account ${stripeAccount}`);
  
  try {
    // First, find the merchant associated with this Stripe Connect account
    const merchant = await prisma.merchant.findFirst({
      where: { stripeConnectId: stripeAccount }
    });

    if (!merchant) {
      console.log(`⚠️ [Stripe Webhook] No merchant found for Stripe account: ${stripeAccount}`);
      return;
    }

    // Find the location in our database
    const dbLocation = await prisma.location.findFirst({
      where: {
        stripeLocationId: location.id,
        merchantId: merchant.id
      }
    });

    if (!dbLocation) {
      console.log(`⚠️ [Stripe Webhook] No location found for Stripe location ID: ${location.id}`);
      return;
    }

    // Create update data
    const updateData: any = {};
    
    // Update display name if changed
    if (location.display_name && location.display_name !== dbLocation.displayName) {
      updateData.displayName = location.display_name;
    }
    
    // Update address if changed
    if (location.address) {
      // Convert address to a proper JSON object
      const addressObject = location.address as Record<string, any>;
      updateData.address = addressObject;
    }

    // Only update if there are changes
    if (Object.keys(updateData).length > 0) {
      // Update the location in our database
      await prisma.location.update({
        where: { id: dbLocation.id },
        data: updateData
      });
      console.log(`✅ [Stripe Webhook] Updated location ${dbLocation.id} in database`);
    } else {
      console.log(`ℹ️ [Stripe Webhook] No changes needed for location ${dbLocation.id}`);
    }
  } catch (error: any) {
    console.error(`❌ [Stripe Webhook] Error handling terminal.location.updated event: ${error?.message || 'Unknown error'}`);
    throw error;
  }
}

async function handleTerminalLocationDeleted(event: Stripe.Event) {
  const location = event.data.object as Stripe.Terminal.Location;
  const stripeAccount = event.account as string;
  
  console.log(`🗑️ [Stripe Webhook] Terminal location deleted: ${location.id} for account ${stripeAccount}`);
  
  try {
    // First, find the merchant associated with this Stripe Connect account
    const merchant = await prisma.merchant.findFirst({
      where: { stripeConnectId: stripeAccount }
    });

    if (!merchant) {
      console.log(`⚠️ [Stripe Webhook] No merchant found for Stripe account: ${stripeAccount}`);
      return;
    }

    // Find the location in our database
    const dbLocation = await prisma.location.findFirst({
      where: {
        stripeLocationId: location.id,
        merchantId: merchant.id
      }
    });

    if (!dbLocation) {
      console.log(`⚠️ [Stripe Webhook] No location found for Stripe location ID: ${location.id}`);
      return;
    }

    // Check if there are any terminals using this location
    const terminals = await prisma.terminal.findMany({
      where: { locationId: dbLocation.id }
    });

    if (terminals.length > 0) {
      console.log(`⚠️ [Stripe Webhook] Cannot delete location ${dbLocation.id} - it has ${terminals.length} terminals associated with it`);
      
      // Instead of deleting, mark as inactive
      await prisma.location.update({
        where: { id: dbLocation.id },
        data: { active: false }
      });
      
      console.log(`✅ [Stripe Webhook] Marked location ${dbLocation.id} as inactive`);
      return;
    }

    // If no terminals are using this location, delete it
    await prisma.location.delete({
      where: { id: dbLocation.id }
    });

    console.log(`✅ [Stripe Webhook] Deleted location ${dbLocation.id} from database`);
  } catch (error: any) {
    console.error(`❌ [Stripe Webhook] Error handling terminal.location.deleted event: ${error?.message || 'Unknown error'}`);
    throw error;
  }
} 