import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/dashboard/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Building2, Users, CalendarDays, TrendingUp, Star, Banknote } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session) return null;

  const [byCompany, byPlan, totals, reviews, topCompanies] = await Promise.all([
    prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { name: true } },
        subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { appointments: true } },
      },
    }),
    prisma.subscription.groupBy({ by: ["planId"], _count: true }),
    (async () => ({
      users: await prisma.user.count(),
      clients: await prisma.user.count({ where: { role: "CLIENT" } }),
      owners: await prisma.user.count({ where: { role: "OWNER" } }),
      appointments: await prisma.appointment.count(),
      reviews: await prisma.review.count(),
      payments: await prisma.platformPayment.aggregate({ _sum: { amountCents: true } }),
    }))(),
    prisma.review.aggregate({ _avg: { rating: true } }),
    prisma.$queryRaw<{ company_id: string; total: bigint }[]>`
      SELECT company_id, SUM(service_price_cents)::bigint AS total FROM appointments
      WHERE status = 'COMPLETED' GROUP BY company_id ORDER BY total DESC LIMIT 5
    `,
  ]);

  const planNames = new Map((await prisma.plan.findMany({ select: { id: true, name: true } })).map((p) => [p.id, p.name]));
  const companyNames = new Map(byCompany.map((c) => [c.id, c.name]));

  return (
    <>
      <PageHeader title="Relatórios gerais" description="Indicadores consolidados de toda a plataforma." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Usuários totais" value={totals.users} icon={Users} />
        <StatCard label="Clientes finais" value={totals.clients} icon={Users} tone="emerald" />
        <StatCard label="Proprietárias" value={totals.owners} icon={Building2} tone="violet" />
        <StatCard label="Agendamentos" value={totals.appointments} icon={CalendarDays} tone="amber" />
        <StatCard label="Total arrecadado" value={formatCurrency(totals.payments._sum.amountCents || 0)} icon={Banknote} tone="emerald" />
        <StatCard label="Avaliação média" value={reviews._avg.rating?.toFixed(1) || "—"} icon={Star} tone="amber" />
        <StatCard label="Total de avaliações" value={totals.reviews} icon={Star} />
        <StatCard label="Receita p/ shop (top 5)" value={topCompanies.length} icon={TrendingUp} tone="violet" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="vixt-card p-6">
          <h2 className="mb-5 font-semibold text-white">Assinaturas por plano</h2>
          <div className="space-y-3">
            {byPlan.map((p) => (
              <div key={p.planId} className="flex items-center justify-between rounded-xl bg-white/[0.02] p-3">
                <span className="text-sm text-rose-100">{planNames.get(p.planId) || "—"}</span>
                <span className="font-semibold text-rose-300">{p._count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="vixt-card p-6">
          <h2 className="mb-5 font-semibold text-white">Top 5 salões por faturamento</h2>
          <div className="space-y-3">
            {topCompanies.map((c, i) => (
              <div key={c.company_id} className="flex items-center justify-between rounded-xl bg-white/[0.02] p-3">
                <span className="text-sm text-rose-100"><span className="mr-2 text-rose-400">#{i + 1}</span>{companyNames.get(c.company_id) || "—"}</span>
                <span className="font-semibold text-emerald-400">{formatCurrency(Number(c.total))}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="vixt-card mt-6 overflow-hidden">
        <div className="border-b border-white/[0.06] px-6 py-4"><h2 className="font-semibold text-white">Clientes e agendamentos por empresa</h2></div>
        <div className="divide-y divide-white/[0.05]">
          {byCompany.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 px-6 py-3.5 text-sm">
              <span className="flex-1 font-medium text-white">{c.name}</span>
              <span className="text-xs text-rose-100/45">Responsável: {c.owner.name}</span>
              <span className="text-xs text-rose-100/60">{c._count.appointments} agendamentos</span>
              <span className="text-xs text-rose-300">{c.subscriptions?.[0]?.plan.name || "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
