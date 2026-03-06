import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPaths = [
  "/dashboard",
  "/customers",
  "/vehicles",
  "/workorders",
  "/parts",
  "/services",
  "/alignments",
  "/settings",
];
const guestPaths = ["/login"];

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const path = request.nextUrl.pathname;
  const isProtected = protectedPaths.some((p) => path.startsWith(p));
  const isGuest = guestPaths.some((p) => path === p);

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }
  if (isGuest && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/customers/:path*", "/vehicles/:path*", "/workorders/:path*", "/parts/:path*", "/services/:path*", "/alignments/:path*", "/settings/:path*", "/login"],
};
