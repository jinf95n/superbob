"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/modules/notifications/actions";
import { NotificationListItem } from "@/modules/notifications/types";
import { NotificationItem } from "./NotificationItem";
import { NotificationModal } from "./NotificationModal";

type Props = {
  notifications: NotificationListItem[];
};

export function NotificationList({ notifications }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<NotificationListItem | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(
    () => new Set(notifications.filter((n) => n.readAt !== null).map((n) => n.id)),
  );

  useEffect(() => {
    async function markAll() {
      await markAllNotificationsReadAction();
      router.refresh();
    }
    markAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleOpen(notification: NotificationListItem) {
    setSelected(notification);
    if (!readIds.has(notification.id)) {
      setReadIds((prev) => new Set([...prev, notification.id]));
      startTransition(async () => {
        await markNotificationReadAction({ notificationId: notification.id });
      });
    }
  }

  function handleClose() {
    setSelected(null);
  }

  function handleNavigate(url: string) {
    setSelected(null);
    router.push(url);
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            isUnread={!readIds.has(notification.id)}
            onOpen={handleOpen}
          />
        ))}
      </div>

      {selected && (
        <NotificationModal
          notification={selected}
          onClose={handleClose}
          onNavigate={handleNavigate}
        />
      )}
    </>
  );
}
