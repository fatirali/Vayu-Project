import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { TopBar } from "@/components/shell/TopBar";
import { ReflectionForm } from "./ReflectionForm";

type Props = {
  params: Promise<{ sessionId: string }>;
};

export default async function ReflectPage({ params }: Props) {
  const { sessionId } = await params;
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { data: session } = await supabase
    .from("sessions")
    .select(`id, learner_id, scenarios ( title )`)
    .eq("id", sessionId)
    .eq("learner_id", user.id)
    .single();

  if (!session) notFound();

  // Already reflected? It's locked — skip straight to analytics, no re-nag.
  const { data: existing } = await supabase
    .from("session_reflections")
    .select("submitted_at")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existing?.submitted_at) redirect(`/analytics/${sessionId}`);

  const scenario = Array.isArray(session.scenarios)
    ? session.scenarios[0]
    : session.scenarios;

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 h-14 border-b border-[var(--color-line)] bg-[var(--color-paper)] shrink-0">
        <TopBar
          breadcrumbs={[
            { label: "Library", href: "/library" },
            { label: scenario?.title ?? "Session" },
            { label: "Reflection" },
          ]}
        />
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <ReflectionForm sessionId={sessionId} />
        </div>
      </div>
    </div>
  );
}
