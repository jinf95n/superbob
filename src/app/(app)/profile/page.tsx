import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserAccountProfile } from "@/modules/users/queries";
import { getProfessionalSlugByUserId } from "@/modules/professionals/queries";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const [accountProfile, professionalSlug] = await Promise.all([
    getUserAccountProfile(session.user.id),
    getProfessionalSlugByUserId(session.user.id),
  ]);

  if (!accountProfile) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6 sm:py-8">
      <h1 className="font-display text-[28px] font-bold text-sb-text">
        Tu cuenta
      </h1>

      <ProfileForm
        accountProfile={accountProfile}
        professionalSlug={professionalSlug}
      />
    </main>
  );
}
