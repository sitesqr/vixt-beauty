import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { validateSlot } from "@/lib/scheduling";
import { handleError, ok, fail } from "@/lib/api";
import { combineDateTime, addMinutes } from "@/lib/utils";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  action: z.enum(["COMPLETE", "CANCEL", "NO_SHOW", "CONFIRM", "REQUEST_RESCHEDULE", "RESCHEDULE"]),
  reason: z.string().max(300).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getSession();
    if (!session) return fail("Não autenticado", 401);
    const { id } = await params;
    const body = patchSchema.parse(await req.json());

    const appt = await prisma.appointment.findUnique({ where: { id } });
    if (!appt) return fail("Agendamento não encontrado", 404);

    const isOwner = session.role === "OWNER" && session.companyId === appt.companyId;
    const isSuperAdmin = session.role === "SUPER_ADMIN";
    const isClient = session.role === "CLIENT" && session.userId === appt.clientId;
    if (!isOwner && !isSuperAdmin && !isClient) return fail("Acesso negado", 403);

    // Reschedule by client = request only; by owner = actual change
    if (body.action === "REQUEST_RESCHEDULE") {
      if (!isClient) return fail("Ação permitida apenas ao cliente", 403);
      if (appt.startAt.getTime() < Date.now()) return fail("Não é possível remarcar um atendimento passado", 400);
      const updated = await prisma.appointment.update({
        where: { id },
        data: { status: "RESCHEDULE_REQUESTED", rescheduleRequestedAt: new Date() },
      });
      await prisma.notification.create({
        data: {
          userId: (await prisma.company.findUnique({ where: { id: appt.companyId }, select: { ownerId: true } }))!.ownerId,
          companyId: appt.companyId,
          appointmentId: id,
          type: "RESCHEDULE_REQUEST",
          title: "Solicitação de remarcação",
          message: `${appt.clientName} solicitou remarcação do horário.`,
        },
      });
      return ok(updated);
    }

    if (body.action === "RESCHEDULE") {
      if (!isOwner && !isSuperAdmin) return fail("Acesso negado", 403);
      if (!body.date || !body.time) return fail("Informe a nova data e horário", 400);
      const conflict = await validateSlot(appt.companyId, appt.professionalId, appt.serviceId, body.date, body.time, id);
      if (conflict) return fail(conflict, 409);
      const startAt = combineDateTime(body.date, body.time);
      const service = await prisma.service.findUnique({ where: { id: appt.serviceId } });
      const updated = await prisma.appointment.update({
        where: { id },
        data: {
          startAt,
          endAt: addMinutes(startAt, service?.durationMin ?? 30),
          status: "CONFIRMED",
          rescheduleRequestedAt: null,
          reminderSentAt: null,
        },
      });
      await prisma.notification.create({
        data: {
          userId: appt.clientId,
          companyId: appt.companyId,
          appointmentId: id,
          type: "APPOINTMENT_CONFIRMED",
          title: "Horário remarcado",
          message: `Seu agendamento foi remarcado para ${body.date} às ${body.time}.`,
        },
      });
      return ok(updated);
    }

    if (body.action === "CANCEL") {
      if (!isOwner && !isSuperAdmin && !isClient) return fail("Acesso negado", 403);
      if (appt.status === "COMPLETED") return fail("Não é possível cancelar um atendimento concluído", 400);
      const updated = await prisma.appointment.update({
        where: { id },
        data: { status: "CANCELLED", cancellationReason: body.reason || null },
      });
      await prisma.notification.create({
        data: {
          userId: isClient ? (await prisma.company.findUnique({ where: { id: appt.companyId }, select: { ownerId: true } }))!.ownerId : appt.clientId,
          companyId: appt.companyId,
          appointmentId: id,
          type: "APPOINTMENT_CANCELLED",
          title: "Agendamento cancelado",
          message: `O agendamento de ${appt.clientName} às ${appt.startAt.toISOString()} foi cancelado.`,
        },
      });
      return ok(updated);
    }

    if (!isOwner && !isSuperAdmin) return fail("Acesso negado", 403);

    if (body.action === "CONFIRM") {
      const updated = await prisma.appointment.update({ where: { id }, data: { status: "CONFIRMED" } });
      return ok(updated);
    }

    if (body.action === "NO_SHOW") {
      const updated = await prisma.appointment.update({ where: { id }, data: { status: "NO_SHOW" } });
      return ok(updated);
    }

    if (body.action === "COMPLETE") {
      if (appt.status === "COMPLETED") return ok(appt);
      const [pro, commissionAlreadyExists] = await Promise.all([
        prisma.professional.findUnique({ where: { id: appt.professionalId }, select: { commissionRate: true } }),
        prisma.commission.findUnique({ where: { appointmentId: id } }),
      ]);

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.appointment.update({ where: { id }, data: { status: "COMPLETED" } });

        if (!commissionAlreadyExists && pro) {
          const amount = Math.round(appt.servicePriceCents * pro.commissionRate / 100);
          await tx.commission.create({
            data: {
              companyId: appt.companyId,
              professionalId: appt.professionalId,
              appointmentId: id,
              grossCents: appt.servicePriceCents,
              rate: pro.commissionRate,
              amountCents: amount,
              items: {
                create: [{
                  serviceId: appt.serviceId,
                  serviceName: appt.serviceName,
                  amountCents: appt.servicePriceCents,
                }],
              },
            },
          });
        }
        return updated;
      });
      return ok(result);
    }

    return fail("Ação inválida", 400);
  } catch (e) {
    return handleError(e);
  }
}
