import { auth } from '@/auth';
import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import crypto from 'crypto';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
});

export const POST = auth(async function POST(req) {
  try {
    console.log('=== MERCHANT ONBOARDING START ===');
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
    console.log('Looking up user in database with email:', req.auth.user.email);
    const dbUser = await prisma.user.findUnique({
      where: { email: req.auth.user.email }
    });

    if (!dbUser) {
      console.log('User not found in database');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('User found in database:', dbUser.id);

    // Parse the request body
    console.log('Parsing request body');
    let data;
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData
      console.log('Detected FormData submission');
      const formData = await req.formData();
      data = Object.fromEntries(formData.entries());
      
      // Handle imageUrl field
      if (formData.has('imageUrl')) {
        const imageUrl = formData.get('imageUrl') as string;
        if (imageUrl) {
          console.log('Using provided image URL:', imageUrl);
          data.image = imageUrl;
        }
      }
      
      // Remove the imageUrl field from data before proceeding
      delete data.imageUrl;
    } else {
      // Handle JSON
      console.log('Detected JSON submission');
      data = await req.json();
      
      // If JSON contains imageUrl, move it to image
      if (data.imageUrl) {
        data.image = data.imageUrl;
        delete data.imageUrl;
      }
    }
    
    console.log('Request data (processed):', data);
    
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
    console.log('Validating required fields');
    if (!businessName || !country) {
      console.log('Missing required fields:', { businessName, country });
      return NextResponse.json(
        { error: 'Business name and country are required' },
        { status: 400 }
      );
    }

    // Check if merchant already exists for this user
    console.log('Checking if merchant already exists for user');
    const existingMerchant = await prisma.merchant.findUnique({
      where: { userId: dbUser.id },
      select: { id: true }
    });

    if (existingMerchant) {
      console.log('Merchant already exists:', existingMerchant.id);
      return NextResponse.json(
        { error: 'Merchant profile already exists for this user' },
        { status: 400 }
      );
    }

    // Create a Stripe Connect account first
    console.log('Creating Stripe Connect account');
    try {
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
      
      console.log('Stripe account created successfully:', stripeAccount.id);

      // Let Prisma handle ID generation according to the schema
      console.log('Creating merchant profile in database');
      console.log('Merchant data:', {
        userId: dbUser.id,
        businessName,
        businessType,
        taxId,
        phoneNumber,
        address,
        image,
        country,
        stripeConnectId: stripeAccount.id
      });
      
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

      console.log('Merchant created successfully:', merchant);
      console.log('=== MERCHANT ONBOARDING COMPLETE ===');
      return NextResponse.json({ 
        merchant,
        stripeAccountId: stripeAccount.id
      });
    } catch (stripeError) {
      console.error('Stripe account creation failed:', stripeError);
      throw stripeError; // Re-throw to be caught by outer catch block
    }
  } catch (error) {
    console.error('=== ERROR IN MERCHANT ONBOARDING ===');
    console.error('Error details:', error);
    
    // Check for Prisma unique constraint errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const prismaError = error as { code: string; meta?: { target?: string[] } };
      const field = prismaError.meta?.target?.[0];
      if (field === 'taxId') {
        console.error('Tax ID must be unique - this one is already in use');
        return NextResponse.json(
          { error: 'Tax ID must be unique - this one is already in use' },
          { status: 400 }
        );
      } else if (field === 'stripeConnectId') {
        console.error('Stripe Connect account already linked to another merchant');
        return NextResponse.json(
          { error: 'Stripe Connect account already linked to another merchant' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create merchant profile' }, 
      { status: 500 }
    );
  }
}); 