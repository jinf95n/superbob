# SUPERBOB — Sistema de Reseñas: Decisiones de Diseño v2.0

Este documento reemplaza y supera toda documentación anterior sobre el sistema de reseñas.
Es la fuente de verdad para implementación. Cualquier contradicción con CLAUDE.md o Schema.md
se resuelve a favor de este documento.

---

## Principio rector (agregar a CLAUDE.md)

> El perfil público solo muestra información derivada de interacciones verificadas dentro de
> SUPERBOB. Nunca muestra decisiones administrativas, sospechas, investigaciones ni información
> que la plataforma no pueda atribuir objetivamente a una interacción registrada.

Aplicación práctica: ante cualquier duda sobre si algo debe aparecer en el perfil público,
la respuesta es NO si no proviene de una reseña de cliente o de una respuesta del profesional
a esa reseña.

---

## 1. Work Records

### Quién puede crear un work_record

Cualquiera de las dos partes puede iniciarlo. Esto elimina el "filtro de impunidad" donde
el profesional bloquea reviews malas simplemente no creando el registro.

**Flujo iniciado por el profesional (flujo principal):**
El profesional crea el work_record desde su panel. El cliente recibe notificación.
Ambas partes quedan habilitadas para dejar work_review.

**Flujo iniciado por el cliente (reclamo):**
Disponible entre el día 7 y el día 30 desde el contact_event.
Si no existe un work_record para ese contact_event, el cliente ve en su historial
la opción de reclamar un trabajo.
El cliente inicia → se crea work_record con status `pending_pro_confirmation`.
El profesional tiene 7 días para responder.

### Estados del work_record

```
pending_pro_confirmation → (profesional confirma) → active
pending_pro_confirmation → (profesional disputa) → disputed
pending_pro_confirmation → (sin respuesta en 7 días) → disputed + tarea admin
active → (reviews completadas o ventana cerrada) → completed
active → (cancelación antes de cualquier review) → cancelled
disputed → (admin resuelve) → completed / cancelled según resolución
```

No hay auto-confirmación por silencio. El silencio del profesional pasa el caso a admin.

### Reglas de unicidad y ventanas

- Solo un work_record activo por par (client_id, professional_id) simultáneamente.
- Un nuevo work_record solo puede crearse si el anterior está en `completed` o `cancelled`.
- El profesional puede crear work_record dentro de los **60 días** del contact_event.
- El cliente puede iniciar reclamo entre el **día 7 y el día 30** del contact_event.
- Las reviews pueden enviarse hasta **60 días** después de que el work_record quede en `active`.
  Pasada esa ventana, el work_record pasa automáticamente a `completed` sin reviews si nadie
  las envió.

### Vinculación con contact_event

Cada work_record debe estar vinculado al contact_event que lo originó mediante un campo
`contact_event_id`. Este vínculo es obligatorio y permite:
- Verificar que el cliente efectivamente tuvo contacto con el profesional.
- Aplicar la exclusividad mutua entre contact_review y work_review.
- Auditar la cadena completa: reveal → contacto → trabajo → reseña.

### Modificaciones y cancelación

- El `trade_id` puede modificarse dentro de las 24 horas de creación y antes de que
  el cliente haya visto la notificación.
- Después de ese plazo el work_record es inmutable.
- Cualquiera de las dos partes puede cancelar si ninguna review fue enviada.
- Si alguna review ya fue enviada, la cancelación requiere intervención admin.

### Eliminación de cuenta durante el proceso

- Si el cliente elimina su cuenta: el work_record queda en estado `cancelled`.
  Sus reviews publicadas se anonimanizan ("Usuario eliminado") pero permanecen visibles.
- Si el profesional se desactiva: el work_record sigue activo y las reviews pueden
  completarse. El perfil inactivo no aparece en búsquedas pero su URL sigue accesible.

---

## 2. Contact Events

### Rate limiting (constantes configurables en código)

