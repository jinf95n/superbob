import Link from "next/link";
import { ProfessionalSearchItem } from "@/modules/professionals/types";
import { StarRating } from "./StarRating";

type ProfessionalCardProps = {
  professional: ProfessionalSearchItem;
};

const MAX_VISIBLE_DEPARTMENTS = 2;

export function ProfessionalCard({ professional }: ProfessionalCardProps) {
  const visibleDepartments = professional.departments.slice(
    0,
    MAX_VISIBLE_DEPARTMENTS,
  );
  const extraDepartmentCount =
    professional.departments.length - visibleDepartments.length;

  return (
    <Link
      href={`/p/${professional.slug}`}
      className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-center gap-3">
        {professional.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={professional.avatarUrl}
            alt={professional.fullName}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sb-card-blue text-xl font-semibold text-sb-blue">
            {professional.fullName.charAt(0).toUpperCase()}
          </div>
        )}

        <div>
          <p className="font-display flex items-center gap-1 text-[18px] font-semibold text-sb-text">
            {professional.fullName}
            {professional.isVerified && (
              <span
                title="Profesional verificado"
                className="text-sb-success"
                aria-label="Verificado"
              >
                ✓
              </span>
            )}
          </p>
          {professional.primaryTrade && (
            <span className="mt-1 inline-block rounded-full bg-sb-card-orange px-3 py-0.5 text-[13px] font-medium text-sb-orange">
              {professional.primaryTrade.name}
            </span>
          )}
        </div>
      </div>

      <StarRating
        score={professional.score}
        reviewCount={professional.reviewCount}
      />

      {professional.bio && (
        <p className="line-clamp-2 text-sm text-sb-muted">
          {professional.bio}
        </p>
      )}

      {visibleDepartments.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {visibleDepartments.map((department) => (
            <span
              key={department.slug}
              className="rounded-full bg-sb-card-blue px-2.5 py-0.5 text-xs font-medium text-sb-blue"
            >
              {department.name}
            </span>
          ))}
          {extraDepartmentCount > 0 && (
            <span className="rounded-full bg-sb-card-blue px-2.5 py-0.5 text-xs font-medium text-sb-blue">
              +{extraDepartmentCount}
            </span>
          )}
        </div>
      )}

      <span className="mt-1 flex h-11 w-full items-center justify-center rounded-full bg-sb-blue text-[15px] font-medium text-white">
        Ver perfil
      </span>
    </Link>
  );
}
