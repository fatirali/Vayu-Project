"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function RunPayoutButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRunPayout() {
    if (!confirm("Run manual payout for all pending sessions?")) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cron/payouts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env["NEXT_PUBLIC_CRON_SECRET"] ?? ""}`,
        },
      });
      if (res.ok) {
        setMessage("Payout triggered. Refresh to see updated status.");
      } else {
        setMessage("Failed to trigger payout.");
      }
    } catch {
      setMessage("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {message && (
        <span className="text-xs text-[var(--color-ink-3)]">{message}</span>
      )}
      <Button variant="stripe" size="sm" loading={loading} onClick={handleRunPayout}>
        Run manual payout
      </Button>
    </div>
  );
}
