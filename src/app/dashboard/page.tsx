import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays, CheckCircle2, XCircle, Users, UserCog, Wallet,
  TrendingUp, Clock, ArrowRight, Star, Scissors, AlertCircle,
} from "lucide-react";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard, PageHeader, EmptyState } from "@/components/dashboard/ui";
import { formatCurrency, formatDateTime, startOfDay, endOfDay, startOfMonth } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OwnerDashboard() {
  const session = await getSession();
  if (!session?.companyId) redirect("/login");
  const companyId = session.companyId;

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);

  const [
    todayAppointments, upcoming, completedThisMonth, cancelledThisMonth,
    totalClients, totalPros, revenueToday, revenueMonth, topServices,
    pendingCommissions, recentReviews, weeklyRevenue, subscription,
  ] = await Promise.all([
    prisma.appointment.findMany({
      where: { companyId, startAt: { gte: todayStart, lte: todayEnd } },
      orderBy: { startAt: "asc" },
      include: { professional: { select: { name: true } }, service: { select: { name: true } } },
    }),
    prisma.appointment.count({
      where: { companyId, startAt: { gt: now }, status: { in: ["PENDING", "CONFIRMED"] } },
    }),
    prisma.appointment.count({ where: { companyId, status: "COMPLETED", startAt: { gte: monthStart } } }),
    prisma.appointment.count({ where: { companyId, status: "CANCELLED", startAt: { gte: monthStart } } }),
    prisma.appointment.groupBy({ by: ["clientId"], where: { companyId } }).then((r) => r.length),
    prisma.professional.count({ where: { companyId, active: true } }),
    prisma.appointment.aggregate({
      where: { companyId, status: "COMPLETED", startAt: { gte: todayStart, lte: todayEnd } },
      _sum: { servicePriceCents: true },
    }),
    prisma.appointment.aggregate({
      where: { companyId, status: "COMPLETED", startAt: { gte: monthStart } },
      _sum: { servicePriceCents: true },
    }),
    prisma.appointment.groupBy({
      by: ["serviceName"],
      where: { companyId, status: "COMPLETED" },
      _count: true,
      orderBy: { _count: { serviceName: "desc" } },
      take: 5,
    }),
    prisma.commission.aggregate({
      where: { companyId, paid: false },
      _sum: { amountCents: true },
    }),
    prisma.review.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { client: { select: { name: true } } },
    }),
    prisma.appointment.groupBy({
      by: ["startAt"],
      where: { companyId, status: "COMPLETED", startAt: { gte: new Date(now.getTime() - 7 * 86400000) } },
      _sum: { servicePriceCents: true },
    }).then((rows) => {
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now.getTime() - (6 - i) * 86400000);
        return { label: d.toLocaleDateString("pt-BR", { weekday: "short" }), key: d.toISOString().slice(0, 10), total: 0 };
      });
      for (const r of rows) {
        const day = days.find((d) => d.key === r.startAt.toISOString().slice(0, 10));
        if (day) day.total = (r._sum.servicePriceCents || 0) / 100;
      }
      return days;
    }),
    prisma.subscription.findFirst({
      where: { companyId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const revenueTodayCents = revenueToday._sum.servicePriceCents || 0;
  const revenueMonthCents = revenueMonth._sum.servicePriceCents || 0;

  return (
    <>
      <PageHeader
        title={`Olá, ${session.name.split(" ")[0]} 👋`}
        description="Aqui está o resumo da sua salão hoje."
        action={
          <Link href="/dashboard/agenda" className="vixt-btn-primary">
            <CalendarDays className="h-4 w-4" /> Abrir agenda
          </Link>
        }
      />

      {subscription?.status === "TRIALING" && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-champagne-400" />
            <div>
              <p className="text-sm font-semibold text-amber-200">Período de teste ativo</p>
              <p className="text-xs text-amber-300/70">Você está testando o plano {subscription.plan.name} até {subscription.trialEndsAt?.toLocaleDateString("pt-BR")}.</p>
            </div>
          </div>
          <Link href="/dashboard/assinatura" className="vixt-btn-ghost !py-2 text-xs">Ver assinatura</Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Agendamentos hoje" value={todayAppointments.length} icon={CalendarDays} hint={`${upcoming} próximos`} />
        <StatCard label="Faturamento de hoje" value={formatCurrency(revenueTodayCents)} icon={Wallet} tone="emerald" hint="Atendimentos concluídos" />
        <StatCard label="Faturamento do mês" value={formatCurrency(revenueMonthCents)} icon={TrendingUp} tone="violet" hint={`${completedThisMonth} atendimentos`} />
        <StatCard label="Comissões pendentes" value={formatCurrency(pendingCommissions._sum.amountCents || 0)} icon={Clock} tone="amber" hint="A pagar aos profissionais" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total de clientes" value={totalClients} icon={Users} />
        <StatCard label="Profissionais ativos" value={totalPros} icon={UserCog} />
        <StatCard label="Concluídos no mês" value={completedThisMonth} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Cancelamentos no mês" value={cancelledThisMonth} icon={XCircle} tone="red" />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <div className="vixt-card p-5 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">Faturamento nos últimos 7 dias</h2>
              <p className="text-xs text-rose-100/45">Atendimentos concluídos</p>
            </div>
          </div>
          <RevenueChart data={weeklyRevenue} />
        </div>

        <div className="vixt-card p-5">
          <h2 className="mb-4 font-semibold text-white">Serviços mais realizados</h2>
          {topServices.length === 0 ? (
            <p className="py-8 text-center text-sm text-rose-100/45">Ainda não há dados</p>
          ) : (
            <div className="space-y-4">
              {topServices.map((s, i) => {
                const max = topServices[0]._count;
                return (
                  <div key={s.serviceName}>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-rose-100">{s.serviceName}</span>
                      <span className="text-rose-100/45">{s._count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all" style={{ width: `${(s._count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <div className="vixt-card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <h2 className="font-semibold text-white">Agenda de hoje</h2>
            <Link href="/dashboard/agendamentos" className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300">
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {todayAppointments.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Scissors} title="Nenhum agendamento hoje" description="Compartilhe sua página pública para receber agendamentos online." />
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {todayAppointments.map((a) => (
                <div key={a.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center">
                  <span className="w-16 font-mono text-sm font-semibold text-rose-400">
                    {new Date(a.startAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{a.serviceName}</p>
                    <p className="text-xs text-rose-100/45">{a.clientName} · {a.professionalName}</p>
                  </div>
                  <span className="text-sm text-rose-100/60">{formatCurrency(a.servicePriceCents)}</span>
                  <span className={`vixt-badge w-fit ring-1 ring-inset ${a.status === "CONFIRMED" ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" : "bg-amber-500/10 text-champagne-400 ring-amber-500/20"}`}>
                    {a.status === "CONFIRMED" ? "Confirmado" : "Pendente"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="vixt-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Últimas avaliações</h2>
            <Star className="h-4 w-4 text-champagne-400" />
          </div>
          {recentReviews.length === 0 ? (
            <p className="py-8 text-center text-sm text-rose-100/45">Nenhuma avaliação ainda</p>
          ) : (
            <div className="space-y-4">
              {recentReviews.map((r) => (
                <div key={r.id} className="rounded-xl bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-rose-50">{r.client.name}</span>
                    <span className="flex gap-0.5">
                      {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-champagne-400 text-champagne-400" />)}
                    </span>
                  </div>
                  {r.comment && <p className="mt-1.5 line-clamp-2 text-xs text-rose-100/45">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
