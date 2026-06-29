# SUPERBOB — CLAUDE.md

Este archivo es la fuente de verdad para Claude Code.
Leélo completo antes de tocar cualquier archivo del repositorio.

---

## Qué es SUPERBOB

Plataforma que conecta clientes con profesionales de oficios (plomeros, electricistas, albañiles, etc.) en Argentina, con roadmap de expansión a Latinoamérica.

**Fase actual: Fase 1 — Directorio de Confianza.**
El objetivo es validar que las personas usan una plataforma para encontrar profesionales confiables en lugar de WhatsApp o Facebook.

No hay presupuestos, no hay materiales, no hay marketplace todavía. Solo directorio, reseñas y contacto.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 con App Router |
| Lenguaje | TypeScript (strict mode) |
| Estilos | Tailwind CSS |
| ORM | Prisma |
| Base de datos | PostgreSQL (Supabase) |
| Auth | Better Auth (email + Google + verificación SMS) |
| Deploy | Vercel |
| PWA | next-pwa (sin apps nativas en Fase 1) |

---

## Sistema de diseño

Ver `docs/Brand.md` para la referencia completa. Resumen operativo:

**Fuentes** — Inter (cuerpo) + DM Sans (headings). Importadas desde Google Fonts en el root layout.
**Color primario** — `#1A6FE0` (azul). Variable Tailwind: `sb-blue`.
**Color secundario** — `#F5820D` (naranja). Variable Tailwind: `sb-orange`.
**Colores de estado** — success `#18A058`, error `#D93026`, warning `#E88A00`.
**Fondo claro** — `#F7F7F5` (no blanco puro).

En `tailwind.config.ts` estos colores están definidos bajo `colors.sb-*`.
Los componentes UI en `src/components/ui/` usan estas variables — no hardcodear hex en componentes.

---

## Estructura de carpetas

```
superbob/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed/
│       ├── trades.ts          # seed de categorías y oficios
│       └── geography.ts       # seed desde API georef Argentina
│
├── public/
│   ├── manifest.json          # PWA manifest
│   └── icons/
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (public)/          # Rutas sin autenticación requerida
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                        # Home / landing
│   │   │   ├── search/
│   │   │   │   └── page.tsx                    # Búsqueda de profesionales
│   │   │   └── p/
│   │   │       └── [slug]/
│   │   │           └── page.tsx                # Perfil público de profesional (también QR)
│   │   │
│   │   ├── (auth)/            # Rutas de autenticación (Better Auth UI)
│   │   │   ├── layout.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (app)/             # Rutas privadas — requieren sesión
│   │   │   ├── layout.tsx     # Verifica sesión, redirige si no hay auth
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx                    # Home del usuario logueado
│   │   │   ├── profile/
│   │   │   │   └── page.tsx                    # Perfil de cuenta (usuario)
│   │   │   ├── professional/
│   │   │   │   ├── onboarding/
│   │   │   │   │   └── page.tsx                # Activar perfil profesional
│   │   │   │   ├── edit/
│   │   │   │   │   └── page.tsx                # Editar perfil profesional
│   │   │   │   └── reviews/
│   │   │   │       └── page.tsx                # Ver reseñas recibidas
│   │   │   ├── reviews/
│   │   │   │   └── [workRecordId]/
│   │   │   │       └── page.tsx                # Escribir reseña (cliente o profesional)
│   │   │   └── notifications/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (admin)/           # Rutas de administración interna
│   │   │   ├── layout.tsx     # Verifica rol admin
│   │   │   └── reports/
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...all]/
│   │   │   │       └── route.ts               # Better Auth handler
│   │   │   └── webhooks/
│   │   │       └── whatsapp/
│   │   │           └── route.ts               # Webhook entrante WhatsApp
│   │   │
│   │   ├── layout.tsx         # Root layout (fuentes, PWA meta, providers)
│   │   └── globals.css
│   │
│   ├── modules/               # Lógica de negocio organizada por dominio
│   │   ├── users/
│   │   │   ├── actions.ts     # Server Actions
│   │   │   ├── queries.ts     # Consultas de solo lectura (Prisma)
│   │   │   └── types.ts       # Tipos y schemas Zod del dominio
│   │   │
│   │   ├── professionals/
│   │   │   ├── actions.ts
│   │   │   ├── queries.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── trades/
│   │   │   ├── actions.ts
│   │   │   ├── queries.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── geography/
│   │   │   ├── queries.ts     # Solo lectura — geografía es datos de referencia
│   │   │   └── types.ts
│   │   │
│   │   ├── reviews/
│   │   │   ├── actions.ts
│   │   │   ├── queries.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── contacts/
│   │   │   ├── actions.ts     # Registrar contact_event al revelar teléfono
│   │   │   ├── queries.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── photos/
│   │   │   ├── actions.ts
│   │   │   ├── queries.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── notifications/
│   │   │   ├── actions.ts
│   │   │   ├── queries.ts
│   │   │   └── types.ts
│   │   │
│   │   └── whatsapp/
│   │       ├── actions.ts     # Envío de mensajes via API
│   │       └── types.ts
│   │
│   ├── components/            # Componentes UI reutilizables
│   │   ├── ui/                # Primitivos (Button, Input, Card, Badge, etc.)
│   │   ├── layout/            # Header, Footer, Sidebar, BottomNav (PWA)
│   │   └── shared/            # Componentes de dominio compartidos entre páginas
│   │       ├── ProfessionalCard.tsx
│   │       ├── ReviewCard.tsx
│   │       ├── StarRating.tsx
│   │       ├── TradeSelector.tsx
│   │       └── PhoneReveal.tsx   # Muestra teléfono + registra contact_event
│   │
│   ├── lib/
│   │   ├── prisma.ts          # Singleton de Prisma client
│   │   ├── auth.ts            # Configuración de Better Auth
│   │   ├── auth-client.ts     # Cliente de Better Auth para componentes
│   │   └── utils.ts           # cn(), formatDate(), slugify(), etc.
│   │
│   └── types/
│       └── index.ts           # Tipos globales y re-exports
│
├── .env.local                 # Variables de entorno (no commitear)
├── .env.example               # Template de variables (sí commitear)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── CLAUDE.md                  # Este archivo
```

