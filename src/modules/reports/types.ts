import { ReportStatus } from "@prisma/client";

export type AdminReportListItem = {
  id: string;
  reporterName: string;
  reportedUserName: string;
  reportedProfessionalSlug: string | null;
  reason: string;
  description: string | null;
  status: ReportStatus;
  createdAt: Date;
};

export type AdminReportListResult = {
  reports: AdminReportListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type UpdateReportStatusActionState = {
  error?: string;
};
