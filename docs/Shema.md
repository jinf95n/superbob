# SUPERBOB — Database Schema v1.0

# Fase 1 — Directorio de Confianza
---
## Decisiones de diseño
- PostgreSQL como base de datos principal

- Un usuario puede tener rol de cliente y profesional bajo la misma cuenta

- Las reseñas al profesional son públicas con sistema double-blind de 14 días

- Las calificaciones al cliente son privadas, solo visibles para profesionales

- Los oficios son una lista fija jerárquica (categoría > oficio)

- La geografía se pre-carga desde la API georef Argentina

- El profesional cubre por departamentos, no por radio de kilómetros

- Las reseñas están asociadas al oficio específico en que se trabajó

- Límite de 10 fotos de portafolio por profesional en Fase 1

- Las reseñas no tienen fotos en Fase 1

- Reportes van a tabla simple, resolución manual por email

- El profesional puede tener un teléfono de contacto distinto al de su cuenta
---
## BLOQUE 1: Usuarios y roles
```sql

users

- id                        UUID PRIMARY KEY DEFAULT gen_random_uuid()

- email                     TEXT UNIQUE NOT NULL

- phone                     TEXT UNIQUE NOT NULL

- phone_verified_at         TIMESTAMPTZ

- full_name                 TEXT NOT NULL

- avatar_url                TEXT

- is_active                 BOOLEAN DEFAULT true

- created_at                TIMESTAMPTZ DEFAULT now()

- updated_at                TIMESTAMPTZ DEFAULT now()
professional_profiles

- id                        UUID PRIMARY KEY DEFAULT gen_random_uuid()

- user_id                   UUID UNIQUE NOT NULL REFERENCES users(id)

- bio                       TEXT

- contact_phone             TEXT

- contact_phone_verified_at TIMESTAMPTZ

- is_active                 BOOLEAN DEFAULT true

- is_verified               BOOLEAN DEFAULT false

- qr_code_url               TEXT

- created_at                TIMESTAMPTZ DEFAULT now()

- updated_at                TIMESTAMPTZ DEFAULT now()

```
---
## BLOQUE 2: Oficios
```sql

trade_categories

- id                        UUID PRIMARY KEY DEFAULT gen_random_uuid()

- name                      TEXT NOT NULL

- icon                      TEXT

- order                     INTEGER
trades

- id                        UUID PRIMARY KEY DEFAULT gen_random_uuid()

- category_id               UUID NOT NULL REFERENCES trade_categories(id)

- name                      TEXT NOT NULL

- slug                      TEXT UNIQUE NOT NULL

- is_active                 BOOLEAN DEFAULT true

- order                     INTEGER
professional_trades

- id                        UUID PRIMARY KEY DEFAULT gen_random_uuid()

- professional_id           UUID NOT NULL REFERENCES professional_profiles(id)

- trade_id                  UUID NOT NULL REFERENCES trades(id)

- is_primary                BOOLEAN DEFAULT false

- years_experience          INTEGER

- created_at                TIMESTAMPTZ DEFAULT now()
-- Constraint: solo un oficio primario por profesional

-- Índice parcial único: CREATE UNIQUE INDEX ON professional_trades

-- (professional_id) WHERE is_primary = true

```
---
## BLOQUE 3: Geografía
```sql

provinces

- id                        UUID PRIMARY KEY DEFAULT gen_random_uuid()

- georef_id                 TEXT UNIQUE NOT NULL

- name                      TEXT NOT NULL

- slug                      TEXT UNIQUE NOT NULL
departments

- id                        UUID PRIMARY KEY DEFAULT gen_random_uuid()

- province_id               UUID NOT NULL REFERENCES provinces(id)

- georef_id                 TEXT UNIQUE NOT NULL

- name                      TEXT NOT NULL

- slug                      TEXT UNIQUE NOT NULL
localities

- id                        UUID PRIMARY KEY DEFAULT gen_random_uuid()

- department_id             UUID NOT NULL REFERENCES departments(id)

- georef_id                 TEXT UNIQUE NOT NULL

- name                      TEXT NOT NULL

- slug                      TEXT UNIQUE NOT NULL

- latitude                  DECIMAL(10,8)

- longitude                 DECIMAL(11,8)
professional_coverage_areas

- id                        UUID PRIMARY KEY DEFAULT gen_random_uuid()

- professional_id           UUID NOT NULL REFERENCES professional_profiles(id)

- department_id             UUID NOT NULL REFERENCES departments(id)

- created_at                TIMESTAMPTZ DEFAULT now()
-- Constraint: un profesional no puede duplicar departamento

-- UNIQUE(professional_id, department_id)

```
---
## BLOQUE 4: Sistema de reseñas
```sql

work_records

- id                            UUID PRIMARY KEY DEFAULT gen_random_uuid()

- professional_id               UUID NOT NULL REFERENCES professional_profiles(id)

- client_id                     UUID NOT NULL REFERENCES users(id)

- trade_id                      UUID NOT NULL REFERENCES trades(id)

- type                          TEXT NOT NULL CHECK (type IN ('contact', 'completed'))

- initiated_by_professional_at  TIMESTAMPTZ

- client_notified_at            TIMESTAMPTZ

- created_at                    TIMESTAMPTZ DEFAULT now()
reviews

- id                            UUID PRIMARY KEY DEFAULT gen_random_uuid()

- work_record_id                UUID NOT NULL REFERENCES work_records(id)

- reviewer_id                   UUID NOT NULL REFERENCES users(id)

- reviewed_professional_id      UUID NOT NULL REFERENCES professional_profiles(id)

- trade_id                      UUID NOT NULL REFERENCES trades(id)

- type                          TEXT NOT NULL CHECK (type IN ('contact_review','work_review'))

- rating                        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5)

- comment                       TEXT

- submitted_at                  TIMESTAMPTZ

- published_at                  TIMESTAMPTZ

- created_at                    TIMESTAMPTZ DEFAULT now()
-- published_at es null hasta que:

-- a) ambas partes enviaron su reseña, o

-- b) pasaron 14 días desde submitted_at
client_ratings

- id                            UUID PRIMARY KEY DEFAULT gen_random_uuid()

- work_record_id                UUID NOT NULL REFERENCES work_records(id)

- rated_by_professional_id      UUID NOT NULL REFERENCES professional_profiles(id)

- client_id                     UUID NOT NULL REFERENCES users(id)

- rating                        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5)

- comment                       TEXT

- created_at                    TIMESTAMPTZ DEFAULT now()
-- Privadas: solo visibles para profesionales cuando reciben contacto de ese cliente

```
---
## BLOQUE 5: Contactos y métricas
```sql

contact_events

- id                        UUID PRIMARY KEY DEFAULT gen_random_uuid()

- professional_id           UUID NOT NULL REFERENCES professional_profiles(id)

- client_id                 UUID NOT NULL REFERENCES users(id)

- source                    TEXT CHECK (source IN ('profile','qr_scan','search'))

- created_at                TIMESTAMPTZ DEFAULT now()
-- Métrica principal de validación de Fase 1

-- Registra cada vez que un usuario ve el teléfono de un profesional

```
---
## BLOQUE 6: Fotos de trabajos
```sql

work_photos

- id                        UUID PRIMARY KEY DEFAULT gen_random_uuid()

- professional_id           UUID NOT NULL REFERENCES professional_profiles(id)

- trade_id                  UUID REFERENCES trades(id)

- work_record_id            UUID REFERENCES work_records(id)

- url                       TEXT NOT NULL

- thumbnail_url             TEXT

- caption                   TEXT

- order                     INTEGER

- created_at                TIMESTAMPTZ DEFAULT now()
-- Límite: 10 fotos por profesional, manejado a nivel de aplicación

-- Las reseñas no tienen fotos en Fase 1

```
---
## BLOQUE 7: WhatsApp y notificaciones
```sql

whatsapp_messages

- id                        UUID PRIMARY KEY DEFAULT gen_random_uuid()

- professional_id           UUID NOT NULL REFERENCES professional_profiles(id)

- client_id                 UUID NOT NULL REFERENCES users(id)

- work_record_id            UUID REFERENCES work_records(id)

- type                      TEXT CHECK (type IN ('review_request','work_confirmation'))

- status                    TEXT CHECK (status IN ('pending','sent','delivered','failed'))

- sent_at                   TIMESTAMPTZ

- created_at                TIMESTAMPTZ DEFAULT now()
notifications

- id                        UUID PRIMARY KEY DEFAULT gen_random_uuid()

- user_id                   UUID NOT NULL REFERENCES users(id)

- type                      TEXT NOT NULL

- payload                   JSONB

- read_at                   TIMESTAMPTZ

- created_at                TIMESTAMPTZ DEFAULT now()

```
---
## BLOQUE 8: Reportes
```sql

reports

- id                            UUID PRIMARY KEY DEFAULT gen_random_uuid()

- reporter_id                   UUID NOT NULL REFERENCES users(id)

- reported_user_id              UUID NOT NULL REFERENCES users(id)

- reported_professional_id      UUID REFERENCES professional_profiles(id)

- reason                        TEXT NOT NULL

- description                   TEXT

- status                        TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved'))

- created_at                    TIMESTAMPTZ DEFAULT now()
-- Resolución manual en Fase 1

-- El formulario de reporte manda email al admin además de guardar el registro

```
---
## Índices recomendados
```sql

-- Búsqueda de profesionales por oficio y zona (query más frecuente)

CREATE INDEX ON professional_trades(trade_id);

CREATE INDEX ON professional_coverage_areas(department_id);

CREATE INDEX ON professional_profiles(is_active);
-- Reseñas

CREATE INDEX ON reviews(reviewed_professional_id);

CREATE INDEX ON reviews(published_at);

CREATE INDEX ON reviews(trade_id);
-- Contactos (métricas)

CREATE INDEX ON contact_events(professional_id);

CREATE INDEX ON contact_events(created_at);
-- Notificaciones

CREATE INDEX ON notifications(user_id, read_at);
-- Oficio primario único por profesional

CREATE UNIQUE INDEX ON professional_trades(professional_id) WHERE is_primary = true;
-- Cobertura sin duplicados

CREATE UNIQUE INDEX ON professional_coverage_areas(professional_id, department_id);

```
---
## Notas para Fase 2 en adelante
- Fase 2: agregar tablas job_posts y proposals para el marketplace

- Fase 3: agregar quotes y quote_items para presupuestos digitales

- Fase 4: agregar material_lists y material_items

- Fase 5: agregar suppliers y supplier_catalogs

- Fase 6: agregar pgvector para normalización semántica de materiales

- Las reseñas pueden sumar campo photo_urls (array) en Fase 2

- El campo client_ratings puede hacerse semi-público en Fase 3 si hay razón de negocio