```
CONTACT_RATE_LIMIT_PER_PAIR_DAYS = 30      # días mínimos entre reveals del mismo par
CONTACT_RATE_LIMIT_PER_USER_DAY = 10       # reveals máximos por usuario por día
CONTACT_RATE_LIMIT_PER_USER_WEEK = 30      # reveals máximos por usuario por semana
```

Estos valores son constantes nombradas, nunca hardcodeadas. Se ajustan con datos reales.

### IP address

El campo `ip_address` se agrega a `contact_events`. Se almacena durante 90 días como
señal secundaria de fraude. Después de 90 días se anula mediante cron job.
Nunca se expone públicamente.

### Cuenta única por teléfono

La verificación de teléfono es la defensa principal contra cuentas múltiples.
Sin teléfono verificado: el usuario no puede revelar teléfonos ni dejar reseñas.

---

## 3. Tipos de reseña y exclusividad mutua

### La regla fundamental

**Contact_review y work_review son mutuamente excluyentes por contact_event.**

Una vez que existe un work_record vinculado a un contact_event (en cualquier estado
excepto `cancelled`), la ventana de contact_review para ese contact_event se cierra
permanentemente. No se suma — se reemplaza.

### Contact Review

- **Cuándo:** entre 2 horas y 30 días después del contact_event.
- **Requisito:** que no exista un work_record vinculado a ese contact_event.
- **Representa:** la calidad del primer contacto (atendió, fue claro, se presentó, etc.).
- No puede editarse después del envío.
- No puede eliminarse por el usuario (solo por moderación admin).
- El profesional puede agregar una respuesta pública (ver sección Moderación).

### Work Review

- **Cuándo:** hasta 60 días después de que el work_record quede en `active`.
- **Requisito:** work_record en estado `active` o `completed` vinculado al contact_event.
- **Representa:** la calidad del trabajo (resultado, puntualidad, profesionalismo).
- No puede editarse (excepto dentro de la ventana de 15 minutos post-envío).
- No puede eliminarse por el usuario (solo por moderación admin).
- El profesional puede agregar una respuesta pública.

### Consecuencia del reclamo frustrado

Si el cliente inicia un reclamo y la disputa se cierra sin evidencia suficiente:
- No hay contact_review (el reclamo cerró esa ventana).
- No hay work_review (no se verificó el trabajo).
- No hay ningún registro en el perfil público.
- La disputa queda registrada internamente para el admin.

Esto es deliberado: el sistema no publica lo que no puede verificar.

---

## 4. Double-blind

### Reglas completas

- El contador de 14 días comienza cuando la **primera** parte envía su reseña (`submitted_at`).
- **Ninguna parte sabe si la otra ya calificó.** El double-blind es completamente ciego.
- Al día 14 desde el primer `submitted_at`, la reseña de quien la envió se publica
  independientemente de si la otra parte envió la suya.
- Recordatorios: día 3 y día 10. Máximo 2 por work_record.

### Edición y retiro

**Edición:** disponible durante 15 minutos después del envío. Pasado ese plazo, definitiva.

**Retiro:** permitido exactamente una vez por parte por work_record, antes de la publicación.
- Al retirar: la reseña vuelve a estado "no enviada" para esa parte.
- El contador de 14 días se reinicia **solo para quien retiró**.
- Si la otra parte ya había enviado, su contador original sigue corriendo sin cambios.
- No se puede retirar una segunda vez.

Esta combinación (edición de 15 min + retiro único con timer parcial) elimina el abuso
de retiros repetidos sin sacrificar la válvula de escape para errores genuinos.

---

## 5. Score del profesional

### Fórmula

```
Score = Σ(peso_i × rating_i) / Σ(peso_i)
```

Donde:
```
REVIEW_WEIGHT_WORK = 1.0      # constante configurable
REVIEW_WEIGHT_CONTACT = 0.3   # constante configurable
```

### Reglas de display según cantidad de reseñas

