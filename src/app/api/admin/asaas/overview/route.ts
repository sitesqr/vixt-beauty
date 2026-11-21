import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleError, ok } from "@/lib/api";
import { AsaasError, getAsaasConfig, getWalletBalance, listPayments } from "@/lib/asaas";

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN");
    const cfg = await getAsaasConfig();

    const [invoiceTotals, asaasPayments] = await Promise.all([
      prisma.invoice.aggregate({
        where: { providerRef: { not: null } },
        _sum: { amountCents: true },
        _count: true,
      }),
      cfg.configured
        ? listPayments(50).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] }),
    ]);

    let balance: number | null = null;
    if (cfg.configured) {
      try {
        balance = (await getWalletBalance()).balance;
      } catch {
        balance = null;
      }
    }

    return ok({
      configured: cfg.configured,
      environment: cfg.environment,
      walletId: cfg.walletId,
      balance,
      localCharges: invoiceTotals._count,
      localTotalCents: invoiceTotals._sum.amountCents || 0,
      asaasPayments: asaasPayments.data.slice(0, 20),
      events: await prisma.asaasEvent.count(),
    });
  } catch (e) {
    if (e instanceof AsaasError) return ok({ configured: false, error: e.message });
    return handleError(e);
  }
}
