// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });

  // Siempre responder OK aunque el email no exista (seguridad)
  const user = await db.user.findUnique({
    where:  { email },
    select: { id: true, name: true, email: true, password: true },
  });

  if (user && user.password) {
    // Invalidar tokens anteriores
    await db.passwordReset.deleteMany({ where: { email } });

    const reset = await db.passwordReset.create({
      data: {
        email,
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
      },
    });

    await sendPasswordResetEmail(email, user.name ?? email, reset.token)
      .catch(e => console.error("[forgot-password] email failed:", e));
  }

  return NextResponse.json({ ok: true });
}