---

## Convenciones de naming

### Archivos y carpetas
- Carpetas: `kebab-case` siempre
- Componentes React: `PascalCase.tsx`
- Todo lo demás (actions, queries, lib, utils): `camelCase.ts`
- Rutas del App Router: la convención de Next.js (`page.tsx`, `layout.tsx`, `route.ts`)

### Variables y funciones
- Variables y funciones: `camelCase`
- Tipos e interfaces: `PascalCase`
- Constantes globales: `UPPER_SNAKE_CASE`
- Schemas de Zod: `PascalCase + Schema` → `CreateProfessionalSchema`

### Base de datos (Prisma)
- Modelos Prisma: `PascalCase` singular → `User`, `ProfessionalProfile`, `Review`
- Campos: `camelCase` en Prisma → Prisma mapea a `snake_case` en PostgreSQL con `@map`
- Todas las tablas usan `id` como UUID con `@default(uuid())`

---

## Cómo está organizada la lógica de negocio

### El patrón central

```
Página / Componente
    ↓ llama
Server Action (src/modules/[dominio]/actions.ts)
    ↓ valida con Zod, verifica auth, ejecuta lógica
Prisma Client (src/lib/prisma.ts)
    ↓
PostgreSQL en Railway
```

Para lectura de datos en Server Components:

```
Server Component (page.tsx o componente async)
    ↓ llama directamente
Query function (src/modules/[dominio]/queries.ts)
    ↓
Prisma Client
```

### Regla de oro
**Toda la lógica de negocio vive en `src/modules/`.** Las páginas y componentes no consultan Prisma directamente. Siempre pasan por una función de `actions.ts` o `queries.ts`.

### Server Actions vs Route Handlers

| Usar Server Action | Usar Route Handler |
|---|---|
| Mutaciones desde formularios y botones | Webhooks externos (WhatsApp) |
| Acciones que requieren sesión | Endpoints públicos que consume JS del cliente |
| Todo lo que es "acción de usuario" | El handler de Better Auth (`/api/auth/[...all]`) |

En Fase 1, casi todo es Server Action. Los únicos Route Handlers son el de Better Auth y el webhook de WhatsApp.

---

## Módulos — responsabilidades por dominio

### `users`
Gestión de cuenta de usuario. Registro, perfil, teléfono verificado. Un usuario puede activar un perfil profesional sin crear otra cuenta.

### `professionals`
Perfil profesional: bio, teléfono de contacto (puede diferir del de cuenta), foto, oficios, zonas de cobertura, estado de verificación, QR code URL. El QR apunta a `/p/[slug]` que es público (no requiere login).

