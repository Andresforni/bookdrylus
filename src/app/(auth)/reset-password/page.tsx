// src/app/(auth)/reset-password/page.tsx
"use client";
import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

// Componente interno que usa useSearchParams
function ResetPasswordForm() {
  const params  = useSearchParams();
  const router  = useRouter();
  const token   = params.get("token") ?? "";

  const [password,  setPassword]  = useState("");
  const [password2, setPassword2] = useState("");
  const [show1,     setShow1]     = useState(false);
  const [show2,     setShow2]     = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState("");

  useEffect(() => {
    if (!token) setError("Link inválido. Solicitá uno nuevo desde ¿Olvidaste tu contraseña?");
  }, [token]);

  const strength = password.length === 0 ? 0
    : password.length < 6  ? 1
    : password.length < 10 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;

  const strengthLabel = ["", "Muy corta", "Regular", "Buena", "Excelente"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#22c55e", "#16a34a"][strength];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== password2) { setError("Las contraseñas no coinciden."); return; }
    if (password.length < 8)    { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al restablecer."); return; }
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (done) return (
    <div style={{ textAlign:"center" }}>
      <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(34,197,94,.1)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M4 12l6 6 10-10"/></svg>
      </div>
      <h1 style={{ fontWeight:700, fontSize:20, marginBottom:10 }}>¡Contraseña actualizada!</h1>
      <p style={{ color:"#4A5568", fontSize:14, lineHeight:1.7, marginBottom:24 }}>
        Tu contraseña fue cambiada exitosamente.<br/>
        <span style={{ color:"#94A3B8", fontSize:12.5 }}>Redirigiendo al login…</span>
      </p>
      <Link href="/login" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"11px 24px", borderRadius:11, background:"#2D7FF9", color:"white", textDecoration:"none", fontWeight:600, fontSize:14 }}>
        Ir al login →
      </Link>
    </div>
  );

  if (!token) return (
    <div style={{ textAlign:"center", padding:"20px 0" }}>
      <div style={{ fontSize:44, marginBottom:14 }}>🔗</div>
      <p style={{ color:"#dc2626", fontSize:14, marginBottom:20 }}>
        Link inválido. Solicitá uno nuevo.
      </p>
      <Link href="/forgot-password" style={{ display:"inline-flex", padding:"11px 24px", borderRadius:11, background:"#2D7FF9", color:"white", textDecoration:"none", fontWeight:600, fontSize:14 }}>
        Solicitar nuevo link
      </Link>
    </div>
  );

  return (
    <>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontWeight:700, fontSize:22, color:"#0F1729", marginBottom:8 }}>Nueva contraseña</h1>
        <p style={{ color:"#94A3B8", fontSize:14 }}>Elegí una contraseña segura para tu cuenta.</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Campo 1 */}
        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:.8, color:"#94A3B8", marginBottom:7 }}>
            Nueva contraseña
          </label>
          <div style={{ position:"relative" }}>
            <input type={show1 ? "text" : "password"} required
              placeholder="Mínimo 8 caracteres" value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width:"100%", padding:"13px 44px 13px 15px", border:"1.5px solid #E8ECF2", borderRadius:12, fontFamily:"Poppins, sans-serif", fontSize:14, color:"#0F1729", outline:"none", boxSizing:"border-box" as any }}
              onFocus={e => (e.target.style.borderColor = "#2D7FF9")}
              onBlur={e  => (e.target.style.borderColor = "#E8ECF2")}
            />
            <button type="button" onClick={() => setShow1(s => !s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94A3B8", padding:4 }}>
              {show1
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>
          {password.length > 0 && (
            <div style={{ marginTop:8 }}>
              <div style={{ display:"flex", gap:4, marginBottom:4 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ flex:1, height:3, borderRadius:100, background: i <= strength ? strengthColor : "#E8ECF2", transition:"background .3s" }}/>
                ))}
              </div>
              <span style={{ fontSize:11.5, color:strengthColor, fontWeight:600 }}>{strengthLabel}</span>
            </div>
          )}
        </div>

        {/* Campo 2 */}
        <div style={{ marginBottom:20 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:.8, color:"#94A3B8", marginBottom:7 }}>
            Confirmar contraseña
          </label>
          <div style={{ position:"relative" }}>
            <input type={show2 ? "text" : "password"} required
              placeholder="Repetí tu contraseña" value={password2}
              onChange={e => setPassword2(e.target.value)}
              style={{ width:"100%", padding:"13px 44px 13px 15px", border:`1.5px solid ${password2 && password2 !== password ? "#ef4444" : password2 && password2 === password ? "#22c55e" : "#E8ECF2"}`, borderRadius:12, fontFamily:"Poppins, sans-serif", fontSize:14, color:"#0F1729", outline:"none", boxSizing:"border-box" as any }}
            />
            <button type="button" onClick={() => setShow2(s => !s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94A3B8", padding:4 }}>
              {show2
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>
          {password2 && password2 !== password && <p style={{ fontSize:12, color:"#ef4444", marginTop:5 }}>Las contraseñas no coinciden</p>}
          {password2 && password2 === password  && <p style={{ fontSize:12, color:"#22c55e", marginTop:5 }}>✓ Las contraseñas coinciden</p>}
        </div>

        {error && (
          <div style={{ padding:"11px 14px", borderRadius:10, background:"rgba(239,68,68,.07)", border:"1px solid rgba(239,68,68,.2)", color:"#dc2626", fontSize:13, marginBottom:16 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading || !password || !password2}
          style={{ width:"100%", padding:"14px", borderRadius:12, background:"#2D7FF9", color:"white", border:"none", cursor: loading||!password||!password2 ? "not-allowed" : "pointer", fontFamily:"Poppins, sans-serif", fontWeight:700, fontSize:15, opacity: loading||!password||!password2 ? .7 : 1, minHeight:50, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {loading
            ? <><svg style={{ animation:"spin 1s linear infinite" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Guardando…</>
            : "Guardar nueva contraseña"
          }
        </button>
      </form>

      <p style={{ textAlign:"center", marginTop:20, fontSize:13.5, color:"#94A3B8" }}>
        <Link href="/login" style={{ color:"#2D7FF9", fontWeight:600, textDecoration:"none" }}>← Volver al login</Link>
      </p>
    </>
  );
}

// Página wrapper con Suspense — requerido por Next.js 14 para useSearchParams
export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight:"100vh", background:"#F5F7FA", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px 16px", fontFamily:"Poppins, sans-serif" }}>
      <div style={{ marginBottom:32 }}>
        <Image src="/images/logo.png" alt="Book Drylus" width={140} height={52} style={{ objectFit:"contain" }} priority/>
      </div>
      <div style={{ background:"white", borderRadius:20, padding:"36px 32px", maxWidth:420, width:"100%", boxShadow:"0 4px 32px rgba(0,0,0,.08)" }}>
        <Suspense fallback={
          <div style={{ textAlign:"center", padding:"40px 0", color:"#94A3B8" }}>
            <svg style={{ animation:"spin 1s linear infinite", margin:"0 auto 12px", display:"block" }} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            Cargando…
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
