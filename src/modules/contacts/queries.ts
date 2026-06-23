import { prisma } from "@/lib/prisma";

export async function getContactEventsCountSince(
  since: Date,
): Promise<number> {
  return prisma.contactEvent.count({
    where: { createdAt: { gte: since } },
  });
}
