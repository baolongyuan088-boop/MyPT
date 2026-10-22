"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionGroup } from "@/components/ui/section";
import { Loader2, Sparkles } from "lucide-react";
import type { AiSuggestion } from "@/db/schema";

export function InsightsPanel({ initial }: { initial: AiSuggestion[] }) {
  const t = useTranslations("insights");
  const locale = useLocale();
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale, windowDays: 3 }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Failed");
      }
      const data = (await res.json()) as { suggestion: AiSuggestion };
      setItems((prev) => [data.suggestion, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const dateFmt = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : locale === "tr" ? "tr-TR" : "en-GB", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-5">
      <Button onClick={generate} disabled={busy} className="w-full" size="lg">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {busy ? t("generating") : t("generate")}
      </Button>

      {error && (
        <div
          role="alert"
          className="rounded-2xl bg-destructive/15 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl bg-card px-5 py-6 text-center text-sm text-muted-foreground">
          {t("noSuggestions")}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((s) => (
            <SectionGroup
              key={s.id}
              footer={dateFmt.format(
                s.generatedAt instanceof Date
                  ? s.generatedAt
                  : new Date(s.generatedAt as unknown as number),
              )}
            >
              <div className="px-4 py-4">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                  {s.suggestionText}
                </p>
              </div>
            </SectionGroup>
          ))}
        </div>
      )}
    </div>
  );
}
