// src/app/(dashboard)/dashboard/settings/page.tsx
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import SettingsClient from "@/components/dashboard/SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  const user = await db.user.findUnique({
    where:  { id: session!.user.id },
    select: {
      id:true, name:true, email:true, image:true,
      businessName:true, specialty:true, bio:true,
      phone:true, location:true, timezone:true, slug:true,
      primaryColor:true, accentColor:true,
      googleEmail:true, googleCalendarId:true,
    },
  });

  // Leer campos nuevos via SQL directo (pueden no estar en schema de Prisma aún)
  let bookingFields = { bookingMinDays: 0, bookingMaxDays: 60, allowDuplicateBooking: false };
  try {
    const { createClient } = await import("@libsql/client");
    const client = createClient({
      url:       process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    const row = await client.execute({
      sql:  `SELECT bookingMinDays, bookingMaxDays, allowDuplicateBooking FROM "User" WHERE id = ?`,
      args: [session!.user.id],
    });
    if (row.rows[0]) {
      bookingFields = {
        bookingMinDays:       Number(row.rows[0].bookingMinDays  ?? 0),
        bookingMaxDays:       Number(row.rows[0].bookingMaxDays  ?? 60),
        allowDuplicateBooking: !!row.rows[0].allowDuplicateBooking,
      };
    }
  } catch { /* columnas aún no existen — usar defaults */ }

  return <SettingsClient user={{ ...user!, ...bookingFields }} />;
}
