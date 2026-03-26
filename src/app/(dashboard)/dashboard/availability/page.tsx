// src/app/(dashboard)/dashboard/availability/page.tsx
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import AvailabilityClient from "@/components/dashboard/AvailabilityClient";

export default async function AvailabilityPage() {
  const session = await auth();
  const rows = await db.availability.findMany({
    where:   { userId: session!.user.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return (
    <AvailabilityClient
      schedule={rows.map(r => ({
        id:        r.id,
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime:   r.endTime,
        isActive:  r.isActive,
      }))}
    />
  );
}
