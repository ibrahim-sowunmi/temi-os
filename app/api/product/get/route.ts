import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(request: Request) {
  console.log("GET /api/product/get - Started");
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const merchantId = searchParams.get('merchantId');

    console.log(`GET /api/product/get - Request params:`, { 
      productId, 
      merchantId, 
      url: request.url 
    });

    // Validate required parameters
    if (!productId) {
      console.log("GET /api/product/get - No productId provided");
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (!merchantId) {
      console.log("GET /api/product/get - No merchantId provided");
      return NextResponse.json(
        { error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    // Verify the merchant exists
    console.log(`GET /api/product/get - Looking up merchant: ${merchantId}`);
    try {
      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        select: { id: true }
      });

      console.log(`GET /api/product/get - Merchant lookup result:`, merchant);

      if (!merchant) {
        console.log(`GET /api/product/get - Merchant not found: ${merchantId}`);
        return NextResponse.json(
          { error: 'Merchant not found' },
          { status: 404 }
        );
      }
    } catch (merchantError) {
      console.error(`GET /api/product/get - Error looking up merchant:`, merchantError);
      return NextResponse.json(
        { error: 'Error verifying merchant', details: (merchantError as Error).message },
        { status: 500 }
      );
    }

    // Find the product and verify it belongs to the specified merchant
    console.log(`GET /api/product/get - Looking up product: ${productId} for merchant: ${merchantId}`);
    try {
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          merchantId: merchantId
        },
        include: {
          knowledgeBase: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      console.log(`GET /api/product/get - Product lookup result:`, 
        product ? { id: product.id, name: product.name } : 'Not found'
      );

      if (!product) {
        console.log(`GET /api/product/get - Product not found or doesn't belong to merchant: ${productId}`);
        return NextResponse.json(
          { error: 'Product not found for this merchant' },
          { status: 404 }
        );
      }

      // Format the response
      console.log(`GET /api/product/get - Constructing response for product: ${productId}`);
      const response = {
        productId: product.id,
        stripeProductId: product.stripeProductId,
        name: product.name,
        description: product.description,
        status: product.status,
        price: product.price,
        currency: product.currency,
        inStock: product.inStock,
        knowledgeBaseId: product.knowledgeBaseId,
        knowledgeBaseTitle: product.knowledgeBase?.title,
        message: `${product.name} costs ${product.price ? (product.price / 100).toFixed(2) : '0.00'} ${product.currency?.toUpperCase() || 'USD'}${!product.inStock ? ' (Currently out of stock)' : ''}`
      };
      
      console.log(`GET /api/product/get - Successfully constructed response for: ${productId}`);
      return NextResponse.json(response);
    } catch (productError) {
      console.error(`GET /api/product/get - Error looking up product:`, productError);
      return NextResponse.json(
        { error: 'Error retrieving product', details: (productError as Error).message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in GET /api/product/get:', error);
    // Include more error details to help diagnose the issue
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error(`Error details: ${errorMessage}`);
    if (errorStack) console.error(`Stack trace: ${errorStack}`);
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: errorMessage,
        // Only include stack in development
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    );
  }
} 