### `trades`
Lista jerárquica fija de oficios (`trade_categories` → `trades`). Es datos de referencia, no cambia en runtime. Se carga vía seed. Las queries son casi todas de solo lectura.

### `geography`
Provincias, departamentos, localidades precargadas desde la API georef Argentina. Solo lectura en runtime. El profesional selecciona los departamentos que cubre (`professional_coverage_areas`).

### `reviews`
Sistema double-blind: ninguna parte ve la reseña de la otra hasta que ambas envíen la suya o pasen 14 días. Las reseñas son públicas (del cliente al profesional). Las calificaciones del profesional al cliente (`client_ratings`) son privadas, solo visibles para profesionales cuando ese cliente los contacta. Las reseñas se asocian al oficio específico en que se trabajó.

Tipos de reseña: `contact_review` (el profesional atendió bien) y `work_review` (trabajo completado). work_review peso 100%, contact_review peso 30%. El score es promedio ponderado.

El score ponderado del profesional se expone públicamente ordenado por oficio y departamento. Esto alimenta el ranking público: Top profesionales por oficio + zona. La query vive en src/modules/reviews/queries.ts


### `contacts`
Registra `contact_events` cada vez que un usuario registrado revela el teléfono de un profesional. Es la métrica principal de validación de Fase 1. La fuente del evento puede ser `profile`, `qr_scan` o `search`. El número de teléfono solo se muestra a usuarios registrados.

### `photos`
Fotos de portafolio del profesional. Límite: 10 por profesional en Fase 1, validado a nivel de aplicación (no en DB). Las reseñas no tienen fotos en Fase 1.

### `notifications`
Notificaciones internas de la plataforma (nueva reseña disponible, reseña publicada, etc.). Payload flexible con JSONB.

### `whatsapp`
Envío de mensajes via WhatsApp API. En Fase 1: `review_request` (el profesional pide reseña al cliente) y `work_confirmation`. Registra el estado de cada mensaje en `whatsapp_messages`.

---

## Base de datos — reglas de Prisma

### Schema
El schema de Prisma refleja exactamente el diseño en `docs/Schema.md`. Usar `@map` para mapear nombres camelCase de Prisma a snake_case en Postgres.

```prisma
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  phone           String    @unique
  phoneVerifiedAt DateTime? @map("phone_verified_at")
  fullName        String    @map("full_name")
  // ...
  @@map("users")
}
```

### Constraints críticos
Estos constraints están en el schema y NO deben removerse:

1. **Un solo oficio primario por profesional** — índice parcial único en `professional_trades` donde `is_primary = true`
2. **Sin departamentos duplicados por profesional** — unique en `(professional_id, department_id)` en `professional_coverage_areas`
3. **Un solo perfil profesional por usuario** — relación 1:1 entre `users` y `professional_profiles`

### Queries frecuentes
La query más importante de la app es búsqueda de profesionales por oficio + departamento. Siempre filtrar por `professional_profiles.is_active = true` y `trades.is_active = true`.

---

## Autenticación — Better Auth

### Sesión en Server Components
```typescript
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

const session = await auth.api.getSession({ headers: await headers() })
if (!session) redirect("/login")
```

### Sesión en Client Components
```typescript
import { authClient } from "@/lib/auth-client"
const { data: session } = authClient.useSession()
```

### Verificación de teléfono
Todos los usuarios deben verificar su teléfono (`phone_verified_at` no null) para poder contactar profesionales o escribir reseñas. Los profesionales deben verificar también su `contact_phone` si es distinto al de cuenta.

---

## Rutas públicas vs privadas

| Ruta | Auth requerida |
|---|---|
| `/` | No |
| `/search` | No (pero no revela teléfonos) |
| `/p/[slug]` | No (perfil público, sin teléfono) |
| `/dashboard` | Sí |
| `/profile` | Sí |
| `/professional/*` | Sí |
| `/reviews/*` | Sí |
| `/notifications` | Sí |
| `/(admin)/*` | Sí + rol admin |

El teléfono del profesional se revela solo cuando hay sesión activa. El componente `PhoneReveal` maneja esto y registra el `contact_event` al mismo tiempo.

---

## PWA

El manifest y los service workers se configuran con `next-pwa`. La app está diseñada mobile-first. Hay un `BottomNav` en `src/components/layout/` para navegación principal en mobile. No hay apps nativas en Fase 1.

