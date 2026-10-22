import { auth } from "@/auth";
import { db } from "@/db/client";
import { meals } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { MealEditForm } from "@/components/meal-edit-form";

export default async function MealEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("editMeal");

  const session = await auth();
  const rows = await db
    .select()
    .from(meals)
    .where(and(eq(meals.id, id), eq(meals.userId, session!.user.id)))
    .limit(1);

  const meal = rows[0];
  if (!meal) notFound();

  return (
    <div className="space-y-6">
      <header className="px-1">
        <h1 className="text-[34px] font-bold tracking-tight leading-tight">
          {t("title")}
        </h1>
      </header>
      <MealEditForm initial={meal} />
    </div>
  );
}
