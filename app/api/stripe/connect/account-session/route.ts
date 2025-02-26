import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { StripeComponentType, getAllComponentConfigs, getComponentConfig } from '@/app/lib/stripe-components';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
});

export const POST = auth(async function POST(req) {
  try {
    if (!req.auth?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the connected account ID and component type from the request body
    const { connectedAccountId, componentType = 'account_management', componentTypes = [] } = await req.json();
    
    if (!connectedAccountId) {
      return NextResponse.json(
        { error: 'Connected account ID is required' }, 
        { status: 400 }
      );
    }

    // Create the account session with the requested component or components
    let components: any = {};
    
    // If componentTypes array is provided, use all of them
    if (componentTypes.length > 0) {
      components = getAllComponentConfigs(componentTypes as StripeComponentType[]);
    } else {
      // Otherwise, use the single componentType
      components[componentType] = getComponentConfig(componentType as StripeComponentType);
    }

    const accountSession = await stripe.accountSessions.create({
      account: connectedAccountId,
      components: components as any
    });

    // Return the client secret
    return NextResponse.json({
      client_secret: accountSession.client_secret,
    });
  } catch (error) {
    console.error('Error creating Stripe account session:', error);
    return NextResponse.json(
      { error: 'Failed to create account session' },
      { status: 500 }
    );
  }
}); 