---

## Variables de entorno

Todas las variables sensibles van en `.env.local` (no se commitea). El archivo `.env.example` tiene la lista de todas las variables necesarias sin valores.

Variables mínimas para Fase 1:

```
# Base de datos
DATABASE_URL=

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# WhatsApp API
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

# SMS (verificación de teléfono)
TWILIO_AUTH_TOKEN=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Reglas que Claude Code debe seguir siempre

1. **No consultar Prisma desde páginas o componentes directamente.** Siempre usar una función de `src/modules/[dominio]/queries.ts` o `actions.ts`.

2. **Validar input con Zod en toda Server Action.** El schema Zod vive en `src/modules/[dominio]/types.ts`.

3. **Verificar sesión al inicio de toda Server Action mutante.** Si no hay sesión, lanzar error antes de cualquier operación.

4. **No exponer el teléfono del profesional en queries públicas.** El campo `contact_phone` de `professional_profiles` solo se incluye en queries que verifican sesión activa.

5. **El límite de 10 fotos por profesional se valida en la Server Action de `photos`.** No confiar en validación del cliente.

6. **La lógica de publicación de reseñas double-blind es crítica.** `published_at` solo se setea cuando: (a) ambas partes enviaron su reseña, o (b) pasaron `REVIEW_BLIND_DAYS` días desde `submitted_at` (constante en `src/lib/config.ts`). Esta lógica vive en `src/modules/reviews/actions.ts` y no se simplifica.

7. **El campo `is_primary` en `professional_trades` es único por profesional.** Al asignar un nuevo oficio primario, primero desactivar el anterior en la misma transacción de Prisma.

8. **Usar transacciones de Prisma** (`prisma.$transaction`) cuando una operación involucra más de una escritura relacionada.

9. **Toda nueva tabla o campo en Prisma requiere una migración.** No editar el schema sin generar la migración correspondiente.

10. **Los componentes en `src/components/ui/` son primitivos sin lógica de negocio.** Si un componente necesita llamar a Prisma o a un módulo, pertenece a `src/components/shared/` o directamente a la página.

11. Peso de reseñas en el score del profesional:
`REVIEW_WEIGHT_WORK` (1.0) y `REVIEW_WEIGHT_CONTACT` (0.3), ambas constantes en `src/lib/config.ts`. El score visible del profesional es el promedio ponderado de ambos tipos. Esta lógica vive en `src/modules/reviews/queries.ts` y no se cambia sin decisión explícita del producto.

12. El ranking público por oficio y departamento se calcula en tiempo real desde la tabla reviews usando el score ponderado (`REVIEW_WEIGHT_WORK` / `REVIEW_WEIGHT_CONTACT`). No se cachea en Fase 1. Se muestra en la página de búsqueda y en cada página de oficio por zona.

13. **No hardcodear colores hex en componentes.** Usar siempre las clases Tailwind del sistema de diseño (`sb-blue`, `sb-orange`, etc.) o las clases semánticas de estado (`sb-success`, `sb-error`, `sb-warning`). Los valores hex viven únicamente en `tailwind.config.ts`.

14. **Tipografía por función:** DM Sans para headings (`font-display`), Inter para todo el resto (`font-sans`). Ambas configuradas en el root layout y en `tailwind.config.ts`.

15. Migraciones en Supabase: nunca usar --shadow-database-url apuntando a la base real. Para generar SQL de migraciones usar prisma migrate diff --from-migrations --to-schema-datamodel y aplicar con psql o el SQL editor de Supabase directamente.

16. **IDs de Better Auth son nanoid, no UUID estándar.** Todo campo de ID que provenga de la sesión de Better Auth (ej. `session.user.id`) debe validarse con `z.string().min(1)`, nunca con `z.string().uuid()`. Los IDs generados por Prisma en tablas propias sí son UUID y pueden usar `z.uuid()`.

17. **Colores dinámicos por oficio: nunca usar clases Tailwind dinámicas.** Las clases generadas en runtime (ej. `` `bg-${slug}-500` ``) no son incluidas por Tailwind en el build. Para colorear por oficio, usar siempre `style={{ backgroundColor: getTradeColor(slug) }}` con la función del archivo `src/lib/tradeColors.ts`.

18. **En Zod, no usar `z.preprocess(emptyToUndefined, ...)`.** Este patrón oculta el error real del campo detrás del error del wrapper, dificultando el debugging. Usar `z.string().min(1).optional()` en su lugar.

19. **Toda constante numérica de negocio vive en `src/lib/config.ts`.** Esto incluye ventanas de tiempo, pesos de score, límites de rate, thresholds de triggers y factores de ranking. No hardcodear esos valores en ningún otro archivo. Ver `docs/review-system-decisions-v2.md §13` para la lista completa y sus justificaciones.

---

## Lo que NO existe en Fase 1

No implementar, no mencionar, no crear tablas para:

- Publicación de trabajos (job posts) → Fase 2
- Propuestas de profesionales → Fase 2
- Presupuestos digitales → Fase 3
- Listas de materiales → Fase 4
- Proveedores / comercios → Fase 5
- Chat en la plataforma → no hay en ninguna fase planeada por ahora
- Fotos en reseñas → Fase 2
- Calificaciones de clientes semi-públicas → posible Fase 3

---

## Documentos de referencia en el repositorio

| Archivo | Contenido |
|---|---|
| `CLAUDE.md` | Este archivo — arquitectura y convenciones |
| `docs/review-system-decisions-v2.md` | **Fuente de verdad** del sistema de reseñas — reemplaza `docs/Schema.md` en todo lo relativo a reviews y work_records |
| `docs/Schema.md` | Schema base de datos v1.0 (supersedido por review-system-decisions-v2.md para las tablas de reviews) |
| `src/lib/config.ts` | Todas las constantes configurables de negocio |
| `docs/Brief.md` | Visión del producto y propuesta de valor |
| `docs/Roadmap.md` | Las 6 fases de evolución del producto |
| `docs/Brand.md` | Identidad de marca, colores, tipografía, tono de voz |

## Work records — modelo, máquina de estados y flujo

### Iniciación dual

Un `work_record` puede ser iniciado por cualquiera de las dos partes, siempre a partir de
un `contact_event` existente (el cliente reveló el teléfono del profesional previamente):

| `initiated_by` | Acción | Estado inicial |
|---|---|---|
| `professional` | `createProWorkRecordAction` | `active` |
| `client` | `createClientClaimAction` | `pending_pro_confirmation` |

El profesional registra un trabajo completado directamente (sin confirmación del cliente).
El cliente inicia un reclamo cuando el profesional no lo registró, dentro de una ventana de
`WORK_RECORD_CLIENT_CLAIM_MIN_DAYS`–`WORK_RECORD_CLIENT_CLAIM_MAX_DAYS` días del contacto.

### Máquina de estados

```
                   [profesional crea]          [cliente crea reclamo]
                         │                              │
                         ▼                              ▼
                      active ◄─── confirm ──── pending_pro_confirmation
                         │                              │
                 (review window)                   dispute │
                         │                              │
                         ▼                              ▼
                     completed                       disputed
                         │                              │
                   (sin cambios                  (admin resuelve)
                    de estado)                         / \
                                          work_confirmed  claim_rejected
                                               │          /  unresolved
                                               ▼         ▼
                                            active    cancelled
                                               │
                                           cancelled (si admin o timeout)
