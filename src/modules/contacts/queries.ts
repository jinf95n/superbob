import { WorkRecordType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ContactForReview = {
  contactEventId: string;
  clientId: string;
  clientName: string;
  clientAvatarUrl: string | null;
  contactDate: Date;
  workRecord: {
    id: string;
    type: WorkRecordType;
    hasClientRating: boolean;
    hasClientReview: boolean;
  } | null;
};

export async function getProfessionalContactsForReview(
  professionalId: string,
): Promise<ContactForReview[]> {
  const contactEvents = await prisma.contactEvent.findMany({
    where: { professionalId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      clientId: true,
      createdAt: true,
      client: { select: { fullName: true, avatarUrl: true } },
    },
  });

  if (contactEvents.length === 0) return [];

  const clientIds = [...new Set(contactEvents.map((c) => c.clientId))];

  const workRecords = await prisma.workRecord.findMany({
    where: { professionalId, clientId: { in: clientIds } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      clientId: true,
      type: true,
      clientRatings: {
        where: { ratedByProfessionalId: professionalId },
        select: { id: true },
      },
      reviews: { select: { reviewerId: true } },
    },
  });

  const workRecordByClient = new Map<string, (typeof workRecords)[0]>();
  for (const wr of workRecords) {
    if (!workRecordByClient.has(wr.clientId)) {
      workRecordByClient.set(wr.clientId, wr);
    }
  }

  return contactEvents.map((event) => {
    const wr = workRecordByClient.get(event.clientId);
    return {
      contactEventId: event.id,
      clientId: event.clientId,
      clientName: event.client.fullName,
      clientAvatarUrl: event.client.avatarUrl ?? null,
      contactDate: event.createdAt,
      workRecord: wr
        ? {
            id: wr.id,
            type: wr.type,
            hasClientRating: wr.clientRatings.length > 0,
            hasClientReview: wr.reviews.some((r) => r.reviewerId === event.clientId),
          }
        : null,
    };
  });
}

export async function getPendingContactsCount(
  professionalId: string,
): Promise<number> {
  const contactEvents = await prisma.contactEvent.findMany({
    where: { professionalId },
    select: { clientId: true },
    distinct: ["clientId"],
  });

  if (contactEvents.length === 0) return 0;

  const clientIds = contactEvents.map((c) => c.clientId);

  const withWorkRecords = await prisma.workRecord.findMany({
    where: { professionalId, clientId: { in: clientIds } },
    select: { clientId: true },
    distinct: ["clientId"],
  });

  const clientsWithWorkRecord = new Set(withWorkRecords.map((w) => w.clientId));
  return clientIds.filter((id) => !clientsWithWorkRecord.has(id)).length;
}

export async function getContactEventsCountSince(
  since: Date,
): Promise<number> {
  return prisma.contactEvent.count({
    where: { createdAt: { gte: since } },
  });
}

export async function getContactEventsCountForProfessionalSince(
  professionalId: string,
  since: Date,
): Promise<number> {
  return prisma.contactEvent.count({
    where: { professionalId, createdAt: { gte: since } },
  });
}
