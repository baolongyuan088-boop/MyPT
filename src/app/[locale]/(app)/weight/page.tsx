import { auth } from "@/auth";
import { db } from "@/db/client";
import { weightLogs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { WeightTracker } from "@/components/weight-tracker";

export default async function WeightPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const rows = await db
    .select()
    .from(weightLogs)
    .where(eq(weightLogs.userId, session!.user.id))
    .orderBy(desc(weightLogs.loggedAt))
    .limit(200);

  const t = await getTranslations("weight");

  return (
    <div className="space-y-6">
      <header className="px-1">
        <h1 className="text-[34px] font-bold tracking-tight leading-tight">
          {t("title")}
        </h1>
      </header>
      <WeightTracker initial={rows} />
    </div>
  );
}
