// src/app/(admin)/admin/professionals/page.tsx
import { db } from "@/lib/db";
import AdminProfessionalsClient from "@/components/admin/AdminProfessionalsClient";

export default async function AdminProfessionalsPage() {
  const users = await db.user.findMany({
    where:   { role: "PROFESSIONAL" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true,
      businessName: true, specialty: true, location: true,
      membershipStatus: true, trialEndsAt: true,
      subscriptionEndsAt: true, subscriptionPlan: true,
      createdAt: true, slug: true,
      _count: { select: { bookings: true, services: true } },
    },
  });

  return (
    <AdminProfessionalsClient
      professionals={users.map(u => ({
        id:                 u.id,
        name:               u.name,
        email:              u.email,
        businessName:       u.businessName,
        specialty:          u.specialty,
        location:           u.location,
        membershipStatus:   u.membershipStatus,
        trialEndsAt:        u.trialEndsAt?.toISOString()        ?? null,
        subscriptionEndsAt: u.subscriptionEndsAt?.toISOString() ?? null,
        subscriptionPlan:   u.subscriptionPlan                  ?? null,
        createdAt:          u.createdAt.toISOString(),
        slug:               u.slug,
        bookingsCount:      u._count.bookings,
        servicesCount:      u._count.services,
      }))}
    />
  );
}
