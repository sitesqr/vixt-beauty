import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyContext } from "@/lib/auth";
import { handleError, ok, fail } from "@/lib/api";
import { z } from "zod";
import { AsaasError, createCheckout, createCharge, ensureCustomer, getAsaasConfig } from "@/lib/asaas";

const schema = z.object({
  method: z.enum(["PIX", "CREDIT_CARD"]),
  invoiceId: z.string().optional(),
});

/** Gera PIX ou checkout de cartão para pagar a assinatura do salão. */
export async function POST(req: NextRequest) {
  try {
    const session = await requireCompanyContext();
    const { method, invoiceId } = schema.parse(await req.json());

    const cfg = await getAsaasConfig();
    if (!cfg.configured) return fail("Pagamento online indisponível no momento", 503);

    const company = await prisma.company.findUnique({
      where: { id: session.companyId },
      include: { subscriptions: { where: { status: { in: ["TRIALING", "ACTIVE", "PAST_DUE"] } }, orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (!company) return fail("Salão não encontrado", 404);

    let invoice = invoiceId
      ? await prisma.invoice.findFirst({ where: { id: invoiceId, companyId: company.id } })
      : await prisma.invoice.findFirst({
          where: { companyId: company.id, status: "PENDING" },
          orderBy: { createdAt: "desc" },
        });

    if (!invoice || invoice.status === "PAID") {
      const plan = await prisma.plan.findUnique({ where: { id: company.subscriptions[0]?.planId || "" } });
      const priceCents = plan?.priceCents || 4900;
      const number = `VB-${Date.now().toString(36).toUpperCase()}`;
      invoice = await prisma.invoice.create({
        data: {
          companyId: company.id,
          subscriptionId: company.subscriptions[0]?.id || null,
          number,
          amountCents: priceCents,
          status: "PENDING",
          description: `Assinatura VIXT Beauty — ${plan?.name || "Plano"}`,
          dueDate: new Date(Date.now() + 3 * 86400000),
        },
      });
    }

    const customer = await ensureCustomer({
      id: company.id,
      name: company.name,
      email: company.email,
      phone: company.phone,
    });

    if (method === "PIX") {
      const payment = await createCharge({
        customerId: customer.id,
        valueCents: invoice.amountCents,
        dueDate: invoice.dueDate,
        description: invoice.description || `Assinatura VIXT Beauty — ${invoice.number}`,
        externalReference: invoice.number,
      });
      await prisma.invoice.update({ where: { id: invoice.id }, data: { providerRef: payment.id } });
      return ok({
        method: "PIX",
        paymentId: payment.id,
        invoiceUrl: payment.invoiceUrl,
        pixCopyPaste: payment.pixCopyPaste,
        pixQrCode: payment.pixQrCode,
        amountCents: invoice.amountCents,
        invoiceNumber: invoice.number,
      });
    }

    const checkout = await createCheckout({
      customerId: customer.id,
      valueCents: invoice.amountCents,
      description: invoice.description || `Assinatura VIXT Beauty — ${invoice.number}`,
      externalReference: invoice.number,
      billingType: "UNDEFINED",
    });
    await prisma.invoice.update({ where: { id: invoice.id }, data: { providerRef: checkout.id } });
    return ok({
      method: "CREDIT_CARD",
      checkoutUrl: checkout.url,
      amountCents: invoice.amountCents,
      invoiceNumber: invoice.number,
    });
  } catch (e) {
    if (e instanceof AsaasError) return fail(e.message, e.status);
    return handleError(e);
  }
}
