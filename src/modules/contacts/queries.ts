import { prisma } from "@/lib/prisma";

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
