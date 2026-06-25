import Image from "next/image";
import Link from "next/link";
import { SearchableProfessional } from "@/modules/professionals/types";
import { getTradeColor } from "@/lib/tradeColors";
import { PhoneReveal } from "./PhoneReveal";

type ProfessionalSearchCardProps = {
  professional: SearchableProfessional;
};

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

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
    <div className="overflow-hidden rounded-2xl border-[1.5px] border-sb-border bg-white transition-colors duration-150 ease-in-out hover:border-sb-blue">
      <div
        className="relative h-[120px] overflow-hidden"
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

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          {professional.avatarUrl ? (
            <div className="h-16 w-16 overflow-hidden rounded-full border-[3px] border-white">
              <Image
                src={professional.avatarUrl}
                alt={professional.fullName}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-white bg-white">
              <span className="font-display text-xl font-bold text-sb-blue">
                {getInitials(professional.fullName)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 pt-10">
        <div className="text-center">
          <p className="truncate font-display text-[17px] font-bold text-sb-text">
            {professional.fullName}
          </p>
          <p className="mt-1 text-[14px] text-sb-muted">
            {professional.primaryTrade?.name ?? "Profesional"}
          </p>

          {firstDepartment && (
            <p className="mt-[6px] flex items-center justify-center gap-[6px] text-[13px] text-sb-muted">
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
              {firstDepartment}
            </p>
          )}

          {professional.reviewCount > 0 && (
            <div className="mt-2 flex items-center justify-center gap-[6px]">
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

        <div className="mt-3 flex">
          <div className="flex flex-1 flex-col items-center border-r border-sb-border">
            <span className="font-display text-[16px] font-bold text-sb-text">
              {professional.completedJobsCount > 0
                ? professional.completedJobsCount
                : "—"}
            </span>
            <span className="text-[11px] text-sb-muted">Trabajos</span>
          </div>
          <div className="flex flex-1 flex-col items-center border-r border-sb-border">
            <span className="font-display text-[16px] font-bold text-sb-text">
              {professional.yearsExperience > 0
                ? `${professional.yearsExperience} años`
                : "—"}
            </span>
            <span className="text-[11px] text-sb-muted">Experiencia</span>
          </div>
          <div className="flex flex-1 flex-col items-center">
            <span className="font-display text-[16px] font-bold text-sb-text">
              {sinceYear}
            </span>
            <span className="text-[11px] text-sb-muted">Desde</span>
          </div>
        </div>

        {professional.bio && (
          <p className="mt-3 overflow-hidden text-[13px] leading-[1.5] text-sb-muted [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box]">
            {professional.bio}
          </p>
        )}

        <div className="mt-[14px] flex flex-col gap-2">
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
