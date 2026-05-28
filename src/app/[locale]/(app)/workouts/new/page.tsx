import { setRequestLocale, getTranslations } from "next-intl/server";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import { AiSuggest } from "@/components/workout/ai-suggest";

export default async function NewWorkoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("workouts");

  return (
    <div className="space-y-6">
      <header className="px-1">
        <h1 className="text-[34px] font-bold tracking-tight leading-tight">
          {t("new")}
        </h1>
      </header>

      <AiSuggest />

      <h2 className="px-4 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t("orPickManually")}
      </h2>
      <ExercisePicker />
    </div>
  );
}
