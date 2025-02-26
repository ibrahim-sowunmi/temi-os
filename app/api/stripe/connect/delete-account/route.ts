import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { prisma } from '@/app/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
});

export const DELETE = auth(async function DELETE(req) {
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

    if (!merchant.stripeConnectId) {
      return NextResponse.json(
        { error: 'No Stripe Connect account found' },
        { status: 404 }
      );
    }

    // Delete the Stripe Connect account
    await stripe.accounts.del(merchant.stripeConnectId);

    // Update merchant to remove the Stripe Connect ID
    await prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        stripeConnectId: null,
        isOnboarded: false // Reset onboarding status
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Stripe Connect account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting Stripe Connect account:', error);
    return NextResponse.json(
      { error: 'Failed to delete Stripe Connect account' },
      { status: 500 }
    );
  }
}); 