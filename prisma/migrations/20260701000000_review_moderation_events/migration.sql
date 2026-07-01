-- Migration: review_moderation_events
-- Tabla de auditoría para acciones de moderación sobre reseñas (suspender, levantar, eliminar).

CREATE TABLE "review_moderation_events" (
    "id"         TEXT        NOT NULL,
    "review_id"  TEXT        NOT NULL,
    "admin_id"   TEXT        NOT NULL,
    "action"     TEXT        NOT NULL,
    "reason"     TEXT        NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_moderation_events_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "review_moderation_events_action_check"
        CHECK (action IN ('suspend', 'unsuspend', 'delete')),

    CONSTRAINT "review_moderation_events_review_id_fkey"
        FOREIGN KEY ("review_id") REFERENCES "reviews"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT "review_moderation_events_admin_id_fkey"
        FOREIGN KEY ("admin_id") REFERENCES "users"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "review_moderation_events_review_id_idx"
    ON "review_moderation_events"("review_id");
