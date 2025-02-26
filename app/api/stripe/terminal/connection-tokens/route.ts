import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

// Create a connection token for terminal SDK
export const POST = auth(async function POST(req) {
  console.log("POST /api/stripe/terminal/connection-tokens - Started");
  try {
    if (!req.auth) {
      console.log("POST /api/stripe/terminal/connection-tokens - Unauthorized");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { locationId } = body;
    console.log("POST /api/stripe/terminal/connection-tokens - Request body:", { locationId });

    // Get the merchant data for the current user
    const merchant = await prisma.merchant.findUnique({
      where: {
        userId: req.auth.user.id,
      },
    });
    console.log("POST /api/stripe/terminal/connection-tokens - Merchant found:", { 
      merchantId: merchant?.id, 
      hasStripeConnect: !!merchant?.stripeConnectId 
    });

    if (!merchant || !merchant.stripeConnectId) {
      console.log("POST /api/stripe/terminal/connection-tokens - Merchant not found or not connected");
      return new NextResponse("Merchant account not found or not connected to Stripe", { status: 400 });
    }

    // Create connection token params
    const connectionTokenParams: any = {};
    
    // If locationId is provided, restrict the token to that location
    if (locationId) {
      console.log("POST /api/stripe/terminal/connection-tokens - Location ID provided, fetching location");
      // Get the location to ensure it belongs to this merchant
      const location = await prisma.location.findUnique({
        where: {
          id: locationId,
          merchantId: merchant.id,
        },
      });
      console.log("POST /api/stripe/terminal/connection-tokens - Location found:", { 
        locationId: location?.id, 
        stripeLocationId: location?.stripeLocationId 
      });

      if (!location) {
        console.log("POST /api/stripe/terminal/connection-tokens - Location not found");
        return new NextResponse("Location not found", { status: 404 });
      }

      connectionTokenParams.location = location.stripeLocationId;
    }

    // Create a connection token in Stripe
    console.log("POST /api/stripe/terminal/connection-tokens - Creating connection token in Stripe");
    const connectionToken = await stripe.terminal.connectionTokens.create(
      connectionTokenParams,
      {
        stripeAccount: merchant.stripeConnectId,
      }
    );
    console.log("POST /api/stripe/terminal/connection-tokens - Connection token created");

    return NextResponse.json(connectionToken);
  } catch (error) {
    console.error("Error creating connection token:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}); 