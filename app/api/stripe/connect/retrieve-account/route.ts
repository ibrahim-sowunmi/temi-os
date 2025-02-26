import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
});

export async function GET(request: Request) {
  console.log('🔍 [Stripe Connect] Starting account retrieval...');
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    console.log('📝 [Stripe Connect] Attempting to retrieve account:', accountId);

    if (!accountId) {
      console.error('❌ [Stripe Connect] Account ID missing in request');
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    const account = await stripe.accounts.retrieve(accountId);
    console.log('✅ [Stripe Connect] Successfully retrieved account:', accountId);

    return NextResponse.json({ account });
  } catch (error) {
    console.error('❌ [Stripe Connect] Error retrieving account:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve Stripe Connect account' },
      { status: 500 }
    );
  }
} 