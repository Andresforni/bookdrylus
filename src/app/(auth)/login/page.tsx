// src/app/(auth)/login/page.tsx
"use client";
import { useState, Suspense, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const PHOTOS = [
  { src: "/images/prof-1.png", alt: "Odontólogo con paciente" },
  { src: "/images/prof-2.png", alt: "Médico en consulta" },
  { src: "/images/prof-3.png", alt: "Estilista profesional" },
  { src: "/images/prof-4.png", alt: "Masajista terapéutica" },
];

const FEATURES = [
  { icon: "/images/card.png",     title: "Sin tarjeta de crédito", desc: "Empezá gratis, sin compromiso financiero." },
  { icon: "/images/calendar.png", title: "Google Calendar",        desc: "Sincronizá tu agenda automáticamente." },
  { icon: "/images/chat.png",     title: "API para Bot de Mensajeria",        desc: "Confirmaciones y recordatorios 24/7." },
  { icon: "/images/secure.png",   title: "Reservas seguras",       desc: "Control total de tu disponibilidad." },
];

const MONTHLY_PRICE = process.env.NEXT_PUBLIC_PLAN_MONTHLY_PRICE ?? "5000";
const ANNUAL_PRICE  = process.env.NEXT_PUBLIC_PLAN_ANNUAL_PRICE  ?? "45000";

function formatARS(val: string) {
  return Number(val).toLocaleString("es-AR");
}

function PricingModal({ onClose }: { onClose: () => void }) {
  const monthly     = Number(MONTHLY_PRICE);
  const annual      = Number(ANNUAL_PRICE);
  const annualMonth = Math.round(annual / 12);
  const saving      = Math.round(100 - (annual / (monthly * 12)) * 100);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        <div className="modal-header">
          <Image src="/images/logo.png" alt="Book Drylus" width={110} height={44} style={{ objectFit: "contain" }} />
          <h2>Planes simples, sin sorpresas</h2>
          <p>Todas las funciones incluidas en ambos planes</p>
        </div>

        <div className="modal-plans">
          {/* Plan mensual */}
          <div className="plan-card">
            <div className="plan-label">Mensual</div>
            <div className="plan-price">
              <span className="plan-currency">$</span>
              <span className="plan-amount">{formatARS(MONTHLY_PRICE)}</span>
            </div>
            <div className="plan-period">por mes</div>
            <ul className="plan-features">
              <li><CheckIcon /> Reservas ilimitadas</li>
              <li><CheckIcon /> Sincronización Google Calendar</li>
              <li><CheckIcon /> Bot de Mensajeria</li>
              <li><CheckIcon /> Recordatorios automáticos</li>
              <li><CheckIcon /> Cancelación en cualquier momento</li>
            </ul>
            <a href="mailto:book@drylus.com?subject=Quiero%20el%20plan%20mensual" className="plan-btn plan-btn-outline">
              Consultar
            </a>
          </div>

          {/* Plan anual */}
          <div className="plan-card plan-card-featured">
            <div className="plan-badge">Ahorrás {saving}%</div>
            <div className="plan-label">Anual</div>
            <div className="plan-price">
              <span className="plan-currency">$</span>
              <span className="plan-amount">{formatARS(String(annualMonth))}</span>
            </div>
            <div className="plan-period">por mes · facturado anualmente</div>
            <div className="plan-total">Total: ${formatARS(ANNUAL_PRICE)} / año</div>
            <ul className="plan-features">
              <li><CheckIcon /> Todo lo del plan mensual</li>
              <li><CheckIcon /> 2 meses gratis incluidos</li>
              <li><CheckIcon /> Soporte prioritario</li>
              <li><CheckIcon /> Acceso anticipado a nuevas funciones</li>
              <li><CheckIcon /> Factura a nombre de tu empresa</li>
            </ul>
            <a href="mailto:book@drylus.com?subject=Quiero%20el%20plan%20anual" className="plan-btn plan-btn-solid">
              Consultar
            </a>
          </div>
        </div>

        <p className="modal-footer-note">
          Los precios están expresados en pesos argentinos (ARS) e incluyen IVA.
        </p>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" style={{ flexShrink: 0, marginTop: 1 }}>
      <path d="M2 10l5 5 11-11"/>
    </svg>
  );
}

