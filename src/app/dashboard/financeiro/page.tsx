import { redirect } from "next/navigation";
import { Wallet, TrendingUp, Receipt, Users } from "lucide-react";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/dashboard/ui";
import { formatCurrency, formatDate, startOfMonth } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session?.companyId) redirect("/login");
  const companyId = session.companyId;

  const [revenue, commissions, expenses, monthly, recent] = await Promise.all([
    prisma.appointment.aggregate({ where: { companyId, status: "COMPLETED" }, _sum: { servicePriceCents: true }, _count: true }),
    prisma.commission.aggregate({ where: { companyId }, _sum: { amountCents: true }, _count: true }),
    prisma.expense.aggregate({ where: { companyId }, _sum: { amountCents: true } }),
    prisma.$queryRaw<{ month: string; total: bigint }[]>`
      SELECT TO_CHAR(start_at, 'YYYY-MM') AS month, SUM(service_price_cents)::bigint AS total
      FROM appointments WHERE company_id = ${companyId} AND status = 'COMPLETED'
      GROUP BY month ORDER BY month DESC LIMIT 6
    `,
    prisma.appointment.findMany({
      where: { companyId, status: "COMPLETED" },
      orderBy: { startAt: "desc" },
      take: 15,
      select: { id: true, startAt: true, serviceName: true, servicePriceCents: true, clientName: true, professionalName: true },
    }),
  ]);

  const revenueCents = revenue._sum.servicePriceCents || 0;
  const commissionCents = commissions._sum.amountCents || 0;

  return (
    <>
      <PageHeader title="Financeiro" description="Receitas, comissões e saúde financeira da salão." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Receita total" value={formatCurrency(revenueCents)} icon={TrendingUp} tone="emerald" hint={`${revenue._count} atendimentos`} />
        <StatCard label="Comissões pagas/pendentes" value={formatCurrency(commissionCents)} icon={Users} tone="amber" hint={`${commissions._count} comissões`} />
        <StatCard label="Despesas registradas" value={formatCurrency(expenses._sum.amountCents || 0)} icon={Receipt} tone="red" />
        <StatCard label="Lucro estimado" value={formatCurrency(revenueCents - commissionCents - (expenses._sum.amountCents || 0))} icon={Wallet} tone="violet" hint="Receita - comissões - despesas" />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <div className="vixt-card p-5 xl:col-span-2">
          <h2 className="mb-5 font-semibold text-white">Faturamento por mês</h2>
          <RevenueChart data={monthly.map((m) => ({ month: m.month, total: Number(m.total) / 100 }))} />
        </div>
        <div className="vixt-card p-5">
          <h2 className="mb-4 font-semibold text-white">Últimos atendimentos</h2>
          <div className="space-y-3">
            {recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b border-white/[0.04] pb-2 last:border-0">
                <div>
                  <p className="text-sm text-rose-50">{r.serviceName}</p>
                  <p className="text-[11px] text-rose-100/45">{r.clientName} · {formatDate(r.startAt)}</p>
                </div>
                <span className="text-sm font-semibold text-rose-300">{formatCurrency(r.servicePriceCents)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
