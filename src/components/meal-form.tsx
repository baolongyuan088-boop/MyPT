"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SectionGroup, RowField } from "@/components/ui/section";
import { Loader2 } from "lucide-react";

function nowTimeValue() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function MealForm() {
  const t = useTranslations("log");
  const locale = useLocale();
  const router = useRouter();

  const [text, setText] = useState("");
  const [time, setTime] = useState(nowTimeValue());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const [hh, mm] = time.split(":").map(Number);
    const eatenAt = new Date();
    eatenAt.setHours(hh, mm, 0, 0);

    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rawText: text.trim(),
          eatenAt: eatenAt.toISOString(),
          locale,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Failed");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <SectionGroup footer={t("subtitle")}>
        <div className="px-4 py-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("placeholder")}
            required
            minLength={2}
            rows={5}
          />
        </div>
      </SectionGroup>

      <SectionGroup>
        <RowField label={t("time")}>
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="h-10 w-full max-w-[10rem] cursor-pointer rounded-lg border border-border bg-muted/40 px-3 text-[15px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="button"
              onClick={() => setTime(nowTimeValue())}
              className="text-[13px] font-medium text-muted-foreground hover:text-foreground"
            >
              {t("now")}
            </button>
          </div>
        </RowField>
      </SectionGroup>

      {error && (
        <div
          role="alert"
          className="rounded-2xl bg-destructive/15 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={submitting || text.trim().length < 2}
        className="w-full"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? t("calculating") : t("submit")}
      </Button>
    </form>
  );
}
