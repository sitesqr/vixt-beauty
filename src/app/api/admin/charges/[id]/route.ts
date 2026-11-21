import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleError, ok, fail } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** Mark an invoice as paid (simulated payment provider). */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const session = await requireRole("SUPER_ADMIN");
    const { id } = await params;
    const body = await req.json();
    if (body.action !== "MARK_PAID") return fail("Ação inválida", 400);

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return fail("Cobrança não encontrada", 404);
    if (invoice.status === "PAID") return fail("Cobrança já paga", 400);

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.update({
        where: { id },
        data: { status: "PAID", paidAt: new Date() },
      });
      await tx.platformPayment.create({
        data: {
          invoiceId: id,
          userId: session.userId,
          amountCents: invoice.amountCents,
          method: "SIMULATED",
          status: "COMPLETED",
        },
      });
      // Reactivate the subscription and company on payment
      if (invoice.subscriptionId) {
        const sub = await tx.subscription.findUnique({ where: { id: invoice.subscriptionId } });
        if (sub) {
          const periodEnd = new Date(Math.max(Date.now(), sub.currentPeriodEnd.getTime()) + 30 * 86400000);
          await tx.subscription.update({
            where: { id: sub.id },
            data: { status: "ACTIVE", currentPeriodStart: new Date(), currentPeriodEnd: periodEnd },
          });
          await tx.company.update({ where: { id: invoice.companyId }, data: { status: "ACTIVE" } });
        }
      }
      return updated;
    });
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
