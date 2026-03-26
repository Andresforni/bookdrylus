"use client";
// src/app/(auth)/forgot-password/page.tsx
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:"#F5F7FA", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px 16px", fontFamily:"Poppins, sans-serif" }}>

      {/* Logo */}
      <div style={{ marginBottom:32 }}>
        <Image src="/images/logo.png" alt="Book Drylus" width={140} height={52} style={{ objectFit:"contain" }} priority/>
      </div>

      <div style={{ background:"white", borderRadius:20, padding:"36px 32px", maxWidth:420, width:"100%", boxShadow:"0 4px 32px rgba(0,0,0,.08)" }}>

        {sent ? (
          /* ── Estado: email enviado ── */
          <div style={{ textAlign:"center" }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:"#EBF3FF", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2D7FF9" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <h1 style={{ fontWeight:700, fontSize:20, marginBottom:10 }}>¡Revisá tu email!</h1>
            <p style={{ color:"#4A5568", fontSize:14, lineHeight:1.7, marginBottom:24 }}>
              Si existe una cuenta con <strong>{email}</strong>, vas a recibir un email con el link para restablecer tu contraseña.<br/>
              <span style={{ color:"#94A3B8", fontSize:12.5 }}>El link es válido por 1 hora.</span>
            </p>
            <Link href="/login" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"11px 24px", borderRadius:11, background:"#2D7FF9", color:"white", textDecoration:"none", fontWeight:600, fontSize:14 }}>
              ← Volver al login
            </Link>
          </div>
        ) : (
          /* ── Formulario ── */
          <>
            <div style={{ marginBottom:28 }}>
              <h1 style={{ fontWeight:700, fontSize:22, color:"#0F1729", marginBottom:8 }}>
                Olvidaste tu contraseña?
              </h1>
              <p style={{ color:"#94A3B8", fontSize:14, lineHeight:1.6 }}>
                Ingresá tu email y te enviamos un link para crear una nueva contraseña.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:18 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:.8, color:"#94A3B8", marginBottom:7 }}>
                  Email
                </label>
                <input
                  type="email" required autoFocus
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ width:"100%", padding:"13px 15px", border:"1.5px solid #E8ECF2", borderRadius:12, fontFamily:"Poppins, sans-serif", fontSize:14, color:"#0F1729", outline:"none", boxSizing:"border-box" as any, transition:"border-color .15s" }}
                  onFocus={e  => (e.target.style.borderColor = "#2D7FF9")}
                  onBlur={e   => (e.target.style.borderColor = "#E8ECF2")}
                />
              </div>

              {error && (
                <div style={{ padding:"11px 14px", borderRadius:10, background:"rgba(239,68,68,.07)", border:"1px solid rgba(239,68,68,.2)", color:"#dc2626", fontSize:13, marginBottom:16 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading || !email}
                style={{ width:"100%", padding:"14px", borderRadius:12, background:"#2D7FF9", color:"white", border:"none", cursor: loading||!email ? "not-allowed" : "pointer", fontFamily:"Poppins, sans-serif", fontWeight:700, fontSize:15, opacity: loading||!email ? .7 : 1, transition:"all .15s", minHeight:50, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {loading ? (
                  <><svg style={{ animation:"spin 1s linear infinite" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Enviando…</>
                ) : "Enviar link de recuperación"}
              </button>
            </form>

            <p style={{ textAlign:"center", marginTop:20, fontSize:13.5, color:"#94A3B8" }}>
              <Link href="/login" style={{ color:"#2D7FF9", fontWeight:600, textDecoration:"none" }}>
                ← Volver al login
              </Link>
            </p>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
