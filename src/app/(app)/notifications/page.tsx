import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getNotificationsForUser } from "@/modules/notifications/queries";
import { NotificationItem } from "./NotificationItem";

export default async function NotificationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const notifications = await getNotificationsForUser(session.user.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-[28px] font-bold text-sb-text">
        Notificaciones
      </h1>

      {notifications.length === 0 ? (
        <p className="mt-6 text-[15px] text-sb-muted">
          Todavía no tenés notificaciones.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      )}
    </main>
  );
}
