import Link from "next/link";
import {
  getCategoriesWithCounts,
  getAllActiveTrades,
} from "@/modules/trades/queries";
import {
  getFeaturedProfessionals,
  getTopRatedProfessionals,
  getPlatformStats,
} from "@/modules/professionals/queries";
import { getSanJuanDepartments } from "@/modules/geography/queries";
import { HomeSearch } from "@/components/shared/HomeSearch";
import { ProfessionalCard } from "@/components/shared/ProfessionalCard";
import { ProfessionalCTASection } from "@/components/shared/ProfessionalCTASection";

const CATEGORY_ICON_EMOJI: Record<string, string> = {
  construction: "🧱",
  wrench: "🔧",
  hammer: "🔨",
  home: "🏠",
  cpu: "💻",
};

const HOW_IT_WORKS_STEPS = [
  {
    emoji: "🔍",
    title: "Buscá por oficio y zona",
    description: "Escribí lo que necesitás y elegí tu departamento.",
  },
  {
    emoji: "⭐",
    title: "Revisá el perfil y las reseñas",
    description:
      "Fotos de trabajos reales, opiniones verificadas, historial completo.",
  },
  {
    emoji: "📞",
    title: "Contactá directo",
    description: "El teléfono del profesional, sin intermediarios ni comisiones.",
  },
];

export default async function HomePage() {
  const [categories, featuredPros, topRatedPros, stats, trades, departments] =
    await Promise.all([
      getCategoriesWithCounts(),
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
      <section className="bg-sb-blue px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-center text-[32px] font-extrabold text-white sm:text-[48px]">
            Encontrá el profesional ideal para tu hogar
          </h1>
          <p className="mx-auto mt-3 max-w-md text-center text-[16px] text-white/80">
            Reseñas verificadas, contacto directo. Sin intermediarios.
          </p>

          <div className="mt-8">
            <HomeSearch trades={trades} departments={departments} />
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 sm:gap-10">
            <div className="text-center">
              <p className="font-display text-[20px] font-bold text-white">
                {stats.totalProfessionals}
              </p>
              <p className="text-[13px] text-white/80">profesionales</p>
              <p className="text-[13px] text-white/60">registrados</p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-center">
              <p className="font-display text-[20px] font-bold text-white">
                {stats.totalReviews}
              </p>
              <p className="text-[13px] text-white/80">reseñas</p>
              <p className="text-[13px] text-white/60">verificadas</p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-center">
              <p className="font-display text-[20px] font-bold text-white">
                {stats.verifiedProfessionals}
              </p>
              <p className="text-[13px] text-white/80">perfiles</p>
              <p className="text-[13px] text-white/60">verificados</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORÍAS POPULARES */}
      {categories.length > 0 && (
        <section className="bg-white px-4 py-12">
          <div className="mx-auto max-w-5xl">
            <h2 className="font-display text-[22px] font-bold text-sb-text">
              ¿Qué necesitás resolver?
            </h2>
            <p className="mt-1 text-[14px] text-sb-muted">
              Seleccioná una categoría para ver profesionales disponibles en
              tu zona.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/search?trade=${category.slug}`}
                  className="flex flex-col items-center gap-1 rounded-2xl border border-sb-border bg-sb-bg p-5 text-center transition-colors duration-150 ease-in-out hover:border-sb-blue"
                >
                  <span className="text-[32px] leading-none" aria-hidden="true">
                    {(category.icon && CATEGORY_ICON_EMOJI[category.icon]) ||
                      "🛠"}
                  </span>
                  <span className="font-display mt-1 text-[15px] font-semibold text-sb-text">
                    {category.name}
                  </span>
                  <span className="text-[13px] text-sb-muted">
                    {category.professionalCount} profesional
                    {category.professionalCount === 1 ? "" : "es"}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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
      <section className="bg-white px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-center text-[22px] font-bold text-sb-text">
            Así de simple
          </h2>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-stretch">
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <div key={step.title} className="flex flex-1 items-center gap-4">
                <div className="flex-1 rounded-2xl bg-sb-bg p-6">
                  <span className="text-[40px] leading-none" aria-hidden="true">
                    {step.emoji}
                  </span>
                  <h3 className="font-display mt-3 text-[16px] font-semibold text-sb-text">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-[14px] text-sb-muted">
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
                    strokeLinejoin="round"
                    className="hidden shrink-0 text-sb-muted sm:block"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
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
