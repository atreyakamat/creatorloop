import { NextResponse, type NextRequest } from "next/server";
import { landingOnly } from "@/lib/env";
import { updateSession } from "@/lib/supabase/proxy";

const APP_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password", "/dashboard", "/business", "/creator", "/admin", "/auth"];

export async function proxy(request: NextRequest) {
  // Landing-only: the app is not open yet, so every app route goes to the waitlist.
  if (landingOnly()) {
    const path = request.nextUrl.pathname;
    if (APP_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) {
      return NextResponse.redirect(new URL("/#waitlist", request.url));
    }
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    // Everything except static assets, images and PWA files.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml|sw.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
