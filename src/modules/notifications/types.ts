import { z } from "zod";

export const MarkNotificationReadSchema = z.object({
  notificationId: z.string().uuid(),
});

export type MarkNotificationReadInput = z.infer<typeof MarkNotificationReadSchema>;

export type MarkNotificationReadActionState = {
  error?: string;
};

export type NotificationPayload = {
  message: string;
  actionUrl?: string;
};

export type NotificationListItem = {
  id: string;
  type: string;
  payload: NotificationPayload | null;
  readAt: Date | null;
  createdAt: Date;
};
