"use client";

import { NotificationListItem } from "@/modules/notifications/types";

function getNotificationMessage(notification: NotificationListItem): string {
  switch (notification.type) {
    case "review_received":
      return "Recibiste una nueva reseña. Todos los profesionales reciben opiniones diversas. Cómo respondés también construye tu reputación.";
    case "work_confirmed":
      return notification.payload?.message ?? "Nuevo trabajo registrado. ¿Querés dejar una reseña?";
    case "review_published":
      return "Una reseña tuya se publicó en el perfil del profesional.";
    case "work_record_created":
      return notification.payload?.message ?? "Un profesional registró un trabajo con vos.";
    default:
      return notification.payload?.message ?? "";
  }
}

type Props = {
  notification: NotificationListItem;
  isUnread: boolean;
  onOpen: (notification: NotificationListItem) => void;
};

export function NotificationItem({ notification, isUnread, onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={`w-full rounded-2xl p-4 text-left text-[15px] transition-colors hover:opacity-90 ${
        isUnread
          ? "bg-sb-card-blue font-medium text-sb-text"
          : "bg-white text-sb-muted"
      }`}
    >
      <p>{getNotificationMessage(notification)}</p>
      <p className="mt-1 text-sm text-sb-muted">
        {notification.createdAt.toLocaleDateString("es-AR")}
      </p>
    </button>
  );
}
