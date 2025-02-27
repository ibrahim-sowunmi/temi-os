import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { KnowledgeBaseScope } from "@prisma/client";

// GET handler for fetching knowledge bases
export const GET = auth(async function GET(req) {
  console.log("GET /api/knowledge - Started");
  try {
    if (!req.auth?.user?.email) {
      console.log("GET /api/knowledge - No user email found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const scope = searchParams.get("scope") as KnowledgeBaseScope | null;

    // Get the merchant data for the current user
    const merchant = await prisma.merchant.findFirst({
      where: {
        user: {
          email: req.auth.user.email
        }
      }
    });

    if (!merchant) {
      console.log("GET /api/knowledge - Merchant not found");
      return NextResponse.json(
        { error: "Merchant account not found" },
        { status: 400 }
      );
    }

    // If ID is provided, get a specific knowledge base
    if (id) {
      console.log(`GET /api/knowledge - Fetching specific knowledge base: ${id}`);
      
      const knowledgeBase = await prisma.knowledgeBase.findUnique({
        where: {
          id,
          merchantId: merchant.id // Only allow access to the merchant's own knowledge bases
        },
        include: {
          merchant: {
            select: {
              id: true,
              businessName: true
            }
          },
          products: {
            select: {
              id: true,
              name: true
            }
          },
          terminals: {
            select: {
              id: true,
              name: true
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

      if (!knowledgeBase) {
        console.log("GET /api/knowledge - Knowledge base not found");
        return NextResponse.json(
          { error: "Knowledge base not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(knowledgeBase);
    }

    // Otherwise, get all knowledge bases with optional scope filter
    const whereClause: any = {
      merchantId: merchant.id // Filter by merchant ID
    };
    
    if (scope) {
      whereClause.scope = scope;
    }

    console.log(`GET /api/knowledge - Fetching all knowledge bases${scope ? ` with scope: ${scope}` : ''}`);
    
    const knowledgeBases = await prisma.knowledgeBase.findMany({
      where: whereClause,
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true
          }
        },
        _count: {
          select: {
            products: true,
            terminals: true,
            locations: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    return NextResponse.json(knowledgeBases);
  } catch (error: any) {
    console.log("Error fetching knowledge bases:", error?.message || 'Unknown error');
    return NextResponse.json(
      { error: "Failed to fetch knowledge bases", details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
});

// POST handler for creating knowledge bases
export const POST = auth(async function POST(req) {
  console.log("POST /api/knowledge - Started");
  try {
    if (!req.auth?.user?.email) {
      console.log("POST /api/knowledge - No user email found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, content, tags, scope, productIds, terminalIds, locationIds, active = true } = body;

    // Validate required fields
    if (!title || !content) {
      console.log("POST /api/knowledge - Missing required fields");
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Validate scope value
    if (scope && !Object.values(KnowledgeBaseScope).includes(scope)) {
      console.log("POST /api/knowledge - Invalid scope value");
      return NextResponse.json(
        { error: `Invalid scope value. Must be one of: ${Object.values(KnowledgeBaseScope).join(', ')}` },
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
      console.log("POST /api/knowledge - Merchant not found");
      return NextResponse.json(
        { error: "Merchant account not found" },
        { status: 400 }
      );
    }

    // Enforce scope constraints
    const finalScope = scope || KnowledgeBaseScope.GLOBAL;
    console.log(`POST /api/knowledge - Creating with scope: ${finalScope}`);

    // Check that the provided IDs match the scope
    if (finalScope === KnowledgeBaseScope.PRODUCT && (terminalIds?.length || locationIds?.length)) {
      console.log("POST /api/knowledge - Scope mismatch: PRODUCT scope cannot include terminals or locations");
      return NextResponse.json(
        { error: "Knowledge bases with PRODUCT scope can only be attached to products" },
        { status: 400 }
      );
    }

    if (finalScope === KnowledgeBaseScope.READER && (productIds?.length || locationIds?.length)) {
      console.log("POST /api/knowledge - Scope mismatch: READER scope cannot include products or locations");
      return NextResponse.json(
        { error: "Knowledge bases with READER scope can only be attached to terminal readers" },
        { status: 400 }
      );
    }

    if (finalScope === KnowledgeBaseScope.LOCATION && (productIds?.length || terminalIds?.length)) {
      console.log("POST /api/knowledge - Scope mismatch: LOCATION scope cannot include products or terminals");
      return NextResponse.json(
        { error: "Knowledge bases with LOCATION scope can only be attached to locations" },
        { status: 400 }
      );
    }

    if (finalScope === KnowledgeBaseScope.GLOBAL && (productIds?.length || terminalIds?.length || locationIds?.length)) {
      console.log("POST /api/knowledge - Scope mismatch: GLOBAL scope cannot include any attachments");
      return NextResponse.json(
        { error: "Knowledge bases with GLOBAL scope cannot be attached to specific items" },
        { status: 400 }
      );
    }

    // Prepare the create data
    const createData: any = {
      id: `kb_${crypto.randomUUID().replace(/-/g, '')}`,
      title,
      content,
      scope: finalScope,
      active,
      tags: tags || [],
      merchantId: merchant.id, // Associate with the merchant
    };

    // Add connections based on scope
    if (finalScope === KnowledgeBaseScope.PRODUCT && productIds?.length) {
      // Verify all products belong to this merchant
      const productCount = await prisma.product.count({
        where: {
          id: { in: productIds },
          merchantId: merchant.id
        }
      });

      if (productCount !== productIds.length) {
        console.log("POST /api/knowledge - Some products don't belong to this merchant");
        return NextResponse.json(
          { error: "One or more products not found or don't belong to your account" },
          { status: 400 }
        );
      }

      createData.products = {
        connect: productIds.map((id: string) => ({ id }))
      };
    }

    if (finalScope === KnowledgeBaseScope.READER && terminalIds?.length) {
      // Verify all terminals belong to this merchant
      const terminalCount = await prisma.terminal.count({
        where: {
          id: { in: terminalIds },
          merchantId: merchant.id
        }
      });

      if (terminalCount !== terminalIds.length) {
        console.log("POST /api/knowledge - Some terminals don't belong to this merchant");
        return NextResponse.json(
          { error: "One or more terminal readers not found or don't belong to your account" },
          { status: 400 }
        );
      }

      createData.terminals = {
        connect: terminalIds.map((id: string) => ({ id }))
      };
    }

    if (finalScope === KnowledgeBaseScope.LOCATION && locationIds?.length) {
      // Verify all locations belong to this merchant
      const locationCount = await prisma.location.count({
        where: {
          id: { in: locationIds },
          merchantId: merchant.id
        }
      });

      if (locationCount !== locationIds.length) {
        console.log("POST /api/knowledge - Some locations don't belong to this merchant");
        return NextResponse.json(
          { error: "One or more locations not found or don't belong to your account" },
          { status: 400 }
        );
      }

      createData.locations = {
        connect: locationIds.map((id: string) => ({ id }))
      };
    }

    // Create the knowledge base
    const knowledgeBase = await prisma.knowledgeBase.create({
      data: createData,
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true
          }
        },
        products: {
          select: {
            id: true,
            name: true
          }
        },
        terminals: {
          select: {
            id: true,
            name: true
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

    console.log("POST /api/knowledge - Knowledge base created:", { id: knowledgeBase.id });
    return NextResponse.json(knowledgeBase);
  } catch (error: any) {
    console.log("Error creating knowledge base:", error?.message || 'Unknown error');
    return NextResponse.json(
      { error: "Failed to create knowledge base", details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
});

// PUT handler for updating knowledge bases
export const PUT = auth(async function PUT(req) {
  console.log("PUT /api/knowledge - Started");
  try {
    if (!req.auth?.user?.email) {
      console.log("PUT /api/knowledge - No user email found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      console.log("PUT /api/knowledge - No knowledge base ID provided");
      return NextResponse.json(
        { error: "Knowledge base ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { 
      title, 
      content, 
      tags, 
      scope, 
      active,
      productIds, 
      terminalIds, 
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
      console.log("PUT /api/knowledge - Merchant not found");
      return NextResponse.json(
        { error: "Merchant account not found" },
        { status: 400 }
      );
    }

    // Fetch the existing knowledge base
    const existingKnowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { 
        id,
        merchantId: merchant.id // Ensure the knowledge base belongs to this merchant
      },
      include: {
        products: true,
        terminals: true,
        locations: true
      }
    });

    if (!existingKnowledgeBase) {
      console.log("PUT /api/knowledge - Knowledge base not found or not owned by merchant");
      return NextResponse.json(
        { error: "Knowledge base not found" },
        { status: 404 }
      );
    }

    // Prevent scope changes
    if (scope && scope !== existingKnowledgeBase.scope) {
      console.log("PUT /api/knowledge - Attempted to change scope");
      return NextResponse.json(
        { error: "Cannot change the scope of an existing knowledge base" },
        { status: 400 }
      );
    }

    // Enforce scope constraints for connections
    if (existingKnowledgeBase.scope === KnowledgeBaseScope.PRODUCT && (terminalIds || locationIds)) {
      console.log("PUT /api/knowledge - Scope mismatch: PRODUCT scope cannot include terminals or locations");
      return NextResponse.json(
        { error: "Knowledge bases with PRODUCT scope can only be attached to products" },
        { status: 400 }
      );
    }

    if (existingKnowledgeBase.scope === KnowledgeBaseScope.READER && (productIds || locationIds)) {
      console.log("PUT /api/knowledge - Scope mismatch: READER scope cannot include products or locations");
      return NextResponse.json(
        { error: "Knowledge bases with READER scope can only be attached to terminal readers" },
        { status: 400 }
      );
    }

    if (existingKnowledgeBase.scope === KnowledgeBaseScope.LOCATION && (productIds || terminalIds)) {
      console.log("PUT /api/knowledge - Scope mismatch: LOCATION scope cannot include products or terminals");
      return NextResponse.json(
        { error: "Knowledge bases with LOCATION scope can only be attached to locations" },
        { status: 400 }
      );
    }

    if (existingKnowledgeBase.scope === KnowledgeBaseScope.GLOBAL && (productIds || terminalIds || locationIds)) {
      console.log("PUT /api/knowledge - Scope mismatch: GLOBAL scope cannot include any attachments");
      return NextResponse.json(
        { error: "Knowledge bases with GLOBAL scope cannot be attached to specific items" },
        { status: 400 }
      );
    }

    // Prepare the update data
    const updateData: any = {};
    
    // Only update fields that are provided
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = tags;
    if (active !== undefined) updateData.active = active;

    // Handle connections based on scope
    if (existingKnowledgeBase.scope === KnowledgeBaseScope.PRODUCT && productIds) {
      // Verify all products belong to this merchant
      const productCount = await prisma.product.count({
        where: {
          id: { in: productIds },
          merchantId: merchant.id
        }
      });

      if (productCount !== productIds.length) {
        console.log("PUT /api/knowledge - Some products don't belong to this merchant");
        return NextResponse.json(
          { error: "One or more products not found or don't belong to your account" },
          { status: 400 }
        );
      }

      // Get current product IDs for comparison
      const currentProductIds = existingKnowledgeBase.products.map(product => product.id);
      
      // Determine which products to disconnect
      const productsToDisconnect = currentProductIds.filter((id: string) => !productIds.includes(id));
      
      // Determine which products to connect
      const productsToConnect = productIds.filter((id: string) => !currentProductIds.includes(id));

      if (productsToDisconnect.length > 0) {
        updateData.products = {
          disconnect: productsToDisconnect.map((id: string) => ({ id }))
        };
      }

      if (productsToConnect.length > 0) {
        updateData.products = updateData.products || {};
        updateData.products.connect = productsToConnect.map((id: string) => ({ id }));
      }
    }

    if (existingKnowledgeBase.scope === KnowledgeBaseScope.READER && terminalIds) {
      // Verify all terminals belong to this merchant
      const terminalCount = await prisma.terminal.count({
        where: {
          id: { in: terminalIds },
          merchantId: merchant.id
        }
      });

      if (terminalCount !== terminalIds.length) {
        console.log("PUT /api/knowledge - Some terminals don't belong to this merchant");
        return NextResponse.json(
          { error: "One or more terminal readers not found or don't belong to your account" },
          { status: 400 }
        );
      }

      // Get current terminal IDs for comparison
      const currentTerminalIds = existingKnowledgeBase.terminals.map(terminal => terminal.id);
      
      // Determine which terminals to disconnect
      const terminalsToDisconnect = currentTerminalIds.filter((id: string) => !terminalIds.includes(id));
      
      // Determine which terminals to connect
      const terminalsToConnect = terminalIds.filter((id: string) => !currentTerminalIds.includes(id));

      if (terminalsToDisconnect.length > 0) {
        updateData.terminals = {
          disconnect: terminalsToDisconnect.map((id: string) => ({ id }))
        };
      }

      if (terminalsToConnect.length > 0) {
        updateData.terminals = updateData.terminals || {};
        updateData.terminals.connect = terminalsToConnect.map((id: string) => ({ id }));
      }
    }

    if (existingKnowledgeBase.scope === KnowledgeBaseScope.LOCATION && locationIds) {
      // Verify all locations belong to this merchant
      const locationCount = await prisma.location.count({
        where: {
          id: { in: locationIds },
          merchantId: merchant.id
        }
      });

      if (locationCount !== locationIds.length) {
        console.log("PUT /api/knowledge - Some locations don't belong to this merchant");
        return NextResponse.json(
          { error: "One or more locations not found or don't belong to your account" },
          { status: 400 }
        );
      }

      // Get current location IDs for comparison
      const currentLocationIds = existingKnowledgeBase.locations.map(location => location.id);
      
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

    // Skip update if no changes
    if (Object.keys(updateData).length === 0) {
      console.log("PUT /api/knowledge - No changes to update");
      return NextResponse.json(existingKnowledgeBase);
    }

    // Update the knowledge base
    const updatedKnowledgeBase = await prisma.knowledgeBase.update({
      where: { 
        id,
        merchantId: merchant.id // Ensure we're updating the merchant's own knowledge base
      },
      data: updateData,
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true
          }
        },
        products: {
          select: {
            id: true,
            name: true
          }
        },
        terminals: {
          select: {
            id: true,
            name: true
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

    console.log("PUT /api/knowledge - Knowledge base updated:", { id });
    return NextResponse.json(updatedKnowledgeBase);
  } catch (error: any) {
    console.log("Error updating knowledge base:", error?.message || 'Unknown error');
    return NextResponse.json(
      { error: "Failed to update knowledge base", details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
});

// DELETE handler for deleting knowledge bases
export const DELETE = auth(async function DELETE(req) {
  console.log("DELETE /api/knowledge - Started");
  try {
    if (!req.auth?.user?.email) {
      console.log("DELETE /api/knowledge - No user email found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      console.log("DELETE /api/knowledge - No knowledge base ID provided");
      return NextResponse.json(
        { error: "Knowledge base ID is required" },
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
      console.log("DELETE /api/knowledge - Merchant not found");
      return NextResponse.json(
        { error: "Merchant account not found" },
        { status: 400 }
      );
    }

    // Check if the knowledge base exists and belongs to this merchant
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { 
        id,
        merchantId: merchant.id // Ensure the knowledge base belongs to the merchant
      }
    });

    if (!knowledgeBase) {
      console.log("DELETE /api/knowledge - Knowledge base not found or not owned by merchant");
      return NextResponse.json(
        { error: "Knowledge base not found" },
        { status: 404 }
      );
    }

    // Delete the knowledge base
    await prisma.knowledgeBase.delete({
      where: { 
        id,
        merchantId: merchant.id // Ensure we're deleting the merchant's own knowledge base
      }
    });

    console.log("DELETE /api/knowledge - Knowledge base deleted:", { id });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.log("Error deleting knowledge base:", error?.message || 'Unknown error');
    return NextResponse.json(
      { error: "Failed to delete knowledge base", details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}); 