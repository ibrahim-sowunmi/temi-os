import { NextRequest } from "next/server";
import authConfig from "./config/auth.config";
import NextAuth from "next-auth";

const { auth } = NextAuth(authConfig);

// Wrapped middleware with custom logic
export default auth(async function middleware(req: NextRequest) {
  // Your custom middleware logic goes here
});

// Optionally configure middleware matcher
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 