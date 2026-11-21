import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/ui";
import { ServicesManager } from "@/components/dashboard/services-manager";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session?.companyId) redirect("/login");
  const services = await prisma.service.findMany({
    where: { companyId: session.companyId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return (
    <>
      <PageHeader title="Serviços" description="Cadastre e gerencie os serviços e preços da sua salão." />
      <ServicesManager initial={services.map((s) => ({ ...s, createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString() }))} />
    </>
  );
}
