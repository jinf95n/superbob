import { z } from "zod";
import { ReviewType } from "@prisma/client";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const SearchProfessionalsParamsSchema = z.object({
  trade: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  department: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  page: z.coerce.number().int().min(1).catch(1),
});

export type SearchProfessionalsParams = z.infer<
  typeof SearchProfessionalsParamsSchema
>;

export type ProfessionalTradeSummary = {
  name: string;
  slug: string;
};

export type ProfessionalDepartmentSummary = {
  name: string;
  slug: string;
};

export type ProfessionalSearchItem = {
  id: string;
  slug: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  primaryTrade: ProfessionalTradeSummary | null;
  trades: ProfessionalTradeSummary[];
  departments: ProfessionalDepartmentSummary[];
  score: number | null;
  reviewCount: number;
};

export type SearchProfessionalsResult = {
  professionals: ProfessionalSearchItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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
});

export const CreateProfessionalProfileSchema = z
  .object({
    bio: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(500, "Máximo 500 caracteres").optional(),
    ),
    contactPhone: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(8, "Teléfono inválido").optional(),
    ),
    primaryTradeId: z.string().uuid("Elegí un oficio principal"),
    primaryYearsExperience: yearsExperienceSchema,
    secondaryTrades: z
      .array(SecondaryTradeSchema)
      .max(4, "Máximo 4 oficios secundarios"),
    departmentIds: z
      .array(z.string().uuid())
      .min(1, "Elegí al menos una zona de cobertura"),
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
};

export type ProfessionalTradeWithScore = {
  name: string;
  slug: string;
  isPrimary: boolean;
  yearsExperience: number | null;
  score: number | null;
  reviewCount: number;
};

export type ProfessionalPortfolioPhoto = {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  caption: string | null;
};

export type ProfessionalPublishedReview = {
  id: string;
  reviewerName: string;
  tradeName: string;
  type: ReviewType;
  rating: number;
  comment: string | null;
  publishedAt: Date;
};

export type ProfessionalProfileDetail = {
  id: string;
  slug: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  trades: ProfessionalTradeWithScore[];
  departments: ProfessionalDepartmentSummary[];
  photos: ProfessionalPortfolioPhoto[];
  reviews: ProfessionalPublishedReview[];
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
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
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
