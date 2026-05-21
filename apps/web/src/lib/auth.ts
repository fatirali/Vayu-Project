import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

/**
 * Reads the authenticated user from the Supabase JWT + public.users table.
 * Redirects to /sign-in if not authenticated.
 * Call only from Server Components and Route Handlers.
 */
export async function requireAuth(): Promise<AuthUser> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("users")
    .select("first_name, last_name, role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    firstName: profile?.first_name ?? user.user_metadata["firstName"] ?? "",
    lastName: profile?.last_name ?? user.user_metadata["lastName"] ?? "",
    role: profile?.role ?? user.user_metadata["role"] ?? "learner",
  };
}
