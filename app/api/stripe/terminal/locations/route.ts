import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia" as any,
});

export const POST = auth(async function POST(req) {
  console.log("POST /api/stripe/terminal/locations - Started");
  try {
    if (!req.auth) {
      console.log("POST /api/stripe/terminal/locations - Unauthorized");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!req.auth?.user?.email) {
      console.log("POST /api/stripe/terminal/locations - No user email found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { displayName, address } = body;
    console.log("POST /api/stripe/terminal/locations - Request body:", { displayName, address: { ...address, line1: address?.line1 } });

    if (!displayName || !address) {
      console.log("POST /api/stripe/terminal/locations - Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the merchant data for the current user using the authenticated email
    console.log("Auth user email:", req.auth.user.email);
    const merchant = await prisma.merchant.findFirst({
      where: {
        user: {
          email: req.auth.user.email
        }
      }
    });
    console.log("POST /api/stripe/terminal/locations - Merchant found:", { 
      merchantId: merchant?.id, 
      hasStripeConnect: !!merchant?.stripeConnectId 
    });

    if (!merchant || !merchant.stripeConnectId) {
      console.log("POST /api/stripe/terminal/locations - Merchant not found or not connected");
      return NextResponse.json(
        { error: "Merchant account not found or not connected to Stripe" },
        { status: 400 }
      );
    }

    // Create a location in Stripe
    console.log("POST /api/stripe/terminal/locations - Creating location in Stripe for connected account:", merchant.stripeConnectId);
    const stripeLocation = await stripe.terminal.locations.create(
      {
        display_name: displayName,
        address: {
          line1: address.line1,
          city: address.city,
          state: address.state,
          country: address.country,
          postal_code: address.postalCode,
        },
      },
      {
        stripeAccount: merchant.stripeConnectId,
      }
    );
    console.log("POST /api/stripe/terminal/locations - Stripe location created:", { 
      locationId: stripeLocation.id,
      connectedAccountId: merchant.stripeConnectId 
    });

    // Create the location in our database
    console.log("POST /api/stripe/terminal/locations - Creating location in database");
    const location = await prisma.location.create({
      data: {
        id: `loc_${crypto.randomUUID().replace(/-/g, '')}`,
        merchantId: merchant.id,
        stripeLocationId: stripeLocation.id,
        displayName,
        address: {
          line1: address.line1,
          city: address.city,
          state: address.state,
          country: address.country,
          postalCode: address.postalCode
        },
        active: true,
      },
    });
    console.log("POST /api/stripe/terminal/locations - Database location created:", { id: location.id });

    return NextResponse.json(location);
    
  } catch (error: any) {
    console.log("Error in locations route:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: error.message },
      { status: 500 }
    );
  }
});

// Get locations for the authenticated merchant
export const GET = auth(async function GET(req) {
  console.log("GET /api/stripe/terminal/locations - Started");
  try {
    if (!req.auth) {
      console.log("GET /api/stripe/terminal/locations - Unauthorized");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!req.auth?.user?.email) {
      console.log("GET /api/stripe/terminal/locations - No user email found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    const includeStripeData = searchParams.get("includeStripeData") === "true";

    // If locationId is provided, get specific location
    if (locationId) {
      console.log("GET /api/stripe/terminal/locations - Fetching specific location:", locationId);
      
      // Get the merchant data for the current user
      const merchant = await prisma.merchant.findFirst({
        where: {
          user: {
            email: req.auth.user.email
          }
        }
      });

      if (!merchant) {
        console.log("GET /api/stripe/terminal/locations - Merchant not found");
        return NextResponse.json(
          { error: "Merchant account not found" },
          { status: 400 }
        );
      }

      // Get the location from database
      const location = await prisma.location.findUnique({
        where: {
          id: locationId.startsWith('loc_') ? locationId : `loc_${locationId}`,
          merchantId: merchant.id // Ensure location belongs to requesting merchant
        }
      });

      if (!location) {
        console.log("GET /api/stripe/terminal/locations - Location not found");
        return NextResponse.json(
          { error: "Location not found" },
          { status: 404 }
        );
      }

      // If stripe data is requested and merchant is connected
      if (includeStripeData && merchant.stripeConnectId) {
        try {
          console.log("GET /api/stripe/terminal/locations - Fetching Stripe location:", location.stripeLocationId);
          const stripeLocation = await stripe.terminal.locations.retrieve(
            location.stripeLocationId,
            {
              stripeAccount: merchant.stripeConnectId
            }
          );
          
          return NextResponse.json({
            ...location,
            stripeData: stripeLocation
          });
        } catch (stripeError) {
          console.log("Error fetching Stripe location:", stripeError);
          // Return database location even if Stripe fetch fails
          return NextResponse.json(location);
        }
      }

      return NextResponse.json(location);
    }

    // If no locationId, get all locations (existing code)
    console.log("GET /api/stripe/terminal/locations - Fetching all locations");
    const merchant = await prisma.merchant.findFirst({
      where: {
        user: {
          email: req.auth.user.email
        }
      }
    });

    if (!merchant) {
      console.log("GET /api/stripe/terminal/locations - Merchant not found");
      return NextResponse.json(
        { error: "Merchant account not found" },
        { status: 400 }
      );
    }

    // Get all locations for this merchant
    console.log("GET /api/stripe/terminal/locations - Fetching locations");
    const locations = await prisma.location.findMany({
      where: {
        merchantId: merchant.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    console.log("GET /api/stripe/terminal/locations - Locations found:", { count: locations.length });

    return NextResponse.json(locations);
  } catch (error: any) {
    console.log("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
});

// Update a location
export const PUT = auth(async function PUT(req) {
  console.log("PUT /api/stripe/terminal/locations - Started");
  try {
    if (!req.auth?.user?.email) {
      console.log("PUT /api/stripe/terminal/locations - No user email found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    
    if (!locationId) {
      console.log("PUT /api/stripe/terminal/locations - No location ID provided");
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { displayName, address } = body;

    // Get the merchant data for the current user
    const merchant = await prisma.merchant.findFirst({
      where: {
        user: {
          email: req.auth.user.email
        }
      }
    });

    if (!merchant) {
      console.log("PUT /api/stripe/terminal/locations - Merchant not found");
      return NextResponse.json(
        { error: "Merchant account not found" },
        { status: 400 }
      );
    }

    // Get the existing location
    const location = await prisma.location.findUnique({
      where: {
        id: locationId.startsWith('loc_') ? locationId : `loc_${locationId}`,
        merchantId: merchant.id // Ensure location belongs to requesting merchant
      }
    });

    if (!location) {
      console.log("PUT /api/stripe/terminal/locations - Location not found");
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    // Update in Stripe first
    if (merchant.stripeConnectId) {
      console.log("PUT /api/stripe/terminal/locations - Updating Stripe location:", location.stripeLocationId);
      await stripe.terminal.locations.update(
        location.stripeLocationId,
        {
          display_name: displayName,
          address: address ? {
            line1: address.line1,
            city: address.city,
            state: address.state,
            country: address.country,
            postal_code: address.postalCode,
          } : undefined,
        },
        {
          stripeAccount: merchant.stripeConnectId,
        }
      );
    }

    // Update in database
    console.log("PUT /api/stripe/terminal/locations - Updating database location");
    const updatedLocation = await prisma.location.update({
      where: {
        id: location.id,
        merchantId: merchant.id,
      },
      data: {
        displayName: displayName || location.displayName,
        address: address ? {
          line1: address.line1,
          city: address.city,
          state: address.state,
          country: address.country,
          postalCode: address.postalCode
        } : undefined,
      },
    });

    return NextResponse.json(updatedLocation);
  } catch (error: any) {
    console.log("Error updating location:", error);
    return NextResponse.json(
      { error: "Failed to update location", details: error.message },
      { status: 500 }
    );
  }
});

// Delete a location
export const DELETE = auth(async function DELETE(req) {
  console.log("DELETE /api/stripe/terminal/locations - Started");
  try {
    if (!req.auth?.user?.email) {
      console.log("DELETE /api/stripe/terminal/locations - No user email found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    
    if (!locationId) {
      console.log("DELETE /api/stripe/terminal/locations - No location ID provided");
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 }
      );
    }

    // Get the merchant data for the current user
    const merchant = await prisma.merchant.findFirst({
      where: {
        user: {
          email: req.auth.user.email
        }
      }
    });

    if (!merchant) {
      console.log("DELETE /api/stripe/terminal/locations - Merchant not found");
      return NextResponse.json(
        { error: "Merchant account not found" },
        { status: 400 }
      );
    }

    // Get the existing location
    const location = await prisma.location.findUnique({
      where: {
        id: locationId.startsWith('loc_') ? locationId : `loc_${locationId}`,
        merchantId: merchant.id // Ensure location belongs to requesting merchant
      }
    });

    if (!location) {
      console.log("DELETE /api/stripe/terminal/locations - Location not found");
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    // Delete from Stripe first
    if (merchant.stripeConnectId) {
      console.log("DELETE /api/stripe/terminal/locations - Deleting Stripe location:", location.stripeLocationId);
      await stripe.terminal.locations.del(
        location.stripeLocationId,
        {
          stripeAccount: merchant.stripeConnectId,
        }
      );
    }

    // Delete from database
    console.log("DELETE /api/stripe/terminal/locations - Deleting database location");
    await prisma.location.delete({
      where: {
        id: location.id,
        merchantId: merchant.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.log("Error deleting location:", error);
    return NextResponse.json(
      { error: "Failed to delete location", details: error.message },
      { status: 500 }
    );
  }
}); 