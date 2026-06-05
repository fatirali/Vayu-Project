import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

type CookieEntry = { name: string; value: string; options?: Record<string, unknown> };

// Actor routes are prefixed with /actor/ to avoid URL conflicts with learner routes
// e.g. both learner and actor have a "brief" concept but different pages
const ROLE_ROUTES: Record<string, string[]> = {
  learner: ["/library", "/book", "/brief", "/session", "/my-sessions", "/analytics", "/coach", "/progress"],
  actor: ["/actor/dashboard", "/actor/brief", "/actor/playbook", "/actor/rules", "/actor/session", "/actor/scenarios", "/actor/earnings"],
  ld_admin: ["/scenarios", "/actors", "/cohorts", "/insights"],
  ops_admin: ["/overview", "/sessions", "/roster", "/payouts"],
};

const DEFAULT_ROUTES: Record<string, string> = {
  learner: "/library",
  actor: "/actor/dashboard",
  ld_admin: "/scenarios",
  ops_admin: "/overview",
};

const PUBLIC_PATHS = ["/sign-in", "/sign-up", "/api/auth", "/api/coach"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths and Next.js internals
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/cron") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: CookieEntry[]) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          response = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            response.cookies.set(name, value, (options ?? {}) as any)
          );
        },
      },
    }
  );

  // Use getUser() not getSession() — validates JWT server-side
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const role = (user.user_metadata["role"] as string) ?? "learner";
  const allowedPrefixes = ROLE_ROUTES[role] ?? [];

  // Allow root — handled by page.tsx redirect
  if (pathname === "/") return response;

  const isAllowed = allowedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isAllowed) {
    const defaultRoute = DEFAULT_ROUTES[role] ?? "/sign-in";
    return NextResponse.redirect(new URL(defaultRoute, req.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
