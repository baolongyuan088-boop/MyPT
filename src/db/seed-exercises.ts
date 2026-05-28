import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

type Cat = "chest" | "back" | "legs" | "core" | "arms" | "shoulder" | "cardio" | "fullbody";

interface E {
  slug: string;
  nameTr: string;
  nameEn: string;
  category: Cat;
  defaultRest?: number;
}

// All exercises are HOME / NO-EQUIPMENT (bodyweight = true everywhere).
const CATALOG: E[] = [
  // Chest
  { slug: "push-up", nameTr: "Şınav", nameEn: "Push-up", category: "chest" },
  { slug: "incline-push-up", nameTr: "Eğimli Şınav", nameEn: "Incline Push-up", category: "chest" },
  { slug: "decline-push-up", nameTr: "Düşük Şınav", nameEn: "Decline Push-up", category: "chest" },
  { slug: "diamond-push-up", nameTr: "Elmas Şınav", nameEn: "Diamond Push-up", category: "chest", defaultRest: 75 },
  { slug: "wide-push-up", nameTr: "Geniş Şınav", nameEn: "Wide Push-up", category: "chest" },

  // Back
  { slug: "pull-up", nameTr: "Barfiks", nameEn: "Pull-up", category: "back", defaultRest: 90 },
  { slug: "inverted-row", nameTr: "Ters Kürek (Masa)", nameEn: "Inverted Row (Table)", category: "back" },
  { slug: "superman", nameTr: "Superman", nameEn: "Superman", category: "back", defaultRest: 45 },
  { slug: "reverse-snow-angel", nameTr: "Ters Kar Meleği", nameEn: "Reverse Snow Angel", category: "back", defaultRest: 45 },

  // Legs
  { slug: "squat", nameTr: "Squat", nameEn: "Squat", category: "legs" },
  { slug: "lunge", nameTr: "Lunge (Hamle)", nameEn: "Lunge", category: "legs" },
  { slug: "jump-squat", nameTr: "Sıçramalı Squat", nameEn: "Jump Squat", category: "legs" },
  { slug: "wall-sit", nameTr: "Duvar Oturuşu", nameEn: "Wall Sit", category: "legs", defaultRest: 45 },
  { slug: "bulgarian-split-squat", nameTr: "Bulgar Split Squat (sandalye)", nameEn: "Bulgarian Split Squat (chair)", category: "legs", defaultRest: 75 },
  { slug: "pistol-squat", nameTr: "Pistol Squat", nameEn: "Pistol Squat", category: "legs", defaultRest: 90 },
  { slug: "glute-bridge", nameTr: "Köprü", nameEn: "Glute Bridge", category: "legs", defaultRest: 45 },
  { slug: "single-leg-glute-bridge", nameTr: "Tek Bacak Köprü", nameEn: "Single-leg Glute Bridge", category: "legs", defaultRest: 45 },
  { slug: "calf-raise", nameTr: "Topuk Yükseltme", nameEn: "Calf Raise", category: "legs", defaultRest: 30 },
  { slug: "step-up", nameTr: "Step-up (sandalye)", nameEn: "Step-up (chair)", category: "legs", defaultRest: 60 },

  // Core
  { slug: "plank", nameTr: "Plank", nameEn: "Plank", category: "core", defaultRest: 45 },
  { slug: "side-plank", nameTr: "Yan Plank", nameEn: "Side Plank", category: "core", defaultRest: 45 },
  { slug: "reverse-plank", nameTr: "Ters Plank", nameEn: "Reverse Plank", category: "core", defaultRest: 45 },
  { slug: "crunch", nameTr: "Mekik", nameEn: "Crunch", category: "core", defaultRest: 45 },
  { slug: "bicycle-crunch", nameTr: "Bisiklet Mekik", nameEn: "Bicycle Crunch", category: "core", defaultRest: 45 },
  { slug: "leg-raise", nameTr: "Bacak Kaldırma", nameEn: "Leg Raise", category: "core", defaultRest: 45 },
  { slug: "mountain-climber", nameTr: "Dağcı", nameEn: "Mountain Climber", category: "core", defaultRest: 45 },
  { slug: "russian-twist", nameTr: "Rus Twist", nameEn: "Russian Twist", category: "core", defaultRest: 45 },
  { slug: "hollow-hold", nameTr: "Hollow Hold", nameEn: "Hollow Hold", category: "core", defaultRest: 45 },
  { slug: "v-up", nameTr: "V Mekik", nameEn: "V-up", category: "core", defaultRest: 45 },
  { slug: "bird-dog", nameTr: "Bird Dog", nameEn: "Bird Dog", category: "core", defaultRest: 30 },

  // Arms
  { slug: "chair-tricep-dip", nameTr: "Sandalye Triceps Dip", nameEn: "Chair Tricep Dip", category: "arms", defaultRest: 60 },

  // Shoulder
  { slug: "pike-push-up", nameTr: "Pike Şınav", nameEn: "Pike Push-up", category: "shoulder", defaultRest: 75 },
  { slug: "wall-handstand-hold", nameTr: "Duvar Amuda", nameEn: "Wall Handstand Hold", category: "shoulder", defaultRest: 60 },

  // Cardio
  { slug: "jumping-jack", nameTr: "Jumping Jack", nameEn: "Jumping Jack", category: "cardio", defaultRest: 30 },
  { slug: "burpee", nameTr: "Burpee", nameEn: "Burpee", category: "cardio", defaultRest: 60 },
  { slug: "high-knee", nameTr: "Yüksek Diz", nameEn: "High Knees", category: "cardio", defaultRest: 30 },

  // Fullbody
  { slug: "thruster", nameTr: "Thruster (bodyweight)", nameEn: "Bodyweight Thruster", category: "fullbody", defaultRest: 75 },
];

