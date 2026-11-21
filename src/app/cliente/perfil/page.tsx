import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/ui";
import { ProfileForm } from "@/components/client/profile-form";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <>
      <PageHeader title="Meu perfil" description="Seus dados são usados para facilitar seus agendamentos." />
      <ProfileForm initial={{ name: session.name, email: session.email }} />
    </>
  );
}
