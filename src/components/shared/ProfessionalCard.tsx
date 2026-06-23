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
      className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 transition hover:border-neutral-400"
    >
      <div className="flex items-center gap-3">
        {professional.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={professional.avatarUrl}
            alt={professional.fullName}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200 text-sm font-medium text-neutral-600">
            {professional.fullName.charAt(0).toUpperCase()}
          </div>
        )}

        <div>
          <p className="flex items-center gap-1 font-medium">
            {professional.fullName}
            {professional.isVerified && (
              <span
                title="Profesional verificado"
                className="text-blue-600"
                aria-label="Verificado"
              >
                ✓
              </span>
            )}
          </p>
          {professional.primaryTrade && (
            <p className="text-sm text-neutral-600">
              {professional.primaryTrade.name}
            </p>
          )}
        </div>
      </div>

      <StarRating
        score={professional.score}
        reviewCount={professional.reviewCount}
      />

      {professional.bio && (
        <p className="line-clamp-2 text-sm text-neutral-600">
          {professional.bio}
        </p>
      )}

      {visibleDepartments.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {visibleDepartments.map((department) => (
            <span
              key={department.slug}
              className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700"
            >
              {department.name}
            </span>
          ))}
          {extraDepartmentCount > 0 && (
            <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
              +{extraDepartmentCount}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
