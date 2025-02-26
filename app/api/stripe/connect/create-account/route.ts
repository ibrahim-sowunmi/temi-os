import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { prisma } from '@/app/lib/prisma';

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

    // Get the merchant record for the authenticated user
    const merchant = await prisma.merchant.findFirst({
      where: {
        user: {
          email: req.auth.user.email
        }
      }
    });

    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant profile not found' },
        { status: 404 }
      );
    }

    // Create a Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'standard',
      email: req.auth.user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Update merchant with Stripe Connect account ID
    await prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        stripeConnectId: account.id
      }
    });

    // Generate an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding/success`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      accountId: account.id,
      accountLink: accountLink.url,
    });
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe Connect account' },
      { status: 500 }
    );
  }
}); 

