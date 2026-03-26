// src/app/api/auth/connect-google/route.ts
// Después del callback de Google OAuth para vinculación de Calendar
// Este endpoint recibe los tokens del callback y los asocia al usuario logueado

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/auth/connect-google/callback`
);

// GET — genera URL de autorización para vincular GCal
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt:      "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
      "email", "profile",
    ],
    state: session.user.id, // para recuperar el userId en el callback
  });

  return NextResponse.json({ url });
}
