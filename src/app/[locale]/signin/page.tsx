import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/top-bar";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (session?.user) {
    redirect(`/${locale}`);
  }

  const { callbackUrl } = await searchParams;
  const t = await getTranslations("signin");
  const tApp = await getTranslations("app");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <TopBar showSettings={false} />
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-12 pt-4">
        <div className="w-full space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{tApp("tagline")}</p>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>

          <form
            action={async () => {
              "use server";
              await signIn("google", {
                redirectTo: callbackUrl ?? `/${locale}`,
              });
            }}
          >
            <Button type="submit" size="lg" className="w-full">
              <GoogleGlyph /> {t("google")}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground">{t("privacy")}</p>
        </div>
      </main>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="currentColor"
        d="M21.6 12.23c0-.78-.07-1.53-.2-2.25H12v4.26h5.4c-.23 1.23-.93 2.28-1.99 2.98v2.48h3.22c1.88-1.73 2.97-4.28 2.97-7.47z"
      />
      <path
        fill="currentColor"
        d="M12 22c2.7 0 4.95-.9 6.6-2.43l-3.22-2.48c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.59-4.12H3.1v2.55C4.74 19.65 8.1 22 12 22z"
      />
      <path
        fill="currentColor"
        d="M6.41 13.92A6.02 6.02 0 0 1 6.1 12c0-.67.12-1.32.31-1.92V7.53H3.1A10.01 10.01 0 0 0 2 12c0 1.62.39 3.15 1.1 4.47l3.31-2.55z"
      />
      <path
        fill="currentColor"
        d="M12 5.96c1.47 0 2.78.5 3.81 1.5l2.86-2.86C16.95 2.99 14.7 2 12 2 8.1 2 4.74 4.35 3.1 7.53l3.31 2.55C7.2 7.72 9.4 5.96 12 5.96z"
      />
    </svg>
  );
}
