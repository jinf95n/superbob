import { z } from "zod";
import { ReportStatus } from "@prisma/client";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const REPORT_REASONS = [
  "Información falsa",
  "Comportamiento inapropiado",
  "Perfil duplicado",
  "Otro",
] as const;

export const CreateReportSchema = z.object({
  reportedUserId: z.string().uuid(),
  reportedProfessionalId: z.preprocess(
    emptyToUndefined,
    z.string().uuid().optional(),
  ),
  reason: z.enum(REPORT_REASONS),
  description: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(1000, "Máximo 1000 caracteres").optional(),
  ),
});

export type CreateReportInput = z.input<typeof CreateReportSchema>;

export type CreateReportActionState = {
  error?: string;
  success?: boolean;
};

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
