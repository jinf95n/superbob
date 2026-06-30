"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  REVIEW_BLIND_DAYS,
  REVIEW_EDIT_WINDOW_MINUTES,
  REVIEW_CONTACT_MIN_HOURS,
  REVIEW_CONTACT_MAX_DAYS,
  WORK_RECORD_PRO_WINDOW_DAYS,
  WORK_RECORD_CLIENT_CLAIM_MIN_DAYS,
  WORK_RECORD_CLIENT_CLAIM_MAX_DAYS,
} from "@/lib/config";
import { getProfessionalProfileIdByUserId } from "@/modules/professionals/queries";
import { getUserRole } from "@/modules/users/queries";
import { createNotification } from "@/modules/notifications/actions";
import {
  CreateProWorkRecordActionState,
  CreateProWorkRecordInput,
  CreateProWorkRecordSchema,
  CreateClientClaimActionState,
  CreateClientClaimInput,
  CreateClientClaimSchema,
  RespondToWorkRecordActionState,
  RespondToWorkRecordInput,
  RespondToWorkRecordSchema,
  SubmitWorkReviewActionState,
  SubmitWorkReviewInput,
  SubmitWorkReviewSchema,
  SubmitContactReviewActionState,
  SubmitContactReviewInput,
  SubmitContactReviewSchema,
  SubmitProfessionalRatingActionState,
  SubmitProfessionalRatingInput,
  SubmitProfessionalRatingSchema,
  WithdrawReviewActionState,
  WithdrawReviewInput,
  WithdrawReviewSchema,
  EditWorkReviewActionState,
  EditWorkReviewInput,
  EditWorkReviewSchema,
  ResolveDisputeActionState,
  ResolveDisputeInput,
  ResolveDisputeSchema,
} from "./types";

// Verifica que el usuario tenga el email verificado. Retorna mensaje de error o null.
async function assertEmailVerified(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });
  if (!user?.emailVerified) {
    return "Necesitás verificar tu email para realizar esta acción. Revisá tu casilla de correo.";
  }
  return null;
}

// Días transcurridos desde una fecha
function daysSince(date: Date): number {
  return (Date.now() - date.getTime()) / (24 * 60 * 60 * 1000);
}

// Horas transcurridas desde una fecha
function hoursSince(date: Date): number {
  return (Date.now() - date.getTime()) / (60 * 60 * 1000);
}

/**
 * Lógica double-blind para work_review (regla #6 de CLAUDE.md, no se simplifica).
 * Publica la reseña cuando:
 *   (a) el profesional ya calificó a ese cliente para el mismo work_record, o
 *   (b) pasaron REVIEW_BLIND_DAYS días desde que el cliente envió su reseña.
 * Revisa suspendedAt, deletedAt y withdrawnAt antes de publicar.
 */
async function checkAndPublishReviews(workRecordId: string): Promise<void> {
  const review = await prisma.review.findFirst({
    where: {
      workRecordId,
      type: "work_review",
      submittedAt: { not: null },
      publishedAt: null,
      withdrawnAt: null,
      suspendedAt: null,
      deletedAt: null,
    },
    select: { id: true, submittedAt: true, reviewedProfessionalId: true },
  });

  if (!review || !review.submittedAt) return;

  const clientRating = await prisma.clientRating.findFirst({
    where: { workRecordId },
    select: { id: true },
  });

  const shouldPublish =
    Boolean(clientRating) || daysSince(review.submittedAt) >= REVIEW_BLIND_DAYS;

  if (!shouldPublish) return;

  await prisma.review.update({
    where: { id: review.id },
    data: { publishedAt: new Date() },
  });

  const professional = await prisma.professionalProfile.findUnique({
    where: { id: review.reviewedProfessionalId },
    select: { userId: true },
  });

  if (professional) {
    await createNotification(professional.userId, "review_published", {
      message: "Nueva reseña publicada en tu perfil.",
      actionUrl: "/professional/reviews",
    });
  }
}

