// prisma/seed.ts
// Datos iniciales: admin + profesional de demo

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Crear admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@book.drylus.app" },
    update: {},
    create: {
      email: "admin@book.drylus.app",
      name: "Super Admin",
      role: "ADMIN",
      membershipStatus: "ACTIVE",
      slug: "admin",
    },
  });
  console.log("✅ Admin creado:", admin.email);

  // Crear profesional demo
  const prof = await prisma.user.upsert({
    where: { email: "demo@book.drylus.app" },
    update: {},
    create: {
      email: "demo@book.drylus.app",
      name: "Dra. Romina Castillo",
      businessName: "Consultorio Castillo",
      specialty: "Odontología",
      location: "Palermo, Buenos Aires",
      bio: "Especialista en implantología y estética dental. 8 años de experiencia.",
      slug: "dra-castillo",
      role: "PROFESSIONAL",
      membershipStatus: "FREE_TRIAL",
      trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      primaryColor: "#3b5bdb",
      accentColor: "#7c3aed",
      // Disponibilidad Lun-Vie 09:00-18:00
      availability: {
        create: [1, 2, 3, 4, 5].map((day) => ({
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "18:00",
          isActive: true,
        })),
      },
      // Servicios demo
      services: {
        create: [
          { name: "Consulta inicial", duration: 30, price: 3500, color: "#0ea5e9", sortOrder: 1 },
          { name: "Limpieza dental", duration: 45, price: 6000, color: "#3b5bdb", sortOrder: 2 },
          { name: "Blanqueamiento", duration: 60, price: 18000, color: "#7c3aed", sortOrder: 3 },
          { name: "Control ortodoncia", duration: 20, price: 4200, color: "#4c6ef5", sortOrder: 4 },
        ],
      },
    },
  });
  console.log("✅ Profesional demo creado:", prof.email);
  console.log("\n🎉 Seed completado.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
