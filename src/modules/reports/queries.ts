import { prisma } from "@/lib/prisma";
import { AdminReportListItem, AdminReportListResult } from "./types";

const ADMIN_REPORTS_PAGE_SIZE = 20;

export async function getUnresolvedReportsCount(): Promise<number> {
  return prisma.report.count({ where: { status: { not: "resolved" } } });
}

export async function getReportsForAdmin(
  page = 1,
): Promise<AdminReportListResult> {
  const total = await prisma.report.count();
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_REPORTS_PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const rows = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * ADMIN_REPORTS_PAGE_SIZE,
    take: ADMIN_REPORTS_PAGE_SIZE,
    select: {
      id: true,
      reason: true,
      description: true,
      status: true,
      createdAt: true,
      reporter: { select: { fullName: true } },
      reportedUser: { select: { fullName: true } },
      reportedProfessional: { select: { slug: true } },
    },
  });

  const reports: AdminReportListItem[] = rows.map((row) => ({
    id: row.id,
    reporterName: row.reporter.fullName,
    reportedUserName: row.reportedUser.fullName,
    reportedProfessionalSlug: row.reportedProfessional?.slug ?? null,
    reason: row.reason,
    description: row.description,
    status: row.status,
    createdAt: row.createdAt,
  }));

  return {
    reports,
    total,
    page: currentPage,
    pageSize: ADMIN_REPORTS_PAGE_SIZE,
    totalPages,
  };
}
