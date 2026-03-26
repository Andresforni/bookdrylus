// middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn   = !!req.auth;
  const isAdmin      = req.auth?.user?.role === "ADMIN";

  // Public routes
  if (
    pathname.startsWith("/book/") ||
    pathname.startsWith("/cancel/") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/availability") ||
    pathname.startsWith("/api/bookings") ||
    pathname.startsWith("/api/services") ||
    pathname.startsWith("/api/cancel") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  if (!isLoggedIn) return NextResponse.redirect(new URL("/login", req.url));
  if (pathname.startsWith("/admin") && !isAdmin) return NextResponse.redirect(new URL("/dashboard", req.url));

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
