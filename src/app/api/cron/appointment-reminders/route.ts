import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, handleError, ok } from "@/lib/api";
import { WhatsAppError, sendWhatsAppText } from "@/lib/whatsapp";
import { formatDate } from "@/lib/utils";

/**
 * Dispara lembretes automáticos via WhatsApp 10 minutos antes do atendimento.
 *
 * Protegido por CRON_SECRET: configure um Cron Job (Render, cron-job.org etc.)
 * para chamar GET /api/cron/appointment-reminders a cada 1 minuto com o header:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Idempotência: apenas agendamentos com reminderSentAt = null são processados,
 * e o campo é preenchido no mesmo update em que reservamos o envio.
 */

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "RESCHEDULE_REQUESTED"] as const;
const MINUTES_BEFORE = 10;
// Janela de tolerância para o caso de o cron atrasar alguns minutos.
const WINDOW_MINUTES = 3;

type ReminderResult = {
  appointmentId: string;
  client: string;
  status: "sent" | "dry-run" | "error" | "no-phone";
  detail?: string;
};

export async function GET(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) return fail("CRON_SECRET não configurado", 503);

    const authHeader = req.headers.get("authorization") || "";
    if (authHeader !== `Bearer ${secret}`) return fail("Não autorizado", 401);

    const now = Date.now();
    const windowStart = new Date(now + (MINUTES_BEFORE - WINDOW_MINUTES) * 60_000);
    const windowEnd = new Date(now + MINUTES_BEFORE * 60_000);

    const appointments = await prisma.appointment.findMany({
      where: {
        status: { in: [...ACTIVE_STATUSES] },
        reminderSentAt: null,
        startAt: { gte: windowStart, lte: windowEnd },
      },
      include: {
        company: { select: { name: true, whatsapp: true } },
      },
      orderBy: { startAt: "asc" },
      take: 100,
    });

    const results: ReminderResult[] = [];

    for (const appt of appointments) {
      const phone = appt.clientPhone;
      if (!phone) {
        results.push({ appointmentId: appt.id, client: appt.clientName, status: "no-phone" });
        // Marca como processado para não tentar novamente a cada minuto.
        await prisma.appointment.update({
          where: { id: appt.id },
          data: { reminderSentAt: new Date() },
        });
        continue;
      }

      // Reserva o envio antes de chamar a API: evita duplicatas entre execuções concorrentes.
      const reserved = await prisma.appointment.updateMany({
        where: { id: appt.id, reminderSentAt: null },
        data: { reminderSentAt: new Date() },
      });
      if (reserved.count === 0) continue; // outro worker já processou

      const time = new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      }).format(appt.startAt);
      const date = formatDate(appt.startAt, { day: "2-digit", month: "long" });
      const salon = appt.company.name;
      const proName = appt.professionalName;
      const message =
        `Olá, ${appt.clientName.split(" ")[0]}! 👋\n\n` +
        `Sua vez está chegando no *${salon}*! Faltam apenas 10 minutos para o seu atendimento.\n\n` +
        `💇 ${appt.serviceName} com ${proName}\n` +
        `📅 ${date} às ${time}\n\n` +
        `Chegue com alguns minutinhos de antecedência para garantir seu horário. ` +
        `Se precisar remarcar, fale com a gente: ${appt.company.whatsapp ? `https://wa.me/${appt.company.whatsapp.replace(/\D/g, "")}` : "responda esta mensagem"}.`;

      try {
        const result = await sendWhatsAppText(phone, message);

        await prisma.notification.create({
          data: {
            userId: appt.clientId,
            companyId: appt.companyId,
            appointmentId: appt.id,
            type: "APPOINTMENT_REMINDER",
            title: "Seu atendimento está próximo!",
            message: `Faltam 10 minutos para ${appt.serviceName} com ${appt.professionalName} às ${time}.`,
          },
        });

        results.push({
          appointmentId: appt.id,
          client: appt.clientName,
          status: result.dryRun ? "dry-run" : "sent",
          detail: result.messageId,
        });
      } catch (e) {
        // Se a API falhar, libera o campo para nova tentativa no próximo tick.
        await prisma.appointment.update({
          where: { id: appt.id },
          data: { reminderSentAt: null },
        });
        const detail = e instanceof WhatsAppError ? e.message : "Falha ao enviar WhatsApp";
        results.push({ appointmentId: appt.id, client: appt.clientName, status: "error", detail });
        console.error(`[reminder] Erro ao enviar para agendamento ${appt.id}:`, e);
      }
    }

    return ok({ processed: appointments.length, results });
  } catch (e) {
    return handleError(e);
  }
}
