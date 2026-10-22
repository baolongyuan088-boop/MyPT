import { safeAIError } from "@/lib/ai/client";
import { auth } from "@/auth";
import { db } from "@/db/client";
import {
  createMealWithItems,
  getMealItems,
  getMealsBetween,
} from "@/db/queries";
import { parseMeal } from "@/lib/ai/parse-meal";
import { startOfLocalDay, endOfLocalDay } from "@/lib/utils";
import { NextResponse } from "next/server";
import { z } from "zod";

const PostBody = z.object({
  rawText: z.string().min(2).max(2000),
  eatenAt: z.string().datetime(),
  locale: z.enum(["zh", "en", "tr"]).default("tr"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = PostBody.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid body", details: body.error.format() }, { status: 400 });
  }

  let parsed;
  try {
    parsed = await parseMeal(body.data.rawText, body.data.locale);
  } catch (err) {
    return NextResponse.json(
      { error: "AI parse failed", message: safeAIError(err) },
      { status: 502 },
    );
  }

  const created = await createMealWithItems(
    {
      userId: session.user.id,
      eatenAt: new Date(body.data.eatenAt),
      rawText: body.data.rawText,
      aiParsedJson: JSON.stringify(parsed),
      totalCalories: parsed.total_calories,
      proteinG: parsed.total_protein_g,
      carbsG: parsed.total_carbs_g,
      fatG: parsed.total_fat_g,
      notes: parsed.notes ?? null,
    },
    parsed.items.map((it) => ({
      name: it.name,
      quantity: it.quantity ?? null,
      unit: it.unit ?? null,
      calories: it.calories,
      proteinG: it.protein_g,
      carbsG: it.carbs_g,
      fatG: it.fat_g,
    })),
  );

  const items = await getMealItems(created.id);
  return NextResponse.json({ meal: created, items, ai: parsed }, { status: 201 });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dateStr = url.searchParams.get("date"); // YYYY-MM-DD (local)
  const date = dateStr ? new Date(dateStr + "T00:00:00") : new Date();

  const from = startOfLocalDay(date).getTime();
  const to = endOfLocalDay(date).getTime();

  const meals = await getMealsBetween(session.user.id, from, to);
  return NextResponse.json({ meals });
}

// Avoid Edge — needs Node for libsql + openai
export const runtime = "nodejs";
