import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get("session")

  // If user is not logged in and trying to access protected routes
  if (!authCookie) {
    if (
      request.nextUrl.pathname.startsWith("/admin") ||
      request.nextUrl.pathname === "/"
    ) {
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/admin/:path*"],
}