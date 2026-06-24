import { prisma } from "@/lib/prisma";
import { PortfolioPhotoItem } from "./types";

export async function getPortfolioPhotosForProfessional(
  professionalId: string,
): Promise<PortfolioPhotoItem[]> {
  return prisma.workPhoto.findMany({
    where: { professionalId },
    orderBy: { order: "asc" },
    select: { id: true, url: true, thumbnailUrl: true, caption: true },
  });
}
