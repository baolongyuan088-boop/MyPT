"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/50 p-0.5 text-[11px] font-semibold">
      {routing.locales.map((l) => (
        <button
          key={{zh: "中文", en: "EN", tr: "TR"}[l]}
          onClick={() => router.replace(pathname, { locale: l })}
          className={cn(
            "h-7 w-9 rounded-full uppercase transition-colors",
            l === locale
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={l === locale}
        >
          {{zh: "中文", en: "EN", tr: "TR"}[l]}
        </button>
      ))}
    </div>
  );
}
