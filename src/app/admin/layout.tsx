import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserRole } from "@/modules/users/queries";
import { AdminNav } from "@/components/layout/AdminNav";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const role = await getUserRole(session.user.id);
  if (role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div>
      <AdminNav />
      <main className="p-4">{children}</main>
    </div>
  );
}
