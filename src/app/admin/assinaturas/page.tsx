import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatusBadge } from "@/components/dashboard/ui";
import { SubscriptionsManager } from "@/components/admin/subscriptions-manager";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session) return null;
  const subs = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: { company: { select: { name: true, slug: true } }, plan: { select: { name: true, priceCents: true } } },
  });
  return (
    <>
      <PageHeader title="Assinaturas" description={`${subs.length} assinatura(s) no total.`} />
      <SubscriptionsManager initial={subs.map((s) => ({
        id: s.id, status: s.status, companyName: s.company.name, companySlug: s.company.slug,
        planName: s.plan.name, priceCents: s.plan.priceCents,
        currentPeriodEnd: s.currentPeriodEnd.toISOString(), trialEndsAt: s.trialEndsAt?.toISOString() || null,
        cancelAtPeriodEnd: s.cancelAtPeriodEnd,
      }))} />
    </>
  );
}
