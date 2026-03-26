// src/app/(auth)/register/page.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { PublicLayout } from "@/components/ui/PublicLayout";

const strengthColors = ["#e2e8f0", "#ef4444", "#f59e0b", "#22c55e", "#2563eb"];
const strengthLabels = ["", "Débil", "Regular", "Buena", "Fuerte"];

function SuccessScreen({ email }: { email: string }) {
  return (
    <PublicLayout>
      <div className="fade-up" style={{ textAlign: "center" }}>
        <div style={{
          width: 68, height: 68, borderRadius: 20,
          background: "rgba(37,99,235,.08)", border: "2px solid rgba(37,99,235,.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <path d="M22 6l-10 7L2 6"/>
          </svg>
        </div>
        <div className="lw-heading" style={{ marginBottom: 12 }}>
          <h1>Revisá tu email</h1>
          <p>Te enviamos un link de verificación a</p>
        </div>
        <div style={{
          padding: "12px 16px", borderRadius: 12,
          background: "#f4f7ff", border: "1.5px solid #e0e8ff",
          fontSize: 14, fontWeight: 700, color: "#0f1729", marginBottom: 24,
        }}>
          {email}
        </div>
        <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 28, lineHeight: 1.6 }}>
          El link es válido por 24 horas.<br/>
          Revisá también tu carpeta de spam.
        </p>
        <Link href="/login" className="lw-btn" style={{ textDecoration: "none" }}>
          Ir al login →
        </Link>
      </div>
    </PublicLayout>
  );
}

export default function RegisterPage() {
  const [form,      setForm]      = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [done,      setDone]      = useState(false);
  const [showPass,  setShowPass]  = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [pwStrength, setPwStrength] = useState(0);

  const upd = (f: string, v: string) => {
    setForm(p => ({ ...p, [f]: v }));
    if (f === "password") {
      let s = 0;
      if (v.length >= 8)            s++;
      if (/[A-Z]/.test(v))          s++;
      if (/[0-9]/.test(v))          s++;
      if (/[^A-Za-z0-9]/.test(v))   s++;
      setPwStrength(s);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Las contraseñas no coinciden"); return; }
    if (form.password.length < 8)       { setError("La contraseña debe tener al menos 8 caracteres"); return; }
    setLoading(true); setError("");
    const res  = await fetch("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Error al registrarse"); return; }
    setDone(true);
  }

  if (done) return <SuccessScreen email={form.email} />;

  return (
    <PublicLayout>
      <div className="fade-up">
        <div className="lw-heading">
          <h1>Crear cuenta gratis</h1>
          <p>60 días de prueba · Sin tarjeta de crédito</p>
        </div>

        {error && (
          <div className="lw-alert error" style={{ marginBottom: 16 }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Nombre */}
          <div className="lw-field">
            <label className="lw-label">Nombre completo</label>
            <input className="lw-input" placeholder="Ej: María García"
              value={form.name} onChange={e => upd("name", e.target.value)} required />
          </div>

          {/* Email */}
          <div className="lw-field">
            <label className="lw-label">Email</label>
            <input className="lw-input" type="email" placeholder="tu@email.com"
              value={form.email} onChange={e => upd("email", e.target.value)}
              required autoComplete="email" />
          </div>

          {/* Contraseña */}
          <div className="lw-field">
            <label className="lw-label">Contraseña</label>
            <div className="lw-pass-wrap">
              <input className="lw-input" type={showPass ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                value={form.password} onChange={e => upd("password", e.target.value)}
                required autoComplete="new-password" />
              <button type="button" className="lw-pass-toggle" onClick={() => setShowPass(s => !s)}>
                {showPass
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {/* Strength bar */}
            {form.password && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 100,
                      background: i <= pwStrength ? strengthColors[pwStrength] : "#e2e8f0",
                      transition: "background .2s",
                    }}/>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: strengthColors[pwStrength], marginTop: 4, fontWeight: 600 }}>
                  {strengthLabels[pwStrength]}
                </div>
              </div>
            )}
          </div>

          {/* Confirmar */}
          <div className="lw-field">
            <label className="lw-label">Confirmar contraseña</label>
            <div className="lw-pass-wrap">
              <input className="lw-input" type={showConf ? "text" : "password"}
                placeholder="Repetí tu contraseña"
                value={form.confirm} onChange={e => upd("confirm", e.target.value)}
                required autoComplete="new-password" />
              <button type="button" className="lw-pass-toggle" onClick={() => setShowConf(s => !s)}>
                {showConf
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {/* Match indicator */}
            {form.confirm && (
              <div style={{ fontSize: 11, marginTop: 4, fontWeight: 600, color: form.password === form.confirm ? "#22c55e" : "#ef4444" }}>
                {form.password === form.confirm ? "✓ Las contraseñas coinciden" : "✗ No coinciden"}
              </div>
            )}
          </div>

          <button type="submit" className="lw-btn" disabled={loading} style={{ marginTop: 4 }}>
            {loading
              ? <><svg style={{ animation: "spin 1s linear infinite" }} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Creando cuenta…</>
              : "Crear cuenta gratis →"
            }
          </button>
        </form>

        <p className="lw-register" style={{ marginTop: 20 }}>
          ¿Ya tenés cuenta?{" "}
          <Link href="/login">Iniciar sesión</Link>
        </p>
      </div>
    </PublicLayout>
  );
}
