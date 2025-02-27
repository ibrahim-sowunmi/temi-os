import { NextResponse } from 'next/server';
import Fuse from 'fuse.js';
import { prisma } from '@/app/lib/prisma';

// Fuzzy search for the best product match
function findClosestProduct(productList: any[], userInput: string) {
  const fuse = new Fuse(productList, {
    keys: ['name', 'description', 'categories'],
    threshold: 0.6, // Adjust sensitivity (lower = stricter match)
  });

  const result = fuse.search(userInput.toLowerCase());
  return result.length ? result[0].item : null;
}

export async function GET(req: Request) {
  console.log("GET /api/product/search - Started");
  try {
    const { searchParams } = new URL(req.url);
    const userQuery = searchParams.get('query');
    const merchantId = searchParams.get('merchantId');

    if (!userQuery) {
      console.log("GET /api/product/search - No query provided");
      return NextResponse.json({
        message: "Could you please specify the product you're looking for?"
      }, { status: 400 });
    }

    if (!merchantId) {
      console.log("GET /api/product/search - No merchantId provided");
      return NextResponse.json({
        message: "A merchant ID is required for this search"
      }, { status: 400 });
    }
    
    // Get products for the specified merchant
    const products = await prisma.product.findMany({
      where: {
        merchantId: merchantId,
        active: true,
      },
    });
    console.log(`GET /api/product/search - Found ${products.length} products for merchant ${merchantId}`);

    if (!products.length) {
      console.log("GET /api/product/search - No products found");
      return NextResponse.json({
        message: "No products found for this merchant"
      }, { status: 404 });
    }

    const matchedProduct = findClosestProduct(products, userQuery);

    if (!matchedProduct) {
      console.log(`GET /api/product/search - No product found matching "${userQuery}"`);
      return NextResponse.json({
        message: `I couldn't find a product matching "${userQuery}". Could you provide more details or try another name?`
      }, { status: 404 });
    }

    // Check if product is out of stock or inactive
    if (!matchedProduct.active || !matchedProduct.inStock) {
      console.log(`GET /api/product/search - Product found but out of stock: ${matchedProduct.id}`);
      
      return NextResponse.json({
        productId: matchedProduct.id,
        name: matchedProduct.name,
        message: `I found ${matchedProduct.name}, but it's currently out of stock.`
      });
    }

    // Product is available
    console.log(`GET /api/product/search - Product found and in stock: ${matchedProduct.id}`);
    return NextResponse.json({
      productId: matchedProduct.id,
      name: matchedProduct.name,
      message: `I found **${matchedProduct.name}**. Would you like to know more about it or make a purchase?`
    });

  } catch (error) {
    console.error('Error matching product:', error);
    return NextResponse.json({
      message: "I encountered an error while searching for the product. Please try again later."
    }, { status: 500 });
  }
} 