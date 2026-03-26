// src/app/(dashboard)/dashboard/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DashboardSidebar from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F5F7FA", fontFamily: "Poppins, sans-serif" }}>
      <DashboardSidebar user={session.user} />
      <main style={{ flex: 1, overflow: "auto", minWidth: 0 }}>
        {/* Mobile: pt-14 para el topbar fijo. Sin pb por bottom nav eliminado. */}
        <style>{`
          @media (max-width: 640px) {
            #dash-main { padding-top: 56px; }
          }
        `}</style>
        <div id="dash-main" style={{ minHeight: "100%" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
