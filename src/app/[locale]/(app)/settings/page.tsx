import { setRequestLocale, getTranslations } from "next-intl/server";
import { SectionGroup } from "@/components/ui/section";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("settings");

  return (
    <div className="space-y-6">
      <header className="px-1">
        <h1 className="text-[34px] font-bold tracking-tight leading-tight">
          {t("title")}
        </h1>
      </header>

      <SectionGroup title={t("appearance")} footer={t("themeHint")}>
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <span className="text-[15px]">{t("theme")}</span>
          <ThemeToggle />
        </div>
      </SectionGroup>

      <SectionGroup title={t("language")} footer={t("languageHint")}>
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <span className="text-[15px]">{t("language")}</span>
          <LocaleSwitcher />
        </div>
      </SectionGroup>
    </div>
  );
}
