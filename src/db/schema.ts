import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  index,
} from "drizzle-orm/sqlite-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ---------- Auth.js core tables (DrizzleAdapter compatible) ----------

export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),

  // MyPT profile extension
  username: text("username").unique(),
  locale: text("locale", { enum: ["tr", "en"] }).default("tr"),
  sex: text("sex", { enum: ["male", "female"] }),
  birthYear: integer("birth_year"),
  heightCm: real("height_cm"),
  weightKg: real("weight_kg"),
  activityLevel: text("activity_level", {
    enum: ["sedentary", "light", "moderate", "active", "very_active"],
  }),
  goal: text("goal", { enum: ["lose", "maintain", "gain"] }),
  goalCalorieDelta: integer("goal_calorie_delta").default(0),
  waterTargetMl: integer("water_target_ml").default(2500),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ---------- MyPT domain tables ----------

export const meals = sqliteTable(
  "meal",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eatenAt: integer("eaten_at", { mode: "timestamp_ms" }).notNull(),
    rawText: text("raw_text").notNull(),
    aiParsedJson: text("ai_parsed_json"),
    totalCalories: real("total_calories").notNull().default(0),
    proteinG: real("protein_g").notNull().default(0),
    carbsG: real("carbs_g").notNull().default(0),
    fatG: real("fat_g").notNull().default(0),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index("meal_user_eaten_idx").on(t.userId, t.eatenAt),
  ],
);

export const mealItems = sqliteTable("meal_item", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  mealId: text("meal_id")
    .notNull()
    .references(() => meals.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  quantity: real("quantity"),
  unit: text("unit"),
  calories: real("calories").notNull().default(0),
  proteinG: real("protein_g").notNull().default(0),
  carbsG: real("carbs_g").notNull().default(0),
  fatG: real("fat_g").notNull().default(0),
});

export const dailyGoals = sqliteTable(
  "daily_goal",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // YYYY-MM-DD in user local
    calorieTarget: real("calorie_target").notNull(),
    proteinTargetG: real("protein_target_g"),
    carbsTargetG: real("carbs_target_g"),
    fatTargetG: real("fat_target_g"),
    waterTargetMl: integer("water_target_ml"),
    overridden: integer("overridden", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [index("daily_goal_user_date_idx").on(t.userId, t.date)],
);

export const aiSuggestions = sqliteTable(
  "ai_suggestion",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    generatedAt: integer("generated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    windowDays: integer("window_days").notNull().default(1),
    locale: text("locale", { enum: ["tr", "en"] }).notNull().default("tr"),
    suggestionText: text("suggestion_text").notNull(),
    dismissed: integer("dismissed", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [index("ai_suggestion_user_idx").on(t.userId, t.generatedAt)],
);

// ---------- Water tracking ----------

export const waterLogs = sqliteTable(
  "water_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amountMl: integer("amount_ml").notNull(),
    loggedAt: integer("logged_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [index("water_user_logged_idx").on(t.userId, t.loggedAt)],
);

// ---------- Exercise / Workout ----------

export const exercises = sqliteTable("exercise", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  nameTr: text("name_tr").notNull(),
  nameEn: text("name_en").notNull(),
  category: text("category", {
    enum: ["chest", "back", "legs", "core", "arms", "shoulder", "cardio", "fullbody"],
  }).notNull(),
  bodyweight: integer("bodyweight", { mode: "boolean" }).notNull().default(true),
  defaultRest: integer("default_rest").notNull().default(60),
});

export const workoutSessions = sqliteTable(
  "workout_session",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
    endedAt: integer("ended_at", { mode: "timestamp_ms" }),
    totalDurationSec: integer("total_duration_sec"),
    notes: text("notes"),
  },
  (t) => [index("workout_user_started_idx").on(t.userId, t.startedAt)],
);

// ---------- Weight tracking ----------

export const weightLogs = sqliteTable(
  "weight_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weightKg: real("weight_kg").notNull(),
    loggedAt: integer("logged_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [index("weight_user_logged_idx").on(t.userId, t.loggedAt)],
);

// ---------- Friendships + Privacy ----------

export const friendships = sqliteTable(
  "friendship",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    requesterId: text("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addresseeId: text("addressee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["pending", "accepted", "blocked"] })
      .notNull()
      .default("pending"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index("friendship_requester_idx").on(t.requesterId),
    index("friendship_addressee_idx").on(t.addresseeId),
  ],
);

export const friendPrivacy = sqliteTable("friend_privacy", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  shareWeeklySummary: integer("share_weekly_summary", { mode: "boolean" })
    .notNull()
    .default(true),
  shareWeight: integer("share_weight", { mode: "boolean" }).notNull().default(false),
  shareMeals: integer("share_meals", { mode: "boolean" }).notNull().default(false),
  shareWater: integer("share_water", { mode: "boolean" }).notNull().default(false),
});

export const coachMessages = sqliteTable(
  "coach_message",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    content: text("content").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [index("coach_user_created_idx").on(t.userId, t.createdAt)],
);

export const workoutEntries = sqliteTable("workout_entry", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id")
    .notNull()
    .references(() => workoutSessions.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id),
  sets: integer("sets").notNull(),
  reps: integer("reps"),
  weightKg: real("weight_kg"),
  durationSec: integer("duration_sec"),
  orderIdx: integer("order_idx").notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Meal = typeof meals.$inferSelect;
export type NewMeal = typeof meals.$inferInsert;
export type MealItem = typeof mealItems.$inferSelect;
export type NewMealItem = typeof mealItems.$inferInsert;
export type DailyGoal = typeof dailyGoals.$inferSelect;
export type AiSuggestion = typeof aiSuggestions.$inferSelect;
export type WaterLog = typeof waterLogs.$inferSelect;
export type NewWaterLog = typeof waterLogs.$inferInsert;
export type Exercise = typeof exercises.$inferSelect;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type NewWorkoutSession = typeof workoutSessions.$inferInsert;
export type WorkoutEntry = typeof workoutEntries.$inferSelect;
export type NewWorkoutEntry = typeof workoutEntries.$inferInsert;
export type CoachMessage = typeof coachMessages.$inferSelect;
export type NewCoachMessage = typeof coachMessages.$inferInsert;
export type WeightLog = typeof weightLogs.$inferSelect;
export type NewWeightLog = typeof weightLogs.$inferInsert;
export type Friendship = typeof friendships.$inferSelect;
export type NewFriendship = typeof friendships.$inferInsert;
export type FriendPrivacy = typeof friendPrivacy.$inferSelect;
