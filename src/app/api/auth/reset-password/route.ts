// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password || password.length < 8)
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const reset = await db.passwordReset.findUnique({ where: { token } });

  if (!reset || reset.used || reset.expires < new Date())
    return NextResponse.json({ error: "El link expiró o ya fue usado. Solicitá uno nuevo." }, { status: 400 });

  const hashed = await bcrypt.hash(password, 12);

  await db.user.update({
    where: { email: reset.email },
    data:  { password: hashed },
  });

  await db.passwordReset.update({
    where: { token },
    data:  { used: true },
  });

  return NextResponse.json({ ok: true });
}
