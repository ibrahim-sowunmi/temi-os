import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";

// GET handler for fetching workers
export const GET = auth(async function GET(req) {
  console.log("GET /api/worker - Started");
  try {
    if (!req.auth?.user?.email) {
      console.log("GET /api/worker - No user email found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Get the merchant data for the current user
    const merchant = await prisma.merchant.findFirst({
      where: {
        user: {
          email: req.auth.user.email
        }
      }
    });

    if (!merchant) {
      console.log("GET /api/worker - Merchant not found");
      return NextResponse.json(
        { error: "Merchant account not found" },
        { status: 400 }
      );
    }

    // If ID is provided, get a specific worker
    if (id) {
      console.log(`GET /api/worker - Fetching specific worker: ${id}`);
      
      const worker = await prisma.worker.findUnique({
        where: {
          id,
          merchantId: merchant.id // Only allow access to the merchant's own workers
        },
        include: {
          merchant: {
            select: {
              id: true,
              businessName: true
            }
          },
          locations: {
            select: {
              id: true,
              displayName: true
            }
          }
        }
      });

      if (!worker) {
        console.log("GET /api/worker - Worker not found");
        return NextResponse.json(
          { error: "Worker not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(worker);
    }

    // Otherwise, get all workers
    console.log(`GET /api/worker - Fetching all workers`);
    
    const workers = await prisma.worker.findMany({
      where: {
        merchantId: merchant.id // Filter by merchant ID
      },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true
          }
        },
        _count: {
          select: {
            locations: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    return NextResponse.json(workers);
  } catch (error: any) {
    console.log("Error fetching workers:", error?.message || 'Unknown error');
    return NextResponse.json(
      { error: "Failed to fetch workers", details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
});

// POST handler for creating workers
export const POST = auth(async function POST(req) {
  console.log("POST /api/worker - Started");
  try {
    if (!req.auth?.user?.email) {
      console.log("POST /api/worker - No user email found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { 
      name, 
      agentId, 
      language = "en", 
      firstMessage, 
      prompt, 
      voiceId,
      locationIds 
    } = body;

    // Validate required fields
    if (!name) {
      console.log("POST /api/worker - Missing required fields");
      return NextResponse.json(
        { error: "Name is required" },
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
      console.log("POST /api/worker - Merchant not found");
      return NextResponse.json(
        { error: "Merchant account not found" },
        { status: 400 }
      );
    }

    // Prepare the create data
    const createData: any = {
      id: `worker_${crypto.randomUUID().replace(/-/g, '')}`,
      name,
      language,
      merchantId: merchant.id, // Associate with the merchant
      agentId: '3qvXoZTD2Plx5HKwAy9k' // Default agent ID
    };

    // Add optional fields if provided
    if (firstMessage) createData.firstMessage = firstMessage;
    if (prompt) createData.prompt = prompt;
    if (voiceId) createData.voiceId = voiceId;

    // Handle location connections if provided
    if (locationIds?.length) {
      // Verify all locations belong to this merchant
      const locationCount = await prisma.location.count({
        where: {
          id: { in: locationIds },
          merchantId: merchant.id
        }
      });

      if (locationCount !== locationIds.length) {
        console.log("POST /api/worker - Some locations don't belong to this merchant");
        return NextResponse.json(
          { error: "One or more locations not found or don't belong to your account" },
          { status: 400 }
        );
      }

      createData.locations = {
        connect: locationIds.map((id: string) => ({ id }))
      };
    }

    // Create the worker
    const worker = await prisma.worker.create({
      data: createData,
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true
          }
        },
        locations: {
          select: {
            id: true,
            displayName: true
          }
        }
      }
    });

    console.log("POST /api/worker - Worker created:", { id: worker.id });
    return NextResponse.json(worker);
  } catch (error: any) {
    console.log("Error creating worker:", error?.message || 'Unknown error');
    return NextResponse.json(
      { error: "Failed to create worker", details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
});

// PUT handler for updating workers
export const PUT = auth(async function PUT(req) {
  console.log("PUT /api/worker - Started");
  try {
    if (!req.auth?.user?.email) {
      console.log("PUT /api/worker - No user email found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      console.log("PUT /api/worker - No worker ID provided");
      return NextResponse.json(
        { error: "Worker ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { 
      name, 
      agentId, 
      language, 
      firstMessage, 
      prompt, 
      voiceId,
      locationIds 
    } = body;

    // Get the merchant data for the current user
    const merchant = await prisma.merchant.findFirst({
      where: {
        user: {
          email: req.auth.user.email
        }
      }
    });

    if (!merchant) {
      console.log("PUT /api/worker - Merchant not found");
      return NextResponse.json(
        { error: "Merchant account not found" },
        { status: 400 }
      );
    }

    // Fetch the existing worker
    const existingWorker = await prisma.worker.findUnique({
      where: { 
        id,
        merchantId: merchant.id // Ensure the worker belongs to this merchant
      },
      include: {
        locations: true
      }
    });

    if (!existingWorker) {
      console.log("PUT /api/worker - Worker not found or not owned by merchant");
      return NextResponse.json(
        { error: "Worker not found" },
        { status: 404 }
      );
    }

    // Prepare the update data
    const updateData: any = {};
    
    // Only update fields that are provided
    if (name !== undefined) updateData.name = name;
    if (agentId !== undefined) updateData.agentId = agentId;
    if (language !== undefined) updateData.language = language;
    if (firstMessage !== undefined) updateData.firstMessage = firstMessage;
    if (prompt !== undefined) updateData.prompt = prompt;
    if (voiceId !== undefined) updateData.voiceId = voiceId;

    // Handle location connections if provided
    if (locationIds) {
      // Verify all locations belong to this merchant
      const locationCount = await prisma.location.count({
        where: {
          id: { in: locationIds },
          merchantId: merchant.id
        }
      });

      if (locationCount !== locationIds.length) {
        console.log("PUT /api/worker - Some locations don't belong to this merchant");
        return NextResponse.json(
          { error: "One or more locations not found or don't belong to your account" },
          { status: 400 }
        );
      }

      // Get current location IDs for comparison
      const currentLocationIds = existingWorker.locations.map(location => location.id);
      
      // Determine which locations to disconnect
      const locationsToDisconnect = currentLocationIds.filter((id: string) => !locationIds.includes(id));
      
      // Determine which locations to connect
      const locationsToConnect = locationIds.filter((id: string) => !currentLocationIds.includes(id));

      if (locationsToDisconnect.length > 0) {
        updateData.locations = {
          disconnect: locationsToDisconnect.map((id: string) => ({ id }))
        };
      }

      if (locationsToConnect.length > 0) {
        updateData.locations = updateData.locations || {};
        updateData.locations.connect = locationsToConnect.map((id: string) => ({ id }));
      }
    }

    // Update the worker
    const updatedWorker = await prisma.worker.update({
      where: { 
        id,
        merchantId: merchant.id // Ensure we're updating the merchant's own worker
      },
      data: updateData,
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true
          }
        },
        locations: {
          select: {
            id: true,
            displayName: true
          }
        }
      }
    });

    console.log("PUT /api/worker - Worker updated:", { id });
    return NextResponse.json(updatedWorker);
  } catch (error: any) {
    console.log("Error updating worker:", error?.message || 'Unknown error');
    return NextResponse.json(
      { error: "Failed to update worker", details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
});

// DELETE handler for deleting workers
export const DELETE = auth(async function DELETE(req) {
  console.log("DELETE /api/worker - Started");
  try {
    if (!req.auth?.user?.email) {
      console.log("DELETE /api/worker - No user email found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      console.log("DELETE /api/worker - No worker ID provided");
      return NextResponse.json(
        { error: "Worker ID is required" },
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
      console.log("DELETE /api/worker - Merchant not found");
      return NextResponse.json(
        { error: "Merchant account not found" },
        { status: 400 }
      );
    }

    // Check if the worker exists and belongs to this merchant
    const worker = await prisma.worker.findUnique({
      where: { 
        id,
        merchantId: merchant.id // Ensure the worker belongs to the merchant
      }
    });

    if (!worker) {
      console.log("DELETE /api/worker - Worker not found or not owned by merchant");
      return NextResponse.json(
        { error: "Worker not found" },
        { status: 404 }
      );
    }

    // Delete the worker
    await prisma.worker.delete({
      where: { 
        id,
        merchantId: merchant.id // Ensure we're deleting the merchant's own worker
      }
    });

    console.log("DELETE /api/worker - Worker deleted:", { id });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.log("Error deleting worker:", error?.message || 'Unknown error');
    return NextResponse.json(
      { error: "Failed to delete worker", details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}); 