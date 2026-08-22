import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/admin-auth";

const ADMIN_TOKEN_COOKIE = "admin_token";
const LOGIN_PATH = "/admin/login";
const ADMIN_ROOT = "/admin";

function isAdminLogin(pathname: string): boolean {
  return pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`);
}

async function hasValidAdminToken(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value;
  if (!token) return false;
  return verifyToken(token);
}

/**
 * Edge route protection for /admin pages.
 *
 * - Guarded routes (/admin and everything under it, excluding /admin/login):
 *   missing or invalid `admin_token` cookie -> redirect to /admin/login.
 * - /admin/login with a valid token -> redirect to /admin.
 * - Everything else passes through.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (isAdminLogin(pathname)) {
    if (await hasValidAdminToken(request)) {
      return NextResponse.redirect(new URL(ADMIN_ROOT, request.url));
    }
    return NextResponse.next();
  }

  if (!(await hasValidAdminToken(request))) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
