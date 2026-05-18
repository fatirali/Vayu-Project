"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const learnerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Minimum 8 characters"),
  role: z.literal("learner"),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
});

const actorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Minimum 8 characters"),
  role: z.literal("actor"),
  linkedinUrl: z.string().url("Enter a valid LinkedIn URL").optional().or(z.literal("")),
  referralSource: z.string().optional(),
});

const schema = z.discriminatedUnion("role", [learnerSchema, actorSchema]);
type FormValues = z.infer<typeof schema>;

type Role = "learner" | "actor";

export default function SignUpPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("learner");
  const [serverError, setServerError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "learner" },
  });

  const supabase = createSupabaseBrowserClient();

  function switchRole(r: Role) {
    setRole(r);
    setValue("role", r);
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);

    const metadata: Record<string, string | undefined> = {
      role: values.role,
      firstName: values.firstName,
      lastName: values.lastName,
    };

    if (values.role === "learner") {
      metadata["company"] = values.company ?? undefined;
      metadata["jobTitle"] = values.jobTitle ?? undefined;
    } else {
      metadata["linkedinUrl"] = values.linkedinUrl ?? undefined;
      metadata["referralSource"] = values.referralSource ?? undefined;
    }

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: metadata },
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    if (values.role === "learner") {
      router.push("/library");
      router.refresh();
    } else {
      setDone(true);
    }
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

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius)] bg-[var(--color-actor)] mb-4">
            <span className="text-white font-semibold text-sm">R</span>
          </div>
          <h1 className="text-xl font-semibold text-[var(--color-ink)] mb-2">
            Application received
          </h1>
          <p className="text-sm text-[var(--color-ink-3)] mb-4">
            We&apos;ll review your application and email you within 2 business days.
          </p>
          <Link
            href="/sign-in"
            className="text-sm text-[var(--color-accent)] hover:underline font-medium"
          >
            Return to sign in
          </Link>
        </div>
      </div>
    );
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
          {/* Role picker */}
          <div className="flex rounded-[var(--radius-auth)] border border-[var(--color-line)] p-0.5 mb-5 bg-[var(--color-chip)]">
            <button
              type="button"
              onClick={() => switchRole("learner")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-[calc(var(--radius-auth)-2px)] transition ${
                role === "learner"
                  ? "bg-white text-[var(--color-ink)] shadow-sm"
                  : "text-[var(--color-ink-4)] hover:text-[var(--color-ink-3)]"
              }`}
            >
              I&apos;m a learner
            </button>
            <button
              type="button"
              onClick={() => switchRole("actor")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-[calc(var(--radius-auth)-2px)] transition ${
                role === "actor"
                  ? "bg-white text-[var(--color-ink)] shadow-sm"
                  : "text-[var(--color-ink-4)] hover:text-[var(--color-ink-3)]"
              }`}
            >
              I&apos;m an actor
            </button>
          </div>

          {role === "actor" && (
            <p className="text-xs text-[var(--color-ink-4)] bg-[var(--color-chip)] px-3 py-2 rounded-[var(--radius-auth)] mb-4">
              Actor accounts require approval. We&apos;ll review your application within 2 business days.
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <input type="hidden" {...register("role")} />

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

            {/* Learner-only fields */}
            {role === "learner" && (
              <>
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
                    {...register("company" as "company")}
                  />
                </div>
              </>
            )}

            {/* Actor-only fields */}
            {role === "actor" && (
              <>
                <div>
                  <label
                    htmlFor="linkedinUrl"
                    className="block text-xs font-medium text-[var(--color-ink-3)] mb-1.5"
                  >
                    LinkedIn URL
                  </label>
                  <input
                    id="linkedinUrl"
                    type="url"
                    autoComplete="url"
                    placeholder="https://linkedin.com/in/yourname"
                    className="w-full px-3 py-2 text-sm bg-white border border-[var(--color-line)] rounded-[var(--radius-auth)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-4)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition"
                    {...register("linkedinUrl" as "linkedinUrl")}
                  />
                  {"linkedinUrl" in errors && errors.linkedinUrl && (
                    <p className="mt-1 text-xs text-[var(--color-bad)]">
                      {errors.linkedinUrl.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="referralSource"
                    className="block text-xs font-medium text-[var(--color-ink-3)] mb-1.5"
                  >
                    How did you hear about us?{" "}
                    <span className="text-[var(--color-ink-4)] font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    id="referralSource"
                    type="text"
                    placeholder="LinkedIn, friend, etc."
                    className="w-full px-3 py-2 text-sm bg-white border border-[var(--color-line)] rounded-[var(--radius-auth)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-4)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition"
                    {...register("referralSource" as "referralSource")}
                  />
                </div>
              </>
            )}

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
              {isSubmitting
                ? "Creating account…"
                : role === "actor"
                ? "Apply as actor"
                : "Create account"}
            </button>
          </form>

          {role === "learner" && (
            <>
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
            </>
          )}
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