// =============================================================================
// Work records
// =============================================================================

// El profesional registra un trabajo completado a partir de un contact_event.
// Crea el work_record en status='active' directamente (no necesita confirmación del cliente).
export async function createProWorkRecordAction(
  input: CreateProWorkRecordInput,
): Promise<CreateProWorkRecordActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Necesitás iniciar sesión" };

  const professionalId = await getProfessionalProfileIdByUserId(session.user.id);
  if (!professionalId) return { error: "Necesitás activar tu perfil profesional" };

  const parsed = CreateProWorkRecordSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { contactEventId, tradeId } = parsed.data;

  const contactEvent = await prisma.contactEvent.findUnique({
    where: { id: contactEventId },
    select: { id: true, professionalId: true, clientId: true, createdAt: true },
  });

  if (!contactEvent || contactEvent.professionalId !== professionalId) {
    return { error: "No encontramos ese contacto" };
  }

  // Verifica que el contact_event no tenga ya un work_record activo/en disputa
  const existingWorkRecord = await prisma.workRecord.findFirst({
    where: {
      contactEventId,
      status: { not: "cancelled" },
    },
    select: { id: true, status: true },
  });

  if (existingWorkRecord) {
    if (existingWorkRecord.status === "completed") {
      return { error: "Ya se registró un trabajo para este contacto" };
    }
    return { error: "Ya existe un trabajo activo para este contacto" };
  }

  const now = new Date();
  const reviewWindowClosesAt = new Date(
    now.getTime() + WORK_RECORD_PRO_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );

  const workRecord = await prisma.workRecord.create({
    data: {
      professionalId,
      clientId: contactEvent.clientId,
      tradeId,
      contactEventId,
      status: "active",
      initiatedBy: "professional",
      reviewWindowClosesAt,
    },
  });

  await createNotification(contactEvent.clientId, "work_record_created", {
    message: "Un profesional registró un trabajo con vos. ¿Querés dejar una reseña?",
    actionUrl: `/reviews/${workRecord.id}`,
  });

  return { workRecordId: workRecord.id };
}

// El cliente inicia un reclamo de trabajo (requiere teléfono verificado).
// El work_record queda en status='pending_pro_confirmation' hasta que el profesional responda.
export async function createClientClaimAction(
  input: CreateClientClaimInput,
): Promise<CreateClientClaimActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Necesitás iniciar sesión" };

  const phoneError = await assertEmailVerified(session.user.id);
  if (phoneError) return { error: phoneError };

  const parsed = CreateClientClaimSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { contactEventId, tradeId } = parsed.data;

  const contactEvent = await prisma.contactEvent.findUnique({
    where: { id: contactEventId },
    select: { id: true, clientId: true, professionalId: true, createdAt: true },
  });

  if (!contactEvent || contactEvent.clientId !== session.user.id) {
    return { error: "No encontramos ese contacto" };
  }

  const eventAgeDays = daysSince(contactEvent.createdAt);
  if (eventAgeDays < WORK_RECORD_CLIENT_CLAIM_MIN_DAYS) {
    return {
      error: `Podés iniciar un reclamo a partir de ${WORK_RECORD_CLIENT_CLAIM_MIN_DAYS} días del contacto`,
    };
  }
  if (eventAgeDays > WORK_RECORD_CLIENT_CLAIM_MAX_DAYS) {
    return {
      error: `El plazo para iniciar un reclamo vence a los ${WORK_RECORD_CLIENT_CLAIM_MAX_DAYS} días del contacto`,
    };
  }

  const existingWorkRecord = await prisma.workRecord.findFirst({
    where: {
      contactEventId,
      status: { not: "cancelled" },
    },
    select: { id: true },
  });

  if (existingWorkRecord) {
    return { error: "Ya existe un trabajo registrado para este contacto" };
  }

  const professional = await prisma.professionalProfile.findUnique({
    where: { id: contactEvent.professionalId },
    select: { userId: true, user: { select: { fullName: true } } },
  });

  const workRecord = await prisma.workRecord.create({
    data: {
      professionalId: contactEvent.professionalId,
      clientId: session.user.id,
      tradeId,
      contactEventId,
      status: "pending_pro_confirmation",
      initiatedBy: "client",
    },
  });

  if (professional) {
    await createNotification(professional.userId, "work_claim_received", {
      message: "Un cliente inició un reclamo de trabajo. Confirmá o disputá en 7 días.",
      actionUrl: `/professional/work-records/${workRecord.id}`,
    });
  }

  return { workRecordId: workRecord.id };
}

