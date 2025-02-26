import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: session.user.id }
    });

    return NextResponse.json({ hasMerchant: !!merchant });
  } catch (error) {
    console.error('Error checking merchant status:', error);
    return NextResponse.json(
      { error: 'Failed to check merchant status' },
      { status: 500 }
    );
  }
} 