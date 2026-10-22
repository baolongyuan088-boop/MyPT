import { safeAIError } from "@/lib/ai/client";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { coachMessages, workoutSessions, workoutEntries, exercises } from "@/db/schema";
import {
  getMealsBetween,
  getUserById,
  getWeeklyWorkoutCount,
} from "@/db/queries";
import { fullProfileTargets } from "@/lib/calories";
import { generateCoachReply, type CoachHistoryItem } from "@/lib/ai/coach";
import { startOfLocalDay, endOfLocalDay } from "@/lib/utils";
import { and, asc, desc, eq, gte, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await db
    .select()
    .from(coachMessages)
    .where(eq(coachMessages.userId, session.user.id))
    .orderBy(asc(coachMessages.createdAt))
    .limit(200);
  return NextResponse.json({ messages: rows });
}

const PostBody = z.object({
  content: z.string().min(1).max(2000),
  locale: z.enum(["zh", "en", "tr"]).default("tr"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = PostBody.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { content, locale } = body.data;
  const userId = session.user.id;

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Build context
  const weeklyWorkoutCount = await getWeeklyWorkoutCount(userId);
  const targets =
    user.sex && user.weightKg && user.heightCm && user.birthYear
      ? fullProfileTargets({
          sex: user.sex,
          weightKg: user.weightKg,
          heightCm: user.heightCm,
          birthYear: user.birthYear,
          weeklyWorkoutCount,
        })
      : null;

  const now = new Date();
  const fromToday = startOfLocalDay(now).getTime();
  const toToday = endOfLocalDay(now).getTime();
  const todayMeals = await getMealsBetween(userId, fromToday, toToday);
  const todayTotals = todayMeals.reduce(
    (acc, m) => {
      acc.calories += m.totalCalories ?? 0;
      acc.proteinG += m.proteinG ?? 0;
      acc.carbsG += m.carbsG ?? 0;
      acc.fatG += m.fatG ?? 0;
      return acc;
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  // Last 3 completed workouts
  const recentSessions = await db
    .select()
    .from(workoutSessions)
    .where(
      and(eq(workoutSessions.userId, userId), isNotNull(workoutSessions.endedAt)),
    )
    .orderBy(desc(workoutSessions.startedAt))
    .limit(3);

  const recentWorkouts = await Promise.all(
    recentSessions.map(async (s) => {
      const entries = await db
        .select({ name: exercises.nameTr, slug: exercises.slug })
        .from(workoutEntries)
        .leftJoin(exercises, eq(workoutEntries.exerciseId, exercises.id))
        .where(eq(workoutEntries.sessionId, s.id));
      const startedAt =
        s.startedAt instanceof Date ? s.startedAt : new Date(s.startedAt as unknown as number);
      const daysAgo = Math.round((Date.now() - startedAt.getTime()) / 86400000);
      return {
        daysAgo,
        exercises: entries.map((e) => e.name ?? e.slug ?? "?"),
        durationMin: s.totalDurationSec ? Math.round(s.totalDurationSec / 60) : null,
      };
    }),
  );

  // Recent chat history (last 10)
  const allMessages = await db
    .select()
    .from(coachMessages)
    .where(eq(coachMessages.userId, userId))
    .orderBy(desc(coachMessages.createdAt))
    .limit(10);
  const history: CoachHistoryItem[] = allMessages
    .reverse()
    .map((m) => ({ role: m.role, content: m.content }));

  // Save user message first
  const [userMsg] = await db
    .insert(coachMessages)
    .values({ userId, role: "user", content })
    .returning();

  // Call AI
  let reply = "";
  try {
    reply = await generateCoachReply(
      {
        profile: {
          sex: user.sex,
          age: targets?.age,
          heightCm: user.heightCm,
          weightKg: user.weightKg,
          goal: targets?.goal ?? "maintain",
          activityLevel: targets?.activityLevel ?? "sedentary",
          targetCalories: targets?.target ?? 2000,
          targetProteinG: targets?.proteinG ?? 100,
        },
        todayTotals,
        todayMealsCount: todayMeals.length,
        recentWorkouts,
      },
      history,
      content,
      locale,
    );
  } catch (err) {
    return NextResponse.json(
      { error: safeAIError(err), userMsg },
      { status: 502 },
    );
  }

  if (reply.trim().length < 5) {
    return NextResponse.json(
      {
        error:
          locale === "zh" ? "暂时无法生成建议，请确认资料已填写并稍后重试。" : locale === "tr"
            ? "Koç boş yanıt verdi. Tekrar dene."
            : "Coach returned empty reply. Try again.",
        userMsg,
      },
      { status: 502 },
    );
  }

  const [assistantMsg] = await db
    .insert(coachMessages)
    .values({ userId, role: "assistant", content: reply })
    .returning();

  return NextResponse.json({ userMsg, assistantMsg });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await db.delete(coachMessages).where(eq(coachMessages.userId, session.user.id));
  return NextResponse.json({ ok: true });
}
