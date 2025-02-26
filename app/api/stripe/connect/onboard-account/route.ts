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
    console.log('Starting Stripe onboarding process...');

    if (!req.auth?.user?.email) {
      console.log('Authentication failed: No user email found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Authenticated user email:', req.auth.user.email);

    // Get the merchant record for the authenticated user
    const merchant = await prisma.merchant.findFirst({
      where: {
        user: {
          email: req.auth.user.email
        }
      }
    });

    console.log('Merchant lookup result:', merchant ? 'Found' : 'Not found');

    if (!merchant) {
      console.log('Merchant profile not found for email:', req.auth.user.email);
      return NextResponse.json(
        { error: 'Merchant profile not found' },
        { status: 404 }
      );
    }

    if (!merchant.stripeConnectId) {
      console.log('No Stripe Connect ID found for merchant:', merchant.id);
      return NextResponse.json(
        { error: 'Stripe Connect account not found' },
        { status: 404 }
      );
    }

    console.log('Creating account link for Stripe Connect ID:', merchant.stripeConnectId);

    // Generate a new account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: merchant.stripeConnectId,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings/account`,
      type: 'account_onboarding',
    });

    console.log('Successfully created account link');

    return NextResponse.json({
      accountLink: accountLink.url,
    });
  } catch (error) {
    console.error('Error creating Stripe onboarding link:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe onboarding link' },
      { status: 500 }
    );
  }
});

export const PUT = auth(async function PUT(req) {
  try {
    console.log('Starting Stripe account update process...');

    if (!req.auth?.user?.email) {
      console.log('Authentication failed: No user email found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Authenticated user email:', req.auth.user.email);

    // Get the merchant record for the authenticated user
    const merchant = await prisma.merchant.findFirst({
      where: {
        user: {
          email: req.auth.user.email
        }
      }
    });

    console.log('Merchant lookup result:', merchant ? 'Found' : 'Not found');

    if (!merchant) {
      console.log('Merchant profile not found for email:', req.auth.user.email);
      return NextResponse.json(
        { error: 'Merchant profile not found' },
        { status: 404 }
      );
    }

    if (!merchant.stripeConnectId) {
      console.log('No Stripe Connect ID found for merchant:', merchant.id);
      return NextResponse.json(
        { error: 'Stripe Connect account not found' },
        { status: 404 }
      );
    }

    console.log('Creating account link for Stripe Connect ID update:', merchant.stripeConnectId);

    // Generate a new account link for updating
    const accountLink = await stripe.accountLinks.create({
      account: merchant.stripeConnectId,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings/account`,
      type: 'account_onboarding',
    });

    console.log('Successfully created account update link');

    return NextResponse.json({
      accountLink: accountLink.url,
    });
  } catch (error) {
    console.error('Error creating Stripe account update link:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe account update link' },
      { status: 500 }
    );
  }
});
