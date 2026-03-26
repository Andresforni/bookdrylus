// src/app/api/auth/resend-verification/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });

  const user = await db.user.findUnique({
    where:  { email },
    select: { id:true, name:true, email:true, emailVerified:true },
  });
  if (!user) return NextResponse.json({ error: "Email no encontrado" }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ error: "Este email ya fue verificado" }, { status: 400 });

  // Eliminar tokens anteriores y crear uno nuevo
  await db.emailVerification.deleteMany({ where: { email } });
  const verification = await db.emailVerification.create({
    data: { email, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });

  await sendVerificationEmail(email, user.name ?? email, verification.token);

  return NextResponse.json({ ok: true });
}
