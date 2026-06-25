import Link from "next/link";
import { getAllActiveTrades } from "@/modules/trades/queries";
import {
  getFeaturedProfessionals,
  getTopRatedProfessionals,
  getPlatformStats,
} from "@/modules/professionals/queries";
import { getSanJuanDepartments } from "@/modules/geography/queries";
import { HomeSearch } from "@/components/shared/HomeSearch";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";
import { ProfessionalCTASection } from "@/components/shared/ProfessionalCTASection";

// Contenido editorial fijo, no viene de la base de datos: las 10
// categorías más representativas del universo de oficios del hogar.
const POPULAR_CATEGORIES = [
  { emoji: "🔧", name: "Plomería", slug: "plomeria" },
  { emoji: "⚡", name: "Electricidad", slug: "electricidad" },
  { emoji: "🧱", name: "Albañilería", slug: "albanileria" },
  { emoji: "🎨", name: "Pintura", slug: "pintura" },
  { emoji: "🔥", name: "Gas", slug: "gas" },
  { emoji: "❄️", name: "Aire acondicionado", slug: "aire-acondicionado" },
  { emoji: "🪟", name: "Carpintería", slug: "carpinteria" },
  { emoji: "🏠", name: "Techista", slug: "techista" },
  { emoji: "🧹", name: "Limpieza", slug: "limpieza" },
  { emoji: "🔒", name: "Cerrajería", slug: "cerrajeria" },
];

const HOW_IT_WORKS_STEPS = [
  {
    emoji: "🔍",
    title: "Buscá por oficio y zona",
    description: "Escribí lo que necesitás y elegí tu departamento.",
    circleClass: "bg-sb-blue/10 text-sb-blue",
  },
  {
    emoji: "⭐",
    title: "Revisá el perfil y las reseñas",
    description:
      "Fotos de trabajos reales, opiniones verificadas, historial completo.",
    circleClass: "bg-sb-orange/10 text-sb-orange",
  },
  {
    emoji: "📞",
    title: "Contactá directo",
    description: "El teléfono del profesional, sin intermediarios ni comisiones.",
    circleClass: "bg-sb-success/10 text-sb-success",
  },
];

