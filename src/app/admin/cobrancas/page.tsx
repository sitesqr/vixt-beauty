import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard } from "@/components/dashboard/ui";
import { ChargesManager } from "@/components/admin/charges-manager";
import { formatCurrency, startOfMonth } from "@/lib/utils";
import { Wallet, Clock, CheckCircle2, Receipt } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session) return null;
  const [invoices, paidThisMonth, pending] = await Promise.all([
    prisma.invoice.findMany({ orderBy: { createdAt: "desc" }, include: { company: { select: { name: true, slug: true } } } }),
    prisma.platformPayment.aggregate({ where: { paidAt: { gte: startOfMonth() } }, _sum: { amountCents: true } }),
    prisma.invoice.aggregate({ where: { status: "PENDING" }, _sum: { amountCents: true }, _count: true }),
  ]);
  return (
    <>
      <PageHeader title="Cobranças" description="Faturamento da plataforma — pagamentos das proprietárias." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Recebido no mês" value={formatCurrency(paidThisMonth._sum.amountCents || 0)} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Pendente" value={formatCurrency(pending._sum.amountCents || 0)} icon={Clock} tone="amber" hint={`${pending._count} fatura(s)`} />
        <StatCard label="Total de faturas" value={invoices.length} icon={Receipt} tone="violet" />
      </div>
      <ChargesManager initial={invoices.map((i) => ({
        id: i.id, number: i.number, amountCents: i.amountCents, status: i.status,
        description: i.description || "", dueDate: i.dueDate.toISOString(), paidAt: i.paidAt?.toISOString() || null,
        companyName: i.company.name, companySlug: i.company.slug,
      }))} />
    </>
  );
}
