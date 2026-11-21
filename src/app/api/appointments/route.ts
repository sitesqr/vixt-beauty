import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import { validateSlot } from "@/lib/scheduling";
import { handleError, ok, fail } from "@/lib/api";
import { appointmentSchema } from "@/lib/validations";
import { addMinutes, combineDateTime, digitsOnly } from "@/lib/utils";

/** Fetch appointments. Owner sees company appointments; client sees own; public can query by company. */
export async function GET(req: NextRequest) {
  try {
    const q = new URL(req.url).searchParams;
    const session = await getSession();

    if (session?.role === "OWNER" && session.companyId) {
      const where: any = { companyId: session.companyId };
      if (q.get("date")) {
        const d = q.get("date")!;
        where.startAt = { gte: new Date(`${d}T00:00:00-03:00`), lte: new Date(`${d}T23:59:59-03:00`) };
      }
      if (q.get("status")) where.status = q.get("status");
      const items = await prisma.appointment.findMany({
        where,
        orderBy: { startAt: "asc" },
        include: {
          client: { select: { name: true, email: true, phone: true } },
          professional: { select: { name: true } },
          service: { select: { name: true } },
        },
      });
      return ok(items);
    }

    if (session?.role === "CLIENT") {
      const items = await prisma.appointment.findMany({
        where: { clientId: session.userId },
        orderBy: { startAt: "desc" },
        include: {
          company: { select: { name: true, slug: true } },
          professional: { select: { name: true } },
          service: { select: { name: true } },
        },
      });
      return ok(items);
    }

    // Public: slug-based lookup for a shop's page (no sensitive client data)
    const slug = q.get("slug");
    if (slug) {
      const items = await prisma.appointment.findMany({
        where: { company: { slug }, status: { in: ["CONFIRMED", "COMPLETED"] } },
        select: { startAt: true, endAt: true, status: true },
      });
      return ok(items);
    }

    return fail("Não autenticado", 401);
  } catch (e) {
    return handleError(e);
  }
}

/** Create appointment. Accepts logged-in clients or guest details for first booking. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = appointmentSchema.parse(body);
    const session = await getSession();

    const error = await validateSlot(
      data.companyId,
      data.professionalId,
      data.serviceId,
      data.date,
      data.time
    );
    if (error) return fail(error, 409);

    const [service, pro, company] = await Promise.all([
      prisma.service.findFirst({ where: { id: data.serviceId, companyId: data.companyId } }),
      prisma.professional.findFirst({ where: { id: data.professionalId, companyId: data.companyId } }),
      prisma.company.findUnique({ where: { id: data.companyId } }),
    ]);
    if (!service || !pro || !company) return fail("Dados inválidos", 400);

    const startAt = combineDateTime(data.date, data.time);
    const endAt = addMinutes(startAt, service.durationMin);

    let clientId: string;
    let clientName: string;
    let clientPhone: string | null = null;

    if (session?.role === "CLIENT") {
      const u = await prisma.user.findUnique({ where: { id: session.userId } });
      if (!u) return fail("Usuário não encontrado", 401);
      clientId = u.id;
      clientName = u.name;
      clientPhone = u.phone;
    } else {
      // Guest booking: create the free global client account automatically.
      const guestName = String(body.guestName || "").trim();
      const guestEmail = String(body.guestEmail || "").trim().toLowerCase();
      const guestPhone = String(body.guestPhone || "").trim();
      if (!guestName || !guestEmail || !guestPhone) {
        return fail("Informe nome, e-mail e telefone para agendar", 400);
      }
      const existing = await prisma.user.findUnique({ where: { email: guestEmail } });
      if (existing && existing.role !== "CLIENT") {
        return fail("Este e-mail já está associado a outro tipo de conta", 409);
      }
      const user = existing ?? (await prisma.user.create({
        data: {
          name: guestName,
          email: guestEmail,
          phone: guestPhone,
          passwordHash: await hashPassword(digitsOnly(guestPhone).slice(-6) + "@Vixt"),
          role: "CLIENT",
        },
      }));
      clientId = user.id;
      clientName = user.name;
      clientPhone = user.phone;
    }

    const appointment = await prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.create({
        data: {
          companyId: data.companyId,
          clientId,
          professionalId: data.professionalId,
          serviceId: data.serviceId,
          startAt,
          endAt,
          status: "CONFIRMED",
          notes: data.notes || null,
          // snapshots preserve history against later price/name changes
          serviceName: service.name,
          servicePriceCents: service.priceCents,
          professionalName: pro.name,
          clientName,
          clientPhone,
        },
      });

      await tx.notification.create({
        data: {
          userId: clientId,
          companyId: data.companyId,
          appointmentId: appt.id,
          type: "APPOINTMENT_CONFIRMED",
          title: "Agendamento confirmado!",
          message: `${service.name} com ${pro.name} em ${data.date} às ${data.time}.`,
        },
      });

      return appt;
    });

    return ok({ id: appointment.id, startAt: appointment.startAt, status: appointment.status }, 201);
  } catch (e) {
    return handleError(e);
  }
}
