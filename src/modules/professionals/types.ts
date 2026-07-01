import { z } from "zod";
import { ReviewType } from "@prisma/client";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export type ProfessionalTradeSummary = {
  name: string;
  slug: string;
};

export type ProfessionalDepartmentSummary = {
  name: string;
  slug: string;
};

// ---------- Home pública ----------

export type FeaturedProfessional = {
  id: string;
  slug: string;
  fullName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  primaryTrade: string;
  department: string | null;
  averageRating: number;
  reviewCount: number;
};

export type PlatformStats = {
  totalProfessionals: number;
  totalReviews: number;
  verifiedProfessionals: number;
};

export type SearchablePrimaryTrade = {
  name: string;
  slug: string;
  categoryName: string;
};

export type SearchableLatestReview = {
  rating: number;
  comment: string | null;
  reviewerName: string;
};

export type SearchableProfessional = {
  id: string;
  slug: string;
  fullName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  primaryTrade: SearchablePrimaryTrade | null;
  allTrades: string[];
  departments: string[];
  primaryDepartmentName: string | null;
  averageRating: number;
  reviewCount: number;
  completedJobsCount: number;
  yearsExperience: number;
  profileScore: number;
  superbobScore: number;
  latestReview: SearchableLatestReview | null;
};

const yearsExperienceSchema = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number()
    .int()
    .min(0, "No puede ser negativo")
    .max(80, "Valor inválido")
    .optional(),
);

export const SecondaryTradeSchema = z.object({
  tradeId: z.string().uuid("Elegí un oficio"),
  yearsExperience: yearsExperienceSchema,
  specialties: z.array(z.string()).default([]),
});

export const CreateProfessionalProfileSchema = z
  .object({
    bio: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(10000).optional(),
    ),
    contactPhone: z
      .string()
      .trim()
      .min(8, "Ingresá un número de teléfono válido")
      .regex(/^[\d\s\+\-\(\)]+$/, "Solo números, espacios y +/-/()"),
    primaryTradeId: z.string().uuid("Elegí un oficio principal"),
    primaryYearsExperience: yearsExperienceSchema,
    primarySpecialties: z.array(z.string()).default([]),
    secondaryTrades: z
      .array(SecondaryTradeSchema)
      .max(4, "Máximo 4 oficios secundarios"),
    departmentIds: z
      .array(z.string().uuid())
      .min(1, "Elegí al menos una zona de cobertura"),
    primaryDepartmentId: z.string().uuid().optional(),
  })
  .refine(
    (data) =>
      !data.secondaryTrades.some((t) => t.tradeId === data.primaryTradeId),
    {
      message: "Un oficio secundario no puede repetir el principal",
      path: ["secondaryTrades"],
    },
  )
  .refine(
    (data) => {
      const ids = data.secondaryTrades.map((t) => t.tradeId);
      return new Set(ids).size === ids.length;
    },
    {
      message: "No repitas el mismo oficio secundario",
      path: ["secondaryTrades"],
    },
  );

// z.input (no z.infer/z.output): los campos numéricos usan z.coerce.number(),
// así que lo que el caller debe poder pasar es string | number | undefined,
// no ya el número validado.
export type CreateProfessionalProfileInput = z.input<
  typeof CreateProfessionalProfileSchema
>;

export type CreateProfessionalProfileActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  professionalId?: string;
};

export type ProfessionalPortfolioPhoto = {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  caption: string | null;
};

// ---------- Perfil público completo (/p/[slug]) ----------

export type ProfessionalTradeForProfile = {
  tradeId: string;
  name: string;
  slug: string;
  isPrimary: boolean;
  yearsExperience: number | null;
  specialties: string[];
  completedWorkCount: number;
};

export type ProfessionalReviewForProfile = {
  id: string;
  reviewerId: string;
  reviewerDisplayName: string;
  reviewerAvatarUrl: string | null;
  reviewsGivenCount: number;
  tradeName: string;
  rating: number;
  comment: string | null;
  publishedAt: Date;
  reviewType: ReviewType;
};

export type ProfessionalFullProfile = {
  id: string;
  userId: string;
  slug: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  specialties: string[];
  isVerified: boolean;
  qrCodeUrl: string | null;
  createdAt: Date;
  primaryTrade: ProfessionalTradeSummary | null;
  primaryDepartmentName: string | null;
  trades: ProfessionalTradeForProfile[];
  departments: ProfessionalDepartmentSummary[];
  photos: ProfessionalPortfolioPhoto[];
  reviews: ProfessionalReviewForProfile[];
  weightedScore: number | null;
  publishedReviewsCount: number;
  ratingHistogram: Record<1 | 2 | 3 | 4 | 5, number>;
  completedWorkRecordsCount: number;
  satisfactionRate: number | null;
};

export type PrivateSuperbobScoreComponent = {
  label: string;
  emoji: string;
  value: number;
  max: number;
  hint: string | null;
};

