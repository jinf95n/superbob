import { prisma } from "@/lib/prisma";
import { WorkRecordStatus } from "@/modules/reviews/types";
import {
  WORK_RECORD_CLIENT_CLAIM_MIN_DAYS,
  WORK_RECORD_CLIENT_CLAIM_MAX_DAYS,
} from "@/lib/config";

export type ContactForReview = {
  contactEventId: string;
  clientId: string;
  clientName: string;
  clientAvatarUrl: string | null;
  contactDate: Date;
  workRecord: {
    id: string;
    status: WorkRecordStatus;
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
    distinct: ["clientId"],
    take: 20,
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
      status: true,
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
            status: wr.status as WorkRecordStatus,
            hasClientRating: wr.clientRatings.length > 0,
            hasClientReview: wr.reviews.some((r) => r.reviewerId === event.clientId),
          }
        : null,
    };
  });
}

export async function getPendingContactsCount(professionalId: string): Promise<number> {
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

export async function getContactEventsCountSince(since: Date): Promise<number> {
  return prisma.contactEvent.count({ where: { createdAt: { gte: since } } });
}

export async function getContactEventsCountForProfessionalSince(
  professionalId: string,
  since: Date,
): Promise<number> {
  return prisma.contactEvent.count({
    where: { professionalId, createdAt: { gte: since } },
  });
}

export type ClaimableContactForClient = {
  contactEventId: string;
  professionalName: string;
  professionalSlug: string;
  professionalId: string;
  contactDate: Date;
  availableTrades: Array<{ id: string; name: string }>;
};

export async function getClaimableContactsForClient(
  userId: string,
): Promise<ClaimableContactForClient[]> {
  const minDate = new Date(
    Date.now() - WORK_RECORD_CLIENT_CLAIM_MAX_DAYS * 24 * 60 * 60 * 1000,
  );
  const maxDate = new Date(
    Date.now() - WORK_RECORD_CLIENT_CLAIM_MIN_DAYS * 24 * 60 * 60 * 1000,
  );

  const contactEvents = await prisma.contactEvent.findMany({
    where: {
      clientId: userId,
      createdAt: { gte: minDate, lte: maxDate },
      workRecords: { none: { status: { not: "cancelled" } } },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      professional: {
        select: {
          id: true,
          slug: true,
          user: { select: { fullName: true } },
          professionalTrades: {
            where: { trade: { isActive: true } },
            select: { trade: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  return contactEvents.map((ce) => ({
    contactEventId: ce.id,
    professionalName: ce.professional.user.fullName,
    professionalSlug: ce.professional.slug,
    professionalId: ce.professional.id,
    contactDate: ce.createdAt,
    availableTrades: ce.professional.professionalTrades.map((pt) => ({
      id: pt.trade.id,
      name: pt.trade.name,
    })),
  }));
}

export async function getClaimableContactsForClientCount(userId: string): Promise<number> {
  const minDate = new Date(
    Date.now() - WORK_RECORD_CLIENT_CLAIM_MAX_DAYS * 24 * 60 * 60 * 1000,
  );
  const maxDate = new Date(
    Date.now() - WORK_RECORD_CLIENT_CLAIM_MIN_DAYS * 24 * 60 * 60 * 1000,
  );

  return prisma.contactEvent.count({
    where: {
      clientId: userId,
      createdAt: { gte: minDate, lte: maxDate },
      workRecords: { none: { status: { not: "cancelled" } } },
    },
  });
}

export type ContactEventDetails = {
  id: string;
  clientId: string;
  createdAt: Date;
  professionalName: string;
  professionalSlug: string;
  professionalId: string;
  availableTrades: Array<{ id: string; name: string }>;
  hasActiveWorkRecord: boolean;
};

export async function getContactEventDetails(
  contactEventId: string,
  userId: string,
): Promise<ContactEventDetails | null> {
  const ce = await prisma.contactEvent.findUnique({
    where: { id: contactEventId },
    select: {
      id: true,
      clientId: true,
      createdAt: true,
      professional: {
        select: {
          id: true,
          slug: true,
          user: { select: { fullName: true } },
          professionalTrades: {
            where: { trade: { isActive: true } },
            select: { trade: { select: { id: true, name: true } } },
          },
        },
      },
      workRecords: {
        where: { status: { not: "cancelled" } },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!ce || ce.clientId !== userId) return null;

  return {
    id: ce.id,
    clientId: ce.clientId,
    createdAt: ce.createdAt,
    professionalName: ce.professional.user.fullName,
    professionalSlug: ce.professional.slug,
    professionalId: ce.professional.id,
    availableTrades: ce.professional.professionalTrades.map((pt) => ({
      id: pt.trade.id,
      name: pt.trade.name,
    })),
    hasActiveWorkRecord: ce.workRecords.length > 0,
  };
}

export async function checkUserHadContact(
  clientId: string,
  professionalId: string,
): Promise<boolean> {
  const event = await prisma.contactEvent.findFirst({
    where: { clientId, professionalId },
    select: { id: true },
  });
  return !!event;
}
