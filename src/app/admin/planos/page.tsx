import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/ui";
import { PlansManager } from "@/components/admin/plans-manager";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session) return null;
  const plans = await prisma.plan.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { subscriptions: true } } },
  });
  return (
    <>
      <PageHeader title="Planos" description="Configure os planos e preços das assinaturas." />
      <PlansManager initial={plans.map((p) => ({
        id: p.id, name: p.name, slug: p.slug, description: p.description || "",
        priceCents: p.priceCents, trialDays: p.trialDays, maxProfessionals: p.maxProfessionals,
        maxServices: p.maxServices, features: typeof p.features === "string" ? JSON.parse(p.features) : p.features,
        active: p.active, sortOrder: p.sortOrder, subscriptions: p._count.subscriptions,
      }))} />
    </>
  );
}
