import { setRequestLocale, getTranslations } from "next-intl/server";
import { MealForm } from "@/components/meal-form";

export default async function LogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("log");

  return (
    <div className="space-y-6">
      <header className="px-1">
        <h1 className="text-[34px] font-bold tracking-tight leading-tight">
          {t("title")}
        </h1>
      </header>
      <MealForm />
    </div>
  );
}
