-- Eliminación de cuentas: soft-delete con anonimización de datos personales.
-- Aplicar con psql o el SQL editor de Supabase (ver CLAUDE.md regla 15).

ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE professional_profiles ADD COLUMN deleted_at TIMESTAMPTZ;
