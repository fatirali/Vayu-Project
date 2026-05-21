import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";

function makeCookieMethods(
  cookieStore: Awaited<ReturnType<typeof cookies>>
): CookieMethodsServer {
  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          if (options) cookieStore.set(name, value, options);
          else cookieStore.set(name, value);
        });
      } catch {
        // Called from a Server Component — cookie mutation is a no-op
      }
    },
  };
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!,
    { cookies: makeCookieMethods(cookieStore) }
  );
}

/** Service-role client — bypasses RLS. Use only in server actions and API routes, never in RSCs. */
export async function createSupabaseServiceClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    { cookies: makeCookieMethods(cookieStore) }
  );
}