function LoginForm() {
  const router  = useRouter();
  const params  = useSearchParams();
  const [email,        setEmail]        = useState("");
  const [pass,         setPass]         = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [showPass,     setShowPass]     = useState(false);
  const [notVerified,  setNotVerified]  = useState(false);
  const [resending,    setResending]    = useState(false);
  const [resent,       setResent]       = useState(false);
  const [activePhoto,  setActivePhoto]  = useState(0);
  const [showPricing,  setShowPricing]  = useState(false);

  useEffect(() => {
    const t = setInterval(() => setActivePhoto(p => (p + 1) % PHOTOS.length), 3500);
    return () => clearInterval(t);
  }, []);

  // Close modal on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setShowPricing(false); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const verified = params.get("verified") === "1";
  const errParam = params.get("error");
  const errorMessages: Record<string, string> = {
    invalid_credentials:   "Email o contraseña incorrectos.",
    email_not_verified:    "Verificá tu email antes de ingresar. Revisá tu bandeja.",
    token_expired:         "El link de verificación expiró. Registrate de nuevo.",
    invalid_token:         "Link inválido.",
    OAuthAccountNotLinked: "Este email ya está registrado con otro método.",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setNotVerified(false);
    const res = await signIn("credentials", { email, password: pass, redirect: false });
    if (res?.error) {
      const code = res.code ?? "";
      setError(errorMessages[code] ?? "Error al ingresar. Intentá de nuevo.");
      if (code === "email_not_verified") setNotVerified(true);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }

        /* ── LAYOUT ── */
        .lw { display: flex; min-height: 100vh; }

        /* ── LEFT PANEL ── */
        .lw-left {
          flex: 1; position: relative; overflow: hidden;
          display: flex; flex-direction: column; min-width: 0;
        }
        .lw-bg-photo { position: absolute; inset: 0; transition: opacity 1.1s ease; }
        .lw-bg-photo.active   { opacity: 1; }
        .lw-bg-photo.inactive { opacity: 0; }
        .lw-overlay {
          position: absolute; inset: 0; z-index: 1;
          background: linear-gradient(
            180deg,
            rgba(10,25,70,.30)  0%,
            rgba(10,25,70,.18) 30%,
            rgba(8,20,60,.72)  68%,
            rgba(5,12,45,.95) 100%
          );
        }
        .lw-left-content {
          position: relative; z-index: 2;
          display: flex; flex-direction: column;
          height: 100%; padding: 36px 40px 44px;
        }
        .lw-left-logo { margin-bottom: auto; }
        .lw-tagline { margin-bottom: 28px; }
        .lw-tagline h2 {
          color: white; font-size: 34px; font-weight: 800;
          line-height: 1.2; text-shadow: 0 2px 24px rgba(0,0,0,.5); letter-spacing: -.5px;
        }
        .lw-tagline p { color: rgba(255,255,255,.72); font-size: 15px; margin-top: 10px; font-weight: 500; }

        /* Features 2×2 */
        .lw-feat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 28px; }
        .lw-feat-card {
          background: rgba(255,255,255,.12); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,.22); border-radius: 16px;
          padding: 14px 14px 12px; display: flex; align-items: center; gap: 12px;
          transition: background .2s, border-color .2s;
        }
        .lw-feat-card:hover { background: rgba(255,255,255,.20); border-color: rgba(255,255,255,.38); }
        .lw-feat-img {
          width: 40px; height: 40px; flex-shrink: 0; border-radius: 12px;
          background: rgba(255,255,255,.18); display: flex; align-items: center; justify-content: center; padding: 6px;
        }
        .lw-feat-body h4 { color: white; font-size: 12px; font-weight: 700; line-height: 1.3; }
        .lw-feat-body p  { color: rgba(255,255,255,.65); font-size: 10.5px; font-weight: 500; margin-top: 2px; line-height: 1.4; }

        /* Thumbnails + dots */
        .lw-thumbs { display: flex; gap: 10px; align-items: flex-end; }
        .lw-thumb {
          border-radius: 12px; overflow: hidden; border: 2px solid rgba(255,255,255,.35);
          cursor: pointer; transition: all .25s; flex-shrink: 0;
        }
        .lw-thumb.active-thumb { border-color: white; box-shadow: 0 6px 20px rgba(0,0,0,.45); transform: scale(1.08) translateY(-4px); }
        .lw-dots { display: flex; gap: 7px; margin-top: 14px; }
        .lw-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,.35); transition: all .3s; cursor: pointer; }
        .lw-dot.active-dot { background: white; width: 22px; border-radius: 4px; }

        /* ── RIGHT PANEL ── */
        .lw-right {
          width: 440px; min-width: 340px; background: white;
          display: flex; flex-direction: column;
          padding: 0; overflow-y: auto;
          box-shadow: -8px 0 40px rgba(0,0,20,.10);
        }

        /* Top nav bar */
        .lw-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 24px 44px 0;
        }
        .lw-topbar-links { display: flex; gap: 6px; }
        .lw-topbar-link {
          font-size: 13px; font-weight: 600; color: #64748b;
          text-decoration: none; padding: 6px 12px; border-radius: 8px;
          transition: color .15s, background .15s; cursor: pointer; background: none; border: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .lw-topbar-link:hover { color: #2563eb; background: #f0f5ff; }
        .lw-topbar-link.register {
          color: white; background: #2563eb;
          padding: 7px 14px; border-radius: 9px;
        }
        .lw-topbar-link.register:hover { background: #1d4ed8; color: white; }

        /* Form area */
        .lw-form-area {
          flex: 1; display: flex; flex-direction: column;
          justify-content: center; padding: 32px 44px 0;
        }

        .lw-heading { margin-bottom: 28px; }
        .lw-heading h1 { font-size: 28px; font-weight: 800; color: #0f1729; letter-spacing: -.5px; }
        .lw-heading p  { color: #94a3b8; font-size: 14px; margin-top: 6px; font-weight: 500; }

        /* Inputs */
        .lw-field { margin-bottom: 16px; }
        .lw-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: #94a3b8; margin-bottom: 7px; }
        .lw-input {
          width: 100%; padding: 13px 16px; border: 1.5px solid #e0e8ff; border-radius: 12px;
          font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; color: #0f1729;
          background: #f4f7ff; outline: none;
          transition: border-color .15s, background .15s, box-shadow .15s;
        }
        .lw-input:focus { border-color: #2563eb; background: white; box-shadow: 0 0 0 4px rgba(37,99,235,.08); }
        .lw-pass-wrap { position: relative; }
        .lw-pass-wrap .lw-input { padding-right: 48px; }
        .lw-pass-toggle {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #94a3b8; display: flex; padding: 4px;
        }
        .lw-pass-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; }
        .lw-forgot { font-size: 12px; color: #2563eb; text-decoration: none; font-weight: 600; }
        .lw-forgot:hover { text-decoration: underline; }

        /* Button */
        .lw-btn {
          width: 100%; margin-top: 8px; padding: 14px; border-radius: 12px; border: none;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white;
          font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 15px;
          cursor: pointer; min-height: 52px; display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: opacity .15s, transform .1s, box-shadow .15s;
          box-shadow: 0 4px 18px rgba(37,99,235,.35);
        }
        .lw-btn:hover:not(:disabled) { opacity: .92; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(37,99,235,.45); }
        .lw-btn:active:not(:disabled) { transform: translateY(0); }
        .lw-btn:disabled { opacity: .7; cursor: not-allowed; }

        /* Alerts */
        .lw-alert { padding: 11px 14px; border-radius: 11px; font-size: 13px; margin-bottom: 16px; display: flex; align-items: flex-start; gap: 8px; font-weight: 500; }
        .lw-alert.success { background: rgba(34,197,94,.08); border: 1px solid rgba(34,197,94,.2); color: #16a34a; }
        .lw-alert.error   { background: rgba(239,68,68,.06);  border: 1px solid rgba(239,68,68,.18); color: #dc2626; }

        /* Register */
        .lw-register { text-align: center; font-size: 14px; color: #4a5568; margin-top: 20px; }
        .lw-register a { color: #2563eb; font-weight: 700; text-decoration: none; }
        .lw-register a:hover { text-decoration: underline; }

        /* Footer */
        .lw-footer { padding: 24px 44px 28px; text-align: center; }
        .lw-footer p { font-size: 12px; color: #cbd5e1; font-weight: 500; }

        /* Animations */
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp .45s ease both; }

        /* ══════════════════════════════════
           PRICING MODAL
        ══════════════════════════════════ */
        .modal-backdrop {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(10,20,60,.55);
          backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: fadeIn .2s ease;
        }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .modal-box {
          background: white; border-radius: 24px;
          padding: 36px 32px 28px;
          width: 100%; max-width: 640px;
          position: relative;
          box-shadow: 0 24px 80px rgba(0,20,80,.25);
          animation: slideUp .25s ease;
          max-height: 90vh; overflow-y: auto;
        }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .modal-close {
          position: absolute; top: 18px; right: 18px;
          background: #f1f5f9; border: none; cursor: pointer;
          width: 34px; height: 34px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #64748b; transition: background .15s;
        }
        .modal-close:hover { background: #e2e8f0; }
        .modal-header { text-align: center; margin-bottom: 28px; }
        .modal-header h2 { font-size: 22px; font-weight: 800; color: #0f1729; margin-top: 14px; letter-spacing: -.3px; }
        .modal-header p  { color: #94a3b8; font-size: 14px; margin-top: 5px; font-weight: 500; }

        .modal-plans { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

        .plan-card {
          border: 1.5px solid #e8eeff; border-radius: 18px;
          padding: 24px 20px 20px; display: flex; flex-direction: column;
          position: relative; transition: border-color .2s;
        }
        .plan-card:hover { border-color: #bdd0ff; }
        .plan-card-featured {
          border-color: #2563eb;
          background: linear-gradient(160deg, #f0f5ff 0%, #e8eeff 100%);
        }
        .plan-card-featured:hover { border-color: #1d4ed8; }

        .plan-badge {
          position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white; font-size: 11px; font-weight: 700;
          padding: 4px 14px; border-radius: 20px;
          white-space: nowrap; letter-spacing: .2px;
        }
        .plan-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: #94a3b8; margin-bottom: 10px; }
        .plan-price { display: flex; align-items: flex-start; gap: 2px; margin-bottom: 2px; }
        .plan-currency { font-size: 20px; font-weight: 700; color: #0f1729; margin-top: 6px; }
        .plan-amount  { font-size: 44px; font-weight: 800; color: #0f1729; line-height: 1; letter-spacing: -2px; }
        .plan-period  { font-size: 12px; color: #94a3b8; font-weight: 500; margin-bottom: 4px; }
        .plan-total   { font-size: 12px; color: #2563eb; font-weight: 700; margin-bottom: 16px; }
        .plan-features {
          list-style: none; display: flex; flex-direction: column; gap: 8px;
          margin-bottom: 20px; margin-top: 12px; flex: 1;
        }
        .plan-features li {
          display: flex; align-items: flex-start; gap: 8px;
          font-size: 13px; color: #334155; font-weight: 500;
        }
        .plan-features li svg { color: #2563eb; }
        .plan-btn {
          display: block; text-align: center; padding: 12px;
          border-radius: 11px; font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px; font-weight: 700; text-decoration: none;
          transition: opacity .15s, transform .1s;
        }
        .plan-btn:hover { opacity: .88; transform: translateY(-1px); }
        .plan-btn-outline {
          border: 1.5px solid #e0e8ff; color: #2563eb; background: white;
        }
        .plan-btn-outline:hover { background: #f0f5ff; }
        .plan-btn-solid {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white; border: none;
          box-shadow: 0 4px 14px rgba(37,99,235,.35);
        }
        .modal-footer-note {
          text-align: center; font-size: 11.5px; color: #94a3b8;
          font-weight: 500; margin-top: 20px;
        }

        /* ── MOBILE ── */
        @media (max-width: 768px) {
          .lw { flex-direction: column; }

          /* Left panel: foto + features visible en mobile también, pero SIN los iconos de features */
          .lw-left { min-height: 42vh; max-height: 46vh; }
          .lw-left-content { padding: 22px 18px 20px; }
          .lw-left-logo { margin-bottom: 12px; }
          .lw-tagline h2 { font-size: 21px; }
          .lw-tagline p  { font-size: 13px; margin-top: 5px; }
          .lw-tagline { margin-bottom: 0; }

          /* Ocultar features e thumbnails en mobile */
          .lw-feat-grid { display: none; }
          .lw-thumbs    { display: none; }
          .lw-dots      { display: none; }

          /* Right panel: card que sube sobre la foto */
          .lw-right {
            width: 100%; min-width: 0;
            border-radius: 24px 24px 0 0;
            margin-top: -22px; position: relative; z-index: 10;
            box-shadow: 0 -6px 30px rgba(0,20,80,.12);
            flex: 1;
          }
          .lw-topbar { padding: 22px 22px 0; }
          .lw-topbar-link { font-size: 12px; padding: 5px 10px; }
          .lw-form-area { padding: 24px 22px 0; }
          .lw-footer { padding: 20px 22px 36px; }
          .lw-heading h1 { font-size: 23px; }

          /* Modal en mobile */
          .modal-plans { grid-template-columns: 1fr; }
          .modal-box { padding: 28px 20px 24px; border-radius: 20px; }
          .plan-card-featured { margin-top: 14px; }
        }
      `}</style>

      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}

      <div className="lw">

        {/* ── PANEL IZQUIERDO ── */}
        <div className="lw-left">
          {PHOTOS.map((p, i) => (
            <div key={i} className={`lw-bg-photo ${i === activePhoto ? "active" : "inactive"}`}>
              <Image src={p.src} alt={p.alt} fill
                sizes="(max-width:768px) 100vw, 60vw"
                style={{ objectFit: "cover", objectPosition: "center top" }}
                priority={i === 0} />
            </div>
          ))}
          <div className="lw-overlay" />

          <div className="lw-left-content">
            <div className="lw-left-logo">
              <Image src="/images/logo.png" alt="Book Drylus" width={140} height={56}
                style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }} priority />
            </div>

            <div className="lw-tagline">
              <h2>Gestiona tus Reservas<br />con Facilidad y<br />Ventajas Exclusivas</h2>
              <p>La plataforma que profesionales eligen para crecer</p>
            </div>

            <div className="lw-feat-grid">
              {FEATURES.map((f, i) => (
                <div key={i} className="lw-feat-card">
                  <div className="lw-feat-img">
                    <Image src={f.icon} alt={f.title} width={28} height={28} style={{ objectFit: "contain" }} />
                  </div>
                  <div className="lw-feat-body">
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="lw-thumbs">
              {PHOTOS.map((p, i) => (
                <div key={i}
                  className={`lw-thumb ${i === activePhoto ? "active-thumb" : ""}`}
                  onClick={() => setActivePhoto(i)}
                  style={{ width: i === activePhoto ? 80 : 60, height: i === activePhoto ? 80 : 60 }}>
                  <Image src={p.src} alt={p.alt} width={80} height={80}
                    style={{ objectFit: "cover", width: "100%", height: "100%", display: "block" }} />
                </div>
              ))}
            </div>
            <div className="lw-dots">
              {PHOTOS.map((_, i) => (
                <div key={i}
                  className={`lw-dot ${i === activePhoto ? "active-dot" : ""}`}
                  onClick={() => setActivePhoto(i)} />
              ))}
            </div>
          </div>
        </div>

        {/* ── PANEL DERECHO: solo login ── */}
        <div className="lw-right">

          {/* Top nav */}
          <div className="lw-topbar">
            <Image src="/images/logo.png" alt="Book Drylus" width={130} height={52}
              style={{ objectFit: "contain" }} priority />
            <div className="lw-topbar-links">
              <a href="mailto:book@drylus.com" className="lw-topbar-link">Soporte</a>
              <button className="lw-topbar-link" onClick={() => setShowPricing(true)}>Precios</button>
              
            </div>
          </div>

          {/* Form */}
          <div className="lw-form-area fade-up">
            <div className="lw-heading">
              <h1>Bienvenido de vuelta</h1>
              <p>Ingresá con tu email y contraseña</p>
            </div>

            {verified && (
              <div className="lw-alert success">
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M2 10l5 5 11-11"/></svg>
                Email verificado. Ya podés ingresar.
              </div>
            )}
            {errParam && (
              <div className="lw-alert error">{errorMessages[errParam] ?? "Ocurrió un error."}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="lw-field">
                <label className="lw-label">Email</label>
                <input className="lw-input" type="email" placeholder="tu@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
              </div>

              <div className="lw-field">
                <div className="lw-pass-header">
                  <label className="lw-label" style={{ marginBottom: 0 }}>Contraseña</label>
                  <Link href="/forgot-password" className="lw-forgot">¿Olvidaste la clave?</Link>
                </div>
                <div className="lw-pass-wrap" style={{ marginTop: 6 }}>
                  <input className="lw-input" type={showPass ? "text" : "password"} placeholder="••••••••"
                    value={pass} onChange={e => setPass(e.target.value)} required autoComplete="current-password" />
                  <button type="button" className="lw-pass-toggle" onClick={() => setShowPass(s => !s)}>
                    {showPass
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              {error && (
                <div className="lw-alert error" style={{ marginBottom: 14 }}>
                  {error}
                  {notVerified && (
                    <div style={{ marginTop: 8 }}>
                      {resent
                        ? <span style={{ color: "#16a34a", fontWeight: 600 }}>✅ Email reenviado.</span>
                        : <button type="button" disabled={resending}
                            onClick={async () => {
                              setResending(true);
                              await fetch("/api/auth/resend-verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
                              setResending(false); setResent(true);
                            }}
                            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#2563eb", fontWeight: 700, fontSize: 13, fontFamily: "inherit", textDecoration: "underline" }}>
                            {resending ? "Enviando…" : "Reenviar email de verificación"}
                          </button>
                      }
                    </div>
                  )}
                </div>
              )}

              <button type="submit" className="lw-btn" disabled={loading}>
                {loading
                  ? <><svg style={{ animation: "spin 1s linear infinite" }} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Ingresando…</>
                  : "Ingresar →"
                }
              </button>
            </form>

            <p className="lw-register">
              ¿No tenés cuenta?{" "}
              <Link href="/register">Registrarse gratis</Link>
            </p>
          </div>

          <div className="lw-footer">
            <p>Book Drylus · Agenda tu cita en segundos</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
