import { auth, signOut } from "@/auth";
import { getUserById, getWeeklyWorkoutCount } from "@/db/queries";
import { fullProfileTargets } from "@/lib/calories";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ProfileForm } from "@/components/profile-form";
import { SectionGroup, Row } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import { History as HistoryIcon, Dumbbell, ChevronRight } from "lucide-react";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const user = await getUserById(session!.user.id);
  if (!user) {
    return <div>Not found</div>;
  }

  let targets: ReturnType<typeof fullProfileTargets> | null = null;
  if (user.sex && user.weightKg && user.heightCm && user.birthYear) {
    const weeklyWorkoutCount = await getWeeklyWorkoutCount(user.id);
    targets = fullProfileTargets({
      sex: user.sex,
      weightKg: user.weightKg,
      heightCm: user.heightCm,
      birthYear: user.birthYear,
      weeklyWorkoutCount,
    });
  }

  const t = await getTranslations("profile");
  const tNav = await getTranslations("nav");

  return (
    <div className="space-y-6">
      <header className="space-y-1 px-1">
        {user.email && (
          <p className="text-[13px] font-medium text-muted-foreground">
            {user.email}
          </p>
        )}
        <h1 className="text-[34px] font-bold tracking-tight leading-tight">
          {t("title")}
        </h1>
      </header>

      <ProfileForm initial={user} initialTargets={targets} />

      <SectionGroup>
        <NavRow
          href="/history"
          icon={<HistoryIcon className="h-5 w-5" />}
          label={tNav("history")}
        />
        <NavRow
          href="/workouts"
          icon={<Dumbbell className="h-5 w-5" />}
          label={tNav("workouts")}
          last
        />
      </SectionGroup>

      <SectionGroup>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: `/${locale}/signin` });
          }}
        >
          <Row
            onClick={undefined}
            label={
              <button
                type="submit"
                className="block w-full text-left text-[15px] text-destructive"
              >
                {tNav("signout")}
              </button>
            }
            hideSeparator
          />
        </form>
      </SectionGroup>
    </div>
  );
}

function NavRow({
  href,
  icon,
  label,
  last,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  last?: boolean;
}) {
  return (
    <div
      className={
        "relative " +
        (!last
          ? "before:absolute before:bottom-0 before:left-4 before:right-0 before:h-px before:bg-border"
          : "")
      }
    >
      <Link
        href={href}
        className="flex w-full items-center gap-3 px-4 py-3.5 transition-colors hover:bg-foreground/[0.03] active:bg-foreground/[0.06]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground">
          {icon}
        </span>
        <span className="flex-1 text-[15px]">{label}</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
      </Link>
    </div>
  );
}
