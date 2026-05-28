import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

type Cat = "chest" | "back" | "legs" | "core" | "arms" | "shoulder" | "cardio" | "fullbody";

interface E {
  slug: string;
  nameTr: string;
  nameEn: string;
  category: Cat;
  bodyweight?: boolean;
  defaultRest?: number;
}

const CATALOG: E[] = [
  { slug: "push-up", nameTr: "Şınav", nameEn: "Push-up", category: "chest" },
  { slug: "incline-push-up", nameTr: "Eğimli Şınav", nameEn: "Incline Push-up", category: "chest" },
  { slug: "bench-press", nameTr: "Bench Press", nameEn: "Bench Press", category: "chest", bodyweight: false, defaultRest: 90 },
  { slug: "pull-up", nameTr: "Barfiks", nameEn: "Pull-up", category: "back", defaultRest: 90 },
  { slug: "inverted-row", nameTr: "Ters Kürek", nameEn: "Inverted Row", category: "back" },
  { slug: "bent-over-row", nameTr: "Eğik Kürek", nameEn: "Bent-over Row", category: "back", bodyweight: false, defaultRest: 75 },
  { slug: "squat", nameTr: "Squat", nameEn: "Squat", category: "legs" },
  { slug: "lunge", nameTr: "Lunge (Hamle)", nameEn: "Lunge", category: "legs" },
  { slug: "jump-squat", nameTr: "Sıçramalı Squat", nameEn: "Jump Squat", category: "legs" },
  { slug: "wall-sit", nameTr: "Duvar Oturuşu", nameEn: "Wall Sit", category: "legs" },
  { slug: "deadlift", nameTr: "Deadlift", nameEn: "Deadlift", category: "legs", bodyweight: false, defaultRest: 120 },
  { slug: "plank", nameTr: "Plank", nameEn: "Plank", category: "core", defaultRest: 45 },
  { slug: "side-plank", nameTr: "Yan Plank", nameEn: "Side Plank", category: "core", defaultRest: 45 },
  { slug: "crunch", nameTr: "Mekik", nameEn: "Crunch", category: "core", defaultRest: 45 },
  { slug: "leg-raise", nameTr: "Bacak Kaldırma", nameEn: "Leg Raise", category: "core", defaultRest: 45 },
  { slug: "mountain-climber", nameTr: "Dağcı", nameEn: "Mountain Climber", category: "core", defaultRest: 45 },
  { slug: "russian-twist", nameTr: "Rus Twist", nameEn: "Russian Twist", category: "core", defaultRest: 45 },
  { slug: "dip", nameTr: "Dip", nameEn: "Dip", category: "arms", defaultRest: 75 },
  { slug: "bicep-curl", nameTr: "Biceps Curl", nameEn: "Bicep Curl", category: "arms", bodyweight: false },
  { slug: "tricep-extension", nameTr: "Triceps Ekstansiyon", nameEn: "Tricep Extension", category: "arms", bodyweight: false },
  { slug: "pike-push-up", nameTr: "Pike Şınav", nameEn: "Pike Push-up", category: "shoulder" },
  { slug: "shoulder-press", nameTr: "Omuz Pres", nameEn: "Shoulder Press", category: "shoulder", bodyweight: false, defaultRest: 75 },
  { slug: "lateral-raise", nameTr: "Yana Açma", nameEn: "Lateral Raise", category: "shoulder", bodyweight: false },
  { slug: "jumping-jack", nameTr: "Jumping Jack", nameEn: "Jumping Jack", category: "cardio", defaultRest: 30 },
  { slug: "burpee", nameTr: "Burpee", nameEn: "Burpee", category: "cardio", defaultRest: 60 },
  { slug: "high-knee", nameTr: "Yüksek Diz", nameEn: "High Knees", category: "cardio", defaultRest: 30 },
  { slug: "thruster", nameTr: "Thruster", nameEn: "Thruster", category: "fullbody", defaultRest: 90 },
  { slug: "kettlebell-swing", nameTr: "Kettlebell Swing", nameEn: "Kettlebell Swing", category: "fullbody", bodyweight: false, defaultRest: 60 },
  { slug: "turkish-getup", nameTr: "Turkish Get-up", nameEn: "Turkish Get-up", category: "fullbody", bodyweight: false, defaultRest: 90 },
];

async function main() {
  // Dynamic import AFTER env vars are loaded
  const { db } = await import("./client");
  const { exercises } = await import("./schema");

  const rows = CATALOG.map((e) => ({
    id: e.slug,
    slug: e.slug,
    nameTr: e.nameTr,
    nameEn: e.nameEn,
    category: e.category,
    bodyweight: e.bodyweight ?? true,
    defaultRest: e.defaultRest ?? 60,
  }));

  for (const r of rows) {
    await db
      .insert(exercises)
      .values(r)
      .onConflictDoUpdate({
        target: exercises.id,
        set: {
          slug: r.slug,
          nameTr: r.nameTr,
          nameEn: r.nameEn,
          category: r.category,
          bodyweight: r.bodyweight,
          defaultRest: r.defaultRest,
        },
      });
  }
  console.log(`Seeded ${rows.length} exercises.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
