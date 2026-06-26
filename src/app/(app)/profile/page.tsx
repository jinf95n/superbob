import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getUserAccountProfile,
  getUserProfileStats,
  getUserRole,
} from "@/modules/users/queries";
import { getActiveProfessionalSlugByUserId } from "@/modules/professionals/queries";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const [accountProfile, professionalSlug, stats, role] = await Promise.all([
    getUserAccountProfile(session.user.id),
    getActiveProfessionalSlugByUserId(session.user.id),
    getUserProfileStats(session.user.id),
    getUserRole(session.user.id),
  ]);

  if (!accountProfile) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-lg px-4 pb-10 pt-6 sm:pt-8">
      <ProfileForm
        accountProfile={accountProfile}
        professionalSlug={professionalSlug}
        stats={stats}
        isAdmin={role === "admin"}
      />
    </main>
  );
}
