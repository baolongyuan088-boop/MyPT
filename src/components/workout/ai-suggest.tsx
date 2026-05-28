"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Play, RefreshCw, Sparkles } from "lucide-react";

interface PlanEntry {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
}

interface Plan {
  rationale: string;
  entries: PlanEntry[];
}

export function AiSuggest() {
  const t = useTranslations("workouts");
  const locale = useLocale();
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/workouts/suggest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale: locale === "en" ? "en" : "tr" }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Failed");
      }
      const data = (await res.json()) as Plan;
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  }

  async function startPlan() {
    if (!plan) return;
    setStarting(true);
    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          entries: plan.entries.map((e) => ({
            exerciseId: e.exerciseId,
            sets: e.sets,
            reps: e.reps,
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { session: { id: string } };
      router.push(`/workouts/${data.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStarting(false);
    }
  }

  if (!plan) {
    return (
      <div className="rounded-2xl bg-card p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 shrink-0 text-foreground" />
          <div className="flex-1">
            <h2 className="text-base font-semibold">{t("aiSuggest")}</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {t("aiSubtext")}
            </p>
          </div>
        </div>
        {error && (
          <div
            role="alert"
            className="mt-3 rounded-xl bg-destructive/15 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        )}
        <Button
          type="button"
          size="lg"
          onClick={generate}
          disabled={generating}
          className="mt-4 w-full"
        >
          {generating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
          {generating ? t("thinking") : t("generate")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-card p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 shrink-0 text-foreground" />
          <p className="flex-1 text-[14px] italic leading-snug text-muted-foreground">
            {plan.rationale}
          </p>
        </div>
        <ul className="mt-4 space-y-2 border-t border-border pt-3">
          {plan.entries.map((e) => (
            <li
              key={e.exerciseId}
              className="flex items-center justify-between gap-2"
            >
              <span className="text-[15px]">{e.exerciseName}</span>
              <span className="text-[13px] font-semibold tabular-nums text-muted-foreground">
                {e.sets} × {e.reps}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl bg-destructive/15 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Button
          type="button"
          size="lg"
          onClick={startPlan}
          disabled={starting}
        >
          {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
          {t("startThisPlan")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={generate}
          disabled={generating}
          aria-label={t("regenerate")}
        >
          {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}
