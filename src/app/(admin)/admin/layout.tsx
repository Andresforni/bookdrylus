// src/app/(admin)/admin/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#eceef5", fontFamily:"Poppins, sans-serif" }}>
      <AdminSidebar user={session.user} />
      <main style={{ flex:1, overflow:"auto" }}>{children}</main>
    </div>
  );
}
