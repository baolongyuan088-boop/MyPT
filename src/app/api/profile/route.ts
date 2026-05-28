import { auth } from "@/auth";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { getUserById, getWeeklyWorkoutCount, updateUserProfile } from "@/db/queries";
import { fullProfileTargets } from "@/lib/calories";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const ProfilePatch = z.object({
  name: z.string().min(1).max(80).optional(),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9_]+$/, "Sadece küçük harf, rakam, _")
    .optional(),
  locale: z.enum(["tr", "en"]).optional(),
  sex: z.enum(["male", "female"]).optional(),
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  heightCm: z.number().min(50).max(260).optional(),
  weightKg: z.number().min(20).max(400).optional(),
  // goal, activityLevel, goalCalorieDelta are now derived — accept silently but ignore.
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getUserById(session.user.id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let targets: ReturnType<typeof fullProfileTargets> | null = null;
  if (user.sex && user.weightKg && user.heightCm && user.birthYear) {
    const weeklyWorkoutCount = await getWeeklyWorkoutCount(user.id);
    targets = fullProfileTargets({
      sex: user.sex,
      weightKg: user.weightKg,
      heightCm: user.heightCm,
      birthYear: user.birthYear,
      weeklyWorkoutCount,
    });
  }

  return NextResponse.json({ user, targets });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = ProfilePatch.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid body", details: body.error.format() }, { status: 400 });
  }
  // username uniqueness check
  if (body.data.username) {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.username, body.data.username), ne(users.id, session.user.id)))
      .limit(1);
    if (existing[0]) {
      return NextResponse.json(
        { error: "Bu kullanıcı adı kullanılıyor" },
        { status: 409 },
      );
    }
  }

  await updateUserProfile(session.user.id, body.data);
  const user = await getUserById(session.user.id);
  return NextResponse.json({ user });
}
