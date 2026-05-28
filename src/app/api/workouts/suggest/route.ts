import { auth } from "@/auth";
import { db } from "@/db/client";
import { exercises, workoutEntries, workoutSessions } from "@/db/schema";
import { getUserById, getWeeklyWorkoutCount } from "@/db/queries";
import { fullProfileTargets } from "@/lib/calories";
import { generateWorkoutPlan } from "@/lib/ai/suggest-workout";
import { and, eq, gte, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const PostBody = z.object({
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
  const { locale } = body.data;
  const userId = session.user.id;

  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!user.sex || !user.weightKg || !user.heightCm || !user.birthYear) {
    return NextResponse.json(
      {
        error:
          locale === "tr"
            ? "Önce profilini doldur (boy, kilo, yaş, cinsiyet)."
            : "Fill your profile first (height, weight, age, sex).",
      },
      { status: 422 },
    );
  }

  const weeklyWorkoutCount = await getWeeklyWorkoutCount(userId);
  const targets = fullProfileTargets({
    sex: user.sex,
    weightKg: user.weightKg,
    heightCm: user.heightCm,
    birthYear: user.birthYear,
    weeklyWorkoutCount,
  });

  // Last 7 days categories
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recent = await db
    .select({
      slug: exercises.slug,
      category: exercises.category,
    })
    .from(workoutEntries)
    .innerJoin(workoutSessions, eq(workoutEntries.sessionId, workoutSessions.id))
    .leftJoin(exercises, eq(workoutEntries.exerciseId, exercises.id))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        isNotNull(workoutSessions.endedAt),
        gte(workoutSessions.startedAt, sevenDaysAgo),
      ),
    );

  const recentBodyParts = Array.from(
    new Set(recent.map((r) => r.category).filter((c): c is NonNullable<typeof c> => c !== null)),
  ) as string[];
  const recentExerciseSlugs = Array.from(
    new Set(recent.map((r) => r.slug).filter((s): s is string => s !== null)),
  );

  // Catalog
  const catalog = await db
    .select({
      slug: exercises.slug,
      nameTr: exercises.nameTr,
      nameEn: exercises.nameEn,
      category: exercises.category,
      bodyweight: exercises.bodyweight,
    })
    .from(exercises);

  let plan;
  try {
    plan = await generateWorkoutPlan(
      {
        profile: {
          sex: user.sex,
          age: targets.age,
          weightKg: user.weightKg,
          goal: targets.goal,
          activityLevel: targets.activityLevel,
        },
        recentBodyParts,
        recentExerciseSlugs,
        availableCatalog: catalog,
      },
      locale,
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI failed" },
      { status: 502 },
    );
  }

  // Filter to valid catalog slugs and resolve names
  const catalogById = new Map(catalog.map((c) => [c.slug, c]));
  const validEntries = plan.entries
    .filter((e) => catalogById.has(e.exerciseSlug))
    .map((e) => {
      const c = catalogById.get(e.exerciseSlug)!;
      return {
        exerciseId: e.exerciseSlug,
        exerciseName: locale === "en" ? c.nameEn : c.nameTr,
        sets: e.sets,
        reps: e.reps,
      };
    });

  if (validEntries.length < 3) {
    return NextResponse.json(
      {
        error:
          locale === "tr"
            ? "AI yeterli geçerli egzersiz öneremedi. Tekrar dene."
            : "AI could not suggest enough valid exercises. Try again.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    rationale: plan.rationale,
    entries: validEntries,
  });
}
