import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { verifyToken } from "@/lib/admin-auth";

const intlMiddleware = createMiddleware(routing);

const ADMIN_TOKEN_COOKIE = "admin_token";
const LOGIN_PATH = "/admin/login";
const ADMIN_ROOT = "/admin";

function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split("/");
  const first = segments[1]?.toLowerCase();
  if (segments.length > 1 && first && (routing.locales as readonly string[]).includes(first)) {
    return "/" + segments.slice(2).join("/");
  }
  return pathname;
}

async function hasValidAdminToken(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value;
  if (!token) return false;
  return verifyToken(token);
}

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const path = stripLocalePrefix(pathname);

  const isAdminPath = path === "/admin" || path.startsWith("/admin/");
  const isAdminLoginPath =
    path === "/admin/login" || path.startsWith("/admin/login/");

  // 1. Handle Admin Route Protection first
  if (isAdminPath) {
    if (isAdminLoginPath) {
      if (await hasValidAdminToken(request)) {
        return NextResponse.redirect(new URL(ADMIN_ROOT, request.url));
      }
      return intlMiddleware(request);
    }

    if (!(await hasValidAdminToken(request))) {
      return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    }

    return intlMiddleware(request);
  }

  // 2. Handle next-intl Language Routing for all public routes
  return intlMiddleware(request);
}

export const config = {
  // Match all paths except API routes, static files, and Next.js internals
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
