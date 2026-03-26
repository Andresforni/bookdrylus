// src/app/api/admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

// GET /api/admin — platform stats
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const [totalProfs, activeMembers, trialMembers, totalBookings] = await Promise.all([
    db.user.count({ where: { role: "PROFESSIONAL" } }),
    db.user.count({ where: { role: "PROFESSIONAL", membershipStatus: "ACTIVE" } }),
    db.user.count({ where: { role: "PROFESSIONAL", membershipStatus: "FREE_TRIAL" } }),
    db.booking.count(),
  ]);
  return NextResponse.json({ totalProfs, activeMembers, trialMembers, totalBookings });
}
