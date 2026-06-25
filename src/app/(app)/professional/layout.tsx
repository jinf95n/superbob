import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserRole } from "@/modules/users/queries";

export default async function ProfessionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const role = await getUserRole(session.user.id);
  if (role === "admin") {
    redirect("/admin");
  }

  return <>{children}</>;
}
