import { z } from "zod";
import { ai, MODEL } from "./client";

export const MealItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  calories: z.number().min(0),
  protein_g: z.number().min(0).default(0),
  carbs_g: z.number().min(0).default(0),
  fat_g: z.number().min(0).default(0),
});

export const MealParseSchema = z.object({
  items: z.array(MealItemSchema).min(1),
  total_calories: z.number().min(0),
  total_protein_g: z.number().min(0).default(0),
  total_carbs_g: z.number().min(0).default(0),
  total_fat_g: z.number().min(0).default(0),
  notes: z.string().nullable().optional(),
});

export type MealParse = z.infer<typeof MealParseSchema>;

const SYSTEM_TR = `Sen bir beslenme uzmanısın. Kullanıcının yediği yemekleri doğal dilden parse edip
HER ÖĞE için ayrı ayrı kalori ve makro besin tahmini yapacaksın.

Kurallar:
- Sadece geçerli JSON döndür. Açıklama, prefix, code fence YOK.
- Türkçe yemek isimlerini koru ("yumurta", "tam buğday ekmeği" gibi).
- quantity ve unit'i kullanıcının dediği gibi sakla ("2", "adet" / "1", "dilim" / "1", "kaşık").
- Eğer porsiyon belirtilmemişse Türkiye'de yaygın 1 porsiyon kabul et.
- Kalori değerleri Türkiye'de yaygın gıdaların ortalama değerleri olsun (USDA + TÜBER).
- Tahmini gram cinsinden makroları (protein_g, carbs_g, fat_g) doldur.
- total_* alanlarını items toplamı olarak hesapla.

JSON şeması:
{
  "items": [{
    "name": string,
    "quantity": number | null,
    "unit": string | null,
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number
  }],
  "total_calories": number,
  "total_protein_g": number,
  "total_carbs_g": number,
  "total_fat_g": number,
  "notes": string | null
}`;

const SYSTEM_EN = `You are a nutrition expert. Parse the user's meal from natural language
and estimate calories and macros for EACH ITEM separately.

Rules:
- Return ONLY valid JSON. No explanation, prefix, code fence.
- Keep item names natural ("2 eggs", "whole-wheat bread slice").
- Save quantity and unit as the user said them.
- If portion is missing, assume one common serving.
- Use USDA-typical estimates.
- Fill protein_g, carbs_g, fat_g (grams).
- total_* fields should be the sum across items.

JSON schema:
{
  "items": [{
    "name": string, "quantity": number | null, "unit": string | null,
    "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number
  }],
  "total_calories": number,
  "total_protein_g": number, "total_carbs_g": number, "total_fat_g": number,
  "notes": string | null
}`;

export async function parseMeal(
  rawText: string,
  locale: "tr" | "en" = "tr",
): Promise<MealParse> {
  const completion = await ai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: locale === "en" ? SYSTEM_EN : SYSTEM_TR },
      { role: "user", content: rawText },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
    // Z.AI GLM-5.1 reasoning model: disable thinking so JSON is returned in content.
    ...({ thinking: { type: "disabled" } } as object),
  });

  const msg = completion.choices[0]?.message as
    | { content?: string | null; reasoning_content?: string | null }
    | undefined;

  let content = msg?.content?.trim() ?? "";
  if (!content && msg?.reasoning_content) {
    // Fallback: try to extract a JSON object from reasoning_content.
    const m = msg.reasoning_content.match(/\{[\s\S]*\}/);
    content = m ? m[0] : "";
  }
  if (!content) content = "{}";

  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    // Sometimes models wrap in ```json ... ``` — strip and retry once.
    const cleaned = content
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    json = JSON.parse(cleaned);
  }
  return MealParseSchema.parse(json);
}
