# book.drylus

**Plataforma de agendamiento online para profesionales independientes.**  
Cada profesional obtiene su propia URL pública (`/book/su-slug`) donde sus pacientes pueden reservar turnos en tiempo real, con sincronización automática de Google Calendar y notificaciones por email.

---

## Índice

1. [Características](#características)
2. [Stack tecnológico](#stack-tecnológico)
3. [Arquitectura del proyecto](#arquitectura-del-proyecto)
4. [Requisitos previos](#requisitos-previos)
5. [Configuración de servicios externos](#configuración-de-servicios-externos)
   - [Google Cloud Console](#1-google-cloud-console-oauth--calendar)
   - [Turso (base de datos)](#2-turso-base-de-datos)
   - [Resend (emails)](#3-resend-emails)
6. [Instalación y desarrollo local](#instalación-y-desarrollo-local)
7. [Variables de entorno](#variables-de-entorno)
8. [Despliegue en Vercel](#despliegue-en-vercel)
9. [Estructura del proyecto](#estructura-del-proyecto)
10. [Rutas de la aplicación](#rutas-de-la-aplicación)
11. [API Reference](#api-reference)
12. [Lógica de membresías](#lógica-de-membresías)
13. [Flujo de reserva](#flujo-de-reserva)
14. [Personalización](#personalización)
15. [Troubleshooting](#troubleshooting)

---

## Características

### Para pacientes (público, sin cuenta)
- Reserva de turnos en menos de 2 minutos desde `/book/[slug]`
- Visualización de disponibilidad en tiempo real (cruzada con Google Calendar)
- Selección de servicio → fecha → horario → datos → confirmación
- Email de confirmación automático con link de cancelación
- Cancelación sin login desde `/cancel/[token]`

### Para profesionales
- Registro con **un click** usando Google OAuth
- **15 días de prueba gratuita** automática al registrarse
- Dashboard con turnos del día, métricas y calendario
- Gestión completa de servicios (hasta 10)
- Configuración de horarios semanales (Lun-Dom, con toggle por día)
- Sincronización automática con Google Calendar (OAuth con scope `calendar.events`)
- URL pública personalizada (`/book/su-nombre`)
- Perfil personalizable con colores, bio, especialidad y ubicación

### Para administradores
- Panel con métricas globales de la plataforma
- Gestión de membresías (activar, desactivar, extender trial)
- Vista de todos los profesionales con filtros
- El email en `ADMIN_EMAIL` recibe automáticamente rol `ADMIN` al primer login

---

## Stack tecnológico

| Capa | Tecnología | Plan gratuito |
|------|-----------|---------------|
| Framework | **Next.js 14** (App Router) | — |
| Hosting | **Vercel** | Hobby (gratis) |
| Base de datos | **Turso** (LibSQL / SQLite distribuido) | 500 DBs, 1 GB storage |
| ORM | **Prisma** con adapter LibSQL | — |
| Autenticación | **NextAuth v5** + Google OAuth | — |
| Email | **Resend** (primario) + Nodemailer/Gmail (fallback) | 3.000/mes gratis |
| Estilos | **Tailwind CSS** + CSS custom | — |
| Fuentes | Google Fonts (Outfit + Syne) | — |
| Calendario | **Google Calendar API** | Incluido en OAuth |
| Validación | **Zod** | — |
| Fechas | **date-fns** + **date-fns-tz** | — |

**Costo total de infraestructura: $0/mes** en los tiers gratuitos.

---

## Arquitectura del proyecto

```
Paciente → /book/[slug]
               │
               ▼
    GET /api/availability    ← cruza horarios DB + Google Calendar
               │
               ▼
    POST /api/bookings       ← anti-race-condition check
               │
       ┌───────┴───────┐
       ▼               ▼
  Email paciente   Email profesional
  GCal event create
       │
       ▼
  /cancel/[token]  ← cancelación sin login
```

**Anti race-condition:** antes de crear la reserva, se hace un segundo `SELECT` de conflictos usando `startTime < endEnd AND endTime > startStart`. Si hay colisión, devuelve 409.

**Degradación elegante:** si Google Calendar falla (token expirado, API caída), los slots se calculan solo con los datos de la DB. Nunca se bloquea la reserva por un fallo de GCal.

**Tokens de Google:** se persistem en la DB. Se refrescan automáticamente si expiran en menos de 5 minutos.

---

## Requisitos previos

- **Node.js** ≥ 18.17
- **npm** ≥ 9
- Cuenta en [Google Cloud Console](https://console.cloud.google.com)
- Cuenta en [Turso](https://turso.tech) (gratis)
- Cuenta en [Resend](https://resend.com) (gratis) o cuenta de Gmail
- Cuenta en [Vercel](https://vercel.com) (gratis)

---

## Configuración de servicios externos

### 1. Google Cloud Console (OAuth + Calendar)

> Tiempo estimado: 10 minutos

**a. Crear proyecto**

1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear nuevo proyecto → dale un nombre (ej: `book-drylus`)

**b. Habilitar APIs**

En el menú lateral → "APIs y servicios" → "Biblioteca":
- Buscar y habilitar **Google Calendar API**
- Buscar y habilitar **Google+ API** (o "Google People API")

**c. Crear credenciales OAuth 2.0**

1. APIs y servicios → **Credenciales** → "Crear credenciales" → "ID de cliente OAuth"
2. Tipo de aplicación: **Aplicación web**
3. Nombre: `book.drylus` (o el que quieras)
4. **URIs de redireccionamiento autorizados** — agregar:
   ```
   http://localhost:3000/api/auth/callback/google
   https://TU-DOMINIO.vercel.app/api/auth/callback/google
   ```
   > ⚠️ Reemplazá `TU-DOMINIO.vercel.app` por tu URL real de Vercel (la obtenés después del primer deploy)

5. Guardar → copiar **Client ID** y **Client Secret**

**d. Configurar pantalla de consentimiento OAuth**

1. APIs y servicios → **Pantalla de consentimiento OAuth**
2. Tipo de usuario: **Externo**
3. Completar: nombre de la app, email de soporte, logo (opcional)
4. Scopes → "Agregar o quitar scopes" → agregar:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/calendar.readonly`
5. Usuarios de prueba → agregar los emails que usarás durante el desarrollo
6. Estado: puede quedar en "Testing" para desarrollo; para producción pasar a "In production"

> 💡 **Nota:** mientras la app esté en "Testing", solo los usuarios de prueba pueden loguearse. Para producción, solicitá verificación de Google (proceso de 1-7 días) o dejá la pantalla de consentimiento en externo/producción sin verificar (con el warning de Google).

---

### 2. Turso (base de datos)

> Tiempo estimado: 5 minutos

**a. Instalar CLI de Turso**

```bash
# macOS / Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Windows (PowerShell)
scoop install turso
```

**b. Login y crear base de datos**

```bash
turso auth login

# Crear DB (elegí la región más cercana a tus usuarios)
turso db create book-drylus --location gru  # gru = São Paulo (recomendado para Argentina)

# Obtener URL de conexión
turso db show book-drylus --url
# Output: libsql://book-drylus-[usuario].turso.io

# Crear token de autenticación
turso db tokens create book-drylus
# Output: eyJ...  (guardalo, no se muestra de nuevo)
```

**c. Verificar la conexión**

```bash
turso db shell book-drylus
# Si se abre un prompt SQL, todo está bien
# .quit para salir
```

> 💡 **Regiones disponibles:** `gru` (São Paulo), `iad` (Virginia), `cdg` (París), `nrt` (Tokio). Elegí la más cercana a tus usuarios para minimizar latencia.

---

### 3. Resend (emails)

> Tiempo estimado: 5 minutos

1. Registrarse en [resend.com](https://resend.com)
2. Dashboard → **API Keys** → "Create API Key"
3. Nombre: `book-drylus-production`
4. Permisos: Full Access
5. Copiar la clave (`re_...`)
6. (Opcional pero recomendado) Agregar tu dominio en **Domains** para enviar desde `tu@tudominio.com` en vez de `onboarding@resend.dev`

**Alternativa sin dominio propio — Gmail SMTP:**

Si no tenés dominio, podés usar Gmail como fallback:
1. En tu cuenta Google → Seguridad → Contraseñas de aplicaciones
2. Generar contraseña para "Correo" / "Otra"
3. Usar esa contraseña en `GMAIL_APP_PASSWORD` (NO tu contraseña normal)

> ⚠️ La configuración de Resend tiene prioridad. El fallback de Gmail solo se usa si `RESEND_API_KEY` no está definida.

---

## Instalación y desarrollo local

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/book-drylus.git
cd book-drylus

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores (ver sección siguiente)

# 4. Inicializar la base de datos local
npm run db:push

# 5. (Opcional) Cargar datos de ejemplo
npm run db:seed

# 6. Iniciar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

**Rutas para probar localmente:**
- `http://localhost:3000/login` → Login con Google
- `http://localhost:3000/book/dra-castillo` → Agenda pública (después del seed)
- `http://localhost:3000/dashboard` → Panel profesional (requiere login)
- `http://localhost:3000/admin` → Panel admin (requiere login con email admin)

---

## Variables de entorno

Crear `.env.local` en la raíz del proyecto:

```env
# ── NEXTAUTH ──────────────────────────────────────────────────
NEXTAUTH_URL="http://localhost:3000"
# Generar con: openssl rand -base64 32
NEXTAUTH_SECRET="tu-secreto-muy-largo-aqui"

# ── GOOGLE OAUTH ──────────────────────────────────────────────
GOOGLE_CLIENT_ID="123456789-abc.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."

# ── TURSO ─────────────────────────────────────────────────────
TURSO_DATABASE_URL="libsql://book-drylus-tuusuario.turso.io"
TURSO_AUTH_TOKEN="eyJ..."

# Solo para desarrollo local (Prisma CLI)
DATABASE_URL="file:./dev.db"

# ── EMAIL (elegí uno) ─────────────────────────────────────────
# Opción A — Resend (recomendado)
RESEND_API_KEY="re_..."
EMAIL_FROM="book.drylus <noreply@tudominio.com>"

# Opción B — Gmail SMTP (fallback)
# GMAIL_USER="tu@gmail.com"
# GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"

# ── ADMIN ─────────────────────────────────────────────────────
ADMIN_EMAIL="tu@gmail.com"

# ── APP ───────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="book.drylus"
```

### Variables requeridas en producción

En Vercel, cambiar:

```env
NEXTAUTH_URL="https://tu-app.vercel.app"
NEXT_PUBLIC_APP_URL="https://tu-app.vercel.app"
DATABASE_URL=""   # Dejar vacío — en producción usa Turso directamente
```

> 💡 En producción, `DATABASE_URL` puede omitirse o dejarse vacía porque el código detecta `NODE_ENV=production` y usa Turso vía `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`.

---

## Despliegue en Vercel

### Opción A — Desde la CLI (recomendado)

```bash
# Instalar CLI de Vercel
npm i -g vercel

# Login
vercel login

# Deploy desde la raíz del proyecto
vercel

# Cuando pregunte por configuración:
# - Framework: Next.js (auto-detectado)
# - Build Command: npm run build  (ya configurado en package.json)
# - Output Directory: .next (por defecto)
```

### Opción B — Desde GitHub

1. Subir el proyecto a GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/tu-usuario/book-drylus.git
   git push -u origin main
   ```

2. En [vercel.com](https://vercel.com):
   - "New Project" → "Import Git Repository"
   - Seleccionar el repo → "Deploy"

### Configurar variables de entorno en Vercel

En el dashboard de Vercel → tu proyecto → **Settings** → **Environment Variables**:

| Variable | Valor |
|----------|-------|
| `NEXTAUTH_URL` | `https://tu-app.vercel.app` |
| `NEXTAUTH_SECRET` | (generar con `openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | Del paso anterior |
| `GOOGLE_CLIENT_SECRET` | Del paso anterior |
| `TURSO_DATABASE_URL` | `libsql://book-drylus-...turso.io` |
| `TURSO_AUTH_TOKEN` | Token de Turso |
| `RESEND_API_KEY` | `re_...` |
| `EMAIL_FROM` | `book.drylus <noreply@tudominio.com>` |
| `ADMIN_EMAIL` | Tu email de admin |
| `NEXT_PUBLIC_APP_URL` | `https://tu-app.vercel.app` |
| `NEXT_PUBLIC_APP_NAME` | `book.drylus` |
| `DATABASE_URL` | Dejar en blanco o `""` |

### Inicializar la DB en producción

Después del primer deploy:

```bash
# Opción A — Con Turso CLI
turso db shell book-drylus < schema.sql
# (prisma generate crea el SQL automáticamente con `npx prisma migrate diff`)

# Opción B — Forzar push via Prisma con URL de producción
TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." DATABASE_URL="libsql://..." npx prisma db push
```

> 💡 La manera más sencilla: en tu `.env.local`, temporalmente cambiar `DATABASE_URL` a la URL de Turso y ejecutar `npm run db:push`.

### Actualizar redirect URIs en Google Console

Después del primer deploy, agregar la URL de Vercel:

1. Google Cloud Console → Credenciales → tu OAuth client
2. Agregar URI: `https://TU-APP.vercel.app/api/auth/callback/google`

---

## Estructura del proyecto

```
book-drylus/
├── prisma/
│   ├── schema.prisma          # Schema de la DB (7 modelos)
│   └── seed.ts                # Datos iniciales de prueba
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx   # Página de login con Google
│   │   │
│   │   ├── (public)/
│   │   │   └── book/[slug]/
│   │   │       └── page.tsx   # Agenda pública del profesional
│   │   │
│   │   ├── (dashboard)/
│   │   │   └── dashboard/
│   │   │       ├── layout.tsx        # Sidebar + auth guard
│   │   │       ├── page.tsx          # Overview con KPIs
│   │   │       ├── bookings/page.tsx # Lista de reservas
│   │   │       ├── services/page.tsx # Gestión de servicios
│   │   │       ├── availability/page.tsx # Horarios semanales
│   │   │       └── settings/page.tsx # Perfil del profesional
│   │   │
│   │   ├── (admin)/
│   │   │   └── admin/
│   │   │       ├── layout.tsx              # Auth guard admin
│   │   │       ├── page.tsx                # Overview de plataforma
│   │   │       └── professionals/page.tsx  # Gestión de profesionales
│   │   │
│   │   ├── cancel/[token]/
│   │   │   └── page.tsx       # Cancelación sin login
│   │   │
│   │   ├── api/
│   │   │   ├── auth/nextauth/route.ts  # Handler de NextAuth
│   │   │   ├── availability/route.ts  # GET slots, PUT horarios
│   │   │   ├── bookings/
│   │   │   │   ├── route.ts           # POST crear, GET listar
│   │   │   │   └── [id]/route.ts      # PATCH actualizar estado
│   │   │   ├── services/route.ts      # CRUD servicios
│   │   │   ├── cancel/route.ts        # POST cancelar por token
│   │   │   ├── user/route.ts          # GET/PATCH perfil
│   │   │   └── admin/
│   │   │       ├── route.ts                # GET stats plataforma
│   │   │       └── membership/route.ts     # PATCH membresía
│   │   │
│   │   ├── layout.tsx         # Root layout (fuentes, metadata)
│   │   ├── globals.css        # Design tokens + Tailwind
│   │   ├── page.tsx           # Redirect a /dashboard o /login
│   │   └── not-found.tsx      # Página 404
│   │
│   ├── components/
│   │   ├── booking/
│   │   │   ├── BookingClient.tsx  # UI completa de reserva (client)
│   │   │   └── CancelClient.tsx  # UI de cancelación (client)
│   │   ├── dashboard/
│   │   │   ├── Sidebar.tsx           # Sidebar del profesional
│   │   │   ├── BookingsClient.tsx    # Tabla de reservas
│   │   │   ├── ServicesClient.tsx    # Gestión servicios con modal
│   │   │   ├── AvailabilityClient.tsx # Editor de horarios
│   │   │   └── SettingsClient.tsx    # Editor de perfil
│   │   └── admin/
│   │       ├── AdminSidebar.tsx
│   │       └── AdminProfessionalsClient.tsx
│   │
│   ├── lib/
│   │   ├── auth.ts              # NextAuth config, callbacks, events
│   │   ├── db.ts                # Prisma client singleton (Turso)
│   │   ├── google-calendar.ts   # GCal: slots, crear/borrar eventos
│   │   ├── email.ts             # Resend + fallback Nodemailer
│   │   ├── membership.ts        # Lógica trial, validaciones
│   │   └── utils.ts             # Helpers de fecha, cn()
│   │
│   ├── types/
│   │   └── next-auth.d.ts       # Extensión de tipos de sesión
│   │
│   └── middleware.ts            # Protección de rutas
│
├── .env.example                 # Template de variables
├── .gitignore
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Rutas de la aplicación

### Públicas (sin autenticación)

| Ruta | Descripción |
|------|-------------|
| `/book/[slug]` | Agenda pública del profesional |
| `/cancel/[token]` | Cancelación de reserva por token |
| `/login` | Login con Google OAuth |

### Profesional (requiere login)

| Ruta | Descripción |
|------|-------------|
| `/dashboard` | KPIs y turnos del día |
| `/dashboard/bookings` | Listado completo con filtros |
| `/dashboard/services` | Crear/editar/eliminar servicios |
| `/dashboard/availability` | Configurar horarios semanales |
| `/dashboard/settings` | Perfil público y personalización |

### Administrador (requiere rol ADMIN)

| Ruta | Descripción |
|------|-------------|
| `/admin` | Métricas globales de la plataforma |
| `/admin/professionals` | Gestión de profesionales y membresías |

---

## API Reference

### Público

#### `GET /api/availability`
Obtiene los slots disponibles para una fecha.

**Query params:**
```
slug=dra-castillo
serviceId=clj123...
date=2026-03-15
```

**Response:**
```json
{
  "slots": [
    { "start": "2026-03-15T12:00:00.000Z", "end": "2026-03-15T12:30:00.000Z" },
    { "start": "2026-03-15T13:00:00.000Z", "end": "2026-03-15T13:30:00.000Z" }
  ]
}
```

#### `POST /api/bookings`
Crea una nueva reserva.

**Body:**
```json
{
  "professionalSlug": "dra-castillo",
  "serviceId": "clj123abc",
  "startTime": "2026-03-15T12:00:00.000Z",
  "clientName": "Juan García",
  "clientEmail": "juan@email.com",
  "clientPhone": "11 4567-8901",
  "clientNotes": "Primera consulta"
}
```

**Response 201:**
```json
{
  "success": true,
  "booking": {
    "id": "cljabc...",
    "startTime": "2026-03-15T12:00:00.000Z",
    "endTime": "2026-03-15T12:30:00.000Z",
    "cancelToken": "xyz..."
  }
}
```

**Error 409:** Conflicto de horario (race condition detectada)

#### `POST /api/cancel`
Cancela una reserva por token.

**Body:**
```json
{ "token": "xyz..." }
```

### Profesional (requiere sesión)

#### `GET /api/bookings`
Lista las reservas del profesional.

**Query params opcionales:**
```
status=CONFIRMED
from=2026-03-01
to=2026-03-31
page=1
limit=20
```

#### `PATCH /api/bookings/[id]`
Actualiza el estado de una reserva.

**Body:**
```json
{ "status": "COMPLETED" }
```

Valores: `CONFIRMED` | `CANCELLED` | `COMPLETED` | `NO_SHOW`

#### `POST /api/services`
Crea un nuevo servicio.

#### `PUT /api/services`
Actualiza un servicio existente (requiere `id` en el body).

#### `DELETE /api/services?id=...`
Elimina un servicio (o lo desactiva si tiene reservas futuras).

#### `PUT /api/availability`
Guarda la configuración de horarios.

**Body:**
```json
{
  "schedule": [
    { "dayOfWeek": 1, "startTime": "09:00", "endTime": "18:00", "isActive": true },
    { "dayOfWeek": 2, "startTime": "09:00", "endTime": "18:00", "isActive": true }
  ]
}
```

#### `PATCH /api/user`
Actualiza el perfil del profesional.

### Admin (requiere rol ADMIN)

#### `PATCH /api/admin/membership`
Gestiona la membresía de un profesional.

**Body — Cambiar estado:**
```json
{ "userId": "clj...", "status": "ACTIVE" }
```

**Body — Extender trial:**
```json
{ "userId": "clj...", "extendTrialDays": 7 }
```

---

## Lógica de membresías

```
Registro → FREE_TRIAL (15 días)
               │
         ┌─────┴─────┐
         │           │
      Activa      Vence
         │           │
       ACTIVE     EXPIRED
         │
      Cancela
         │
     CANCELLED
```

### Comportamiento por estado

| Estado | Agenda pública | Recibe reservas | Email de turnos |
|--------|---------------|-----------------|-----------------|
| `FREE_TRIAL` | ✅ Visible | ✅ Sí | ✅ Sí |
| `ACTIVE` | ✅ Visible | ✅ Sí | ✅ Sí |
| `EXPIRED` | ❌ Muestra mensaje | ❌ No | ❌ No |
| `CANCELLED` | ❌ Muestra mensaje | ❌ No | ❌ No |

La verificación ocurre:
1. En cada request a `GET /api/availability` (no muestra slots)
2. En `POST /api/bookings` (rechaza con 403)
3. En el callback de sesión de NextAuth (actualiza el estado en DB si el trial venció)

---

## Flujo de reserva

```
1. Paciente visita /book/dra-castillo
   └─ Server Component carga perfil + servicios desde DB

2. Paciente selecciona servicio (client-side)

3. Paciente selecciona día en el calendario
   └─ Fetch GET /api/availability?slug=&serviceId=&date=
      ├─ Verifica membresía activa
      ├─ Lee horario configurado del día
      ├─ Obtiene eventos de Google Calendar (getGCalEvents)
      ├─ Obtiene reservas confirmadas de DB
      └─ Devuelve slots libres (30 min de mínimo de anticipación)

4. Paciente selecciona slot → completa formulario

5. Paciente confirma → POST /api/bookings
   ├─ Valida membresía
   ├─ Verifica servicio activo
   ├─ Anti race-condition: SELECT conflictos
   ├─ Si hay conflicto → 409 "Este horario ya no está disponible"
   ├─ INSERT booking
   └─ En paralelo (sin bloquear respuesta):
       ├─ createGCalEvent (invitación al paciente + recordatorio)
       ├─ sendBookingConfirmationToClient (con link de cancelación)
       └─ sendNewBookingToProfessional (con link al dashboard)

6. Paciente recibe 201 → muestra modal de confirmación

7. Paciente recibe email con link /cancel/[token]
   └─ Al cancelar:
       ├─ UPDATE booking status = CANCELLED
       ├─ deleteGCalEvent
       └─ sendCancellationEmail al paciente
```

---

## Personalización

### Slug personalizado
El slug se genera automáticamente desde el email al registrarse. El profesional puede verlo en Settings y compartirlo como `book.tudominio.com/su-slug`.

### Colores
En `/dashboard/settings` → "Colores de tu agenda", los profesionales pueden cambiar `primaryColor` y `accentColor`. Estos colores se aplican en su página pública.

### Horarios de atención
En `/dashboard/availability`, configuración semanal completa. Los slots se generan en bloques de 30 minutos dentro del rango configurado. Los eventos de Google Calendar bloquean automáticamente los slots coincidentes.

### Google Calendar ID
Por defecto se usa el calendario primario del usuario. En Settings el profesional puede especificar el ID de un calendario secundario (ej: un calendario separado para consultas).

---

## Troubleshooting

### Error: "redirect_uri_mismatch" al hacer login

**Causa:** La URL de redirect en Google Console no coincide con la de la app.

**Solución:**
1. Ir a Google Cloud Console → Credenciales → tu OAuth client
2. Verificar que la URI exacta está en "URIs de redireccionamiento autorizados":
   - Desarrollo: `http://localhost:3000/api/auth/callback/google`
   - Producción: `https://TU-APP.vercel.app/api/auth/callback/google`

---

### Error: "PrismaClientInitializationError"

**Causa:** `DATABASE_URL` incorrecto o DB no inicializada.

**Solución en desarrollo:**
```bash
# Verificar que DATABASE_URL="file:./dev.db" en .env.local
npm run db:push
```

**Solución en producción:** Asegurarse de que `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` están correctamente configurados en Vercel.

---

### Error: "Cannot read properties of undefined (reading 'googleAccessToken')"

**Causa:** Usuario registrado antes de que se guardaran los tokens de GCal.

**Solución:** El usuario debe cerrar sesión y volver a iniciarla para re-autorizar con los scopes de Calendar. La app degradará elegantemente y calculará slots solo con datos de DB mientras tanto.

---

### Los emails no se envían

**Verificar en orden:**
1. ¿Está `RESEND_API_KEY` definida en las variables de entorno?
2. ¿El dominio en `EMAIL_FROM` está verificado en Resend?
3. ¿Los emails van a spam? (usar dominio propio con SPF/DKIM resuelve esto)
4. Si usás Gmail fallback: ¿es una "App Password" de 16 caracteres, no tu contraseña normal?

---

### Slots no aparecen aunque el día está habilitado

**Verificar:**
1. ¿Hay un evento de "día completo" en Google Calendar que bloquee el día?
2. ¿El servicio seleccionado está activo (`isActive: true`)?
3. ¿La membresía del profesional es `FREE_TRIAL` o `ACTIVE`?
4. ¿El día y horario está configurado en `/dashboard/availability`?
5. ¿La fecha es al menos 30 minutos en el futuro?

---

### Deploy falla en Vercel con error de Prisma

**Causa:** Prisma necesita generar el cliente antes del build.

**Verificar** que `package.json` tiene:
```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

También asegurarse de que `@prisma/client`, `@prisma/adapter-libsql` y `@libsql/client` están en `dependencies` (no en `devDependencies`).

---

## Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo en localhost:3000
npm run build        # Build de producción (prisma generate + next build)
npm run start        # Servidor de producción (requiere build previo)
npm run lint         # ESLint
npm run db:generate  # Regenerar cliente Prisma
npm run db:push      # Sincronizar schema con la DB (sin migrations)
npm run db:studio    # Abrir Prisma Studio (GUI para la DB)
npm run db:migrate   # Crear migration (para cambios de schema)
npm run db:seed      # Cargar datos de ejemplo
```

---

## Contribuir

1. Fork del repositorio
2. Crear rama: `git checkout -b feature/mi-feature`
3. Commit: `git commit -m 'feat: descripción'`
4. Push: `git push origin feature/mi-feature`
5. Abrir Pull Request

---

## Licencia

MIT — libre para uso personal y comercial.

---

*book.drylus — Tu turno, en 2 minutos.*