- **0 reseñas:** "Sin reseñas aún" + badge "Nuevo". Sin score.
- **1–2 reseñas:** número decimal + "(N reseña/s)". Sin gráfico de estrellas.
- **3+ reseñas:** estrellas + score numérico + "(N reseñas)".

### Sin decay temporal en Fase 1

Las reseñas antiguas y nuevas tienen el mismo peso. Se evalúa decay en Fase 2
cuando haya masa crítica de datos.

---

## 6. Ranking en búsquedas

### Factores y pesos (todos configurables como constantes)

```
RANKING_WEIGHT_SCORE = 0.60           # score ponderado del profesional
RANKING_WEIGHT_VOLUME = 0.25          # log(N_work_reviews + 1)
RANKING_WEIGHT_PROFILE = 0.15         # completitud del perfil (0 a 1)
```

La función logarítmica en volumen evita que el profesional con 500 reseñas aplaste
al que tiene 50. El volumen importa pero con rendimientos decrecientes.

### Profesionales sin reseñas

Entran al ranking general desde el primer día, naturalmente abajo por score 0 y volumen 0.
Reciben un boost temporal de visibilidad durante sus primeros 60 días (ver sección Boost).

### Boost para profesionales nuevos

El boost solo se activa cuando se cumplen TODAS estas condiciones:
1. Foto de perfil cargada
2. Bio escrita
3. Teléfono de contacto verificado
4. Al menos una foto de portfolio
5. Términos de la versión actual aceptados
6. Sin sanciones activas

Mientras el boost está activo:
- Factor de ranking aumentado en `NEW_PROFESSIONAL_BOOST_FACTOR = 0.20` (configurable).
- Badge "Nuevo" visible en resultados de búsqueda y perfil.

El boost se desactiva automáticamente al cumplir 60 días desde la activación,
o inmediatamente si el profesional recibe una sanción.
El badge "Nuevo" desaparece cuando se publica la primera work_review.

---

## 7. Moderación y respuestas

### Reporte de una reseña

Motivos disponibles (check constraint):
```
contenido_ofensivo | resena_falsa | datos_incorrectos |
presion_o_coaccion | manipulacion_reviews | otro
```

### Durante la investigación

- **Casos rutinarios:** la reseña permanece visible.
- **Casos graves** (presión, coacción, manipulación con indicios): admin puede
  suspender temporalmente (`suspended_at`). Invisible al público, visible al admin.

Al resolver:
- A favor del denunciante: soft delete (`deleted_at`).
- A favor del reseñado: `suspended_at` se limpia, la reseña vuelve a ser pública.

### Respuesta pública del profesional

- Una respuesta por reseña.
- Plazo: 30 días desde la publicación de la reseña.
- Editable durante las primeras 24 horas desde su publicación. Después es definitiva.
- La respuesta es parte de la experiencia pública: sí aparece en el perfil.

---

## 8. Disputas — el caso difícil

**El escenario:** contacto verificado + reclamo del cliente + negativa del profesional
+ sin evidencia suficiente para ninguna de las dos partes.

**La decisión:**

El admin cierra la disputa como "sin resolución". Resultado:
- Ninguna reseña pública de ningún tipo.
- La disputa queda registrada **internamente** en la base de datos.
- El perfil público del profesional no muestra nada relacionado a esta disputa.
- El admin la ve en el historial del profesional.

**Por qué esta decisión es correcta:**

El sistema no puede publicar lo que no puede verificar. Una disputa sin evidencia
es genuinamente ambigua — puede ser un profesional deshonesto o un cliente mintiendo.
Publicar cualquier señal pública sería publicar una acusación no probada.

La protección contra el profesional deshonesto sistemático viene del mecanismo de
triggers de revisión obligatoria (sección siguiente), no del perfil público.

### Admin panel para disputas

