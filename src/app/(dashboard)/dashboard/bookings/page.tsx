// src/app/(dashboard)/dashboard/bookings/page.tsx
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import BookingsClient from "@/components/dashboard/BookingsClient";

export default async function BookingsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const bookings = await db.booking.findMany({
    where: { professionalId: userId },
    include: { service: { select: { name: true, duration: true, color: true, price: true } } },
    orderBy: { startTime: "desc" },
    take: 100,
  });

  const serialized = bookings.map((b) => ({
    id:          b.id,
    clientName:  b.clientName,
    clientEmail: b.clientEmail,
    clientPhone: b.clientPhone,
    clientNotes: b.clientNotes,
    startTime:   b.startTime.toISOString(),
    endTime:     b.endTime.toISOString(),
    status:      b.status,
    cancelToken: b.cancelToken,
    service: {
      name:     b.service.name,
      duration: b.service.duration,
      color:    b.service.color,
      price:    b.service.price,
    },
  }));

  return <BookingsClient bookings={serialized} />;
}
