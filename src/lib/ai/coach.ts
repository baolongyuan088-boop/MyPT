import { ai, MODEL } from "./client";

const SYSTEM_TR = `Sen MyPT, kullanıcının kişisel antrenörü ve beslenme koçusun.
Samimi, profesyonel, doğrudan konuş. Türkçe.

Her mesajda context veriliyor (profile, hedef, bugün ne yemiş, son antrenmanlar).
Buna referans ver. Genel öğüt verme — kullanıcıya özel cevap.

KURALLAR:
- 1-3 paragraf, fazla uzun olma.
- Sayısal verilere atıfta bulun.
- Hedefe saygı: kilo verme → açığı destekle (kapatma deme), kilo alma → açığı kapat öner.
- Asla tıbbi tavsiye verme — "tıbbi konular için doktora git" de.
- Spesifik öneri: "30g protein ekle" değil, "2 yumurta daha ekle (~12g)".
- Markdown KULLANMA — düz metin.`;

const SYSTEM_EN = `You are MyPT, the user's personal trainer and nutrition coach.
Warm, professional, direct. Speak English.

Each message includes context (profile, goal, what they ate today, recent workouts).
Reference it. Avoid generic advice — speak to their specific situation.

RULES:
- 1-3 short paragraphs.
- Reference numbers.
- Respect goal: weight loss → support the deficit, don't say "fill the gap"; gain → suggest closing the gap.
- Never give medical advice — say "see a doctor for medical issues".
- Specific: not "add 30g protein" but "add 2 more eggs (~12g)".
- NO markdown — plain text.`;

export interface CoachContext {
  profile: {
    sex?: string | null;
    age?: number | null;
    heightCm?: number | null;
    weightKg?: number | null;
    goal: string;
    activityLevel: string;
    targetCalories: number;
    targetProteinG: number;
  };
  todayTotals: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  todayMealsCount: number;
  recentWorkouts: Array<{ daysAgo: number; exercises: string[]; durationMin: number | null }>;
}

export interface CoachHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export async function generateCoachReply(
  ctx: CoachContext,
  history: CoachHistoryItem[],
  newMessage: string,
  locale: "tr" | "en" = "tr",
): Promise<string> {
  const ctxText = JSON.stringify(ctx, null, 2);
  const systemContent =
    (locale === "en" ? SYSTEM_EN : SYSTEM_TR) +
    `\n\nCONTEXT:\n${ctxText}`;

  const completion = await ai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemContent },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: newMessage },
    ],
    temperature: 0.7,
    max_tokens: 600,
    ...({ thinking: { type: "disabled" } } as object),
  });

  const msg = completion.choices[0]?.message as
    | { content?: string | null; reasoning_content?: string | null }
    | undefined;

  let text = msg?.content?.trim() ?? "";
  if (!text && msg?.reasoning_content) {
    const parts = msg.reasoning_content.trim().split(/\n{2,}/);
    text = parts.pop()?.trim() ?? "";
  }
  return text;
}
