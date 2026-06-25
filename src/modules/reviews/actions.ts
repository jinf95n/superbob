"use server";

import { headers } from "next/headers";
import { WorkRecordType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProfessionalProfileIdByUserId } from "@/modules/professionals/queries";
import { createNotification } from "@/modules/notifications/actions";
import {
  ConfirmWorkFromContactActionState,
  ConfirmWorkFromContactInput,
  ConfirmWorkFromContactSchema,
  CreateWorkRecordActionState,
  CreateWorkRecordInput,
  CreateWorkRecordSchema,
  SubmitClientReviewActionState,
  SubmitClientReviewInput,
  SubmitClientReviewSchema,
  SubmitProfessionalRatingActionState,
  SubmitProfessionalRatingInput,
  SubmitProfessionalRatingSchema,
} from "./types";

const AUTO_PUBLISH_DAYS = 14;

async function createWorkRecord(
  input: CreateWorkRecordInput,
  type: WorkRecordType,
): Promise<CreateWorkRecordActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Necesitás iniciar sesión" };
  }

  const professionalId = await getProfessionalProfileIdByUserId(session.user.id);
  if (!professionalId) {
    return { error: "Necesitás activar tu perfil profesional" };
  }

  const parsed = CreateWorkRecordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { tradeId, clientPhone, clientEmail } = parsed.data;

  const client = await prisma.user.findFirst({
    where: {
      OR: [
        ...(clientPhone ? [{ phone: clientPhone }] : []),
        ...(clientEmail ? [{ email: clientEmail }] : []),
      ],
    },
    select: { id: true, fullName: true },
  });

  if (!client) {
    return { error: "No encontramos un cliente registrado con esos datos" };
  }

  const professional = await prisma.professionalProfile.findUnique({
    where: { id: professionalId },
    select: { user: { select: { fullName: true } } },
  });

  const now = new Date();

  const workRecord = await prisma.workRecord.create({
    data: {
      professionalId,
      clientId: client.id,
      tradeId,
      type,
      initiatedByProfessionalAt: now,
      clientNotifiedAt: now,
    },
  });

  await createNotification(client.id, "work_record_created", {
    message:
      type === "completed"
        ? `${professional?.user.fullName ?? "Un profesional"} dice que completó un trabajo con vos. ¿Querés dejar una reseña?`
        : `${professional?.user.fullName ?? "Un profesional"} dice que tuvo contacto con vos. ¿Querés dejar una reseña?`,
    actionUrl: `/reviews/${workRecord.id}`,
  });

  return { success: true };
}

export async function createWorkRecordAction(
  input: CreateWorkRecordInput,
): Promise<CreateWorkRecordActionState> {
  return createWorkRecord(input, "completed");
}

export async function createContactWorkRecordAction(
  input: CreateWorkRecordInput,
): Promise<CreateWorkRecordActionState> {
  return createWorkRecord(input, "contact");
}

/**
 * Lógica double-blind (regla #6 de CLAUDE.md, no se simplifica): publica la
 * reseña del cliente cuando (a) el profesional ya calificó a ese cliente
 * para el mismo work_record, o (b) pasaron 14 días desde que el cliente
 * envió su reseña. Se invoca después de cada envío de reseña o calificación,
 * así que el caso (b) se resuelve la próxima vez que cualquiera de las dos
 * acciones toque ese work_record.
 */
