import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { getAsaasConfig, extractEventId } from "@/lib/asaas";

/**
 * Webhook do Asaas. Valida o token, garante idempotência por eventId e
 * confirma pagamentos de assinaturas (fatura -> paga, assinatura -> ativa).
 */
export async function POST(req: NextRequest) {
  try {
    const cfg = await getAsaasConfig();

    if (cfg.webhookToken) {
      const received = req.headers.get("asaas-token") || "";
      const a = Buffer.from(received);
      const b = Buffer.from(cfg.webhookToken);
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
    }

    const payload = await req.json();
    // O Asaas envia o ID do evento no header asaas-event-id.
    const eventId = req.headers.get("asaas-event-id") || extractEventId(payload);
    const eventType = payload?.event || payload?.eventType || "";
    const payment = payload?.payment || payload?.data?.payment || payload || {};
    const paymentId = payment?.id || null;
    const externalReference = payment?.externalReference as string | undefined;

    if (!eventId) return NextResponse.json({ error: "Missing event id" }, { status: 400 });

    // Idempotência: se já processado, responder 200 sem efeito.
    const existing = await prisma.asaasEvent.findUnique({ where: { eventId } });
    if (existing) return NextResponse.json({ received: true, duplicate: true });

    await prisma.asaasEvent.create({
      data: {
        eventId,
        eventType,
        paymentId,
        payload: payload as any,
        processed: true,
      },
    });

    if (["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"].includes(eventType)) {
      const invoice = await prisma.invoice.findFirst({
        where: {
          OR: [
            { providerRef: paymentId },
            ...(externalReference ? [{ number: externalReference }] : []),
          ],
        },
        include: { subscription: true },
      });

      if (invoice && invoice.status !== "PAID") {
        const paidAt = new Date();
        await prisma.$transaction(async (tx) => {
          await tx.invoice.update({
            where: { id: invoice.id },
            data: { status: "PAID", paidAt, providerRef: paymentId || invoice.providerRef },
          });
          await tx.platformPayment.create({
            data: {
              invoiceId: invoice.id,
              amountCents: invoice.amountCents,
              method: "ASAAS",
              providerRef: paymentId,
              status: "COMPLETED",
              paidAt,
            },
          });
          if (invoice.subscription) {
            const periodEnd = new Date(Math.max(Date.now(), invoice.subscription.currentPeriodEnd.getTime()) + 30 * 86400000);
            await tx.subscription.update({
              where: { id: invoice.subscription.id },
              data: { status: "ACTIVE", currentPeriodEnd: periodEnd, provider: "ASAAS", providerRef: paymentId },
            });
            await tx.company.update({
              where: { id: invoice.companyId },
              data: { status: "ACTIVE" },
            });
          }
        });
      }
    }

    if (eventType === "PAYMENT_OVERDUE" && paymentId) {
      await prisma.invoice.updateMany({
        where: { providerRef: paymentId, status: "PENDING" },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[ASAAS WEBHOOK]", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