// El profesional responde a un reclamo del cliente: confirma (→ active) o disputa (→ disputed).
export async function respondToWorkRecordAction(
  input: RespondToWorkRecordInput,
): Promise<RespondToWorkRecordActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Necesitás iniciar sesión" };

  const professionalId = await getProfessionalProfileIdByUserId(session.user.id);
  if (!professionalId) return { error: "Necesitás activar tu perfil profesional" };

  const parsed = RespondToWorkRecordSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { workRecordId, response } = parsed.data;

  const workRecord = await prisma.workRecord.findUnique({
    where: { id: workRecordId },
    select: {
      id: true,
      status: true,
      professionalId: true,
      clientId: true,
      initiatedBy: true,
    },
  });

  if (!workRecord || workRecord.professionalId !== professionalId) {
    return { error: "No encontramos ese trabajo" };
  }

  if (workRecord.status !== "pending_pro_confirmation") {
    return { error: "Este trabajo ya fue respondido" };
  }

  if (workRecord.initiatedBy !== "client") {
    return { error: "Solo podés responder reclamos iniciados por el cliente" };
  }

  const now = new Date();

  if (response === "confirm") {
    const reviewWindowClosesAt = new Date(
      now.getTime() + WORK_RECORD_PRO_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    await prisma.workRecord.update({
      where: { id: workRecordId },
      data: { status: "active", reviewWindowClosesAt },
    });

    await createNotification(workRecord.clientId, "work_claim_confirmed", {
      message: "El profesional confirmó tu reclamo. Podés dejar tu reseña.",
      actionUrl: `/reviews/${workRecordId}`,
    });
  } else {
    await prisma.workRecord.update({
      where: { id: workRecordId },
      data: { status: "disputed" },
    });

    await createNotification(workRecord.clientId, "work_claim_disputed", {
      message: "El profesional disputó tu reclamo. El equipo de SuperBob lo revisará.",
      actionUrl: `/reviews/${workRecordId}`,
    });
  }

  return { success: true };
}

// =============================================================================
// Reviews
// =============================================================================

