import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/items", "/transactions", "/users", "/audit-logs"];

const isProtectedRoute = (pathname: string) => {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
};

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("inventra_token")?.value;

  if (pathname === "/") {
    const url = new URL(token ? "/dashboard" : "/login", request.url);
    return NextResponse.redirect(url);
  }

  if (!token && isProtectedRoute(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*", "/items/:path*", "/transactions/:path*", "/users/:path*", "/audit-logs/:path*"]
};
