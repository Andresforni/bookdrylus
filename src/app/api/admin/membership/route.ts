// src/app/api/admin/membership/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const Schema = z.object({
  userId:          z.string().min(1),
  status:          z.enum(["FREE_TRIAL","ACTIVE","EXPIRED","CANCELLED"]).optional(),
  extendTrialDays: z.number().int().min(1).max(365).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { userId, status, extendTrialDays } = parsed.data;

  const user = await db.user.findUnique({
    where:  { id: userId },
    select: { id:true, membershipStatus:true, trialEndsAt:true },
  });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const updateData: any = {};
  if (status) updateData.membershipStatus = status;
  if (extendTrialDays) {
    const base = user.trialEndsAt && user.trialEndsAt > new Date() ? user.trialEndsAt : new Date();
    updateData.trialEndsAt = new Date(base.getTime() + extendTrialDays * 86400000);
    if (user.membershipStatus === "EXPIRED") updateData.membershipStatus = "FREE_TRIAL";
  }

  const updated = await db.user.update({ where: { id: userId }, data: updateData });
  return NextResponse.json({ user: { id: updated.id, membershipStatus: updated.membershipStatus, trialEndsAt: updated.trialEndsAt } });
}