// El cliente envía una work_review sobre un trabajo (work_record en active o completed).
// Requiere teléfono verificado. Se publica de forma double-blind (regla #6 CLAUDE.md).
export async function submitWorkReviewAction(
  input: SubmitWorkReviewInput,
): Promise<SubmitWorkReviewActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Necesitás iniciar sesión" };

  const phoneError = await assertEmailVerified(session.user.id);
  if (phoneError) return { error: phoneError };

  const parsed = SubmitWorkReviewSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { workRecordId, rating, comment } = parsed.data;

  const workRecord = await prisma.workRecord.findUnique({
    where: { id: workRecordId },
    select: {
      id: true,
      clientId: true,
      professionalId: true,
      tradeId: true,
      status: true,
      reviewWindowClosesAt: true,
      contactEventId: true,
    },
  });

  if (!workRecord) return { error: "No encontramos ese trabajo" };
  if (workRecord.clientId !== session.user.id) return { error: "No podés dejar esta reseña" };

  if (!["active", "completed"].includes(workRecord.status)) {
    return { error: "Solo podés reseñar trabajos activos o completados" };
  }

  if (workRecord.reviewWindowClosesAt && workRecord.reviewWindowClosesAt < new Date()) {
    return { error: "El plazo para dejar una reseña venció" };
  }

  // Exclusividad mutua: no puede haber una contact_review para el mismo contact_event
  const contactReview = await prisma.review.findFirst({
    where: {
      workRecord: { contactEventId: workRecord.contactEventId },
      type: "contact_review",
      reviewerId: session.user.id,
      deletedAt: null,
    },
    select: { id: true },
  });
  if (contactReview) {
    return { error: "Ya dejaste una reseña de contacto para este profesional" };
  }

  // Bloquea reenvío si ya existe una reseña (incluso retirada)
  const existingReview = await prisma.review.findFirst({
    where: { workRecordId, reviewerId: session.user.id },
    select: { id: true },
  });
  if (existingReview) {
    return { error: "Ya enviaste una reseña para este trabajo" };
  }

  const review = await prisma.review.create({
    data: {
      workRecordId,
      reviewerId: session.user.id,
      reviewedProfessionalId: workRecord.professionalId,
      tradeId: workRecord.tradeId,
      type: "work_review",
      rating,
      comment,
      submittedAt: new Date(),
    },
    select: { id: true },
  });

  const professional = await prisma.professionalProfile.findUnique({
    where: { id: workRecord.professionalId },
    select: { userId: true },
  });
  if (professional) {
    await createNotification(professional.userId, "review_received", {
      message:
        "Un cliente dejó una reseña de trabajo. Se publicará cuando la hayas respondido o pasen 14 días.",
      actionUrl: "/professional/reviews",
    });
  }

  await checkAndPublishReviews(workRecordId);

  return { success: true, reviewId: review.id };
}

// El cliente envía una contact_review (solo cuando no hay work_record para el contact_event).
// Requiere teléfono verificado. Se publica de forma inmediata (sin double-blind).
// Internamente crea un work_record 'completed' para hospedar la reseña.
export async function submitContactReviewAction(
  input: SubmitContactReviewInput,
): Promise<SubmitContactReviewActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Necesitás iniciar sesión" };

  const phoneError = await assertEmailVerified(session.user.id);
  if (phoneError) return { error: phoneError };

  const parsed = SubmitContactReviewSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { contactEventId, tradeId, rating, comment } = parsed.data;

  const contactEvent = await prisma.contactEvent.findUnique({
    where: { id: contactEventId },
    select: { id: true, clientId: true, professionalId: true, createdAt: true },
  });

  if (!contactEvent || contactEvent.clientId !== session.user.id) {
    return { error: "No encontramos ese contacto" };
  }

  const ageHours = hoursSince(contactEvent.createdAt);
  if (ageHours < REVIEW_CONTACT_MIN_HOURS) {
    return { error: `Podés dejar una reseña a partir de ${REVIEW_CONTACT_MIN_HOURS} horas del contacto` };
  }
  if (daysSince(contactEvent.createdAt) > REVIEW_CONTACT_MAX_DAYS) {
    return { error: `El plazo para dejar una reseña de contacto venció (${REVIEW_CONTACT_MAX_DAYS} días)` };
  }

  // Exclusividad mutua: bloquea si ya hay un work_record no cancelado para este contact_event
  const existingWorkRecord = await prisma.workRecord.findFirst({
    where: {
      contactEventId,
      status: { not: "cancelled" },
    },
    select: { id: true, status: true },
  });

  if (existingWorkRecord) {
    return {
      error: "Ya existe un trabajo registrado para este contacto. Dejá una reseña de trabajo en cambio.",
    };
  }

  const professional = await prisma.professionalProfile.findUnique({
    where: { id: contactEvent.professionalId },
    select: { userId: true },
  });

  const now = new Date();
  let reviewId = "";

  // Crea el work_record (status='completed') y la contact_review en una transacción
  await prisma.$transaction(async (tx) => {
    const workRecord = await tx.workRecord.create({
      data: {
        professionalId: contactEvent.professionalId,
        clientId: session.user.id,
        tradeId,
        contactEventId,
        status: "completed",
        initiatedBy: "client",
      },
    });

    const review = await tx.review.create({
      data: {
        workRecordId: workRecord.id,
        reviewerId: session.user.id,
        reviewedProfessionalId: contactEvent.professionalId,
        tradeId,
        type: "contact_review",
        rating,
        comment,
        submittedAt: now,
        publishedAt: now,
      },
      select: { id: true },
    });
    reviewId = review.id;
  });

  if (professional) {
    await createNotification(professional.userId, "review_published", {
      message: "Un cliente dejó una reseña de contacto en tu perfil.",
      actionUrl: "/professional/reviews",
    });
  }

  return { success: true, reviewId };
}

