import { auth } from "@/auth"
import { prisma } from "@/app/lib/prisma"
import { NextResponse } from "next/server"

export const DELETE = auth(async function DELETE(req) {
  try {
    console.log('Starting merchant deletion process')
    
    if (!req.auth || !req.auth.user) {
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

    console.log('Attempting to delete merchant:', {
      merchantId,
      userId: req.auth.user.id
    })

    // Delete the merchant
    const deletedMerchant = await prisma.merchant.delete({
      where: {
        id: merchantId,
        userId: req.auth.user.id,
      },
    })

    console.log('Successfully deleted merchant:', deletedMerchant)
    return NextResponse.json(deletedMerchant)
  } catch (error) {
    console.error('Error deleting merchant:', {
      error,
      merchantId: new URL(req.url).searchParams.get("merchantId"),
      userId: req.auth?.user?.id
    })
    return new NextResponse("Internal Server Error", { status: 500 })
  }
})
