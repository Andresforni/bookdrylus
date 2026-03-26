// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

const Schema = z.object({
  name:     z.string().min(2).max(80),
  email:    z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: NextRequest) {
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing)
    return NextResponse.json({ error: "Este email ya está registrado" }, { status: 409 });

  const hash = await bcrypt.hash(password, 12);
  const slug = await generateUniqueSlug(email);
  const trialEndsAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
  const isAdmin = email === process.env.ADMIN_EMAIL;

  const user = await db.user.create({
    data: {
      name,
      email,
      password: hash,
      slug,
      trialEndsAt,
      membershipStatus: isAdmin ? "ACTIVE"       : "FREE_TRIAL",
      role:             isAdmin ? "ADMIN"         : "PROFESSIONAL",
      availability: {
        createMany: {
          data: [1, 2, 3, 4, 5].map(day => ({
            dayOfWeek: day, startTime: "09:00", endTime: "18:00", isActive: true,
          })),
        },
      },
    },
  });

  // Crear token de verificación (expira en 24h)
  await db.emailVerification.deleteMany({ where: { email } });
  const verification = await db.emailVerification.create({
    data: {
      email,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await sendVerificationEmail(email, name, verification.token);

  return NextResponse.json({ ok: true, message: "Revisá tu email para verificar tu cuenta" }, { status: 201 });
}
