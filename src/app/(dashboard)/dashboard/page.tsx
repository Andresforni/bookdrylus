// src/app/(dashboard)/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTrialDaysRemaining, getSubscriptionDaysRemaining, shouldShowRenewalBanner } from "@/lib/membership";
import DashboardHome from "@/components/dashboard/DashboardHome";

export default async function DashboardPage() {
  const session = await auth();
  const userId  = session!.user.id;

  const today      = new Date(); today.setHours(0,0,0,0);
  const todayEnd   = new Date(today); todayEnd.setHours(23,59,59,999);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayBookings, monthCount, totalClients, userInfo] = await Promise.all([
    db.booking.findMany({
      where:   { professionalId: userId, startTime: { gte: today, lte: todayEnd }, status: "CONFIRMED" },
      include: { service: { select: { name: true, duration: true, color: true } } },
      orderBy: { startTime: "asc" },
    }),
    db.booking.count({ where: { professionalId: userId, startTime: { gte: monthStart }, status: { in: ["CONFIRMED","COMPLETED"] } } }),
    db.booking.findMany({ where: { professionalId: userId }, select: { clientEmail: true }, distinct: ["clientEmail"] }),
    // ← Leer siempre desde BD, nunca desde JWT (el JWT puede estar desactualizado)
    db.user.findUnique({
      where:  { id: userId },
      select: { membershipStatus: true, trialEndsAt: true, subscriptionEndsAt: true, subscriptionPlan: true },
    }),
  ]);

  const status    = userInfo?.membershipStatus   ?? "FREE_TRIAL";
  const trialEnds = userInfo?.trialEndsAt        ?? null;
  const subEnds   = userInfo?.subscriptionEndsAt ?? null;
  const subPlan   = userInfo?.subscriptionPlan   ?? null;

  const daysLeft  = status === "FREE_TRIAL"
    ? getTrialDaysRemaining(trialEnds)
    : getSubscriptionDaysRemaining(subEnds);

  const totalDays = subPlan === "ANNUAL" ? 365 : 30;
  const trialPct  = status === "FREE_TRIAL"
    ? Math.round(((15 - daysLeft) / 15) * 100)
    : Math.round(((totalDays - daysLeft) / totalDays) * 100);

  const showRenewal = shouldShowRenewalBanner(status, trialEnds, subEnds);

  const profName  = session!.user.businessName ?? session!.user.name ?? "";
  const firstName = profName.split(" ").find(w => !["Dr.","Dra.","Lic.","Prof."].includes(w)) ?? profName;

  return (
    <DashboardHome
      firstName={firstName}
      slug={session!.user.slug ?? ""}
      status={status}
      daysLeft={daysLeft}
      trialPct={trialPct}
      showRenewal={showRenewal}
      subPlan={subPlan}
      subscriptionEndsAt={subEnds?.toISOString() ?? null}
      todayBookings={todayBookings.map(b => ({
        id: b.id, clientName: b.clientName, clientPhone: b.clientPhone,
        startTime: b.startTime.toISOString(), endTime: b.endTime.toISOString(),
        status: b.status,
        service: { name: b.service.name, duration: b.service.duration, color: b.service.color },
      }))}
      monthCount={monthCount}
      totalClients={totalClients.length}
    />
  );
}
