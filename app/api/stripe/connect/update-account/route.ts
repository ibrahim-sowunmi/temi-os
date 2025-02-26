import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
});

export async function PATCH(request: Request) {
  console.log('🔄 [Stripe Connect] Starting account update...');
  try {
    const data = await request.json();
    const { accountId, ...updateData } = data;
    console.log('📝 [Stripe Connect] Update request for account:', accountId);
    console.log('📋 [Stripe Connect] Update data:', updateData);

    if (!accountId) {
      console.error('❌ [Stripe Connect] Account ID missing in request');
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    if (Object.keys(updateData).length === 0) {
      console.error('❌ [Stripe Connect] No update data provided');
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      );
    }

    const account = await stripe.accounts.update(accountId, updateData);
    console.log('✅ [Stripe Connect] Successfully updated account:', accountId);

    return NextResponse.json({ account });
  } catch (error) {
    console.error('❌ [Stripe Connect] Error updating account:', error);
    return NextResponse.json(
      { error: 'Failed to update Stripe Connect account' },
      { status: 500 }
    );
  }
} 