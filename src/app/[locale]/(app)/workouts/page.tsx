import { auth } from "@/auth";
import { db } from "@/db/client";
import { workoutSessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { SectionGroup, Row } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Plus, Dumbbell } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

export default async function WorkoutsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const rows = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.userId, session!.user.id))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(50);

  const t = await getTranslations("workouts");

  return (
    <div className="space-y-6">
      <header className="px-1">
        <h1 className="text-[34px] font-bold tracking-tight leading-tight">
          {t("title")}
        </h1>
      </header>

      <Link href="/workouts/new" className="block">
        <Button size="lg" className="w-full">
          <Plus className="h-5 w-5" />
          {t("new")}
        </Button>
      </Link>

      {rows.length === 0 ? (
        <div className="rounded-2xl bg-card px-5 py-6 text-center text-sm text-muted-foreground">
          {t("empty")}
        </div>
      ) : (
        <SectionGroup>
          {rows.map((s) => {
            const started =
              s.startedAt instanceof Date
                ? s.startedAt
                : new Date(s.startedAt as unknown as number);
            const finished = s.endedAt
              ? s.endedAt instanceof Date
                ? s.endedAt
                : new Date(s.endedAt as unknown as number)
              : null;
            const durMin = s.totalDurationSec ? Math.round(s.totalDurationSec / 60) : null;
            return (
              <Row
                key={s.id}
                onClick={undefined}
                leading={<Dumbbell className="h-5 w-5" />}
                label={
                  <Link
                    href={`/workouts/${s.id}`}
                    className="block text-[15px]"
                  >
                    {formatDate(started, locale)}
                  </Link>
                }
                sublabel={
                  finished
                    ? `${formatTime(started, locale)} · ${durMin}m`
                    : `${formatTime(started, locale)} · ${t("rest")}`
                }
              />
            );
          })}
        </SectionGroup>
      )}
    </div>
  );
}