// El profesional califica al cliente de forma privada (tabla client_ratings).
// Dispara la lógica double-blind de publicación de la work_review del cliente.
export async function submitProfessionalRatingAction(
  input: SubmitProfessionalRatingInput,
): Promise<SubmitProfessionalRatingActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Necesitás iniciar sesión" };

  const professionalId = await getProfessionalProfileIdByUserId(session.user.id);
  if (!professionalId) return { error: "Necesitás activar tu perfil profesional" };

  const parsed = SubmitProfessionalRatingSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { workRecordId, rating, comment } = parsed.data;

  const workRecord = await prisma.workRecord.findUnique({
    where: { id: workRecordId },
    select: { id: true, professionalId: true, clientId: true, status: true },
  });

  if (!workRecord || workRecord.professionalId !== professionalId) {
    return { error: "No encontramos ese trabajo" };
  }

  if (!["active", "completed"].includes(workRecord.status)) {
    return { error: "No podés calificar en el estado actual de este trabajo" };
  }

  const existingRating = await prisma.clientRating.findFirst({
    where: { workRecordId, ratedByProfessionalId: professionalId },
    select: { id: true },
  });
  if (existingRating) return { error: "Ya calificaste a este cliente" };

  await prisma.clientRating.create({
    data: {
      workRecordId,
      ratedByProfessionalId: professionalId,
      clientId: workRecord.clientId,
      rating,
      comment,
    },
  });

  await checkAndPublishReviews(workRecordId);

  return { success: true };
}

// Retira una work_review antes de que sea publicada. Solo se puede retirar una vez.
// Después del retiro el timer del profesional se reinicia (logic en checkAndPublishReviews
// vía el campo withdrawnAt que excluye la reseña del check de publicación).
export async function withdrawReviewAction(
  input: WithdrawReviewInput,
): Promise<WithdrawReviewActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Necesitás iniciar sesión" };

  const parsed = WithdrawReviewSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { reviewId } = parsed.data;

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      reviewerId: true,
      type: true,
      publishedAt: true,
      withdrawnAt: true,
      deletedAt: true,
    },
  });

  if (!review || review.reviewerId !== session.user.id) {
    return { error: "No encontramos esa reseña" };
  }

  if (review.type !== "work_review") {
    return { error: "Solo podés retirar reseñas de trabajo" };
  }

  if (review.deletedAt) {
    return { error: "Esta reseña fue eliminada" };
  }

  if (review.withdrawnAt) {
    return { error: "Ya retiraste esta reseña anteriormente" };
  }

  if (review.publishedAt) {
    return { error: "No podés retirar una reseña ya publicada" };
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: {
      withdrawnAt: new Date(),
      submittedAt: null,
    },
  });

  return { success: true };
}

