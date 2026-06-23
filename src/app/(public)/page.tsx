import Link from "next/link";

const CATEGORIES = [
  { emoji: "🔧", label: "Plomería", slug: "plomeria" },
  { emoji: "⚡", label: "Electricidad", slug: "electricidad" },
  { emoji: "🧱", label: "Construcción", slug: "albanileria" },
  { emoji: "🪵", label: "Carpintería", slug: "carpinteria-en-madera" },
  { emoji: "🎨", label: "Pintura", slug: "pintura" },
  { emoji: "📱", label: "Tecnología", slug: "service-de-pc-y-notebooks" },
];

const STEPS = [
  { number: 1, text: "Buscás por oficio y zona" },
  { number: 2, text: "Ves el perfil y las reseñas" },
  { number: 3, text: "Contactás directo" },
];

const REASONS = [
  {
    emoji: "✅",
    title: "Reseñas verificadas",
    description:
      "Nadie edita su propia reputación: las reseñas se publican con doble verificación.",
  },
  {
    emoji: "📍",
    title: "Profesionales de tu zona",
    description: "Filtrás por departamento y encontrás a quién está cerca.",
  },
  {
    emoji: "🆓",
    title: "Gratis para clientes",
    description: "Buscar, ver perfiles y contactar no cuesta nada.",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="bg-white px-4 py-12 text-center sm:py-20">
        <h1 className="font-display mx-auto max-w-2xl text-[40px] font-extrabold leading-[1.1] text-sb-text">
          Encontrá al profesional que necesitás
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[18px] leading-relaxed text-sb-muted">
          Dejá de preguntar en el grupo de WhatsApp del barrio. Encontrá
          plomeros, electricistas y albañiles con reseñas reales.
        </p>

        <div className="mx-auto mt-8 max-w-sm">
          <Link
            href="/search"
            className="flex h-14 w-full items-center justify-center rounded-3xl bg-sb-blue px-6 text-[17px] font-medium text-white"
          >
            Buscar profesionales
          </Link>
          <Link
            href="/register"
            className="mt-4 inline-block text-[15px] font-medium text-sb-orange"
          >
            ¿Sos profesional? Activá tu perfil gratis →
          </Link>
        </div>
      </section>

      <section className="bg-sb-section-alt px-4 py-12">
        <h2 className="font-display text-center text-[24px] font-bold text-sb-text">
          ¿Qué necesitás resolver?
        </h2>

        <div className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
          {CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/search?trade=${category.slug}`}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white p-5 text-center shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
            >
              <span className="text-[64px] leading-none">
                {category.emoji}
              </span>
              <span className="font-display text-[15px] font-semibold text-sb-text">
                {category.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white px-4 py-12">
        <h2 className="font-display text-center text-[24px] font-bold text-sb-text">
          Cómo funciona
        </h2>

        <div className="mx-auto mt-6 flex max-w-md flex-col gap-4">
          {STEPS.map((step) => (
            <div key={step.number} className="flex items-center gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sb-blue font-display text-[18px] font-bold text-white">
                {step.number}
              </span>
              <p className="text-[16px] text-sb-text">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-sb-section-alt px-4 py-12">
        <h2 className="font-display text-center text-[24px] font-bold text-sb-text">
          Por qué SUPERBOB
        </h2>

        <div className="mx-auto mt-6 grid max-w-3xl gap-4 sm:grid-cols-3">
          {REASONS.map((reason) => (
            <div
              key={reason.title}
              className="rounded-2xl bg-white p-5"
            >
              <span className="text-[32px]">{reason.emoji}</span>
              <h3 className="font-display mt-2 text-[16px] font-semibold text-sb-text">
                {reason.title}
              </h3>
              <p className="mt-1 text-[14px] leading-relaxed text-sb-muted">
                {reason.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
