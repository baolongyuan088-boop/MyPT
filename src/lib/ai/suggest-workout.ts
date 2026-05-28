import { z } from "zod";
import { ai, MODEL } from "./client";

const SYSTEM_TR = `Sen kişisel antrenörsün. Kullanıcının profil, hedef ve son 7 gün antrenmanına bakarak
TEK BİR antrenman planı öner. Sadece geçerli JSON dön.

KURALLAR:
- 4-7 egzersiz seç. SLUG ile (sana verilen catalog'dan).
- Set/rep gerçekçi: bodyweight 8-15 rep, ağırlık 6-12 rep.
- Hedefe göre:
  * lose → kardiyo + tam vücut, çok rep
  * maintain → dengeli orta yoğunluk
  * gain → büyük kas grupları, az rep + çok set
- Son 7 günde çalıştığı bölgeleri TEKRARLAMA (rotasyon).
- 1-2 cümle "rationale" Türkçe.
- Catalog'da OLMAYAN slug ÜRETME.

JSON şeması:
{ "rationale": string, "entries": [{ "exerciseSlug": string, "sets": int (1-6), "reps": int (5-30) }] }`;

const SYSTEM_EN = `You are a personal trainer. Based on the user's profile, goal, and last 7 days of
workouts, suggest ONE workout plan. Return only valid JSON.

RULES:
- 4-7 exercises. Use SLUG from the provided catalog.
- Sets/reps realistic: bodyweight 8-15 reps, weighted 6-12 reps.
- Goal-based:
  * lose → cardio + full body, more reps
  * maintain → balanced moderate intensity
  * gain → big muscle groups, fewer reps + more sets
- DO NOT repeat body parts trained in last 7 days (rotation).
- 1-2 sentence "rationale" in English.
- DO NOT invent slugs not in the catalog.

JSON schema:
{ "rationale": string, "entries": [{ "exerciseSlug": string, "sets": int (1-6), "reps": int (5-30) }] }`;

export const WorkoutPlanSchema = z.object({
  rationale: z.string().min(5),
  entries: z
    .array(
      z.object({
        exerciseSlug: z.string().min(1),
        sets: z.number().int().min(1).max(6),
        reps: z.number().int().min(5).max(30),
      }),
    )
    .min(2)
    .max(10),
});

export type WorkoutPlan = z.infer<typeof WorkoutPlanSchema>;

export interface WorkoutSuggestContext {
  profile: {
    sex?: string | null;
    age?: number | null;
    weightKg?: number | null;
    goal: string;
    activityLevel: string;
  };
  recentBodyParts: string[]; // categories trained in last 7 days
  recentExerciseSlugs: string[];
  availableCatalog: Array<{ slug: string; nameTr: string; nameEn: string; category: string; bodyweight: boolean }>;
}

export async function generateWorkoutPlan(
  ctx: WorkoutSuggestContext,
  locale: "tr" | "en" = "tr",
): Promise<WorkoutPlan> {
  const payload = JSON.stringify(ctx, null, 2);
  const completion = await ai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: locale === "en" ? SYSTEM_EN : SYSTEM_TR },
      { role: "user", content: payload },
    ],
    response_format: { type: "json_object" },
    temperature: 0.5,
    max_tokens: 800,
    ...({ thinking: { type: "disabled" } } as object),
  });

  const msg = completion.choices[0]?.message as
    | { content?: string | null; reasoning_content?: string | null }
    | undefined;

  let content = msg?.content?.trim() ?? "";
  if (!content && msg?.reasoning_content) {
    const match = msg.reasoning_content.match(/\{[\s\S]*\}/);
    content = match ? match[0] : "";
  }
  if (!content) content = "{}";

  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    const cleaned = content
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    json = JSON.parse(cleaned);
  }
  return WorkoutPlanSchema.parse(json);
}
