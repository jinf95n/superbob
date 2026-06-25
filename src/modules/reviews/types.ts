import { z } from "zod";
import { ReviewType, WorkRecordType } from "@prisma/client";

export const ConfirmWorkFromContactSchema = z.object({
  contactEventId: z.string().uuid(),
  clientId: z.string().uuid(),
  tradeId: z.string().uuid("Elegí un oficio"),
  type: z.enum(WorkRecordType),
});

export type ConfirmWorkFromContactInput = z.input<typeof ConfirmWorkFromContactSchema>;

export type ConfirmWorkFromContactActionState = {
  error?: string;
  workRecordId?: string;
};

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const CreateWorkRecordSchema = z
  .object({
    tradeId: z.string().uuid("Elegí un oficio"),
    clientPhone: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(6, "Teléfono inválido").optional(),
    ),
    clientEmail: z.preprocess(
      emptyToUndefined,
      z.email("Email inválido").optional(),
    ),
  })
  .refine((data) => Boolean(data.clientPhone || data.clientEmail), {
    message: "Ingresá el teléfono o el email del cliente",
    path: ["clientPhone"],
  });

export type CreateWorkRecordInput = z.input<typeof CreateWorkRecordSchema>;

export type CreateWorkRecordActionState = {
  error?: string;
  success?: boolean;
};

export const SubmitClientReviewSchema = z.object({
  workRecordId: z.string().uuid(),
  rating: z.coerce.number().int().min(1, "Elegí una calificación").max(5),
  comment: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(1000, "Máximo 1000 caracteres").optional(),
  ),
});

export type SubmitClientReviewInput = z.input<typeof SubmitClientReviewSchema>;

export type SubmitClientReviewActionState = {
  error?: string;
  success?: boolean;
};

export const SubmitProfessionalRatingSchema = z.object({
  workRecordId: z.string().uuid(),
  rating: z.coerce.number().int().min(1, "Elegí una calificación").max(5),
  comment: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(1000, "Máximo 1000 caracteres").optional(),
  ),
});

export type SubmitProfessionalRatingInput = z.input<
  typeof SubmitProfessionalRatingSchema
>;

export type SubmitProfessionalRatingActionState = {
  error?: string;
  success?: boolean;
};

export type WorkRecordForReviewPage = {
  id: string;
  professionalName: string;
  tradeName: string;
  createdAt: Date;
  clientId: string;
  alreadyReviewed: boolean;
};

export type PendingReviewForClient = {
  workRecordId: string;
  professionalName: string;
  professionalSlug: string;
  tradeName: string;
  type: WorkRecordType;
  createdAt: Date;
};

export type PendingRatingForProfessional = {
  workRecordId: string;
  clientName: string;
  tradeName: string;
  type: WorkRecordType;
  createdAt: Date;
};

export type PublishedReviewForProfessional = {
  id: string;
  reviewerName: string;
  tradeName: string;
  type: ReviewType;
  rating: number;
  comment: string | null;
  publishedAt: Date;
};

export type ClientRatingForProfessional = {
  rating: number;
  comment: string | null;
  createdAt: Date;
};