// Slugs that previously existed but require equipment — remove from DB.
const OBSOLETE_SLUGS = [
  "bench-press",
  "deadlift",
  "bent-over-row",
  "bicep-curl",
  "tricep-extension",
  "shoulder-press",
  "lateral-raise",
  "kettlebell-swing",
  "turkish-getup",
  "dip", // requires parallel bars; replaced with chair-tricep-dip
];

async function main() {
  const { db } = await import("./client");
  const { exercises, workoutEntries } = await import("./schema");
  const { inArray } = await import("drizzle-orm");

  // Upsert new catalog
  for (const e of CATALOG) {
    const row = {
      id: e.slug,
      slug: e.slug,
      nameTr: e.nameTr,
      nameEn: e.nameEn,
      category: e.category,
      bodyweight: true,
      defaultRest: e.defaultRest ?? 60,
    };
    await db
      .insert(exercises)
      .values(row)
      .onConflictDoUpdate({
        target: exercises.id,
        set: {
          slug: row.slug,
          nameTr: row.nameTr,
          nameEn: row.nameEn,
          category: row.category,
          bodyweight: row.bodyweight,
          defaultRest: row.defaultRest,
        },
      });
  }
  console.log(`Upserted ${CATALOG.length} exercises.`);

  // Remove obsolete exercises — but only if not referenced.
  const referenced = await db
    .select({ exerciseId: workoutEntries.exerciseId })
    .from(workoutEntries);
  const referencedIds = new Set(referenced.map((r) => r.exerciseId));
  const safeToDelete = OBSOLETE_SLUGS.filter((s) => !referencedIds.has(s));
  if (safeToDelete.length > 0) {
    await db.delete(exercises).where(inArray(exercises.id, safeToDelete));
    console.log(`Deleted ${safeToDelete.length} obsolete: ${safeToDelete.join(", ")}`);
  } else {
    console.log("No obsolete exercises to delete (some referenced or absent).");
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
