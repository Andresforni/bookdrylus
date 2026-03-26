// src/app/(admin)/admin/page.tsx
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function AdminPage() {
  const [totalProfs, activeMembers, trialMembers, expiredMembers, totalBookings, monthBookings, recentUsers] = await Promise.all([
    db.user.count({ where: { role: "PROFESSIONAL" } }),
    db.user.count({ where: { role: "PROFESSIONAL", membershipStatus: "ACTIVE" } }),
    db.user.count({ where: { role: "PROFESSIONAL", membershipStatus: "FREE_TRIAL" } }),
    db.user.count({ where: { role: "PROFESSIONAL", membershipStatus: "EXPIRED" } }),
    db.booking.count(),
    db.booking.count({ where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    db.user.findMany({
      where:   { role: "PROFESSIONAL" },
      orderBy: { createdAt: "desc" },
      take:    10,
      select:  { id:true, name:true, email:true, businessName:true, specialty:true, membershipStatus:true, trialEndsAt:true, createdAt:true, slug:true, _count: { select: { bookings: true } } },
    }),
  ]);

  const MS_COLOR: Record<string, string> = { FREE_TRIAL:"#0284c7", ACTIVE:"#16a34a", EXPIRED:"#ef4444", CANCELLED:"#9ca3af" };
  const MS_LABEL: Record<string, string> = { FREE_TRIAL:"Prueba", ACTIVE:"Activa", EXPIRED:"Vencida", CANCELLED:"Cancelada" };

  return (
    <div style={{ padding:"28px 32px" }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:"Poppins, sans-serif", fontWeight:800, fontSize:24, color:"#111827" }}>
          Panel de <span style={{ background:"linear-gradient(90deg,#0ea5e9,#4c6ef5,#7c3aed)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Administración</span>
        </h1>
        <p style={{ color:"#9ca3af", fontSize:13, marginTop:3 }}>
          {new Date().toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:24 }}>
        {[
          { ico:"👨‍⚕️", label:"Profesionales", val:totalProfs,     bg:"rgba(79,195,247,.13)" },
          { ico:"✅", label:"Membresías activas", val:activeMembers, bg:"rgba(34,197,94,.11)" },
          { ico:"⏳", label:"En prueba",          val:trialMembers,  bg:"rgba(59,91,219,.11)" },
          { ico:"❌", label:"Vencidas",           val:expiredMembers,bg:"rgba(239,68,68,.10)" },
          { ico:"📅", label:"Reservas este mes",  val:monthBookings, bg:"rgba(124,58,237,.11)" },
        ].map((k,i) => (
          <div key={i} style={{ background:"white", borderRadius:14, border:"1px solid rgba(60,80,180,.09)", padding:18, boxShadow:"0 2px 12px rgba(59,91,219,.07)" }}>
            <div style={{ width:32,height:32,borderRadius:9,background:k.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,marginBottom:12 }}>{k.ico}</div>
            <div style={{ fontFamily:"Poppins, sans-serif", fontWeight:800, fontSize:24 }}>{k.val}</div>
            <div style={{ fontSize:12, color:"#9ca3af", marginTop:4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Professionals table */}
      <div style={{ background:"white", borderRadius:16, border:"1px solid rgba(60,80,180,.09)", boxShadow:"0 2px 12px rgba(59,91,219,.07)", overflow:"hidden" }}>
        <div style={{ padding:"16px 20px 14px", borderBottom:"1px solid rgba(60,80,180,.09)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontFamily:"Poppins, sans-serif", fontWeight:700, fontSize:15 }}>Profesionales recientes</span>
          <Link href="/admin/professionals" style={{ fontSize:12, color:"#3b5bdb", fontWeight:600, textDecoration:"none" }}>Ver todos →</Link>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid rgba(60,80,180,.09)" }}>
              {["Profesional","Especialidad","Estado","Membresía","Reservas","Registro"].map(h=>(
                <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:10.5, fontWeight:700, textTransform:"uppercase", letterSpacing:.8, color:"#9ca3af" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentUsers.map(u => {
              const daysLeft = u.trialEndsAt ? Math.max(0,Math.ceil((u.trialEndsAt.getTime()-Date.now())/86400000)) : null;
              return (
                <tr key={u.id} style={{ borderBottom:"1px solid rgba(60,80,180,.07)" }}>
                  <td style={{ padding:"13px 16px" }}>
                    <div style={{ fontWeight:600, fontSize:13.5 }}>{u.businessName ?? u.name}</div>
                    <div style={{ fontSize:12, color:"#9ca3af", marginTop:1 }}>{u.email}</div>
                  </td>
                  <td style={{ padding:"13px 16px", fontSize:13, color:"#4b5563" }}>{u.specialty ?? "—"}</td>
                  <td style={{ padding:"13px 16px" }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:100, background:`${MS_COLOR[u.membershipStatus]}18`, color:MS_COLOR[u.membershipStatus] }}>
                      {MS_LABEL[u.membershipStatus]}{u.membershipStatus==="FREE_TRIAL"&&daysLeft!==null?` · ${daysLeft}d`:""}
                    </span>
                  </td>
                  <td style={{ padding:"13px 16px", fontSize:13, color:"#4b5563" }}>{u.membershipStatus === "ACTIVE" ? "Mensual" : "—"}</td>
                  <td style={{ padding:"13px 16px", fontFamily:"Poppins, sans-serif", fontWeight:700, fontSize:13 }}>{u._count.bookings}</td>
                  <td style={{ padding:"13px 16px", fontSize:12, color:"#9ca3af" }}>
                    {new Date(u.createdAt).toLocaleDateString("es-AR",{day:"numeric",month:"short",year:"2-digit"})}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
