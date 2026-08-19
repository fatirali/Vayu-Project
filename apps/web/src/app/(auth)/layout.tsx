import { Suspense } from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Solid fill over the global body grid (globals.css) — on the sparse auth
  // pages the grid has no content on top of it and reads as noisy, so the
  // sign-in / sign-up screens sit on a clean background instead.
  return (
    <Suspense>
      <div className="min-h-screen bg-[var(--color-bg)]">{children}</div>
    </Suspense>
  );
}
