import { getAI } from "./client";

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
  locale: "zh" | "tr" | "en" = "tr",
): Promise<string> {
  const ctxText = JSON.stringify(ctx, null, 2);
  const systemContent =
    (locale === "tr" ? SYSTEM_TR : SYSTEM_EN) +
    `\n\n补充规则（优先）：用用户发消息的语言回答，中文输入就用中文。先理解用户的状态，再给可选的小建议。不要催打卡、羞辱或凭空夸奖；鼓励必须引用真实记录。记录为空不代表没有吃饭或运动。热量目标只作参考，不鼓励极端节食。不要声称执行了记录、修改计划等未实际执行的操作。缺少口味、份量或身体状态时简短询问。\n\nCONTEXT:\n${ctxText}`;

  const { ai, model } = await getAI();
  const completion = await ai.chat.completions.create({
    model,
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

  return msg?.content?.trim() ?? "";
}
