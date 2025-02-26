import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia" as any,
});

// Create a terminal reader
export const POST = auth(async function POST(req) {
  console.log("POST /api/stripe/terminal/readers - Started");
  try {
    if (!req.auth?.user?.email) {
      console.log("POST /api/stripe/terminal/readers - No user email found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { registrationCode, label, locationId } = body;
    console.log("POST /api/stripe/terminal/readers - Request body:", { 
      registrationCode: "REDACTED", 
      label, 
      locationId
    });

    if (!registrationCode || !locationId) {
      console.log("POST /api/stripe/terminal/readers - Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the merchant data for the current user using email
    const merchant = await prisma.merchant.findFirst({
      where: {
        user: {
          email: req.auth.user.email
        }
      }
    });
    console.log("POST /api/stripe/terminal/readers - Merchant found:", { 
      merchantId: merchant?.id, 
      hasStripeConnect: !!merchant?.stripeConnectId 
    });

    if (!merchant || !merchant.stripeConnectId) {
      console.log("POST /api/stripe/terminal/readers - Merchant not found or not connected");
      return NextResponse.json(
        { error: "Merchant account not found or not connected to Stripe" },
        { status: 400 }
      );
    }

    // Make sure locationId has the loc_ prefix
    const formattedLocationId = locationId.startsWith('loc_') ? locationId : `loc_${locationId}`;

    // Get the location
    const location = await prisma.location.findUnique({
      where: {
        id: formattedLocationId,
        merchantId: merchant.id,
      },
    });
    console.log("POST /api/stripe/terminal/readers - Location found:", { 
      locationId: location?.id, 
      stripeLocationId: location?.stripeLocationId 
    });

    if (!location) {
      console.log("POST /api/stripe/terminal/readers - Location not found");
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    // Create a reader in Stripe
    console.log("POST /api/stripe/terminal/readers - Creating reader in Stripe for connected account:", merchant.stripeConnectId);
    const reader = await stripe.terminal.readers.create(
      {
        registration_code: registrationCode,
        label: label || "Default Reader",
        location: location.stripeLocationId,
      },
      {
        stripeAccount: merchant.stripeConnectId,
      }
    );
    console.log("POST /api/stripe/terminal/readers - Stripe reader created:", { readerId: reader.id });

    // Create the reader in our database with rdr_ prefix
    const readerData: any = {
      id: `rdr_${crypto.randomUUID().replace(/-/g, '')}`,
      stripeTerminalId: reader.id,
      name: label || reader.label || "Default Reader",
      // Use explicit connect for required relations
      merchant: {
        connect: {
          id: merchant.id
        }
      },
      location: {
        connect: {
          id: location.id
        }
      }
    };

    console.log("POST /api/stripe/terminal/readers - Creating reader in database with no knowledge base");
    
    try {
      const terminalReader = await prisma.terminal.create({
        data: readerData,
        include: {
          location: true
        }
      });
      console.log("POST /api/stripe/terminal/readers - Database reader created:", { id: terminalReader.id });
      
      return NextResponse.json(terminalReader);
    } catch (dbError: any) {
      // If database creation fails, delete the reader from Stripe to avoid orphaned resources
      console.log("Error creating reader in database. Error message:", dbError?.message || 'Unknown database error');
      
      // Delete the Stripe reader to avoid orphaned resources
      if (merchant?.stripeConnectId && reader?.id) {
        try {
          console.log("Cleaning up Stripe reader:", reader.id);
          await stripe.terminal.readers.del(
            reader.id,
            {
              stripeAccount: merchant.stripeConnectId,
            }
          );
          console.log("Successfully cleaned up Stripe reader after database error");
        } catch (stripeCleanupError: any) {
          console.log("Failed to clean up Stripe reader. Error:", stripeCleanupError?.message || 'Unknown cleanup error');
        }
      } else {
        console.log("Cannot clean up Stripe reader: Missing account ID or reader ID");
      }
      
      // Re-throw with more context
      return NextResponse.json(
        { 
          error: "Failed to create terminal reader in database", 
          details: dbError?.message || 'Unknown database error'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.log("Error creating terminal reader:", error?.message || 'Unknown error');
    return NextResponse.json(
      { error: "Failed to create terminal reader", details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
});

// Get readers for the authenticated merchant
export const GET = auth(async function GET(req) {
  console.log("GET /api/stripe/terminal/readers - Started");
  try {
    if (!req.auth?.user?.email) {
      console.log("GET /api/stripe/terminal/readers - No user email found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const readerId = searchParams.get("readerId");
    const includeStripeData = searchParams.get("includeStripeData") === "true";

    // Get the merchant data for the current user
    const merchant = await prisma.merchant.findFirst({
      where: {
        user: {
          email: req.auth.user.email
        }
      }
    });
    console.log("GET /api/stripe/terminal/readers - Merchant found:", { merchantId: merchant?.id });

    if (!merchant) {
      console.log("GET /api/stripe/terminal/readers - Merchant not found");
      return NextResponse.json(
        { error: "Merchant account not found" },
        { status: 400 }
      );
    }

    // If readerId is provided, get specific reader
    if (readerId) {
      console.log("GET /api/stripe/terminal/readers - Fetching specific reader:", readerId);
      
      // Ensure the readerId has the prefix
      const formattedReaderId = readerId.startsWith('rdr_') ? readerId : `rdr_${readerId}`;
      
      // Get the reader from database
      const reader = await prisma.terminal.findUnique({
        where: {
          id: formattedReaderId,
          merchantId: merchant.id // Ensure reader belongs to requesting merchant
        },
        include: {
          location: true,
          knowledgeBase: true,
        }
      });

      if (!reader) {
        console.log("GET /api/stripe/terminal/readers - Reader not found");
        return NextResponse.json(
          { error: "Reader not found" },
          { status: 404 }
        );
      }

      // If stripe data is requested and merchant is connected
      if (includeStripeData && merchant.stripeConnectId && reader.stripeTerminalId) {
        try {
          console.log("GET /api/stripe/terminal/readers - Fetching Stripe reader:", reader.stripeTerminalId);
          const stripeReader = await stripe.terminal.readers.retrieve(
            reader.stripeTerminalId,
            {
              stripeAccount: merchant.stripeConnectId
            }
          );
          
          return NextResponse.json({
            ...reader,
            stripeData: stripeReader
          });
        } catch (stripeError: any) {
          console.log("Error fetching Stripe reader:", stripeError?.message || 'Unknown Stripe error');
          // Return database reader even if Stripe fetch fails
          return NextResponse.json(reader);
        }
      }

      return NextResponse.json(reader);
    }

    // Get all readers for this merchant
    console.log("GET /api/stripe/terminal/readers - Fetching all readers");
    const readers = await prisma.terminal.findMany({
      where: {
        merchantId: merchant.id,
      },
      include: {
        location: true,
        knowledgeBase: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    console.log("GET /api/stripe/terminal/readers - Readers found:", { count: readers.length });

    return NextResponse.json(readers);
  } catch (error: any) {
    console.log("Error fetching terminal readers:", error?.message || 'Unknown error');
    return NextResponse.json(
      { error: "Failed to fetch terminal readers", details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
});

// Update a reader
export const PUT = auth(async function PUT(req) {
  console.log("PUT /api/stripe/terminal/readers - Started");
  try {
    if (!req.auth?.user?.email) {
      console.log("PUT /api/stripe/terminal/readers - No user email found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const readerId = searchParams.get("readerId");
    
    if (!readerId) {
      console.log("PUT /api/stripe/terminal/readers - No reader ID provided");
      return NextResponse.json(
        { error: "Reader ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { label, locationId, knowledgeBaseId } = body;

    // Get the merchant data for the current user
    const merchant = await prisma.merchant.findFirst({
      where: {
        user: {
          email: req.auth.user.email
        }
      }
    });

    if (!merchant) {
      console.log("PUT /api/stripe/terminal/readers - Merchant not found");
      return NextResponse.json(
        { error: "Merchant account not found" },
        { status: 400 }
      );
    }

    // Format reader ID
    const formattedReaderId = readerId.startsWith('rdr_') ? readerId : `rdr_${readerId}`;

    // Get the existing reader
    const reader = await prisma.terminal.findUnique({
      where: {
        id: formattedReaderId,
        merchantId: merchant.id // Ensure reader belongs to requesting merchant
      }
    });

    if (!reader) {
      console.log("PUT /api/stripe/terminal/readers - Reader not found");
      return NextResponse.json(
        { error: "Reader not found" },
        { status: 404 }
      );
    }

    // If locationId is provided, verify it exists
    let location = null;
    if (locationId) {
      const formattedLocationId = locationId.startsWith('loc_') ? locationId : `loc_${locationId}`;
      
      location = await prisma.location.findUnique({
        where: {
          id: formattedLocationId,
          merchantId: merchant.id
        }
      });
      
      if (!location) {
        console.log("PUT /api/stripe/terminal/readers - Location not found");
        return NextResponse.json(
          { error: "Location not found" },
          { status: 404 }
        );
      }
    }

    // If knowledgeBaseId is provided, verify it exists
    if (knowledgeBaseId !== undefined && knowledgeBaseId !== null) {
      const knowledgeBase = await prisma.knowledgeBase.findUnique({
        where: {
          id: knowledgeBaseId
        }
      });
      
      if (!knowledgeBase) {
        console.log("PUT /api/stripe/terminal/readers - Knowledge base not found");
        return NextResponse.json(
          { error: "Knowledge base not found" },
          { status: 404 }
        );
      }
    }

    // Update in Stripe first
    if (merchant.stripeConnectId && reader.stripeTerminalId) {
      console.log("PUT /api/stripe/terminal/readers - Updating Stripe reader:", reader.stripeTerminalId);
      
      const updateParams: any = {};
      
      if (label) {
        updateParams.label = label;
      }
      
      // Only update location in Stripe if a new valid location is provided
      if (location) {
        updateParams.location = location.stripeLocationId;
      }
      
      if (Object.keys(updateParams).length > 0) {
        await stripe.terminal.readers.update(
          reader.stripeTerminalId,
          updateParams,
          {
            stripeAccount: merchant.stripeConnectId,
          }
        );
      }
    }

    // Update in database
    console.log("PUT /api/stripe/terminal/readers - Updating database reader");
    const updateData: any = {};
    
    // Simple field updates
    if (label) {
      updateData.name = label;
    }
    
    // Relation updates with consistent connect syntax
    if (location) {
      updateData.location = {
        connect: {
          id: location.id
        }
      };
    }
    
    // Handle knowledge base update with proper connect/disconnect
    if (knowledgeBaseId !== undefined) {
      if (knowledgeBaseId === null) {
        // If explicitly set to null, disconnect the knowledge base
        updateData.knowledgeBase = {
          disconnect: true
        };
      } else {
        // Otherwise connect to the specified knowledge base
        updateData.knowledgeBase = {
          connect: {
            id: knowledgeBaseId
          }
        };
      }
    }
    
    console.log("PUT /api/stripe/terminal/readers - Update data with knowledgeBaseId:", knowledgeBaseId !== undefined ? (knowledgeBaseId || "null") : "unchanged");
    
    try {
      const updatedReader = await prisma.terminal.update({
        where: {
          id: reader.id,
          merchantId: merchant.id,
        },
        data: updateData,
        include: {
          location: true,
          knowledgeBase: true,
        }
      });

      return NextResponse.json(updatedReader);
    } catch (dbError: any) {
      console.log("Error updating reader in database:", dbError?.message || 'Unknown database error');
      return NextResponse.json(
        { 
          error: "Failed to update terminal reader in database", 
          details: dbError?.message || 'Unknown database error'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.log("Error updating reader:", error?.message || 'Unknown error');
    return NextResponse.json(
      { error: "Failed to update reader", details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
});

// Delete a reader
export const DELETE = auth(async function DELETE(req) {
  console.log("DELETE /api/stripe/terminal/readers - Started");
  try {
    if (!req.auth?.user?.email) {
      console.log("DELETE /api/stripe/terminal/readers - No user email found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const readerId = searchParams.get("readerId");
    
    if (!readerId) {
      console.log("DELETE /api/stripe/terminal/readers - No reader ID provided");
      return NextResponse.json(
        { error: "Reader ID is required" },
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
      console.log("DELETE /api/stripe/terminal/readers - Merchant not found");
      return NextResponse.json(
        { error: "Merchant account not found" },
        { status: 400 }
      );
    }

    // Format reader ID
    const formattedReaderId = readerId.startsWith('rdr_') ? readerId : `rdr_${readerId}`;

    // Get the existing reader
    const reader = await prisma.terminal.findUnique({
      where: {
        id: formattedReaderId,
        merchantId: merchant.id // Ensure reader belongs to requesting merchant
      }
    });

    if (!reader) {
      console.log("DELETE /api/stripe/terminal/readers - Reader not found");
      return NextResponse.json(
        { error: "Reader not found" },
        { status: 404 }
      );
    }

    // Delete from Stripe first
    if (merchant.stripeConnectId && reader.stripeTerminalId) {
      console.log("DELETE /api/stripe/terminal/readers - Deleting Stripe reader:", reader.stripeTerminalId);
      await stripe.terminal.readers.del(
        reader.stripeTerminalId,
        {
          stripeAccount: merchant.stripeConnectId,
        }
      );
    }

    // Delete from database
    console.log("DELETE /api/stripe/terminal/readers - Deleting database reader");
    await prisma.terminal.delete({
      where: {
        id: reader.id,
        merchantId: merchant.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.log("Error deleting reader:", error?.message || 'Unknown error');
    return NextResponse.json(
      { error: "Failed to delete reader", details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}); 