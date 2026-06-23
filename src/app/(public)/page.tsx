import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const QUICK_TRADES = [
  { label: "Buscar plomeros", slug: "plomeria" },
  { label: "Buscar electricistas", slug: "electricidad" },
  { label: "Buscar albañiles", slug: "albanileria" },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <section className="text-center">
        <h1 className="font-display text-[28px] font-bold leading-tight text-sb-text dark:text-sb-text-dark">
          Profesionales recomendados en tu zona.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-sb-muted dark:text-sb-muted-dark">
          Dejá de preguntar en el grupo de WhatsApp del barrio. Encontrá
          plomeros, electricistas y albañiles con reseñas reales de gente que
          ya los contrató.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/search">
            <Button variant="primary" className="w-full sm:w-auto">
              Buscar un profesional
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="accent" className="w-full sm:w-auto">
              Activar perfil profesional
            </Button>
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {QUICK_TRADES.map((trade) => (
            <Link
              key={trade.slug}
              href={`/search?trade=${trade.slug}`}
              className="text-sm font-medium text-sb-blue underline"
            >
              {trade.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        <Card>
          <h2 className="font-display text-[20px] font-semibold">
            Confianza ganada
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-sb-muted dark:text-sb-muted-dark">
            Las reseñas se publican cuando ambas partes califican, o a los 14
            días. Nadie edita su propia reputación.
          </p>
        </Card>
        <Card>
          <h2 className="font-display text-[20px] font-semibold">
            Respeto al oficio
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-sb-muted dark:text-sb-muted-dark">
            Perfiles con fotos de trabajos reales, años de experiencia y
            verificación, no solo un nombre y un teléfono.
          </p>
        </Card>
        <Card>
          <h2 className="font-display text-[20px] font-semibold">
            Sin vueltas
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-sb-muted dark:text-sb-muted-dark">
            Buscás por oficio y zona, ves el historial, y contactás
            directo. Nada más.
          </p>
        </Card>
      </section>
    </main>
  );
}
