import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleError, ok } from "@/lib/api";
import { startOfMonth } from "@/lib/utils";

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN");
    const now = new Date();
    const monthStart = startOfMonth(now);

    const [
      totalCompanies, activeCompanies, trialCompanies, pastDueCompanies,
      suspendedCompanies, totalSubscriptions, mrr, paymentsReceived,
      pendingInvoices, cancelamentos, clients, appointments,
      recentCompanies, revenueByMonth,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { status: "ACTIVE" } }),
      prisma.company.count({ where: { status: "TRIAL" } }),
      prisma.company.count({ where: { status: "PAST_DUE" } }),
      prisma.company.count({ where: { status: "SUSPENDED" } }),
      prisma.subscription.count({ where: { status: { in: ["ACTIVE", "TRIALING"] } } }),
      prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COALESCE(SUM(p."price_cents"), 0)::bigint AS total
        FROM subscriptions s JOIN plans p ON p.id = s.plan_id
        WHERE s.status = 'ACTIVE'
      `.then((r) => Number(r[0]?.total || 0)),
      prisma.platformPayment.aggregate({ where: { paidAt: { gte: monthStart } }, _sum: { amountCents: true } }),
      prisma.invoice.aggregate({ where: { status: "PENDING" }, _sum: { amountCents: true }, _count: true }),
      prisma.subscription.count({ where: { status: "CANCELLED", canceledAt: { gte: monthStart } } }),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.appointment.count(),
      prisma.company.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { owner: { select: { name: true, email: true } } } }),
      prisma.$queryRaw<{ month: string; total: bigint }[]>`
        SELECT TO_CHAR(paid_at, 'YYYY-MM') AS month, SUM(amount_cents)::bigint AS total
        FROM platform_payments
        WHERE paid_at >= NOW() - INTERVAL '6 months'
        GROUP BY month ORDER BY month
      `,
    ]);

    return ok({
      stats: {
        totalCompanies,
        activeCompanies,
        trialCompanies,
        pastDueCompanies,
        suspendedCompanies,
        totalSubscriptions,
        mrrCents: mrr,
        paymentsReceivedCents: paymentsReceived._sum.amountCents || 0,
        pendingCents: pendingInvoices._sum.amountCents || 0,
        pendingCount: pendingInvoices._count,
        cancelamentos,
        totalClients: clients,
        totalAppointments: appointments,
      },
      recentCompanies,
      revenueByMonth: revenueByMonth.map((r) => ({ month: r.month, total: Number(r.total) })),
    });
  } catch (e) {
    return handleError(e);
  }
}
