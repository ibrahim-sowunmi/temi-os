import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia" as any,
});

// Create a product
export const POST = auth(async function POST(req) {
  console.log("POST /api/stripe/products - Started");
  try {
    if (!req.auth?.user?.email) {
      console.log("POST /api/stripe/products - No user email found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, description, images, price, currency = "usd", metadata = {} } = body;
    console.log("POST /api/stripe/products - Request body:", { 
      name, 
      description: description ? "Provided" : "Not provided", 
      images: images?.length ? `${images.length} images` : "No images",
      price: price ? `${price} cents` : "No price provided"
    });

    if (!name) {
      console.log("POST /api/stripe/products - Missing required fields");
      return NextResponse.json(
        { error: "Product name is required" },
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
    console.log("POST /api/stripe/products - Merchant found:", { 
      merchantId: merchant?.id, 
      hasStripeConnect: !!merchant?.stripeConnectId 
    });

    if (!merchant || !merchant.stripeConnectId) {
      console.log("POST /api/stripe/products - Merchant not found or not connected");
      return NextResponse.json(
        { error: "Merchant account not found or not connected to Stripe" },
        { status: 400 }
      );
    }

    // Create product in Stripe
    console.log("POST /api/stripe/products - Creating product in Stripe");
    const product = await stripe.products.create(
      {
        name,
        description,
        images,
        metadata,
        active: true,
      },
      {
        stripeAccount: merchant.stripeConnectId,
      }
    );
    console.log("POST /api/stripe/products - Stripe product created:", { productId: product.id });

    // Create price if provided
    let stripePrice = null;
    if (price) {
      console.log("POST /api/stripe/products - Creating price in Stripe");
      stripePrice = await stripe.prices.create(
        {
          product: product.id,
          unit_amount: price,
          currency: currency,
        },
        {
          stripeAccount: merchant.stripeConnectId,
        }
      );
      console.log("POST /api/stripe/products - Stripe price created:", { priceId: stripePrice.id });
    }

    // Create the product in our database
    console.log("POST /api/stripe/products - Creating product in database");
    try {
      const dbProduct = await prisma.product.create({
        data: {
          id: `prodt_${crypto.randomUUID().replace(/-/g, '')}`,
          stripeProductId: product.id,
          name: product.name,
          description: product.description,
          images: product.images || [],
          active: product.active,
          price: price || null,
          currency: currency,
          categories: body.categories || [],
          stockQuantity: body.stockQuantity || null,
          merchant: {
            connect: {
              id: merchant.id
            }
          },
          metadata: product.metadata || {},
        }
      });
      console.log("POST /api/stripe/products - Database product created:", { id: dbProduct.id });
      
      return NextResponse.json(dbProduct);
    } catch (dbError: any) {
      // If database creation fails, delete the product from Stripe to avoid orphaned resources
      console.log("Error creating product in database:", dbError?.message || 'Unknown database error');
      
      // Delete the Stripe product to avoid orphaned resources
      if (merchant?.stripeConnectId && product?.id) {
        try {
          console.log("Cleaning up Stripe product:", product.id);
          await stripe.products.update(
            product.id,
            {
              active: false,
            },
            {
              stripeAccount: merchant.stripeConnectId,
            }
          );
          console.log("Successfully archived Stripe product after database error");
        } catch (stripeCleanupError: any) {
          console.log("Failed to archive Stripe product. Error:", stripeCleanupError?.message || 'Unknown cleanup error');
        }
      }
      
      return NextResponse.json(
        { 
          error: "Failed to create product in database", 
          details: dbError?.message || 'Unknown database error'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.log("Error creating product:", error?.message || 'Unknown error');
    return NextResponse.json(
      { error: "Failed to create product", details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
});

// Get products for the authenticated merchant
export const GET = auth(async function GET(req) {
  console.log("GET /api/stripe/products - Started");
  try {
    if (!req.auth?.user?.email) {
      console.log("GET /api/stripe/products - No user email found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const includeStripeData = searchParams.get("includeStripeData") === "true";

    // Get the merchant data for the current user
    const merchant = await prisma.merchant.findFirst({
      where: {
        user: {
          email: req.auth.user.email
        }
      }
    });
    console.log("GET /api/stripe/products - Merchant found:", { merchantId: merchant?.id });

    if (!merchant) {
      console.log("GET /api/stripe/products - Merchant not found");
      return NextResponse.json(
        { error: "Merchant account not found" },
        { status: 400 }
      );
    }

    // If productId is provided, get specific product
    if (productId) {
      console.log("GET /api/stripe/products - Fetching specific product:", productId);
      
      // Ensure the productId has the prefix
      const formattedProductId = productId.startsWith('prodt_') ? productId : `prodt_${productId}`;
      
      // Get the product from database
      const product = await prisma.product.findUnique({
        where: {
          id: formattedProductId,
          merchantId: merchant.id // Ensure product belongs to requesting merchant
        }
      });

      if (!product) {
        console.log("GET /api/stripe/products - Product not found");
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      // If stripe data is requested and merchant is connected
      if (includeStripeData && merchant.stripeConnectId && product.stripeProductId) {
        try {
          console.log("GET /api/stripe/products - Fetching Stripe product:", product.stripeProductId);
          const stripeProduct = await stripe.products.retrieve(
            product.stripeProductId,
            {
              stripeAccount: merchant.stripeConnectId
            }
          );
          
          return NextResponse.json({
            ...product,
            stripeData: stripeProduct
          });
        } catch (stripeError: any) {
          console.log("Error fetching Stripe product:", stripeError?.message || 'Unknown Stripe error');
          // Return database product even if Stripe fetch fails
          return NextResponse.json(product);
        }
      }

      return NextResponse.json(product);
    }

    // Get all products for this merchant
    console.log("GET /api/stripe/products - Fetching all products");
    const products = await prisma.product.findMany({
      where: {
        merchantId: merchant.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    console.log("GET /api/stripe/products - Products found:", { count: products.length });

    return NextResponse.json(products);
  } catch (error: any) {
    console.log("Error fetching products:", error?.message || 'Unknown error');
    return NextResponse.json(
      { error: "Failed to fetch products", details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
});

// Update a product
export const PUT = auth(async function PUT(req) {
  console.log("PUT /api/stripe/products - Started");
  try {
    if (!req.auth?.user?.email) {
      console.log("PUT /api/stripe/products - No user email found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    
    if (!productId) {
      console.log("PUT /api/stripe/products - No product ID provided");
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, description, images, active, price, currency, metadata } = body;
    let stripePrice: any = null;

    // Get the merchant data for the current user
    const merchant = await prisma.merchant.findFirst({
      where: {
        user: {
          email: req.auth.user.email
        }
      }
    });

    if (!merchant) {
      console.log("PUT /api/stripe/products - Merchant not found");
      return NextResponse.json(
        { error: "Merchant account not found" },
        { status: 400 }
      );
    }

    // Format product ID
    const formattedProductId = productId.startsWith('prodt_') ? productId : `prodt_${productId}`;

    // Get the existing product
    const product = await prisma.product.findUnique({
      where: {
        id: formattedProductId,
        merchantId: merchant.id // Ensure product belongs to requesting merchant
      }
    });

    if (!product) {
      console.log("PUT /api/stripe/products - Product not found");
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Update in Stripe first
    if (merchant.stripeConnectId && product.stripeProductId) {
      console.log("PUT /api/stripe/products - Updating Stripe product:", product.stripeProductId);
      
      const updateParams: any = {};
      
      if (name !== undefined) updateParams.name = name;
      if (description !== undefined) updateParams.description = description;
      if (images !== undefined) updateParams.images = images;
      if (active !== undefined) updateParams.active = active;
      if (metadata !== undefined) updateParams.metadata = metadata;
      
      if (Object.keys(updateParams).length > 0) {
        await stripe.products.update(
          product.stripeProductId,
          updateParams,
          {
            stripeAccount: merchant.stripeConnectId,
          }
        );
      }
      
      // Handle price update if needed
      if (price !== undefined && merchant.stripeConnectId) {
        console.log("PUT /api/stripe/products - Price update requested");
        
        if (product.stripePriceId) {
          // Archive old price
          console.log("PUT /api/stripe/products - Archiving old price:", product.stripePriceId);
          await stripe.prices.update(
            product.stripePriceId,
            {
              active: false,
            },
            {
              stripeAccount: merchant.stripeConnectId,
            }
          );
        }
        
        // Create new price
        console.log("PUT /api/stripe/products - Creating new price");
        stripePrice = await stripe.prices.create(
          {
            product: product.stripeProductId,
            unit_amount: price,
            currency: currency || product.currency || "usd",
          },
          {
            stripeAccount: merchant.stripeConnectId,
          }
        );
        console.log("PUT /api/stripe/products - New price created:", stripePrice.id);
      }
    }

    // Update in database
    console.log("PUT /api/stripe/products - Updating database product");
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (images !== undefined) updateData.images = images;
    if (active !== undefined) updateData.active = active;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (price !== undefined) updateData.price = price;
    if (currency !== undefined) updateData.currency = currency;
    if (stripePrice && stripePrice.id) updateData.stripePriceId = stripePrice.id;
    
    try {
      const updatedProduct = await prisma.product.update({
        where: {
          id: product.id,
          merchantId: merchant.id,
        },
        data: updateData
      });

      return NextResponse.json(updatedProduct);
    } catch (dbError: any) {
      console.log("Error updating product in database:", dbError?.message || 'Unknown database error');
      return NextResponse.json(
        { 
          error: "Failed to update product in database", 
          details: dbError?.message || 'Unknown database error'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.log("Error updating product:", error?.message || 'Unknown error');
    return NextResponse.json(
      { error: "Failed to update product", details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
});

// Delete (archive) a product
export const DELETE = auth(async function DELETE(req) {
  console.log("DELETE /api/stripe/products - Started");
  try {
    if (!req.auth?.user?.email) {
      console.log("DELETE /api/stripe/products - No user email found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    
    if (!productId) {
      console.log("DELETE /api/stripe/products - No product ID provided");
      return NextResponse.json(
        { error: "Product ID is required" },
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
      console.log("DELETE /api/stripe/products - Merchant not found");
      return NextResponse.json(
        { error: "Merchant account not found" },
        { status: 400 }
      );
    }

    // Format product ID
    const formattedProductId = productId.startsWith('prodt_') ? productId : `prodt_${productId}`;

    // Get the existing product
    const product = await prisma.product.findUnique({
      where: {
        id: formattedProductId,
        merchantId: merchant.id // Ensure product belongs to requesting merchant
      }
    });

    if (!product) {
      console.log("DELETE /api/stripe/products - Product not found");
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Archive in Stripe first (Stripe doesn't allow deletion, only archiving)
    if (merchant.stripeConnectId && product.stripeProductId) {
      console.log("DELETE /api/stripe/products - Archiving Stripe product:", product.stripeProductId);
      await stripe.products.update(
        product.stripeProductId,
        {
          active: false,
        },
        {
          stripeAccount: merchant.stripeConnectId,
        }
      );
    }

    // Delete from database
    console.log("DELETE /api/stripe/products - Deleting database product");
    await prisma.product.delete({
      where: {
        id: product.id,
        merchantId: merchant.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.log("Error deleting product:", error?.message || 'Unknown error');
    
    // More specific error handling for common Stripe errors
    if (error?.message?.includes("Cannot delete product with existing prices")) {
      return NextResponse.json(
        { 
          error: "Cannot delete product with existing prices", 
          details: "Please archive or delete all prices for this product first",
          code: "PRODUCT_HAS_PRICES"
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to delete product", details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}); 