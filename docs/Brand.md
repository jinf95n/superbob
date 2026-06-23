# SUPERBOB — Brand Identity v1.0

---

## Personalidad de marca

SUPERBOB es el vecino que sabe todo. No una corporación, no una app de Silicon Valley — la persona del barrio que te dice "llamá a Raúl, hace años que le arregla la instalación a todo el mundo y nunca falló".

**Cuatro valores que estructuran todo:**

- **Confianza ganada.** No se declama, se demuestra. Las reseñas, las fotos, el historial construyen la reputación.
- **Cercanía sin chabacanería.** Hablamos como personas reales, no como manual corporativo.
- **Respeto al oficio.** El plomero, el electricista, el albañil tienen un oficio con historia y dignidad. Se los trata como profesionales.
- **Pragmatismo rioplatense.** Sin rodeos. La interfaz no hace promesas vacías ni pone fricciones innecesarias.

---

## Nombre

Siempre en mayúsculas sostenidas, sin separación, sin punto: `SUPERBOB`

Nunca: `Super Bob` / `Superbob` / `superbob`

**Tagline Fase 1:** "Profesionales recomendados en tu zona."

---

## Colores

### Tokens principales

```
--sb-blue:      #1A6FE0   (primario — azul SUPERBOB)
--sb-orange:    #F5820D   (secundario — naranja oficio)
```

### Neutros

```
--sb-bg:        #F7F7F5   (fondo claro)
--sb-bg-dark:   #111210   (fondo oscuro)
--sb-text:      #1A1A18   (texto principal claro)
--sb-text-dark: #F0F0EE   (texto principal oscuro)
--sb-muted:     #5A5A58   (texto secundario claro)
--sb-muted-dark:#9A9A98   (texto secundario oscuro)
--sb-border:    #E2E2DF   (bordes claro)
--sb-border-dark:#2E2E2C  (bordes oscuro)
```

### Estados

```
--sb-success:   #18A058
--sb-error:     #D93026
--sb-warning:   #E88A00
--sb-info:      #1A6FE0   (mismo que primario)
```

### En Tailwind config

```js
// tailwind.config.js
colors: {
  'sb-blue':    '#1A6FE0',
  'sb-orange':  '#F5820D',
  'sb-success': '#18A058',
  'sb-error':   '#D93026',
  'sb-warning': '#E88A00',
}
```

---

## Tipografía

Fuentes: Google Fonts, gratuitas, precargar en `layout.tsx`.

```
Font display:  DM Sans   — weights 600, 700
Font body:     Inter     — weights 400, 500, 700
```

### Escala

| Uso | Fuente | Weight | Size | Line-height |
|---|---|---|---|---|
| Heading display | DM Sans | 700 | 28px | 1.2 |
| Heading sección | DM Sans | 600 | 20px | 1.3 |
| Cuerpo principal | Inter | 400 | 16px | 1.6 |
| Labels / metadata | Inter | 400 | 13px | 1.4 |
| Botones | Inter | 500 | 15px | — |

Mínimo absoluto en móvil: **13px**. Nada por debajo.

### En Next.js / layout.tsx

```tsx
import { Inter, DM_Sans } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['600', '700'],
  display: 'swap',
})
```

---

## Tono de voz

Segunda persona singular. Sin "usted". Sin puntos suspensivos que generen ansiedad. Sin signos de exclamación en cascada.

**Principio:** directo, cálido, sin relleno.

### Botones — siempre específicos

```
✓  "Ver teléfono"
✓  "Dejar una reseña"
✓  "Buscar electricistas"
✓  "Activar perfil profesional"
✗  "Enviar"
✗  "Aceptar"
✗  "Continuar"
```

### Errores — nunca culpar, nunca tecnicismos

```
"No pudimos guardar los cambios. Revisá tu conexión y volvé a intentarlo."
"Este número ya tiene una cuenta. ¿Querés ingresar con él?"
"No encontramos profesionales en esa zona todavía. Podés buscar en departamentos cercanos."
```

### Notificaciones

```
"Alguien vio tu teléfono desde SUPERBOB. Contacto registrado hoy a las 14:30."
"Juan Pérez dejó una reseña de tu trabajo. Ya está publicada."
"Completá tu perfil — los perfiles con foto reciben 3 veces más contactos."
```

### Estados vacíos

```
"Todavía no tenés reseñas. Cuando termines un trabajo, pedile al cliente que te califique."
"No hay profesionales registrados en este departamento todavía."
```

### Confirmaciones

```
"Listo. Tu reseña se publica en 14 días o antes si el profesional también califica."
"Guardado. Tu perfil ya es visible para clientes en San Juan."
```

### Nunca usar

```
✗  "¡Genial!"
✗  "¡Felicitaciones!"
✗  "Por favor aguardá"
✗  "Su solicitud está siendo procesada"
✗  "Oops"
✗  "¡Ups!"
```

---

## Logo

El logo lo gestiona el founder por separado. Claude Code no debe generar, sugerir ni modificar el logo.

En código, usar el wordmark `SUPERBOB` en DM Sans 700, color `#1A6FE0`, como placeholder hasta que el activo final esté disponible.

Cuando el logo esté listo, vivirá en `public/logo.svg` e `public/logo-white.svg`.

---

## Componentes de UI — criterios de marca

- Botones primarios: `bg-sb-blue text-white`, border-radius 8px
- Botones secundarios: `border border-sb-blue text-sb-blue bg-transparent`
- Botones de acento: `bg-sb-orange text-white`
- Badges de estado: usar colores semánticos (`sb-success`, `sb-error`, `sb-warning`)
- Bordes: 1px sólido, color `#E2E2DF` en claro / `#2E2E2C` en oscuro
- Corner radius base: 8px (componentes), 12px (cards)
- Sombras: ninguna en Fase 1. Flat design.

## Dirección visual

Referencia principal: YoMeAnimo.com — fondo blanco, tipografía 
pesada y colorida, secciones con color de fondo vibrante, 
sensación cálida y cercana.

- Secciones alternadas: fondo blanco y fondo sb-blue suave (#EEF4FD)
- Headings grandes, DM Sans 800 donde sea posible
- Cards con color de fondo, nunca blanco sobre blanco
- Emojis permitidos como iconos en la home y categorías
- Botones grandes, redondeados, con color fuerte
- Nada de grises apagados como protagonistas
- Energía visual alta, sin ser ruidoso