export type PrivateSuperbobScoreBreakdown = {
  total: number;
  components: PrivateSuperbobScoreComponent[];
};

export type ProfessionalBadge = {
  id: "verified" | "fast-response" | "top-department" | "frequent-clients" | "100-jobs";
  label: string;
};

export type ProfileCompletionItem = {
  label: string;
  completed: boolean;
  points: number;
  actionHref?: string;
};

export type ProfileCompletenessLevel = "Básico" | "Completo" | "Destacado" | "Verificado";

export type ProfileCompleteness = {
  score: number;
  level: ProfileCompletenessLevel;
  items: ProfileCompletionItem[];
};

export type ContactMetrics = {
  contactsThisMonth: number;
  responseTimeLabel: string;
};

export type ProfessionalDashboardMetrics = {
  totalContacts: number;
  contacts30d: number;
  reviewsReceived: number;
  verifiedWorkRecords: number;
  conversionRate: number;
};

export type ProfessionalSecondaryTradeForEdit = {
  tradeId: string;
  yearsExperience: number | null;
  specialties: string[];
};

export type ProfessionalProfileForEdit = {
  id: string;
  slug: string;
  bio: string | null;
  contactPhone: string | null;
  primaryTradeId: string | null;
  primaryYearsExperience: number | null;
  primarySpecialties: string[];
  secondaryTrades: ProfessionalSecondaryTradeForEdit[];
  departmentIds: string[];
  primaryDepartmentId: string | null;
};

const statusFilterSchema = z.preprocess(
  emptyToUndefined,
  z.enum(["yes", "no"]).optional(),
);

export const AdminProfessionalListParamsSchema = z.object({
  tradeId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  departmentId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  active: statusFilterSchema,
  verified: statusFilterSchema,
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).catch(1),
});

export type AdminProfessionalListParams = z.infer<
  typeof AdminProfessionalListParamsSchema
>;

export type AdminProfessionalListItem = {
  id: string;
  slug: string;
  fullName: string;
  primaryTradeName: string | null;
  primaryDepartmentName: string | null;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  publishedReviewCount: number;
};

export type AdminProfessionalListResult = {
  professionals: AdminProfessionalListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type UpdateProfessionalStatusActionState = {
  error?: string;
};

// ---------- Admin — Detalle de profesional ----------

export type ProfessionalSanctionType =
  | "warning"
  | "temporary_suspension"
  | "permanent_deactivation";

export type ProfessionalSanctionRecord = {
  id: string;
  type: ProfessionalSanctionType;
  reason: string;
  notes: string | null;
  imposedAt: Date;
  expiresAt: Date | null;
  liftedAt: Date | null;
};

export type AdminProfessionalDisputeRecord = {
  id: string;
  clientName: string;
  tradeName: string | null;
  status: string;
  disputeResolution: string | null;
  createdAt: Date;
  disputeResolvedAt: Date | null;
};

export type ReviewModerationEventSummary = {
  action: string;
  reason: string;
  adminName: string;
  createdAt: Date;
};

export type AdminProfessionalPublishedReview = {
  id: string;
  rating: number;
  comment: string | null;
  reviewerName: string;
  publishedAt: Date;
  type: string;
  tradeName: string;
  suspendedAt: Date | null;
  moderationEvents: ReviewModerationEventSummary[];
};

export type AdminProfessionalDetail = {
  id: string;
  slug: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  contactPhone: string | null;
  isActive: boolean;
  isVerified: boolean;
  newProfessionalBoostUntil: Date | null;
  createdAt: Date;
  primaryTradeName: string | null;
  primaryDepartmentName: string | null;
  allTrades: string[];
  departments: string[];
  sanctions: ProfessionalSanctionRecord[];
  activeSanction: ProfessionalSanctionRecord | null;
  disputes: AdminProfessionalDisputeRecord[];
  totalContacts: number;
  activeWorkRecords: number;
  publishedReviewCount: number;
  publishedReviews: AdminProfessionalPublishedReview[];
};

export const CreateSanctionSchema = z.object({
  professionalId: z.string().min(1),
  type: z.enum(["warning", "temporary_suspension", "permanent_deactivation"]),
  reason: z
    .string()
    .min(3, "Ingresá un motivo de al menos 3 caracteres")
    .max(1000),
  expiresAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
    .optional(),
  confirmName: z.string().optional(),
}).refine(
  (data) =>
    data.type !== "temporary_suspension" ||
    (data.expiresAt !== undefined && data.expiresAt.length > 0),
  { message: "La fecha de vencimiento es requerida", path: ["expiresAt"] },
);

export type CreateSanctionInput = z.infer<typeof CreateSanctionSchema>;

export type CreateSanctionActionState = {
  error?: string;
  success?: boolean;
};

export const SetBoostSchema = z.object({
  professionalId: z.string().min(1),
  boostUntil: z.string().optional(),
});

export type SetBoostInput = z.infer<typeof SetBoostSchema>;

export type SetBoostActionState = {
  error?: string;
  success?: boolean;
};
