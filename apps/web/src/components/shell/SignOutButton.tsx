"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius)] text-xs text-[var(--color-ink-4)] hover:text-[var(--color-bad)] hover:bg-[var(--color-bad-2)] transition-colors w-full"
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3" />
        <path d="M9 9.5l2.5-3L9 3.5" />
        <path d="M11.5 6.5H5" />
      </svg>
      Sign out
    </button>
  );
}
