// src/app/(dashboard)/dashboard/services/page.tsx
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import ServicesClient from "@/components/dashboard/ServicesClient";

export default async function ServicesPage() {
  const session = await auth();
  const services = await db.service.findMany({
    where:   { userId: session!.user.id },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <ServicesClient
      services={services.map((s) => ({
        id:          s.id,
        name:        s.name,
        description: s.description,
        duration:    s.duration,
        price:       s.price,
        currency:    s.currency,
        color:       s.color,
        isActive:    s.isActive,
        sortOrder:   s.sortOrder,
      }))}
    />
  );
}
