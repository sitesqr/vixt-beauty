import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/ui";
import { ProfessionalsManager } from "@/components/dashboard/professionals-manager";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session?.companyId) redirect("/login");
  const [professionals, services] = await Promise.all([
    prisma.professional.findMany({
      where: { companyId: session.companyId },
      include: { services: { include: { service: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.service.findMany({ where: { companyId: session.companyId, active: true }, orderBy: { name: "asc" } }),
  ]);
  return (
    <>
      <PageHeader title="Profissionais" description="Gerencie sua equipe, especialidades e comissões." />
      <ProfessionalsManager
        initial={professionals.map((p) => ({
          id: p.id, name: p.name, photoUrl: p.photoUrl, email: p.email, phone: p.phone, bio: p.bio,
          specialties: p.specialties, commissionRate: p.commissionRate, active: p.active,
          serviceIds: p.services.map((s) => s.serviceId),
        }))}
        services={services.map((s) => ({ id: s.id, name: s.name }))}
      />
    </>
  );
}
