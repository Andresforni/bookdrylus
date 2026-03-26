// src/app/api/auth/connect-google/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { db } from "@/lib/db";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/auth/connect-google/callback`
);

export async function GET(req: NextRequest) {
  const url    = new URL(req.url);
  const code   = url.searchParams.get("code");
  const userId = url.searchParams.get("state");
  const error  = url.searchParams.get("error");

  if (error || !code || !userId) {
    return NextResponse.redirect(new URL("/dashboard/settings?gcal=error", req.url));
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Email de la cuenta Google vinculada
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: gUser } = await oauth2.userinfo.get();

    // Buscar o crear el calendario "book.drylus"
    const cal = google.calendar({ version: "v3", auth: oauth2Client });
    let calendarId = "primary";

    try {
      const list = await cal.calendarList.list();
      const existing = list.data.items?.find(c => c.summary === "book.drylus");
      if (existing?.id) {
        calendarId = existing.id;
      } else {
        const newCal = await cal.calendars.insert({
          requestBody: {
            summary:     "book.drylus",
            description: "Reservas gestionadas por book.drylus",
            timeZone:    "America/Argentina/Buenos_Aires",
          },
        });
        calendarId = newCal.data.id ?? "primary";
      }
    } catch {
      calendarId = "primary";
    }

    await db.user.update({
      where: { id: userId },
      data: {
        googleEmail:        gUser.email ?? undefined,
        googleAccessToken:  tokens.access_token ?? undefined,
        googleRefreshToken: tokens.refresh_token ?? undefined,
        googleCalendarId:   calendarId,
        tokenExpiresAt:     tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
    });

    // Redirigir con parámetro para que el cliente fuerce actualización del JWT
    return NextResponse.redirect(new URL("/dashboard/settings?gcal=connected&refresh=1", req.url));
  } catch (e) {
    console.error("[connect-google] error:", e);
    return NextResponse.redirect(new URL("/dashboard/settings?gcal=error", req.url));
  }
}
