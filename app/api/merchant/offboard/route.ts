import { auth } from "@/auth"
import { prisma } from "@/app/lib/prisma"
import { NextResponse } from "next/server"
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia" as any,
});

export const DELETE = auth(async function DELETE(req) {
  try {
    console.log('Starting merchant deletion process')
    
    if (!req.auth?.user?.email) {
      console.log('Authentication failed: No auth or user found')
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get the merchant ID from the URL params
    const { searchParams } = new URL(req.url)
    const merchantId = searchParams.get("merchantId")
    console.log('Received merchantId:', merchantId)

    if (!merchantId) {
      console.log('Missing merchantId in request')
      return new NextResponse("Merchant ID is required", { status: 400 })
    }

    // Get the merchant to check Stripe connection and verify ownership
    const merchant = await prisma.merchant.findFirst({
      where: {
        id: merchantId,
        user: {
          email: req.auth.user.email
        }
      },
      include: {
        locations: true // Include locations to delete from Stripe
      }
    });

    if (!merchant) {
      console.log('Merchant not found or unauthorized')
      return new NextResponse("Merchant not found", { status: 404 })
    }

    console.log('Found merchant and associated data:', {
      merchantId: merchant.id,
      locationCount: merchant.locations.length,
      hasStripeConnect: !!merchant.stripeConnectId
    })

    // If merchant has Stripe connection, delete Stripe resources first
    if (merchant.stripeConnectId) {
      try {
        console.log('Deleting Stripe resources for connected account:', merchant.stripeConnectId)
        
        // Delete all Terminal locations in Stripe
        for (const location of merchant.locations) {
          if (location.stripeLocationId) {
            console.log('Deleting Stripe location:', location.stripeLocationId)
            try {
              await stripe.terminal.locations.del(
                location.stripeLocationId,
                {
                  stripeAccount: merchant.stripeConnectId,
                }
              );
            } catch (stripeError) {
              console.log('Error deleting Stripe location:', {
                locationId: location.stripeLocationId,
                error: stripeError
              })
              // Continue with other deletions even if one fails
            }
          }
        }

        // Deactivate the Stripe Connect account
        console.log('Deactivating Stripe Connect account')
        await stripe.accounts.del(merchant.stripeConnectId);
        
      } catch (stripeError) {
        console.error('Error cleaning up Stripe resources:', stripeError)
        // Continue with database cleanup even if Stripe cleanup fails
      }
    }

    // Delete everything from database in correct order
    console.log('Starting database cascade deletion')
    const deletedMerchant = await prisma.merchant.delete({
      where: {
        id: merchantId,
      },
      include: {
        locations: true,
        // Include other related records you want to return in response
      }
    })

    console.log('Successfully deleted merchant and all associated data:', {
      merchantId: deletedMerchant.id,
      deletedLocations: deletedMerchant.locations.length
    })
    
    return NextResponse.json({
      success: true,
      deleted: {
        merchantId: deletedMerchant.id,
        locationCount: deletedMerchant.locations.length,
        stripeConnectId: merchant.stripeConnectId || undefined
      }
    })

  } catch (error: any) {
    console.error('Error in merchant offboarding:', {
      error,
      merchantId: new URL(req.url).searchParams.get("merchantId"),
      email: req.auth?.user?.email
    })
    return NextResponse.json({
      error: "Failed to offboard merchant",
      details: error.message
    }, { status: 500 })
  }
})
