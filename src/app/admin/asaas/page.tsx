import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/ui";
import { AsaasManager } from "@/components/admin/asaas-manager";
import { getAsaasConfig, getWalletBalance, listPayments } from "@/lib/asaas";

export const dynamic = "force-dynamic";

export default async function AdminAsaasPage() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") redirect("/login");

  const cfg = await getAsaasConfig();
  const dbConfig = await prisma.asaasConfig.findFirst();

  const [invoiceTotals, events, payments, balance] = await Promise.all([
    prisma.invoice.aggregate({ where: { providerRef: { not: null } }, _sum: { amountCents: true }, _count: true }),
    prisma.asaasEvent.count(),
    cfg.configured ? listPayments(50).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
    cfg.configured ? getWalletBalance().then((b) => b.balance).catch(() => null) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Carteira Asaas"
        description="Gerencie a integração de pagamentos e receba as assinaturas dos salões direto na sua carteira."
      />
      <AsaasManager
        overview={{
          configured: cfg.configured,
          environment: cfg.environment,
          walletId: cfg.walletId,
          balance,
          localCharges: invoiceTotals._count,
          localTotalCents: invoiceTotals._sum.amountCents || 0,
          events,
          asaasPayments: payments.data,
        }}
        config={dbConfig ? {
          apiKey: dbConfig.apiKey ? "••••••••" + dbConfig.apiKey.slice(-4) : "",
          environment: dbConfig.environment,
          walletId: dbConfig.walletId,
          webhookToken: dbConfig.webhookToken,
          active: dbConfig.active,
        } : null}
      />
    </div>
  );
}
