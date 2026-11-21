import Link from "next/link";
import {
  Building2, CheckCircle2, FlaskConical, AlertTriangle, Ban, CreditCard,
  Wallet, Clock, XCircle, Users, CalendarDays, ArrowRight, TrendingUp,
} from "lucide-react";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard, PageHeader, StatusBadge } from "@/components/dashboard/ui";
import { formatCurrency, formatDate, startOfMonth } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session) return null;

  const now = new Date();
  const monthStart = startOfMonth(now);

  const [
    totalCompanies, activeCompanies, trialCompanies, pastDue, suspended,
    totalSubs, mrr, payments, pending, cancellations, clients, appointments,
    recent, revenueByMonth, revenueThisMonth,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { status: "ACTIVE" } }),
    prisma.company.count({ where: { status: "TRIAL" } }),
    prisma.company.count({ where: { status: "PAST_DUE" } }),
    prisma.company.count({ where: { status: "SUSPENDED" } }),
    prisma.subscription.count({ where: { status: { in: ["ACTIVE", "TRIALING"] } } }),
    prisma.$queryRaw<{ total: bigint }[]>`
      SELECT COALESCE(SUM(p.price_cents),0)::bigint AS total FROM subscriptions s
      JOIN plans p ON p.id = s.plan_id WHERE s.status = 'ACTIVE'
    `.then((r) => Number(r[0]?.total || 0)),
    prisma.platformPayment.aggregate({ where: { paidAt: { gte: monthStart } }, _sum: { amountCents: true } }),
    prisma.invoice.aggregate({ where: { status: "PENDING" }, _sum: { amountCents: true }, _count: true }),
    prisma.subscription.count({ where: { status: "CANCELLED", canceledAt: { gte: monthStart } } }),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.appointment.count(),
    prisma.company.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { owner: { select: { name: true } }, subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 1 } } }),
    prisma.$queryRaw<{ month: string; total: bigint }[]>`
      SELECT TO_CHAR(paid_at, 'YYYY-MM') AS month, SUM(amount_cents)::bigint AS total
      FROM platform_payments WHERE paid_at >= NOW() - INTERVAL '6 months'
      GROUP BY month ORDER BY month
    `,
    prisma.platformPayment.aggregate({ where: { paidAt: { gte: monthStart } }, _sum: { amountCents: true } }),
  ]);

  return (
    <>
      <PageHeader
        title="Central de controle"
        description="Visão geral de toda a plataforma VIXT Beauty."
        action={<Link href="/admin/empresas" className="vixt-btn-primary"><Building2 className="h-4 w-4" /> Gerenciar empresas</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total de empresas" value={totalCompanies} icon={Building2} />
        <StatCard label="Empresas ativas" value={activeCompanies} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Empresas em teste" value={trialCompanies} icon={FlaskConical} tone="amber" />
        <StatCard label="Empresas inadimplentes" value={pastDue} icon={AlertTriangle} tone="red" />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Empresas suspensas" value={suspended} icon={Ban} tone="red" />
        <StatCard label="Assinaturas ativas" value={totalSubs} icon={CreditCard} tone="violet" />
        <StatCard label="Receita mensal recorrente" value={formatCurrency(mrr)} icon={TrendingUp} tone="emerald" />
        <StatCard label="Pagamentos recebidos (mês)" value={formatCurrency(payments._sum.amountCents || 0)} icon={Wallet} tone="emerald" />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pagamentos pendentes" value={formatCurrency(pending._sum.amountCents || 0)} icon={Clock} tone="amber" hint={`${pending._count} fatura(s)`} />
        <StatCard label="Cancelamentos (mês)" value={cancellations} icon={XCircle} tone="red" />
        <StatCard label="Clientes finais (gratuitos)" value={clients} icon={Users} />
        <StatCard label="Total de agendamentos" value={appointments} icon={CalendarDays} tone="violet" />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <div className="vixt-card p-5 xl:col-span-2">
          <h2 className="mb-5 font-semibold text-white">Faturamento da plataforma</h2>
          <RevenueChart data={revenueByMonth.map((r) => ({ month: r.month, total: Number(r.total) / 100 }))} />
        </div>
        <div className="vixt-card p-5">
          <h2 className="mb-4 font-semibold text-white">Resumo financeiro (mês)</h2>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-white/[0.05] pb-3"><span className="text-sm text-rose-100/60">Recebido</span><span className="font-semibold text-emerald-400">{formatCurrency(revenueThisMonth._sum.amountCents || 0)}</span></div>
            <div className="flex justify-between border-b border-white/[0.05] pb-3"><span className="text-sm text-rose-100/60">A receber</span><span className="font-semibold text-champagne-400">{formatCurrency(pending._sum.amountCents || 0)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-rose-100/60">MRR</span><span className="font-semibold text-rose-300">{formatCurrency(mrr)}</span></div>
          </div>
          <Link href="/admin/cobrancas" className="vixt-btn-ghost mt-6 w-full !py-2.5 text-xs">Ver cobranças <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </div>

      <div className="vixt-card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h2 className="font-semibold text-white">Empresas recentes</h2>
          <Link href="/admin/empresas" className="flex items-center gap-1 text-xs text-rose-400">Ver todas <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {recent.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 px-6 py-4 text-sm">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500/10 font-bold text-rose-400">{c.name.charAt(0)}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">{c.name}</p>
                <p className="text-xs text-rose-100/45">{c.owner.name} · /b/{c.slug} · {formatDate(c.createdAt)}</p>
              </div>
              <span className="text-xs text-rose-100/60">{c.subscriptions?.[0]?.plan.name || "—"}</span>
              <StatusBadge status={c.status} />
              <Link href={`/admin/empresas/${c.id}`} className="text-xs text-rose-400 hover:underline">Detalhes</Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