La vista de resolución de disputas debe mostrar:
- Historial completo de disputas previas del profesional (con fechas y resoluciones)
- Historial completo de reclamos previos del cliente (con fechas y resoluciones)
- Opciones de cierre: confirmar trabajo / rechazar reclamo / sin resolución

Sin ese contexto, las decisiones admin serían arbitrarias.

---

## 9. Triggers de revisión admin obligatoria

Cualquiera de estas tres condiciones dispara una tarea admin bloqueante
(el profesional sigue operando normalmente; la revisión es interna):

```
DISPUTE_TRIGGER_RAPID_COUNT = 2        # disputas sin resolver
DISPUTE_TRIGGER_RAPID_DAYS = 60        # en este período de días
DISPUTE_TRIGGER_RATIO = 0.15           # % de contact_events que derivaron en disputa
DISPUTE_TRIGGER_RATIO_MIN_CONTACTS = 10 # mínimo de contactos para aplicar el ratio
DISPUTE_TRIGGER_HISTORICAL = 5         # disputas sin resolver acumuladas (sin expiración)
```

Todos son constantes configurables. Los valores son hipótesis iniciales.

La señal de escala para Fase 2: cuando el volumen de disputas supere 10 por semana,
construir tooling específico en lugar de resolución puramente manual.

---

## 10. Sanciones

Las sanciones afectan la **operativa de la cuenta**, nunca el perfil público.
Este es el corolario directo del principio rector.

**Suspensión temporal:**
- El perfil desaparece de búsquedas.
- No puede recibir nuevos contact_events.
- La URL del perfil muestra "profesional no disponible".
- Al terminar la suspensión: vuelve exactamente al estado previo, sin rastro público.

**Desactivación permanente:**
- La URL del perfil muestra "profesional no disponible".
- Sin acceso a la plataforma.

**El admin siempre ve:**
- Historial completo de sanciones sin fecha de expiración.
- Historial de disputas acumuladas.
- Triggers activados y su estado de resolución.

**El perfil público nunca muestra:** sanciones, suspensiones, advertencias, ni
ningún elemento de gobernanza interna de la plataforma.

---

## 11. Datos y retención

- Las reseñas **nunca se eliminan permanentemente**. Solo soft delete con `deleted_at`.
- Eliminación de cuenta: el usuario se anonimiza (nombre → "Usuario eliminado",
  email y teléfono → null). Las reseñas permanecen con autor anonimizado.
- `ip_address` en contact_events: almacenado 90 días, luego nulled por cron.
- El historial de moderaciones nunca se borra.

---

## 12. Cambios al schema

### Tabla `work_records` — campos nuevos

```sql
-- Estado del work_record
status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN (
    'pending_pro_confirmation',
    'active',
    'completed',
    'cancelled',
    'disputed'
  ))

-- Quién lo inició
initiated_by TEXT NOT NULL
  CHECK (initiated_by IN ('professional', 'client'))

-- FK al contact_event que originó este work_record (OBLIGATORIO)
contact_event_id UUID NOT NULL REFERENCES contact_events(id)

-- Cuándo vence la ventana para enviar reviews (60 días desde que queda en 'active')
review_window_closes_at TIMESTAMPTZ

-- Resolución de disputa (cuando status pasa de 'disputed')
dispute_resolved_at TIMESTAMPTZ
dispute_resolution TEXT
  CHECK (dispute_resolution IN ('work_confirmed', 'claim_rejected', 'unresolved'))

-- ELIMINAR el campo 'type' actual (contact/completed) — ya no aplica con el nuevo modelo
-- ELIMINAR initiated_by_professional_at — reemplazado por initiated_by + created_at
-- ELIMINAR client_notified_at — reemplazado por el sistema de notificaciones existente
```

**Índice nuevo:**
```sql
CREATE INDEX ON work_records(contact_event_id);
CREATE INDEX ON work_records(status);
-- Garantiza un solo work_record activo por par cliente-profesional
CREATE UNIQUE INDEX ON work_records(professional_id, client_id)
  WHERE status IN ('pending_pro_confirmation', 'active', 'disputed');
```

