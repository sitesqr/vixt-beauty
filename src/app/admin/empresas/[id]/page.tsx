import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Users, CalendarDays, Star, CreditCard, Receipt } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/dashboard/ui";
import { CompanyControls } from "@/components/admin/company-controls";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return null;
  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      owner: true,
      subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 1 },
      invoices: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { appointments: true, professionals: true, services: true, reviews: true } },
    },
  });
  if (!company) notFound();

  const clientCount = await prisma.appointment.groupBy({ by: ["clientId"], where: { companyId: id } });
  const revenue = await prisma.appointment.aggregate({ where: { companyId: id, status: "COMPLETED" }, _sum: { servicePriceCents: true } });

  const info = [
    { icon: Users, label: "Profissionais", value: company._count.professionals },
    { icon: Building2, label: "Serviços", value: company._count.services },
    { icon: CalendarDays, label: "Agendamentos", value: company._count.appointments },
    { icon: Users, label: "Clientes únicos", value: clientCount.length },
    { icon: Star, label: "Avaliações", value: company._count.reviews },
    { icon: CreditCard, label: "Faturamento da empresa", value: formatCurrency(revenue._sum.servicePriceCents || 0) },
  ];

  return (
    <>
      <Link href="/admin/empresas" className="mb-5 inline-flex items-center gap-2 text-sm text-rose-100/60 hover:text-white"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/10 text-2xl font-bold text-rose-400">{company.name.charAt(0)}</span>
          <div>
            <div className="flex items-center gap-3"><h1 className="text-2xl font-bold text-white">{company.name}</h1><StatusBadge status={company.status} /></div>
            <p className="text-sm text-rose-100/45">/{company.slug} · Criada em {formatDate(company.createdAt)}</p>
          </div>
        </div>
        <a href={`/b/${company.slug}`} target="_blank" className="vixt-btn-ghost">Ver página pública ↗</a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {info.map(({ icon: Icon, label, value }) => (
          <div key={label} className="vixt-card p-5">
            <div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-rose-400"><Icon className="h-4 w-4" /></div>
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-xs text-rose-100/45">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <CompanyControls
          companyId={company.id}
          status={company.status}
          name={company.name}
          trialEndsAt={company.trialEndsAt?.toISOString() || null}
        />
        <div className="vixt-card p-6">
          <h2 className="mb-5 font-semibold text-white">Proprietária</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-rose-100/45">Nome</span><span className="text-white">{company.owner.name}</span></div>
            <div className="flex justify-between"><span className="text-rose-100/45">E-mail</span><span className="text-white">{company.owner.email}</span></div>
            <div className="flex justify-between"><span className="text-rose-100/45">Telefone</span><span className="text-white">{company.owner.phone || "—"}</span></div>
            <div className="flex justify-between"><span className="text-rose-100/45">Plano</span><span className="text-rose-300">{company.subscriptions?.[0]?.plan.name || "—"}</span></div>
            <div className="flex justify-between"><span className="text-rose-100/45">Assinatura</span><span className="text-white">{company.subscriptions?.[0]?.status || "—"}</span></div>
          </div>
        </div>
      </div>

      <div className="vixt-card mt-6 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-6 py-4"><Receipt className="h-4 w-4 text-rose-400" /><h2 className="font-semibold text-white">Faturas da empresa</h2></div>
        {company.invoices.length === 0 ? <p className="p-6 text-sm text-rose-100/45">Nenhuma fatura.</p> : (
          <div className="divide-y divide-white/[0.05]">
            {company.invoices.map((inv) => (
              <div key={inv.id} className="flex flex-wrap items-center gap-3 px-6 py-3 text-sm">
                <span className="font-mono text-xs text-rose-100/45">{inv.number}</span>
                <span className="flex-1 text-rose-100/60">{inv.description}</span>
                <span className="font-semibold text-white">{formatCurrency(inv.amountCents)}</span>
                <span className={`vixt-badge ${inv.status === "PAID" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-champagne-400"}`}>{inv.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
