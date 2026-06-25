import Image from "next/image";
import Link from "next/link";
import { FeaturedProfessional } from "@/modules/professionals/types";
import { getTradeColor } from "@/lib/tradeColors";

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

/**
 * FeaturedProfessional solo trae el nombre del oficio (no el slug real de
 * trades). Replica exactamente el slugify de prisma/seed/trades.ts para
 * que el nombre mapee al mismo slug con el que se sembró la DB.
 */
function slugifyTradeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProfessionalCard({
  professional,
  className = "",
}: ProfessionalCardProps) {
  const roundedRating = Math.round(professional.averageRating);
  const bannerColor = getTradeColor(slugifyTradeName(professional.primaryTrade));

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-sb-border bg-white ${className}`}
    >
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

      <div className="px-5 pb-5 pt-10 text-center">
        <p className="truncate font-display text-[15px] font-semibold text-sb-text">
          {professional.fullName}
        </p>
        <p className="truncate text-[13px] text-sb-muted">
          {professional.primaryTrade}
        </p>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-[13px] text-sb-muted">
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
          <div className="mt-3 flex items-center justify-center gap-2">
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
    </div>
  );
}
