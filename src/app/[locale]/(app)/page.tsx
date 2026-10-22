import { auth } from "@/auth";
import { getMealsBetween, getUserById, getWeeklyWorkoutCount } from "@/db/queries";
import { db } from "@/db/client";
import { waterLogs } from "@/db/schema";
import { and, eq, gte, lt, desc } from "drizzle-orm";
import { fullProfileTargets } from "@/lib/calories";
import { buildDailySeries, averageCalories } from "@/lib/stats";
import { startOfLocalDay, endOfLocalDay } from "@/lib/utils";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { DailySummary } from "@/components/daily-summary";
import { MealTimeline } from "@/components/meal-timeline";
import { WaterTracker } from "@/components/water-tracker";
import { WeeklyBars } from "@/components/charts/weekly-bars";
import { MacroRing } from "@/components/charts/macro-ring";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Activity } from "lucide-react";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const userId = session!.user.id;
  const user = await getUserById(userId);

  const now = new Date();

  // Today
  const fromToday = startOfLocalDay(now).getTime();
  const toToday = endOfLocalDay(now).getTime();
  const mealsToday = await getMealsBetween(userId, fromToday, toToday);

  // Last 7 days (for weekly bars)
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 6);
  const fromWeek = startOfLocalDay(weekStart).getTime();
  const mealsWeek = await getMealsBetween(userId, fromWeek, toToday);
  const weekSeries = buildDailySeries(mealsWeek, 7);
  const avg7 = averageCalories(weekSeries);

  // Water today
  const waterRows = await db
    .select()
    .from(waterLogs)
    .where(
      and(
        eq(waterLogs.userId, userId),
        gte(waterLogs.loggedAt, new Date(fromToday)),
        lt(waterLogs.loggedAt, new Date(toToday)),
      ),
    )
    .orderBy(desc(waterLogs.loggedAt));
  const waterTotalMl = waterRows.reduce((s, r) => s + r.amountMl, 0);
  const waterTargetMl = user?.waterTargetMl ?? 2500;

  const totals = mealsToday.reduce(
    (acc, m) => {
      acc.calories += m.totalCalories ?? 0;
      acc.proteinG += m.proteinG ?? 0;
      acc.carbsG += m.carbsG ?? 0;
      acc.fatG += m.fatG ?? 0;
      return acc;
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  const weeklyWorkoutCount = user ? await getWeeklyWorkoutCount(user.id) : 0;
  const targets =
    user?.sex && user?.weightKg && user?.heightCm && user?.birthYear
      ? fullProfileTargets({
          sex: user.sex,
          weightKg: user.weightKg,
          heightCm: user.heightCm,
          birthYear: user.birthYear,
          weeklyWorkoutCount,
        })
      : null;

  const t = await getTranslations("dashboard");

  return (
    <div className="space-y-6">
      <header className="space-y-1 px-1">
        <p className="text-[13px] font-medium text-muted-foreground">
          {new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : locale === "tr" ? "tr-TR" : "en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }).format(now)}
        </p>
        <h1 className="text-[34px] font-bold tracking-tight leading-tight">
          {t("today")}
        </h1>
      </header>

      <DailySummary
        totals={totals}
        targets={
          targets
            ? {
                target: targets.target,
                proteinG: targets.proteinG,
                carbsG: targets.carbsG,
                fatG: targets.fatG,
              }
            : null
        }
      />

      {!targets && (
        <Link href="/profile">
          <Button variant="outline" className="w-full">
            {t("completeProfile")}
          </Button>
        </Link>
      )}

      {totals.calories > 0 && (
        <section className="space-y-1.5">
          <h2 className="px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("macroSplit")}
          </h2>
          <div className="rounded-2xl bg-card p-4">
            <MacroRing
              proteinG={totals.proteinG}
              carbsG={totals.carbsG}
              fatG={totals.fatG}
              centerValue={`${Math.round(totals.calories)}`}
              centerLabel="kcal"
            />
          </div>
        </section>
      )}

      <WaterTracker
        initialTotalMl={waterTotalMl}
        targetMl={waterTargetMl}
        initialLastLog={waterRows[0] ?? null}
      />

      <section className="space-y-1.5">
        <h2 className="px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("last7")}
        </h2>
        <WeeklyBars series={weekSeries} target={targets?.target} label={t("average", {n: avg7})} />
      </section>

      <Link href="/workouts" className="block">
        <Button variant="outline" size="lg" className="w-full">
          <Activity className="h-5 w-5" />
          {t("workouts")}
        </Button>
      </Link>

      <MealTimeline meals={mealsToday} title={t("todayMeals")} />
    </div>
  );
}
