import { NextResponse } from 'next/server';
import { prisma } from '@/prisma';
import { auth } from '@/auth';

export async function GET(
  request: Request,
  context: { params: Promise<{ merchantId: string }> }
) {
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // In Next.js 15, we need to await the params
    const params = await context.params;
    const { merchantId } = params;
    
    // Check if the user is authorized to access this merchant's data
    const merchant = await prisma.merchant.findFirst({
      where: {
        id: merchantId,
        user: {
          email: session.user.email
        }
      }
    });
    
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found or unauthorized' }, { status: 403 });
    }
    
    // Fetch terminals for this merchant
    const terminals = await prisma.terminal.findMany({
      where: {
        merchantId: merchantId
      },
      select: {
        id: true,
        name: true,
        stripeTerminalId: true,
        locationId: true,
        deviceType: true,
        location: {
          select: {
            displayName: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    // Format the terminals for the frontend
    const formattedTerminals = terminals.map(terminal => ({
      id: terminal.id,
      name: terminal.name || `Terminal at ${terminal.location.displayName}`,
      stripeTerminalId: terminal.stripeTerminalId,
      locationId: terminal.locationId,
      deviceType: terminal.deviceType
    }));
    
    return NextResponse.json(formattedTerminals);
  } catch (error) {
    console.error('Error fetching terminals:', error);
    return NextResponse.json({ error: 'Failed to fetch terminals' }, { status: 500 });
  }
} 