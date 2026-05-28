import { auth } from "@/auth";
import { db } from "@/db/client";
import {
  getMealsBetween,
  getRecentSuggestions,
  getUserById,
  getWeeklyWorkoutCount,
} from "@/db/queries";
import { aiSuggestions } from "@/db/schema";
import { generateSuggestion } from "@/lib/ai/suggest";
import { fullProfileTargets } from "@/lib/calories";
import { endOfLocalDay, startOfLocalDay } from "@/lib/utils";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await getRecentSuggestions(session.user.id, 20);
  return NextResponse.json({ suggestions: rows });
}

const PostBody = z.object({
  windowDays: z.number().int().min(1).max(14).default(3),
  locale: z.enum(["tr", "en"]).default("tr"),
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
  const { windowDays, locale } = body.data;

  const user = await getUserById(session.user.id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!user.sex || !user.weightKg || !user.heightCm || !user.birthYear) {
    return NextResponse.json(
      { error: "Profile incomplete — fill height/weight/age/sex first." },
      { status: 422 },
    );
  }

  const weeklyWorkoutCount = await getWeeklyWorkoutCount(user.id);
  const t = fullProfileTargets({
    sex: user.sex,
    weightKg: user.weightKg,
    heightCm: user.heightCm,
    birthYear: user.birthYear,
    weeklyWorkoutCount,
  });

  const now = new Date();
  const today = startOfLocalDay(now);
  const todayEnd = endOfLocalDay(now);
  const todayMeals = await getMealsBetween(
    user.id,
    today.getTime(),
    todayEnd.getTime(),
  );

  const totals = todayMeals.reduce(
    (acc, m) => {
      acc.calories += m.totalCalories ?? 0;
      acc.proteinG += m.proteinG ?? 0;
      acc.carbsG += m.carbsG ?? 0;
      acc.fatG += m.fatG ?? 0;
      return acc;
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  const recentFrom = new Date(now);
  recentFrom.setDate(recentFrom.getDate() - windowDays);
  const recentMealsRaw = await getMealsBetween(
    user.id,
    recentFrom.getTime(),
    todayEnd.getTime(),
  );

  const recentMeals = recentMealsRaw.slice(-20).map((m) => {
    const eaten =
      m.eatenAt instanceof Date
        ? m.eatenAt
        : new Date(m.eatenAt as unknown as number);
    return {
      eatenAt: eaten.toISOString(),
      text: m.rawText,
      calories: m.totalCalories ?? 0,
    };
  });

  const suggestion = await generateSuggestion(
    {
      profile: {
        sex: user.sex,
        age: t.age,
        heightCm: user.heightCm,
        weightKg: user.weightKg,
        activityLevel: t.activityLevel,
        goal: t.goal,
        targetCalories: t.target,
        targetProteinG: t.proteinG,
        targetCarbsG: t.carbsG,
        targetFatG: t.fatG,
      },
      todayTotals: totals,
      calorieDelta: Math.round(totals.calories - t.target),
      recentMeals,
    },
    locale,
  );

  // Guard: if AI returned empty/too-short text, don't store an empty card.
  if (suggestion.trim().length < 10) {
    return NextResponse.json(
      {
        error:
          locale === "tr"
            ? "AI boş yanıt verdi. Lütfen tekrar dene."
            : "AI returned an empty response. Please try again.",
      },
      { status: 502 },
    );
  }

  const [row] = await db
    .insert(aiSuggestions)
    .values({
      userId: user.id,
      windowDays,
      locale,
      suggestionText: suggestion,
    })
    .returning();

  return NextResponse.json({ suggestion: row });
}
