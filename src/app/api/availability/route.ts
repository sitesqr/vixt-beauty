import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/scheduling";
import { handleError, ok, fail } from "@/lib/api";

/** Public endpoint: available slots for a shop/professional/service on a date. */
export async function GET(req: NextRequest) {
  try {
    const q = new URL(req.url).searchParams;
    const companyId = q.get("companyId");
    const professionalId = q.get("professionalId");
    const serviceId = q.get("serviceId");
    const date = q.get("date");

    if (!companyId || !professionalId || !serviceId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return fail("Parâmetros inválidos", 400);
    }

    // make sure ids belong to the same company (no cross-tenant probing)
    const [pro, service] = await Promise.all([
      prisma.professional.findFirst({ where: { id: professionalId, companyId, active: true }, select: { id: true } }),
      prisma.service.findFirst({ where: { id: serviceId, companyId, active: true }, select: { id: true } }),
    ]);
    if (!pro || !service) return fail("Profissional ou serviço inválido", 404);

    const slots = await getAvailableSlots(companyId, professionalId, serviceId, date);
    return ok(slots);
  } catch (e) {
    return handleError(e);
  }
}
