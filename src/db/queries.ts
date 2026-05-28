import { and, desc, eq, gte, lt, isNotNull, sql } from "drizzle-orm";
import { db } from "./client";
import {
  meals,
  mealItems,
  users,
  aiSuggestions,
  dailyGoals,
  workoutSessions,
} from "./schema";
import type { NewMeal, NewMealItem, User } from "./schema";

export async function getUserById(id: string) {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateUserProfile(
  id: string,
  patch: Partial<
    Pick<
      User,
      | "name"
      | "username"
      | "locale"
      | "sex"
      | "birthYear"
      | "heightCm"
      | "weightKg"
      | "activityLevel"
      | "goal"
      | "goalCalorieDelta"
    >
  >,
) {
  await db
    .update(users)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(users.id, id));
}

export async function createMealWithItems(
  meal: NewMeal,
  items: Omit<NewMealItem, "mealId">[],
) {
  const [created] = await db.insert(meals).values(meal).returning();
  if (items.length > 0) {
    await db
      .insert(mealItems)
      .values(items.map((it) => ({ ...it, mealId: created.id })));
  }
  return created;
}

export async function getMealsBetween(userId: string, fromMs: number, toMs: number) {
  return db
    .select()
    .from(meals)
    .where(
      and(
        eq(meals.userId, userId),
        gte(meals.eatenAt, new Date(fromMs)),
        lt(meals.eatenAt, new Date(toMs)),
      ),
    )
    .orderBy(meals.eatenAt);
}

export async function getMealItems(mealId: string) {
  return db.select().from(mealItems).where(eq(mealItems.mealId, mealId));
}

export async function deleteMeal(userId: string, mealId: string) {
  await db
    .delete(meals)
    .where(and(eq(meals.id, mealId), eq(meals.userId, userId)));
}

export async function getRecentSuggestions(userId: string, limit = 10) {
  return db
    .select()
    .from(aiSuggestions)
    .where(eq(aiSuggestions.userId, userId))
    .orderBy(desc(aiSuggestions.generatedAt))
    .limit(limit);
}

export async function getDailyGoal(userId: string, date: string) {
  const rows = await db
    .select()
    .from(dailyGoals)
    .where(and(eq(dailyGoals.userId, userId), eq(dailyGoals.date, date)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getWeeklyWorkoutCount(userId: string): Promise<number> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        gte(workoutSessions.startedAt, sevenDaysAgo),
        isNotNull(workoutSessions.endedAt),
      ),
    );
  return Number(rows[0]?.count ?? 0);
}
