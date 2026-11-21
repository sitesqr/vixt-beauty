import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyContext } from "@/lib/auth";
import { handleError, ok, fail } from "@/lib/api";
import { professionalSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { companyId } = await requireCompanyContext();
    const { id } = await params;
    const data = professionalSchema.parse(await req.json());
    const existing = await prisma.professional.findFirst({ where: { id, companyId } });
    if (!existing) return fail("Profissional não encontrado", 404);

    if (data.serviceIds.length) {
      const validCount = await prisma.service.count({ where: { id: { in: data.serviceIds }, companyId } });
      if (validCount !== data.serviceIds.length) return fail("Serviço inválido", 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.professional.update({
        where: { id },
        data: {
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
      await tx.professionalService.deleteMany({ where: { professionalId: id } });
      for (const serviceId of data.serviceIds) {
        await tx.professionalService.create({ data: { professionalId: id, serviceId } });
      }
    });

    return ok({ message: "Profissional atualizado" });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { companyId } = await requireCompanyContext();
    const { id } = await params;
    const existing = await prisma.professional.findFirst({ where: { id, companyId } });
    if (!existing) return fail("Profissional não encontrado", 404);
    await prisma.professional.update({ where: { id }, data: { active: false } });
    return ok({ message: "Profissional desativado" });
  } catch (e) {
    return handleError(e);
  }
}
