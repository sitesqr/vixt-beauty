import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyContext } from "@/lib/auth";
import { handleError, ok, fail } from "@/lib/api";
import { professionalSchema } from "@/lib/validations";

export async function GET() {
  try {
    const { companyId } = await requireCompanyContext();
    const professionals = await prisma.professional.findMany({
      where: { companyId },
      include: { services: { include: { service: true } } },
      orderBy: { name: "asc" },
    });
    return ok(professionals);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { companyId } = await requireCompanyContext();
    const data = professionalSchema.parse(await req.json());

    const subscription = await prisma.subscription.findFirst({
      where: { companyId, status: { in: ["ACTIVE", "TRIALING"] } },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });
    const count = await prisma.professional.count({ where: { companyId } });
    if (subscription && count >= subscription.plan.maxProfessionals) {
      return fail(`Seu plano permite até ${subscription.plan.maxProfessionals} profissionais`, 403);
    }

    // Verify all service ids belong to this company (tenant isolation)
    if (data.serviceIds.length) {
      const validCount = await prisma.service.count({
        where: { id: { in: data.serviceIds }, companyId },
      });
      if (validCount !== data.serviceIds.length) return fail("Serviço inválido", 400);
    }

    const professional = await prisma.$transaction(async (tx) => {
      const pro = await tx.professional.create({
        data: {
          companyId,
          name: data.name,
          photoUrl: data.photoUrl || null,
          email: data.email || null,
          phone: data.phone || null,
          specialties: data.specialties,
          bio: data.bio || null,
          commissionRate: data.commissionRate,
          active: data.active,
        },
      });
      for (const serviceId of data.serviceIds) {
        await tx.professionalService.create({ data: { professionalId: pro.id, serviceId } });
      }
      // default working hours Mon-Sat
      for (let d = 1; d <= 6; d++) {
        await tx.professionalWorkingHour.create({
          data: { professionalId: pro.id, dayOfWeek: d, startTime: "09:00", endTime: "19:00" },
        });
      }
      return pro;
    });

    return ok(professional, 201);
  } catch (e) {
    return handleError(e);
  }
}