// Edita una work_review dentro de los REVIEW_EDIT_WINDOW_MINUTES minutos post-envío.
export async function editWorkReviewAction(
  input: EditWorkReviewInput,
): Promise<EditWorkReviewActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Necesitás iniciar sesión" };

  const parsed = EditWorkReviewSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { reviewId, rating, comment } = parsed.data;

  if (rating === undefined && comment === undefined) {
    return { error: "Debés cambiar la calificación o el comentario" };
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      reviewerId: true,
      type: true,
      submittedAt: true,
      publishedAt: true,
      withdrawnAt: true,
      deletedAt: true,
    },
  });

  if (!review || review.reviewerId !== session.user.id) {
    return { error: "No encontramos esa reseña" };
  }

  if (review.deletedAt || review.withdrawnAt) {
    return { error: "No podés editar esta reseña" };
  }

  if (!review.submittedAt) {
    return { error: "Esta reseña no fue enviada aún" };
  }

  const minutesSinceSubmit =
    (Date.now() - review.submittedAt.getTime()) / (60 * 1000);

  if (minutesSinceSubmit > REVIEW_EDIT_WINDOW_MINUTES) {
    return {
      error: `El plazo de edición venció (${REVIEW_EDIT_WINDOW_MINUTES} minutos desde el envío)`,
    };
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: {
      ...(rating !== undefined && { rating }),
      ...(comment !== undefined && { comment }),
      editedAt: new Date(),
    },
  });

  return { success: true };
}

// =============================================================================
// Admin: resolución de disputas
// =============================================================================

/**
 * Resuelve una disputa de work_record. Solo para admins.
 * - work_confirmed: status → 'active', abre ventana de review
 * - claim_rejected / unresolved: status → 'cancelled'
 */
export async function resolveDisputeAction(
  input: ResolveDisputeInput,
): Promise<ResolveDisputeActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Necesitás iniciar sesión" };

  const role = await getUserRole(session.user.id);
  if (role !== "admin") return { error: "No tenés permisos para realizar esta acción" };

  const parsed = ResolveDisputeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { workRecordId, resolution } = parsed.data;

  const workRecord = await prisma.workRecord.findUnique({
    where: { id: workRecordId },
    select: { id: true, status: true, clientId: true, professionalId: true },
  });

  if (!workRecord) return { error: "No encontramos ese trabajo" };

  if (workRecord.status !== "disputed") {
    return { error: "Este trabajo no está en disputa" };
  }

  const now = new Date();

  if (resolution === "work_confirmed") {
    const reviewWindowClosesAt = new Date(
      now.getTime() + WORK_RECORD_PRO_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    await prisma.workRecord.update({
      where: { id: workRecordId },
      data: {
        status: "active",
        disputeResolution: resolution,
        disputeResolvedAt: now,
        reviewWindowClosesAt,
      },
    });

    await Promise.all([
      createNotification(workRecord.clientId, "dispute_resolved", {
        message: "Tu reclamo fue confirmado. Podés dejar tu reseña.",
        actionUrl: `/reviews/${workRecordId}`,
      }),
      createNotification(workRecord.professionalId, "dispute_resolved_pro", {
        message: "La disputa fue resuelta a favor del cliente.",
        actionUrl: `/professional/work-records/${workRecordId}`,
      }),
    ]);
  } else {
    await prisma.workRecord.update({
      where: { id: workRecordId },
      data: {
        status: "cancelled",
        disputeResolution: resolution,
        disputeResolvedAt: now,
      },
    });

    const message =
      resolution === "claim_rejected"
        ? "Tu reclamo fue rechazado luego de la revisión."
        : "La disputa fue cerrada sin resolución.";

    await Promise.all([
      createNotification(workRecord.clientId, "dispute_resolved", {
        message,
        actionUrl: `/reviews/${workRecordId}`,
      }),
      createNotification(workRecord.professionalId, "dispute_resolved_pro", {
        message: "La disputa fue cerrada.",
        actionUrl: `/professional/work-records/${workRecordId}`,
      }),
    ]);
  }

  return { success: true };
}