### Tabla `contact_events` — campo nuevo

```sql
ip_address TEXT  -- almacenado 90 días, luego nulled
```

### Tabla `reviews` — campos nuevos

```sql
-- Retiro antes de publicación (una vez por parte)
withdrawn_at TIMESTAMPTZ

-- Edición dentro de los 15 minutos post-envío
edited_at TIMESTAMPTZ

-- Moderación: suspensión temporal por admin
suspended_at TIMESTAMPTZ

-- Eliminación por moderación (soft delete)
deleted_at TIMESTAMPTZ

-- Respuesta pública del profesional a la reseña
response_text TEXT
response_published_at TIMESTAMPTZ
response_editable_until TIMESTAMPTZ  -- response_published_at + 24 horas
```

### Tabla `professional_profiles` — campo nuevo

```sql
-- Cuándo vence el boost de nuevo profesional (calculado cuando se completa el perfil por primera vez)
new_professional_boost_until TIMESTAMPTZ
```

### Nueva tabla `professional_sanctions`

```sql
professional_sanctions

- id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
- professional_id       UUID NOT NULL REFERENCES professional_profiles(id)
- type                  TEXT NOT NULL
    CHECK (type IN ('warning', 'temporary_suspension', 'permanent_deactivation'))
- reason                TEXT NOT NULL
- imposed_at            TIMESTAMPTZ NOT NULL DEFAULT now()
- expires_at            TIMESTAMPTZ  -- null para permanent_deactivation
- lifted_at             TIMESTAMPTZ  -- cuando se levanta manualmente
- notes                 TEXT         -- notas internas del admin
- created_at            TIMESTAMPTZ DEFAULT now()

-- Índice
CREATE INDEX ON professional_sanctions(professional_id, imposed_at);
```

### Tabla `reports` — actualización del check de reason

```sql
-- Reemplazar el campo reason TEXT NOT NULL por:
reason TEXT NOT NULL
  CHECK (reason IN (
    'contenido_ofensivo',
    'resena_falsa',
    'datos_incorrectos',
    'presion_o_coaccion',
    'manipulacion_reviews',
    'otro'
  ))
```

---

## 13. Constantes configurables (en código, nunca hardcodeadas)

Todas estas constantes deben vivir en un archivo de configuración centralizado
(por ejemplo `src/lib/config.ts`), nunca dispersas en el código:

```typescript
// Reviews
export const REVIEW_WEIGHT_WORK = 1.0
export const REVIEW_WEIGHT_CONTACT = 0.3
export const REVIEW_EDIT_WINDOW_MINUTES = 15
export const REVIEW_WITHDRAWAL_WINDOW_DAYS = 14    // debe ser < REVIEW_BLIND_DAYS
export const REVIEW_BLIND_DAYS = 14
export const REVIEW_CONTACT_MIN_HOURS = 2          // mínimo entre reveal y contact_review
export const REVIEW_CONTACT_MAX_DAYS = 30          // ventana para contact_review
export const REVIEW_WORK_MAX_DAYS = 60             // ventana para work_review desde active
export const REVIEW_REMINDER_DAYS = [3, 10]        // días para recordatorios

// Work records
export const WORK_RECORD_PRO_WINDOW_DAYS = 60      // días desde contact_event para crear
export const WORK_RECORD_CLIENT_CLAIM_MIN_DAYS = 7 // días mínimos para reclamar
export const WORK_RECORD_CLIENT_CLAIM_MAX_DAYS = 30// días máximos para reclamar
export const WORK_RECORD_PRO_CONFIRM_DAYS = 7      // días para confirmar/disputar

// Contact events
export const CONTACT_RATE_LIMIT_PAIR_DAYS = 30     // días entre reveals del mismo par
export const CONTACT_RATE_LIMIT_PER_DAY = 10       // reveals máx por usuario por día
export const CONTACT_RATE_LIMIT_PER_WEEK = 30      // reveals máx por usuario por semana
export const CONTACT_IP_RETENTION_DAYS = 90        // días que se guarda la IP

// Ranking
export const RANKING_WEIGHT_SCORE = 0.60
export const RANKING_WEIGHT_VOLUME = 0.25
export const RANKING_WEIGHT_PROFILE = 0.15
export const NEW_PROFESSIONAL_BOOST_FACTOR = 0.20
export const NEW_PROFESSIONAL_BOOST_DAYS = 60

// Triggers de revisión admin
export const DISPUTE_TRIGGER_RAPID_COUNT = 2
export const DISPUTE_TRIGGER_RAPID_DAYS = 60
export const DISPUTE_TRIGGER_RATIO = 0.15
export const DISPUTE_TRIGGER_RATIO_MIN_CONTACTS = 10
export const DISPUTE_TRIGGER_HISTORICAL = 5

// Score display
export const SCORE_MIN_REVIEWS_FOR_STARS = 3
```

