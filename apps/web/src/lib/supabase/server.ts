import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
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

/**
 * Service-role client — genuinely bypasses RLS. Use only in server actions and
 * API routes (never RSCs), and always scope queries explicitly to the
 * authenticated user (requireAuth) since RLS will not protect you here.
 *
 * NOTE: must NOT be built with cookies — if a user session is attached, the
 * SDK sends the user's JWT as authorization and RLS applies as that user,
 * silently defeating the purpose (this bug broke recording signed URLs).
 */
export async function createSupabaseServiceClient() {
  return createClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
