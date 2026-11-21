import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/ui";
import { NewCompanyForm } from "@/components/admin/new-company-form";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session) return null;
  const plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return (
    <>
      <PageHeader title="Nova empresa" description="Cadastre manualmente um salão e sua proprietária." />
      <NewCompanyForm plans={plans.map((p) => ({ id: p.id, name: p.name, priceCents: p.priceCents, trialDays: p.trialDays }))} />
    </>
  );
}
