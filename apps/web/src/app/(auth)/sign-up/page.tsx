"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Minimum 8 characters"),
  company: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function SignUpPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const supabase = createSupabaseBrowserClient();

  async function onSubmit(values: FormValues) {
    setServerError(null);

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          role: "learner",
          firstName: values.firstName,
          lastName: values.lastName,
          company: values.company ?? undefined,
        },
      },
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    router.push("/library");
    router.refresh();
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/library`,
      },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius)] bg-[var(--color-accent)] mb-4">
            <span className="text-white font-semibold text-sm">R</span>
          </div>
          <h1 className="text-xl font-semibold text-[var(--color-ink)]">
            Create your account
          </h1>
          <p className="text-sm text-[var(--color-ink-4)] mt-1">
            Start practising high-stakes conversations.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius-auth-lg)] p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-xs font-medium text-[var(--color-ink-3)] mb-1.5"
                >
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Alex"
                  className="w-full px-3 py-2 text-sm bg-white border border-[var(--color-line)] rounded-[var(--radius-auth)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-4)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition"
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-[var(--color-bad)]">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-xs font-medium text-[var(--color-ink-3)] mb-1.5"
                >
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Jordan"
                  className="w-full px-3 py-2 text-sm bg-white border border-[var(--color-line)] rounded-[var(--radius-auth)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-4)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition"
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-[var(--color-bad)]">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-[var(--color-ink-3)] mb-1.5"
              >
                Work email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full px-3 py-2 text-sm bg-white border border-[var(--color-line)] rounded-[var(--radius-auth)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-4)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-[var(--color-bad)]">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-[var(--color-ink-3)] mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                className="w-full px-3 py-2 text-sm bg-white border border-[var(--color-line)] rounded-[var(--radius-auth)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-4)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition"
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-[var(--color-bad)]">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Company */}
            <div>
              <label
                htmlFor="company"
                className="block text-xs font-medium text-[var(--color-ink-3)] mb-1.5"
              >
                Company{" "}
                <span className="text-[var(--color-ink-4)] font-normal">
                  (optional)
                </span>
              </label>
              <input
                id="company"
                type="text"
                autoComplete="organization"
                placeholder="Acme Corp"
                className="w-full px-3 py-2 text-sm bg-white border border-[var(--color-line)] rounded-[var(--radius-auth)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-4)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition"
                {...register("company")}
              />
            </div>

            {/* Server error */}
            {serverError && (
              <p className="text-xs text-[var(--color-bad)] bg-[var(--color-bad-2)] px-3 py-2 rounded-[var(--radius-auth)]">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 text-sm font-medium text-white bg-[var(--color-accent)] rounded-[var(--radius-auth)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent)] disabled:opacity-50 transition"
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-line)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 text-xs text-[var(--color-ink-4)] bg-[var(--color-paper)]">
                or
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium text-[var(--color-ink-2)] bg-white border border-[var(--color-line)] rounded-[var(--radius-auth)] hover:bg-[var(--color-chip)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent)] disabled:opacity-50 transition"
          >
            <GoogleIcon />
            {googleLoading ? "Redirecting…" : "Sign up with Google"}
          </button>
        </div>

        <p className="text-center text-sm text-[var(--color-ink-4)] mt-4">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-[var(--color-accent)] hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M15.68 8.18c0-.57-.05-1.12-.14-1.64H8v3.1h4.3a3.67 3.67 0 01-1.59 2.41v2h2.57c1.5-1.38 2.4-3.42 2.4-5.87z"
        fill="#4285F4"
      />
      <path
        d="M8 16c2.16 0 3.97-.72 5.3-1.95l-2.57-2a4.8 4.8 0 01-2.73.75 4.8 4.8 0 01-4.5-3.32H.86v2.07A8 8 0 008 16z"
        fill="#34A853"
      />
      <path
        d="M3.5 9.48A4.84 4.84 0 013.25 8c0-.52.09-1.02.25-1.48V4.45H.86A8 8 0 000 8c0 1.29.31 2.51.86 3.55l2.64-2.07z"
        fill="#FBBC05"
      />
      <path
        d="M8 3.2a4.33 4.33 0 013.06 1.2l2.3-2.3A7.7 7.7 0 008 0 8 8 0 00.86 4.45L3.5 6.52A4.8 4.8 0 018 3.2z"
        fill="#EA4335"
      />
    </svg>
  );
}
