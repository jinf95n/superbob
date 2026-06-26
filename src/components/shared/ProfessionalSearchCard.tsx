import { SearchableProfessional } from "@/modules/professionals/types";
import { ProfessionalCard, type ProfessionalCardData } from "./ProfessionalCard";

type ProfessionalSearchCardProps = {
  professional: SearchableProfessional;
};

export function ProfessionalSearchCard({
  professional,
}: ProfessionalSearchCardProps) {
  const data: ProfessionalCardData = {
    id: professional.id,
    slug: professional.slug,
    fullName: professional.fullName,
    avatarUrl: professional.avatarUrl,
    isVerified: professional.isVerified,
    primaryTradeName: professional.primaryTrade?.name ?? null,
    tradeSlug: professional.primaryTrade?.slug ?? null,
    department: professional.primaryDepartmentName,
    averageRating: professional.averageRating,
    reviewCount: professional.reviewCount,
    completedJobsCount: professional.completedJobsCount,
    yearsExperience: professional.yearsExperience,
    memberSince: professional.createdAt.getFullYear(),
  };

  return <ProfessionalCard data={data} showMetrics showPhoneReveal />;
}