---

## 14. Lo que NO cambia

Para evitar confusión: estas decisiones del diseño original se mantienen sin cambios.

- Double-blind de 14 días: se mantiene.
- Work_review peso 1.0, contact_review peso 0.3: se mantiene (ahora constantes).
- Límite de 10 fotos de portfolio por profesional: se mantiene.
- Las reseñas no tienen fotos en Fase 1: se mantiene.
- El teléfono solo se revela a usuarios con sesión activa: se mantiene.
- Un solo oficio primario por profesional: se mantiene.
- Cobertura por departamentos (no por radio): se mantiene.
- Admin separado de perfiles profesionales, sin solapamiento de roles: se mantiene.
- Calificaciones de clientes (`client_ratings`) privadas, solo visibles para profesionales: se mantiene.
- Reportes con resolución manual en Fase 1: se mantiene.
- Migraciones nunca con --shadow-database-url apuntando a la base real: se mantiene.

---

## 15. Flujo completo del sistema — diagrama de decisión

```
contact_event (cliente revela teléfono)
     │
     ├─ Sin work_record en 30 días
     │       └─ contact_review disponible (2h a 30 días post-reveal)
     │              Semántica: calidad del primer contacto
     │
     └─ Con work_record vinculado
              │
              ├─ Creado por profesional
              │       └─ work_review habilitada para ambas partes (hasta 60 días)
              │              Semántica: calidad del trabajo
              │
              └─ Reclamo del cliente (día 7 a 30)
                        │
                        ├─ Profesional confirma (7 días)
                        │       └─ work_review habilitada para ambas partes
                        │
                        └─ Profesional disputa / no responde → admin
                                  │
                                  ├─ Admin confirma trabajo
                                  │       └─ work_review habilitada
                                  │
                                  ├─ Admin rechaza reclamo
                                  │       └─ work_record cancelado, ninguna reseña
                                  │
                                  └─ Admin: sin evidencia suficiente
                                            └─ Disputa registrada internamente
                                               Ningún registro en perfil público
                                               Contribuye a triggers de revisión
```

---

*Documento generado en sesión de diseño: junio 2026. Próxima revisión: cuando haya datos reales de uso.*


## Ratio de conversión contactos → trabajos

El ratio no es un trigger de revisión. Es contexto que el admin 
ve únicamente cuando ya existe otra señal activa (disputa, reclamo, 
trigger por patrón).

Un profesional con 500 contactos y 12 work records puede estar 
cobrando más caro, siendo muy selectivo, o trabajando en nichos 
donde el cliente pide varios presupuestos antes de decidir. Eso 
es legítimo y no genera ninguna alerta.

El ratio aparece como dato adicional en la vista de detalle del 
admin cuando ese perfil ya fue marcado por un trigger existente. 
No aparece en la lista general de profesionales ni afecta el score.