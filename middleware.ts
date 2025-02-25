import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// List of public routes that don't require authentication
const publicRoutes = ['/', '/auth/signin', '/auth/signup', '/auth/forgot-password']

export async function middleware(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  // If the user is on a public route and authenticated, redirect to dashboard
  if (publicRoutes.includes(pathname) && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // If the user is not authenticated and trying to access a protected route,
  // redirect to root page
  if (!session && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Allow the request to proceed
  return NextResponse.next()
}

// Configure the paths that should trigger this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
} 