// src/app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/login?error=invalid_token", req.url));

  const record = await db.emailVerification.findUnique({ where: { token } });

  if (!record || record.expires < new Date()) {
    await db.emailVerification.deleteMany({ where: { token } }).catch(() => {});
    return NextResponse.redirect(new URL("/login?error=token_expired", req.url));
  }

  await db.user.update({
    where: { email: record.email },
    data:  { emailVerified: new Date() },
  });

  await db.emailVerification.delete({ where: { token } });

  return NextResponse.redirect(new URL("/login?verified=1", req.url));
}
