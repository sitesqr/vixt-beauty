import { redirect } from "next/navigation";
import Link from "next/link";
import { CreditCard, Check, CalendarDays, AlertCircle } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/ui";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session?.companyId) redirect("/login");
  const [subscription, invoices] = await Promise.all([
    prisma.subscription.findFirst({ where: { companyId: session.companyId }, include: { plan: true }, orderBy: { createdAt: "desc" } }),
    prisma.invoice.findMany({ where: { companyId: session.companyId }, orderBy: { createdAt: "desc" } }),
  ]);

  const features: string[] = subscription?.plan?.features ? JSON.parse(subscription.plan.features as string) : [];

  return (
    <>
      <PageHeader title="Minha assinatura" description="Gerencie seu plano e acompanhe os pagamentos da plataforma." />
      {subscription && (
        <div className="vixt-card overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-white/[0.06] bg-gradient-to-r from-rose-500/[0.12] to-transparent p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/15 text-rose-400"><CreditCard className="h-7 w-7" /></div>
              <div>
                <p className="text-xs text-rose-100/45">Plano atual</p>
                <h2 className="text-2xl font-bold text-white">{subscription.plan.name}</h2>
                <span className={`vixt-badge mt-1 ${subscription.status === "TRIALING" ? "bg-amber-500/10 text-champagne-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                  {subscription.status === "TRIALING" ? "Período de teste" : subscription.status === "ACTIVE" ? "Ativa" : subscription.status}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-white">{formatCurrency(subscription.plan.priceCents)}<span className="text-sm font-normal text-rose-100/45">/mês</span></p>
              <p className="mt-1 text-xs text-rose-100/45">Próxima cobrança: {formatDate(subscription.currentPeriodEnd)}</p>
            </div>
          </div>
          <div className="p-6">
            <h3 className="mb-4 text-sm font-semibold text-white">Recursos inclusos</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((f) => <p key={f} className="flex items-center gap-2 text-sm text-rose-100/60"><Check className="h-4 w-4 text-rose-400" />{f}</p>)}
            </div>
            {subscription.status === "TRIALING" && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-champagne-400" />
                <p className="text-xs text-amber-200">Seu período de teste termina em <strong>{formatDate(subscription.trialEndsAt!)}</strong>. Entre em contato para ativar a cobrança e continuar usando todas as funcionalidades.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="vixt-card mt-6 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-6 py-4"><CalendarDays className="h-4 w-4 text-rose-400" /><h3 className="font-semibold text-white">Histórico de cobranças</h3></div>
        {invoices.length === 0 ? <p className="p-6 text-sm text-rose-100/45">Nenhuma cobrança ainda.</p> : (
          <div className="divide-y divide-white/[0.05]">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex flex-wrap items-center gap-3 px-6 py-4 text-sm">
                <span className="font-mono text-xs text-rose-100/45">{inv.number}</span>
                <span className="flex-1 text-rose-100/60">{inv.description}</span>
                <span className="text-rose-100/45">{formatDate(inv.dueDate)}</span>
                <span className="font-semibold text-white">{formatCurrency(inv.amountCents)}</span>
                <span className={`vixt-badge ${inv.status === "PAID" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-champagne-400"}`}>{inv.status === "PAID" ? "Pago" : "Pendente"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
