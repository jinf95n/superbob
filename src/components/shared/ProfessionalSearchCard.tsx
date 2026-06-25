import Image from "next/image";
import Link from "next/link";
import { SearchableProfessional } from "@/modules/professionals/types";
import { getTradeColor } from "@/lib/tradeColors";
import { PhoneReveal } from "./PhoneReveal";

type ProfessionalSearchCardProps = {
  professional: SearchableProfessional;
};

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      width="14"
      height="14"
      className={filled ? "text-sb-orange" : "text-sb-border"}
    >
      <path
        fill="currentColor"
        d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.9l-5.2 2.61.99-5.79-4.21-4.1 5.82-.85L10 1.5Z"
      />
    </svg>
  );
}

export function ProfessionalSearchCard({
  professional,
}: ProfessionalSearchCardProps) {
  const roundedRating = Math.round(professional.averageRating);
  const firstDepartment = professional.departments[0] ?? null;
  const sinceYear = professional.createdAt.getFullYear();
  const bannerColor = getTradeColor(professional.primaryTrade?.slug);

  return (
    <div className="rounded-2xl border-[1.5px] border-sb-border bg-white transition-colors duration-150 ease-in-out hover:border-sb-blue">
      <div
        className="relative h-[100px] overflow-hidden rounded-t-2xl"
        style={{ backgroundColor: bannerColor }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {professional.isVerified && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-sb-success px-2.5 py-1 text-[11px] font-medium text-white">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Verificado
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <div className="relative -mt-10 z-10">
          {professional.avatarUrl ? (
            <div className="h-20 w-20 overflow-hidden rounded-full border-[3px] border-white">
              <Image
                src={professional.avatarUrl}
                alt={professional.fullName}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-sb-blue">
              <Image
                src="/images/isotipo.png"
                alt="SUPERBOB"
                width={48}
                height={48}
                className="object-contain brightness-0 invert opacity-60"
              />
            </div>
          )}
        </div>
      </div>

      <div className="px-3 pb-4 pt-3">
        <div className="text-center">
          <p className="truncate font-display text-[17px] font-bold text-sb-text">
            {professional.fullName}
          </p>
          <p className="mt-[2px] text-[14px] text-sb-muted">
            {professional.primaryTrade?.name ?? "Profesional"}
          </p>

          {firstDepartment && (
            <p className="mt-1 flex items-center justify-center gap-[6px] text-[13px] text-sb-muted">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="shrink-0"
              >
                <path d="M12 21s-7-7.2-7-12a7 7 0 1 1 14 0c0 4.8-7 12-7 12Z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              Atiende en {firstDepartment}
            </p>
          )}

          {professional.reviewCount > 0 && (
            <div className="mt-[6px] flex items-center justify-center gap-[6px]">
              <span className="flex items-center gap-[2px]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <StarIcon key={index} filled={index < roundedRating} />
                ))}
              </span>
              <span className="font-display text-[15px] font-bold text-sb-text">
                {professional.averageRating.toFixed(1)}
              </span>
              <span className="text-[13px] text-sb-muted">
                ({professional.reviewCount} reseña
                {professional.reviewCount === 1 ? "" : "s"})
              </span>
            </div>
          )}
        </div>

        <div className="mt-[10px] flex">
          <div className="flex flex-1 flex-col items-center border-r border-sb-border py-2">
            <span className="font-display text-[16px] font-bold text-sb-text">
              {professional.completedJobsCount > 0
                ? professional.completedJobsCount
                : "—"}
            </span>
            <span className="text-[11px] text-sb-muted">Trabajos</span>
          </div>
          <div className="flex flex-1 flex-col items-center border-r border-sb-border py-2">
            <span className="font-display text-[16px] font-bold text-sb-text">
              {professional.yearsExperience > 0
                ? `${professional.yearsExperience} años`
                : "—"}
            </span>
            <span className="text-[11px] text-sb-muted">Experiencia</span>
          </div>
          <div className="flex flex-1 flex-col items-center py-2">
            <span className="font-display text-[16px] font-bold text-sb-text">
              {sinceYear}
            </span>
            <span className="text-[11px] text-sb-muted">Desde</span>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <Link
            href={`/p/${professional.slug}`}
            className="flex h-11 w-full items-center justify-center rounded-[10px] bg-sb-blue text-[14px] font-semibold text-white"
          >
            Ver perfil
          </Link>
          <PhoneReveal
            professionalId={professional.id}
            source="search"
            variant="inline"
          />
        </div>
      </div>
    </div>
  );
}