async function checkAndPublishReviews(workRecordId: string): Promise<void> {
  const review = await prisma.review.findFirst({
    where: { workRecordId },
    select: {
      id: true,
      submittedAt: true,
      publishedAt: true,
      reviewedProfessionalId: true,
    },
  });

  if (!review || !review.submittedAt || review.publishedAt) {
    return;
  }

  const clientRating = await prisma.clientRating.findFirst({
    where: { workRecordId },
    select: { id: true },
  });

  const daysSinceSubmitted =
    (Date.now() - review.submittedAt.getTime()) / (24 * 60 * 60 * 1000);

  const shouldPublish = Boolean(clientRating) || daysSinceSubmitted >= AUTO_PUBLISH_DAYS;
  if (!shouldPublish) {
    return;
  }

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

export async function submitClientReviewAction(
  input: SubmitClientReviewInput,
): Promise<SubmitClientReviewActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Necesitás iniciar sesión" };
  }

  const parsed = SubmitClientReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { workRecordId, rating, comment } = parsed.data;

  const workRecord = await prisma.workRecord.findUnique({
    where: { id: workRecordId },
    select: {
      id: true,
      clientId: true,
      professionalId: true,
      tradeId: true,
      type: true,
    },
  });

  if (!workRecord) {
    return { error: "No encontramos ese trabajo" };
  }

  if (workRecord.clientId !== session.user.id) {
    return { error: "No podés dejar esta reseña" };
  }

  const existingReview = await prisma.review.findFirst({
    where: { workRecordId, reviewerId: session.user.id },
    select: { id: true },
  });
  if (existingReview) {
    return { error: "Ya dejaste una reseña para este trabajo" };
  }

  const reviewType = workRecord.type === "completed" ? "work_review" : "contact_review";

  await prisma.review.create({
    data: {
      workRecordId,
      reviewerId: session.user.id,
      reviewedProfessionalId: workRecord.professionalId,
      tradeId: workRecord.tradeId,
      type: reviewType,
      rating,
      comment,
      submittedAt: new Date(),
    },
  });

  const professionalUser = await prisma.professionalProfile.findUnique({
    where: { id: workRecord.professionalId },
    select: { userId: true },
  });
  if (professionalUser) {
    await createNotification(professionalUser.userId, "review_received", {
      message:
        "Un cliente dejó una reseña sobre tu trabajo. Se publicará cuando la hayas respondido o pasen 14 días.",
      actionUrl: "/professional/reviews",
    });
  }

  await checkAndPublishReviews(workRecordId);

  return { success: true };
}

export async function submitProfessionalRatingAction(
  input: SubmitProfessionalRatingInput,
): Promise<SubmitProfessionalRatingActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Necesitás iniciar sesión" };
  }

  const professionalId = await getProfessionalProfileIdByUserId(session.user.id);
  if (!professionalId) {
    return { error: "Necesitás activar tu perfil profesional" };
  }

  const parsed = SubmitProfessionalRatingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { workRecordId, rating, comment } = parsed.data;

  const workRecord = await prisma.workRecord.findUnique({
    where: { id: workRecordId },
    select: { id: true, professionalId: true, clientId: true },
  });

  if (!workRecord || workRecord.professionalId !== professionalId) {
    return { error: "No encontramos ese trabajo" };
  }

  const existingRating = await prisma.clientRating.findFirst({
    where: { workRecordId, ratedByProfessionalId: professionalId },
    select: { id: true },
  });
  if (existingRating) {
    return { error: "Ya calificaste a este cliente" };
  }

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

export async function confirmWorkFromContactAction(
  input: ConfirmWorkFromContactInput,
): Promise<ConfirmWorkFromContactActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Necesitás iniciar sesión" };
  }

  const professionalId = await getProfessionalProfileIdByUserId(session.user.id);
  if (!professionalId) {
    return { error: "Necesitás activar tu perfil profesional" };
  }

  const parsed = ConfirmWorkFromContactSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { contactEventId, clientId, tradeId, type } = parsed.data;

  const contactEvent = await prisma.contactEvent.findUnique({
    where: { id: contactEventId },
    select: { professionalId: true, clientId: true },
  });

  if (!contactEvent || contactEvent.professionalId !== professionalId) {
    return { error: "No encontramos ese contacto" };
  }

  if (contactEvent.clientId !== clientId) {
    return { error: "Datos de cliente inválidos" };
  }

  const existingWorkRecord = await prisma.workRecord.findFirst({
    where: { professionalId, clientId },
    select: { id: true, type: true },
  });

  if (existingWorkRecord) {
    if (existingWorkRecord.type === "contact" && type === "completed") {
      await prisma.workRecord.update({
        where: { id: existingWorkRecord.id },
        data: { type: "completed" },
      });
    }
    return { workRecordId: existingWorkRecord.id };
  }

  const professional = await prisma.professionalProfile.findUnique({
    where: { id: professionalId },
    select: { user: { select: { fullName: true } } },
  });

  const now = new Date();
  const workRecord = await prisma.workRecord.create({
    data: {
      professionalId,
      clientId,
      tradeId,
      type,
      initiatedByProfessionalAt: now,
      clientNotifiedAt: now,
    },
  });

  await createNotification(clientId, "work_confirmed", {
    message:
      type === "completed"
        ? `${professional?.user.fullName ?? "Un profesional"} dice que completó un trabajo con vos. ¿Querés dejar una reseña?`
        : `${professional?.user.fullName ?? "Un profesional"} dice que tuvo contacto con vos. ¿Querés dejar una reseña?`,
    actionUrl: `/reviews/${workRecord.id}`,
  });

  return { workRecordId: workRecord.id };
}
