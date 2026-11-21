import "server-only";
import { prisma } from "./prisma";
import { addMinutes, combineDateTime } from "./utils";

const BLOCKING_STATUSES = ["PENDING", "CONFIRMED", "RESCHEDULE_REQUESTED"] as const;

/** All slots for a professional on a given date (YYYY-MM-DD). */
export async function getAvailableSlots(
  companyId: string,
  professionalId: string,
  serviceId: string,
  dateStr: string
) {
  const date = new Date(`${dateStr}T12:00:00Z`);
  const dayOfWeek = date.getUTCDay();

  const [service, proHours, timeOffs, appointments, policy] = await Promise.all([
    prisma.service.findFirst({ where: { id: serviceId, companyId, active: true } }),
    prisma.professionalWorkingHour.findFirst({ where: { professionalId, dayOfWeek, enabled: true } }),
    prisma.timeOff.findMany({
      where: {
        professionalId,
        startAt: { lte: new Date(`${dateStr}T23:59:59-03:00`) },
        endAt: { gte: new Date(`${dateStr}T00:00:00-03:00`) },
      },
    }),
    prisma.appointment.findMany({
      where: {
        companyId,
        professionalId,
        status: { in: [...BLOCKING_STATUSES] },
        startAt: { gte: new Date(`${dateStr}T00:00:00-03:00`) },
        endAt: { lte: new Date(`${dateStr}T23:59:59-03:00`) },
      },
      select: { startAt: true, endAt: true },
    }),
    prisma.cancellationPolicy.findUnique({ where: { companyId } }),
  ]);

  if (!service || !proHours) return [];

  const slots: { time: string; available: boolean }[] = [];
  const duration = service.durationMin;
  const slotStep = 15;

  const [sh, sm] = proHours.startTime.split(":").map(Number);
  const [eh, em] = proHours.endTime.split(":").map(Number);
  let cursor = sh * 60 + sm;
  const end = eh * 60 + em;

  const now = Date.now();
  const minAdvanceMs = (policy?.minAdvanceHours ?? 0) * 3_600_000;

  while (cursor + duration <= end) {
    const hh = String(Math.floor(cursor / 60)).padStart(2, "0");
    const mm = String(cursor % 60).padStart(2, "0");
    const time = `${hh}:${mm}`;
    const start = combineDateTime(dateStr, time);
    const finish = addMinutes(start, duration);

    const overlapsTimeOff = timeOffs.some((t) => start < t.endAt && finish > t.startAt);
    const overlapsAppointment = appointments.some((a) => start < a.endAt && finish > a.startAt);
    const tooSoon = start.getTime() < now + minAdvanceMs;

    slots.push({ time, available: !overlapsTimeOff && !overlapsAppointment && !tooSoon });
    cursor += slotStep;
  }
  return slots;
}

/** Validates that a proposed appointment is conflict-free. Returns reason or null. */
export async function validateSlot(
  companyId: string,
  professionalId: string,
  serviceId: string,
  dateStr: string,
  time: string,
  excludeAppointmentId?: string
) {
  const service = await prisma.service.findFirst({ where: { id: serviceId, companyId, active: true } });
  if (!service) return "Serviço indisponível";

  const pro = await prisma.professional.findFirst({ where: { id: professionalId, companyId, active: true } });
  if (!pro) return "Profissional indisponível";

  const isOffered = await prisma.professionalService.findUnique({
    where: { professionalId_serviceId: { professionalId, serviceId } },
  });
  if (!isOffered) return "Este profissional não realiza esse serviço";

  const date = new Date(`${dateStr}T12:00:00Z`);
  const dayOfWeek = date.getUTCDay();
  const hours = await prisma.professionalWorkingHour.findFirst({
    where: { professionalId, dayOfWeek, enabled: true },
  });
  if (!hours) return "Profissional não atende neste dia";

  const start = combineDateTime(dateStr, time);
  const end = addMinutes(start, service.durationMin);
  const [sh, sm] = hours.startTime.split(":").map(Number);
  const [eh, em] = hours.endTime.split(":").map(Number);
  const workStart = combineDateTime(dateStr, `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`);
  const workEnd = combineDateTime(dateStr, `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`);
  if (start < workStart || end > workEnd) return "Horário fora do expediente";

  const companyHours = await prisma.workingHour.findFirst({ where: { companyId, dayOfWeek, enabled: true } });
  if (!companyHours) return "Salão fechada neste dia";
  const [csh, csm] = companyHours.openTime.split(":").map(Number);
  const [ceh, cem] = companyHours.closeTime.split(":").map(Number);
  const storeStart = combineDateTime(dateStr, `${String(csh).padStart(2, "0")}:${String(csm).padStart(2, "0")}`);
  const storeEnd = combineDateTime(dateStr, `${String(ceh).padStart(2, "0")}:${String(cem).padStart(2, "0")}`);
  if (start < storeStart || end > storeEnd) return "Horário fora do funcionamento da salão";

  const conflict = await prisma.appointment.findFirst({
    where: {
      companyId,
      professionalId,
      status: { in: [...BLOCKING_STATUSES] },
      startAt: { lt: end },
      endAt: { gt: start },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
    },
  });
  if (conflict) return "Horário já ocupado";

  const timeOff = await prisma.timeOff.findFirst({
    where: { professionalId, startAt: { lt: end }, endAt: { gt: start } },
  });
  if (timeOff) return "Profissional indisponível neste período";

  const policy = await prisma.cancellationPolicy.findUnique({ where: { companyId } });
  if (start.getTime() < Date.now() + (policy?.minAdvanceHours ?? 0) * 3_600_000) {
    return "É necessário agendar com mais antecedência";
  }

  return null;
}
