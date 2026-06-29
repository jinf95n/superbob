-- Migration: review_system_v2
-- Fuente de verdad: docs/review-system-decisions-v2.md §12
--
-- INSTRUCCIÓN DE APLICACIÓN:
-- Aplicar con psql o el SQL editor de Supabase. NO usar --shadow-database-url.
-- Ver nota [*] sobre contact_event_id antes de ejecutar en una base con datos existentes.


-- =============================================================================
-- 1. work_records — eliminar campos obsoletos del modelo anterior
-- =============================================================================

ALTER TABLE "work_records" DROP COLUMN IF EXISTS "type";
ALTER TABLE "work_records" DROP COLUMN IF EXISTS "initiated_by_professional_at";
ALTER TABLE "work_records" DROP COLUMN IF EXISTS "client_notified_at";

-- Eliminar el enum PostgreSQL que ya no se usa
DROP TYPE IF EXISTS "WorkRecordType";


-- =============================================================================
-- 2. work_records — nuevos campos
-- =============================================================================

-- Estado del work_record (DEFAULT 'active' cubre los registros existentes)
ALTER TABLE "work_records"
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';

ALTER TABLE "work_records"
  ADD CONSTRAINT "work_records_status_check"
  CHECK ("status" IN (
    'pending_pro_confirmation',
    'active',
    'completed',
    'cancelled',
    'disputed'
  ));

-- Quién inició el work_record (DEFAULT 'professional' cubre los registros existentes)
ALTER TABLE "work_records"
  ADD COLUMN "initiated_by" TEXT NOT NULL DEFAULT 'professional';

-- Quitar el default permanente: las nuevas filas deben setear initiated_by explícitamente
ALTER TABLE "work_records" ALTER COLUMN "initiated_by" DROP DEFAULT;

ALTER TABLE "work_records"
  ADD CONSTRAINT "work_records_initiated_by_check"
  CHECK ("initiated_by" IN ('professional', 'client'));

-- [*] NOTA sobre contact_event_id:
-- Este campo es obligatorio en el modelo nuevo pero los registros existentes no
-- tienen un contact_event_id. La columna se agrega como nullable para que la
-- migración pueda aplicarse sin errores.
-- Después de backfillear los registros existentes, ejecutar por separado:
--   ALTER TABLE "work_records" ALTER COLUMN "contact_event_id" SET NOT NULL;
ALTER TABLE "work_records"
  ADD COLUMN "contact_event_id" TEXT;

ALTER TABLE "work_records"
  ADD CONSTRAINT "work_records_contact_event_id_fkey"
  FOREIGN KEY ("contact_event_id") REFERENCES "contact_events"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Ventana de reviews (60 días desde que el work_record queda en 'active')
ALTER TABLE "work_records"
  ADD COLUMN "review_window_closes_at" TIMESTAMPTZ;

-- Resolución de disputas
ALTER TABLE "work_records"
  ADD COLUMN "dispute_resolved_at" TIMESTAMPTZ;

ALTER TABLE "work_records"
  ADD COLUMN "dispute_resolution" TEXT;

ALTER TABLE "work_records"
  ADD CONSTRAINT "work_records_dispute_resolution_check"
  CHECK ("dispute_resolution" IN (
    'work_confirmed',
    'claim_rejected',
    'unresolved'
  ));


-- =============================================================================
-- 3. work_records — nuevos índices
-- =============================================================================

CREATE INDEX "work_records_contact_event_id_idx" ON "work_records"("contact_event_id");
CREATE INDEX "work_records_status_idx" ON "work_records"("status");

-- Garantiza un solo work_record activo por par (professional_id, client_id)
CREATE UNIQUE INDEX "work_records_professional_id_client_id_active_key"
  ON "work_records"("professional_id", "client_id")
  WHERE "status" IN ('pending_pro_confirmation', 'active', 'disputed');


-- =============================================================================
-- 4. contact_events — nuevo campo
-- =============================================================================

-- Almacenado durante CONTACT_IP_RETENTION_DAYS (90) días, luego nulled por cron.
ALTER TABLE "contact_events"
  ADD COLUMN "ip_address" TEXT;


-- =============================================================================
-- 5. reviews — nuevos campos
-- =============================================================================

-- Retiro antes de publicación (una vez por parte por work_record)
ALTER TABLE "reviews" ADD COLUMN "withdrawn_at" TIMESTAMPTZ;

-- Edición dentro de los 15 minutos post-envío
ALTER TABLE "reviews" ADD COLUMN "edited_at" TIMESTAMPTZ;

-- Moderación: suspensión temporal (invisible al público durante investigación)
ALTER TABLE "reviews" ADD COLUMN "suspended_at" TIMESTAMPTZ;

-- Soft delete por moderación
ALTER TABLE "reviews" ADD COLUMN "deleted_at" TIMESTAMPTZ;

-- Respuesta pública del profesional a la reseña
ALTER TABLE "reviews" ADD COLUMN "response_text" TEXT;
ALTER TABLE "reviews" ADD COLUMN "response_published_at" TIMESTAMPTZ;
-- response_published_at + 24 horas; después la respuesta es definitiva
ALTER TABLE "reviews" ADD COLUMN "response_editable_until" TIMESTAMPTZ;


-- =============================================================================
-- 6. professional_profiles — nuevo campo
-- =============================================================================

-- Vence el boost de nuevo profesional. Calculado cuando el perfil se completa
-- por primera vez cumpliendo todas las condiciones (ver §6 del documento).
ALTER TABLE "professional_profiles"
  ADD COLUMN "new_professional_boost_until" TIMESTAMPTZ;


-- =============================================================================
-- 7. Nueva tabla: professional_sanctions
-- =============================================================================

CREATE TABLE "professional_sanctions" (
  "id"              TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "professional_id" TEXT        NOT NULL,
  "type"            TEXT        NOT NULL,
  "reason"          TEXT        NOT NULL,
  "imposed_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "expires_at"      TIMESTAMPTZ,
  "lifted_at"       TIMESTAMPTZ,
  "notes"           TEXT,
  "created_at"      TIMESTAMPTZ          DEFAULT now(),

  CONSTRAINT "professional_sanctions_pkey" PRIMARY KEY ("id"),

  CONSTRAINT "professional_sanctions_type_check"
    CHECK ("type" IN (
      'warning',
      'temporary_suspension',
      'permanent_deactivation'
    )),

  CONSTRAINT "professional_sanctions_professional_id_fkey"
    FOREIGN KEY ("professional_id") REFERENCES "professional_profiles"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "professional_sanctions_professional_id_imposed_at_idx"
  ON "professional_sanctions"("professional_id", "imposed_at");


-- =============================================================================
-- 8. reports — actualizar check constraint de reason
-- =============================================================================

-- El constraint anterior no tenía valores definidos (campo TEXT libre).
-- Se agrega el check con los motivos válidos.
-- Si existe un constraint previo con nombre diferente, ajustar o eliminar primero.

-- Normalizar filas existentes: cualquier valor fuera del nuevo enum → 'otro'
UPDATE "reports"
  SET "reason" = 'otro'
  WHERE "reason" NOT IN (
    'contenido_ofensivo',
    'resena_falsa',
    'datos_incorrectos',
    'presion_o_coaccion',
    'manipulacion_reviews',
    'otro'
  );

ALTER TABLE "reports"
  ADD CONSTRAINT "reports_reason_check"
  CHECK ("reason" IN (
    'contenido_ofensivo',
    'resena_falsa',
    'datos_incorrectos',
    'presion_o_coaccion',
    'manipulacion_reviews',
    'otro'
  ));
