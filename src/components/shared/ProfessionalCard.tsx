import Image from "next/image";
import Link from "next/link";
import { FeaturedProfessional } from "@/modules/professionals/types";

type ProfessionalCardProps = {
  professional: FeaturedProfessional;
  className?: string;
};

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

export function ProfessionalCard({
  professional,
  className = "",
}: ProfessionalCardProps) {
  const roundedRating = Math.round(professional.averageRating);

  return (
    <div
      className={`relative rounded-2xl border border-sb-border bg-white p-5 ${className}`}
    >
      {professional.isVerified && (
        <span className="absolute right-4 top-4 rounded-full bg-[#EAF3DE] px-2.5 py-1 text-[11px] font-medium text-[#3B6D11]">
          ✓ Verificado
        </span>
      )}

      <div className="flex items-center gap-3 pr-16">
        {professional.avatarUrl ? (
          <Image
            src={professional.avatarUrl}
            alt={professional.fullName}
            width={48}
            height={48}
            sizes="48px"
            className="h-12 w-12 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sb-blue/10 font-display text-[18px] font-bold text-sb-blue">
            {getInitials(professional.fullName)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-display text-[15px] font-semibold text-sb-text">
            {professional.fullName}
          </p>
          <p className="truncate text-[13px] text-sb-muted">
            {professional.primaryTrade}
          </p>
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[13px] text-sb-muted">
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
        {professional.department}
      </p>

      {professional.reviewCount > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <span aria-hidden="true" className="text-sb-orange">
            {"★".repeat(roundedRating)}
            {"☆".repeat(5 - roundedRating)}
          </span>
          <span className="font-display text-[16px] font-bold text-sb-text">
            {professional.averageRating.toFixed(1)}
          </span>
          <span className="text-[13px] text-sb-muted">
            ({professional.reviewCount} reseña
            {professional.reviewCount === 1 ? "" : "s"})
          </span>
        </div>
      )}

      <Link
        href={`/p/${professional.slug}`}
        className="mt-4 flex h-9 w-full items-center justify-center rounded border border-sb-blue text-[14px] font-medium text-sb-blue transition-colors duration-150 ease-in-out hover:bg-sb-blue/5"
      >
        Ver perfil
      </Link>
    </div>
  );
}
