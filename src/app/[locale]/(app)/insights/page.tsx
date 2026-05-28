import { auth } from "@/auth";
import { db } from "@/db/client";
import { coachMessages } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { setRequestLocale } from "next-intl/server";
import { CoachChat } from "@/components/coach-chat";

export default async function CoachPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const items = await db
    .select()
    .from(coachMessages)
    .where(eq(coachMessages.userId, session!.user.id))
    .orderBy(asc(coachMessages.createdAt))
    .limit(200);

  return <CoachChat initial={items} />;
}
