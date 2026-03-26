// src/app/(public)/book/[slug]/page.tsx
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import BookingClient from "@/components/booking/BookingClient";
import type { Metadata } from "next";

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await db.user.findUnique({
    where:  { slug: params.slug },
    select: { name: true, businessName: true, specialty: true },
  });
  if (!user) return { title: "Profesional no encontrado" };
  return {
    title: `Reservar turno — ${user.businessName ?? user.name}`,
    description: `Reservá tu turno online con ${user.businessName ?? user.name}${user.specialty ? `, especialista en ${user.specialty}` : ""}.`,
  };
}

export default async function BookPage({ params }: Props) {
  const professional = await db.user.findUnique({
    where:  { slug: params.slug },
    select: {
      id: true, name: true, businessName: true, specialty: true,
      location: true, bio: true, image: true, slug: true,
      primaryColor: true, accentColor: true, timezone: true,
      membershipStatus: true, trialEndsAt: true,
      bookingMinDays: true, bookingMaxDays: true, allowDuplicateBooking: true,
      services: {
        where:   { isActive: true },
        orderBy: { sortOrder: "asc" },
        select:  { id:true, name:true, description:true, duration:true, price:true, currency:true, color:true },
      },
    },
  });

  if (!professional) notFound();

  return <BookingClient professional={{
    id:              professional.id,
    name:            professional.name ?? "",
    businessName:    professional.businessName,
    specialty:       professional.specialty,
    location:        professional.location,
    bio:             professional.bio,
    image:           professional.image,
    slug:            professional.slug ?? "",
    primaryColor:    professional.primaryColor,
    accentColor:     professional.accentColor,
    membershipStatus: professional.membershipStatus,
    trialEndsAt:     professional.trialEndsAt?.toISOString() ?? null,
    timezone:        professional.timezone ?? "America/Argentina/Buenos_Aires",
    bookingMinDays:  (professional as any).bookingMinDays  ?? 0,
    bookingMaxDays:  (professional as any).bookingMaxDays  ?? 60,
    allowDuplicateBooking: (professional as any).allowDuplicateBooking ?? false,
    services:        professional.services,
  }} />;
}
