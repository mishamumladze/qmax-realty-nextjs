import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { verifyToken } from "@/lib/admin-auth";

const intlMiddleware = createMiddleware(routing);

const ADMIN_TOKEN_COOKIE = "admin_token";
const LOGIN_PATH = "/admin/login";
const ADMIN_ROOT = "/admin";

function isAdminLogin(pathname: string): boolean {
  return pathname.includes("/admin/login");
}

async function hasValidAdminToken(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value;
  if (!token) return false;
  return verifyToken(token);
}

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // 1. Handle Admin Route Protection first
  if (pathname.includes("/admin")) {
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

  // 2. Handle next-intl Language Routing for all public routes
  return intlMiddleware(request);
}

export const config = {
  // Match all paths except API routes, static files, and Next.js internals
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
