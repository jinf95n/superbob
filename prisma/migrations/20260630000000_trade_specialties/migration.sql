-- Especialidades por oficio en professional_trades.
-- Aplicar con psql o el SQL editor de Supabase (ver CLAUDE.md regla 15).

ALTER TABLE "professional_trades" ADD COLUMN "specialties" text[] NOT NULL DEFAULT '{}';
