import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleError, ok, fail } from "@/lib/api";
import { AsaasError, createCharge, ensureCustomer } from "@/lib/asaas";

/** Cria uma cobrança no Asaas para uma fatura pendente. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  try {
    await requireRole("SUPER_ADMIN");
    const { invoiceId } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { company: true },
    });
    if (!invoice) return fail("Fatura não encontrada", 404);
    if (invoice.status !== "PENDING") return fail("Fatura não está pendente", 409);

    const customer = await ensureCustomer({
      id: invoice.company.id,
      name: invoice.company.name,
      email: invoice.company.email,
      phone: invoice.company.phone,
    });

    const payment = await createCharge({
      customerId: customer.id,
      valueCents: invoice.amountCents,
      dueDate: invoice.dueDate,
      description: invoice.description || `Assinatura VIXT Beauty — ${invoice.number}`,
      externalReference: invoice.number,
    });

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { providerRef: payment.id },
    });

    return ok({ payment, invoiceUrl: payment.invoiceUrl, pixCopyPaste: payment.pixCopyPaste });
  } catch (e) {
    if (e instanceof AsaasError) return fail(e.message, e.status);
    return handleError(e);
  }
}