```

Seis estados posibles del campo `status` en `work_records`:
- `pending_pro_confirmation` — reclamo iniciado por cliente, aguardando respuesta del profesional
- `active` — trabajo registrado y activo; la ventana de review está abierta (`review_window_closes_at`)
- `completed` — estado especial interno para los work_records creados automáticamente al enviar una `contact_review`
- `cancelled` — work_record cerrado (disputa rechazada, no resuelta, o expirado)
- `disputed` — el profesional disputó el reclamo del cliente; requiere intervención admin
- (no existe `completed` como destino de un flujo normal de trabajo — en Fase 1 el estado permanece `active`)

### Exclusividad mutua: contact_review vs work_review

Por `contact_event_id`, solo puede existir UN tipo de review:

- Si existe algún `work_record` con `status != 'cancelled'` para ese `contact_event_id` → solo
  `work_review` es posible (a través del work_record).
- Si NO existe ningún work_record no-cancelado → el cliente puede enviar una `contact_review`.

Ambas rutas verifican este check ANTES de crear cualquier registro. La ventana para
`contact_review` es `REVIEW_CONTACT_MIN_HOURS`–`REVIEW_CONTACT_MAX_DAYS` desde el
`contact_event`. Una vez enviada la `contact_review`, se crea internamente un work_record
con `status='completed'`, cerrando permanentemente la ventana para work_review.

### Server Actions principales del flujo

| Acción | Quién la llama | Qué hace |
|---|---|---|
| `createProWorkRecordAction` | Profesional | Crea work_record `active` desde contact_event |
| `createClientClaimAction` | Cliente (phone verified) | Crea work_record `pending_pro_confirmation` |
| `respondToWorkRecordAction` | Profesional | Confirma (→ `active`) o disputa (→ `disputed`) |
| `submitWorkReviewAction` | Cliente (phone verified) | Review de trabajo; double-blind |
| `submitContactReviewAction` | Cliente (phone verified) | Review de contacto; publica inmediato |
| `resolveDisputeAction` | Admin | Resuelve disputa: `work_confirmed` \| `claim_rejected` \| `unresolved` |

### UI pendiente para próxima sesión

Las siguientes pantallas tienen lógica de backend implementada pero **no tienen UI todavía**:

- **Cliente — iniciar reclamo**: formulario para `createClientClaimAction` (seleccionar contact_event + oficio). Ruta sugerida: `/reviews/claim/[contactEventId]`.
- **Profesional — responder reclamo**: pantalla para `respondToWorkRecordAction` con opciones "Confirmar" / "Disputar". Ruta sugerida: `/professional/work-records/[workRecordId]`.
- **Admin — resolver disputa**: vista con contexto del par (historial de disputas de ambas partes via `getDisputeContextForAdmin`) y botones para las 3 resoluciones posibles. Ruta sugerida: `/admin/disputes/[workRecordId]`.
- **Cliente — contact_review**: formulario para `submitContactReviewAction` para contact_events elegibles (via `getPendingContactReviewsForClient`).

---

## Decisiones de implementación — review_system_v2

### contact_review: se hospeda en un work_record 'completed' creado en transacción

El modelo `Review` requiere `work_record_id` (no nullable). Cuando el cliente envía una
`contact_review`, `submitContactReviewAction` crea internamente un `WorkRecord` con
`status='completed'` e `initiatedBy='client'` en la misma transacción, sin mostrar este
work_record al usuario. La exclusividad mutua se verifica ANTES de la transacción:
si ya existe un work_record no-cancelado para el `contact_event_id`, se bloquea la
contact_review. Esta decisión evita agregar una migración adicional para hacer nullable
`work_record_id` en reviews.

### Rate limiting en contact events es sincrónico

El check de rate limit corre ANTES de retornar el teléfono en `revealPhoneAction`. Si se
pusiera en `after()` sería asíncrono y no podría bloquear la respuesta. Los tres límites
(par/30 días, usuario/día, usuario/semana) usan `Promise.all` para consultar en paralelo.

### `resolveDisputeAction` vive en `reviews/actions.ts` (no en `admin/actions.ts`)

La resolución de disputas es lógica del dominio `reviews` con un guard de rol admin,
no una acción de administración genérica. Esto mantiene toda la máquina de estados de
work_records en un solo lugar.

### Función renombradas en reviews/queries.ts

- `getPendingReviewsForClient` → `getPendingWorkReviewsForClient` (solo work_reviews)
- `getPendingReviewsForProfessional` → `getPendingRatingsForProfessional` (ratings privados)
- `getPendingReviewsForClientCount` → `getPendingWorkReviewsForClientCount`
- Nueva: `getPendingContactReviewsForClient` — contact_events elegibles para contact_review

### ProfessionalReviewForProfile: workRecordType → reviewType

El campo `workRecordType: WorkRecordType` en `src/modules/professionals/types.ts` fue
reemplazado por `reviewType: ReviewType`. El display en `ReviewsList.tsx` ahora usa
`review.reviewType === "work_review"` en lugar de `review.workRecordType === "completed"`.

---

## Gestión del conocimiento

Al finalizar cualquier sesión de desarrollo, antes de cerrar,
evaluar si ocurrió alguno de estos eventos:

- Se resolvió un bug que tardó más de un intento en encontrarse
- Se tomó una decisión de arquitectura que no estaba documentada
- Se descubrió un comportamiento inesperado de una librería
- Se estableció una convención nueva de código o diseño

Si ocurrió alguno, proponer al usuario agregar una nota en la
sección correspondiente del CLAUDE.md con el aprendizaje concreto.
No agregar sin confirmación del usuario.

Si no ocurrió nada relevante, no mencionar esto.