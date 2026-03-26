// src/app/api/api-keys/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";

// Listar keys del profesional
export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const keys = await db.apiKey.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, key: true, isActive: true, lastUsedAt: true, createdAt: true },
  });

  return NextResponse.json({ keys });
}

// Crear nueva API key
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim())
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  // Máximo 5 keys por profesional
  const count = await db.apiKey.count({ where: { userId: session.user.id } });
  if (count >= 5)
    return NextResponse.json({ error: "Máximo 5 API keys por cuenta" }, { status: 400 });

  // Generar key: bdk_live_<32 bytes hex>
  const rawKey = `bdk_live_${crypto.randomBytes(24).toString("hex")}`;

  const key = await db.apiKey.create({
    data: { userId: session.user.id, name: name.trim(), key: rawKey },
  });

  return NextResponse.json({ key });
}

// Revocar/activar key
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, isActive } = await req.json();

  const key = await db.apiKey.findUnique({ where: { id } });
  if (!key || key.userId !== session.user.id)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await db.apiKey.update({ where: { id }, data: { isActive } });
  return NextResponse.json({ ok: true });
}

// Eliminar key
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await req.json();

  const key = await db.apiKey.findUnique({ where: { id } });
  if (!key || key.userId !== session.user.id)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await db.apiKey.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