export default async function HomePage() {
  const [featuredPros, topRatedPros, stats, trades, departments] =
    await Promise.all([
      getFeaturedProfessionals(6),
      getTopRatedProfessionals(3),
      getPlatformStats(),
      getAllActiveTrades(),
      getSanJuanDepartments(),
    ]);

  const featuredGridColsClass =
    featuredPros.length >= 4 ? "sm:grid-cols-3" : "sm:grid-cols-2";

  return (
    <main>
      {/* 1. HERO */}
      <section className="min-h-[480px] bg-sb-blue px-4 pb-10 pt-14 lg:min-h-[520px]">
        <div className="mx-auto max-w-6xl lg:flex lg:items-center lg:gap-12">
          <div className="lg:w-[55%]">
            <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-white/60">
              San Juan · Directorio de oficios
            </p>

            <h1 className="font-display mt-3 text-[44px] font-extrabold leading-[1.1] text-white lg:text-[56px]">
              El profesional que necesitás está en tu{" "}
              <span className="text-sb-orange">barrio</span>.
            </h1>

            <p className="mt-4 max-w-md text-[16px] leading-[1.6] text-white/70">
              Reseñas de vecinos reales. Contacto directo. Sin
              intermediarios.
            </p>

            <div className="mt-8 flex items-center">
              <div className="mr-6 border-r border-white/20 pr-6">
                <p className="font-display text-[28px] font-extrabold text-white">
                  {stats.totalProfessionals}
                </p>
                <p className="text-[12px] text-white/60">
                  profesionales registrados
                </p>
              </div>
              <div className="mr-6 border-r border-white/20 pr-6">
                <p className="font-display text-[28px] font-extrabold text-white">
                  {stats.totalReviews}
                </p>
                <p className="text-[12px] text-white/60">reseñas verificadas</p>
              </div>
              <div>
                <p className="font-display text-[28px] font-extrabold text-white">
                  {stats.verifiedProfessionals}
                </p>
                <p className="text-[12px] text-white/60">
                  perfiles verificados
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 lg:mt-0 lg:w-[45%]">
            <HomeSearch trades={trades} departments={departments} />
          </div>
        </div>
      </section>

      {/* 2. CATEGORÍAS POPULARES */}
      <section className="bg-white px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-[26px] font-extrabold text-sb-text">
              Explorá por oficio
            </h2>
            <Link
              href="/search"
              className="text-[14px] font-normal text-sb-blue"
            >
              Ver todos los oficios →
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2.5 lg:grid-cols-5">
            {POPULAR_CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={`/search?q=${category.slug}`}
                className="flex flex-col items-center rounded-2xl border-[1.5px] border-sb-border bg-sb-bg px-4 py-5 text-center transition-colors duration-150 ease-in-out hover:border-sb-blue hover:bg-white"
              >
                <span
                  role="img"
                  aria-label={category.name}
                  className="mb-2.5 text-[32px] leading-none"
                >
                  {category.emoji}
                </span>
                <span className="font-display line-clamp-2 text-[14px] font-bold leading-[1.3] text-sb-text">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. PROFESIONALES DESTACADOS */}
      {featuredPros.length > 0 && (
        <section className="bg-sb-card-blue px-4 py-12">
          <div className="mx-auto max-w-5xl">
            <h2 className="font-display text-[22px] font-bold text-sb-text">
              Profesionales recomendados
            </h2>
            <p className="mt-1 text-[14px] text-sb-muted">
              Los más contratados y mejor evaluados de San Juan.
            </p>

            <div
              className={`mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:grid sm:gap-4 sm:overflow-visible sm:pb-0 ${featuredGridColsClass}`}
            >
              {featuredPros.map((professional) => (
                <ProfessionalCard
                  key={professional.id}
                  professional={professional}
                  className="w-[280px] shrink-0 snap-start sm:w-full sm:shrink sm:snap-align-none"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. CÓMO FUNCIONA */}
      <section className="bg-[#EEF4FD] px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-center text-[26px] font-extrabold text-sb-text">
            Así de simple
          </h2>
          <p className="mx-auto mb-10 mt-2 max-w-md text-center text-[15px] text-sb-muted">
            Sin comisiones, sin intermediarios, sin vueltas.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <div key={step.title} className="flex flex-1 items-center gap-4">
                <div className="flex-1 rounded-[20px] border-[1.5px] border-sb-border bg-white p-7">
                  <span
                    className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full text-[28px] leading-none ${step.circleClass}`}
                  >
                    <span role="img" aria-label={step.title}>
                      {step.emoji}
                    </span>
                  </span>
                  <h3 className="font-display text-[16px] font-bold text-sb-text">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-[14px] leading-[1.6] text-sb-muted">
                    {step.description}
                  </p>
                </div>
                {index < HOW_IT_WORKS_STEPS.length - 1 && (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="hidden shrink-0 self-center text-sb-blue/40 sm:block"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. MEJOR CALIFICADOS */}
      {topRatedPros.length > 0 && (
        <section className="bg-sb-card-blue px-4 py-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-[22px] font-bold text-sb-text">
              Los mejor calificados
            </h2>
            <p className="mt-1 text-[14px] text-sb-muted">
              Reputación construida trabajo a trabajo.
            </p>

            <div className="mt-6 rounded-2xl bg-white">
              {topRatedPros.map((professional, index) => {
                const roundedRating = Math.round(professional.averageRating);
                return (
                  <div
                    key={professional.id}
                    className={`flex items-center gap-4 p-4 ${
                      index > 0 ? "border-t border-sb-border" : ""
                    }`}
                  >
                    <span className="font-display w-10 shrink-0 text-[32px] font-extrabold text-sb-blue/20">
                      #{index + 1}
                    </span>

                    {professional.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={professional.avatarUrl}
                        alt={professional.fullName}
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sb-blue/10 font-display text-[15px] font-bold text-sb-blue">
                        {professional.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate font-display text-[15px] font-semibold text-sb-text">
                        {professional.fullName}
                        {professional.isVerified && (
                          <span
                            aria-label="Verificado"
                            className="text-sb-success"
                          >
                            ✓
                          </span>
                        )}
                      </p>
                      <p className="truncate text-[13px] text-sb-muted">
                        {professional.primaryTrade}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="font-display text-[24px] font-bold text-sb-text">
                          {professional.averageRating.toFixed(1)}
                        </span>
                        <span aria-hidden="true" className="text-sb-orange">
                          {"★".repeat(roundedRating)}
                          {"☆".repeat(5 - roundedRating)}
                        </span>
                      </div>
                      <p className="text-[13px] text-sb-muted">
                        ({professional.reviewCount} reseña
                        {professional.reviewCount === 1 ? "" : "s"})
                      </p>
                      <Link
                        href={`/p/${professional.slug}`}
                        className="text-[14px] font-medium text-sb-blue"
                      >
                        Ver perfil →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 6. CTA PROFESIONALES */}
      <ProfessionalCTASection />
    </main>
  );
}
