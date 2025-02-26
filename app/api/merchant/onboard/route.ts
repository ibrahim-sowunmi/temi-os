import { auth } from '@/auth';
import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
});

export const POST = auth(async function POST(req) {
  try {
    console.log('Auth object:', req.auth);
    console.log('User object:', req.auth?.user);

    if (!req.auth?.user?.email) {
      console.log('Authentication check failed');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database using email
    const dbUser = await prisma.user.findUnique({
      where: { email: req.auth.user.email }
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse the request body
    const data = await req.json();
    const {
      businessName,
      businessType,
      taxId,
      phoneNumber,
      address,
      image,
      country
    } = data;

    // Validate required fields
    if (!businessName || !country) {
      return NextResponse.json(
        { error: 'Business name and country are required' },
        { status: 400 }
      );
    }

    // Check if merchant already exists for this user
    const existingMerchant = await prisma.merchant.findUnique({
      where: { userId: dbUser.id },
      select: { id: true }
    });

    if (existingMerchant) {
      return NextResponse.json(
        { error: 'Merchant profile already exists for this user' },
        { status: 400 }
      );
    }

    // Create a Stripe Connect account first
    const stripeAccount = await stripe.accounts.create({
      type: 'standard',
      email: req.auth.user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: businessName,
      }
    });

    // Create the merchant profile with Stripe account ID
    const merchant = await prisma.merchant.create({
      data: {
        user: {
          connect: {
            id: dbUser.id
          }
        },
        businessName,
        businessType,
        taxId,
        phoneNumber,
        address,
        image,
        country,
        isOnboarded: false,
        stripeConnectId: stripeAccount.id // Store the Stripe account ID
      }
    });

    console.log('Merchant created with Stripe account:', merchant);
    return NextResponse.json({ 
      merchant,
      stripeAccountId: stripeAccount.id
    });
  } catch (error) {
    console.error('Error in merchant onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to create merchant profile' },
      { status: 500 }
    );
  }
}); 