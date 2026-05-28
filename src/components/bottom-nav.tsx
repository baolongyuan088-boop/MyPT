"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Home, Plus, Activity, User } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";
import { MyptMark } from "@/components/ui/mypt-mark";

type IconComp = ComponentType<{ className?: string } & SVGProps<SVGSVGElement>>;

const sideItems: Array<{
  href: string;
  key: "dashboard" | "workouts" | "insights" | "profile";
  icon: IconComp | typeof MyptMark;
  isLogo?: boolean;
}> = [
  { href: "/", key: "dashboard", icon: Home },
  { href: "/workouts", key: "workouts", icon: Activity },
  { href: "/insights", key: "insights", icon: MyptMark, isLogo: true },
  { href: "/profile", key: "profile", icon: User },
];

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  // Hide on coach (full-screen chat) — composer sits at bottom-0 instead.
  if (pathname === "/insights" || pathname.startsWith("/insights/")) {
    return null;
  }

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");

  const renderTab = (item: (typeof sideItems)[number]) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.key}
        href={item.href}
        className={cn(
          "flex h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
          active ? "text-foreground" : "text-muted-foreground/70",
        )}
      >
        {item.isLogo ? (
          <span className="grid h-[22px] place-items-center">
            <Icon className="h-3 w-auto" />
          </span>
        ) : (
          <Icon
            className="h-[22px] w-[22px]"
            strokeWidth={active ? 2.2 : 1.8}
          />
        )}
        <span>{t(item.key)}</span>
      </Link>
    );
  };

  const logActive = isActive("/log");

  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 backdrop-blur-xl"
    >
      <div className="relative mx-auto max-w-md px-1 pt-1">
        <div className="grid grid-cols-5 items-stretch">
          {renderTab(sideItems[0])}
          {renderTab(sideItems[1])}
          <span aria-hidden className="h-14" />
          {renderTab(sideItems[2])}
          {renderTab(sideItems[3])}
        </div>

        <Link
          href="/log"
          aria-label={t("log")}
          className={cn(
            "absolute left-1/2 -top-5 grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full shadow-lg shadow-black/30 ring-4 ring-background transition-transform active:scale-95",
            logActive
              ? "bg-foreground text-background"
              : "bg-foreground text-background hover:scale-105",
          )}
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </Link>
      </div>
    </nav>
  );
}
