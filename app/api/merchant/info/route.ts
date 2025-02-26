import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const GET = auth(async function GET(req) {
  try {
    console.log("GET /api/merchant/info - Request received", { userEmail: req.auth?.user?.email });

    if (!req.auth?.user?.email) {
      console.log("GET /api/merchant/info - Unauthorized: No user email");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("GET /api/merchant/info - Fetching merchant data for:", req.auth.user.email);
    const merchant = await prisma.merchant.findFirst({
      where: {
        user: {
          email: req.auth.user.email
        }
      },
      include: {
        terminals: true,
        products: true
      }
    });

    if (!merchant) {
      console.log("GET /api/merchant/info - Merchant not found for email:", req.auth.user.email);
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    console.log("GET /api/merchant/info - Successfully retrieved merchant data", { 
      merchantId: merchant.id,
      terminalCount: merchant.terminals.length,
      productCount: merchant.products.length
    });
    return NextResponse.json(merchant);
  } catch (error) {
    console.error("GET /api/merchant/info - Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}); 