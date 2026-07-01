import { z } from "zod";
import { ReviewType } from "@prisma/client";

// Tipo local para los estados de work_record (el enum WorkRecordType fue eliminado en v2)
export type WorkRecordStatus =
  | "pending_pro_confirmation"
  | "active"
  | "completed"
  | "cancelled"
  | "disputed";

// =============================================================================
// Work records
// =============================================================================

// El profesional crea un work_record a partir de un contact_event existente
export const CreateProWorkRecordSchema = z.object({
  contactEventId: z.string().uuid("contactEventId inválido"),
  tradeId: z.string().uuid("Elegí un oficio"),
});
export type CreateProWorkRecordInput = z.infer<typeof CreateProWorkRecordSchema>;
export type CreateProWorkRecordActionState = {
  error?: string;
  workRecordId?: string;
};

// El cliente inicia un reclamo (crea work_record en pending_pro_confirmation)
export const CreateClientClaimSchema = z.object({
  contactEventId: z.string().uuid("contactEventId inválido"),
  tradeId: z.string().uuid("Elegí un oficio"),
});
export type CreateClientClaimInput = z.infer<typeof CreateClientClaimSchema>;
export type CreateClientClaimActionState = {
  error?: string;
  workRecordId?: string;
};

// El profesional confirma o disputa un reclamo del cliente
export const RespondToWorkRecordSchema = z.object({
  workRecordId: z.string().uuid(),
  response: z.enum(["confirm", "dispute"]),
});
export type RespondToWorkRecordInput = z.infer<typeof RespondToWorkRecordSchema>;
export type RespondToWorkRecordActionState = {
  error?: string;
  success?: boolean;
};

// Admin resuelve una disputa
export const ResolveDisputeSchema = z.object({
  workRecordId: z.string().uuid(),
  resolution: z.enum(["work_confirmed", "claim_rejected", "unresolved"]),
});
export type ResolveDisputeInput = z.infer<typeof ResolveDisputeSchema>;
export type ResolveDisputeActionState = {
  error?: string;
  success?: boolean;
};

// =============================================================================
// Reviews
// =============================================================================

// Cliente envía una work_review (work_record en active o completed)
export const SubmitWorkReviewSchema = z.object({
  workRecordId: z.string().uuid(),
  rating: z.coerce.number().int().min(1, "Elegí una calificación").max(5),
  comment: z.string().trim().max(1000, "Máximo 1000 caracteres").optional(),
});
export type SubmitWorkReviewInput = z.infer<typeof SubmitWorkReviewSchema>;
export type SubmitWorkReviewActionState = {
  error?: string;
  success?: boolean;
  reviewId?: string;
};

// Cliente envía una contact_review (no existe work_record para ese contact_event)
export const SubmitContactReviewSchema = z.object({
  contactEventId: z.string().uuid("contactEventId inválido"),
  tradeId: z.string().uuid("Elegí un oficio"),
  rating: z.coerce.number().int().min(1, "Elegí una calificación").max(5),
  comment: z.string().trim().max(1000, "Máximo 1000 caracteres").optional(),
});
export type SubmitContactReviewInput = z.infer<typeof SubmitContactReviewSchema>;
export type SubmitContactReviewActionState = {
  error?: string;
  success?: boolean;
  reviewId?: string;
};

// Profesional califica al cliente (privado, tabla client_ratings)
export const SubmitProfessionalRatingSchema = z.object({
  workRecordId: z.string().uuid(),
  rating: z.coerce.number().int().min(1, "Elegí una calificación").max(5),
  comment: z.string().trim().max(1000, "Máximo 1000 caracteres").optional(),
});
export type SubmitProfessionalRatingInput = z.infer<typeof SubmitProfessionalRatingSchema>;
export type SubmitProfessionalRatingActionState = {
  error?: string;
  success?: boolean;
};

// Retiro de work_review antes de la publicación (una sola vez por parte)
export const WithdrawReviewSchema = z.object({
  reviewId: z.string().uuid(),
});
export type WithdrawReviewInput = z.infer<typeof WithdrawReviewSchema>;
export type WithdrawReviewActionState = {
  error?: string;
  success?: boolean;
};

// Edición de work_review dentro de los 15 minutos post-envío
export const EditWorkReviewSchema = z.object({
  reviewId: z.string().uuid(),
  rating: z.coerce.number().int().min(1, "Elegí una calificación").max(5).optional(),
  comment: z.string().trim().max(1000, "Máximo 1000 caracteres").optional(),
});
export type EditWorkReviewInput = z.infer<typeof EditWorkReviewSchema>;
export type EditWorkReviewActionState = {
  error?: string;
  success?: boolean;
};

// =============================================================================
// Query types
// =============================================================================

export type WorkRecordForReviewPage = {
  id: string;
  professionalName: string;
  tradeName: string;
  createdAt: Date;
  clientId: string;
  status: WorkRecordStatus;
  alreadyReviewed: boolean;
};

// work_records en active/completed donde el cliente aún no envió su work_review
export type PendingWorkReviewForClient = {
  workRecordId: string;
  professionalName: string;
  professionalSlug: string;
  tradeName: string;
  status: WorkRecordStatus;
  createdAt: Date;
};

// contact_events elegibles para contact_review (sin work_record, dentro de la ventana)
export type PendingContactReviewForClient = {
  contactEventId: string;
  professionalName: string;
  professionalSlug: string;
  professionalId: string;
  contactDate: Date;
  availableTrades: Array<{ id: string; name: string }>;
};

// work_records en active/completed donde el profesional aún no calificó al cliente
export type PendingRatingForProfessional = {
  workRecordId: string;
  clientName: string;
  tradeName: string;
  status: WorkRecordStatus;
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
  responseText: string | null;
  responsePublishedAt: Date | null;
};

export type ClientRatingForProfessional = {
  rating: number;
  comment: string | null;
  createdAt: Date;
};

export type WorkRecordForNewReviewPage = {
  id: string;
  status: WorkRecordStatus;
  professionalName: string;
  professionalSlug: string;
  tradeName: string;
  alreadyReviewed: boolean;
};

// =============================================================================
// Admin — moderación de reseñas
// =============================================================================

export const ModerateReviewSchema = z.object({
  reviewId: z.string().uuid(),
  reason: z
    .string()
    .min(3, "Ingresá un motivo de al menos 3 caracteres")
    .max(1000, "Máximo 1000 caracteres"),
});
export type ModerateReviewInput = z.infer<typeof ModerateReviewSchema>;
export type ModerateReviewActionState = { error?: string; success?: boolean };

export type DisputeContextForAdmin = {
  workRecord: {
    id: string;
    status: WorkRecordStatus;
    initiatedBy: string;
    createdAt: Date;
    contactEventCreatedAt: Date;
    tradeName: string;
    professional: { id: string; fullName: string; email: string };
    client: { id: string; fullName: string; email: string };
  };
  // Disputas y reclamos previos del profesional (excluyendo el actual)
  proDisputes: Array<{
    id: string;
    status: WorkRecordStatus;
    disputeResolution: string | null;
    createdAt: Date;
    disputeResolvedAt: Date | null;
    clientName: string;
  }>;
  // Reclamos previos del cliente (excluyendo el actual)
  clientClaims: Array<{
    id: string;
    status: WorkRecordStatus;
    disputeResolution: string | null;
    createdAt: Date;
    disputeResolvedAt: Date | null;
    professionalName: string;
  }>;
};
