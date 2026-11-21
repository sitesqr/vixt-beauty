import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyContext } from "@/lib/auth";
import { handleError, ok, fail } from "@/lib/api";
import { serviceSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { companyId } = await requireCompanyContext();
    const { id } = await params;
    const service = await prisma.service.findFirst({ where: { id, companyId } });
    if (!service) return fail("Serviço não encontrado", 404);
    return ok(service);
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { companyId } = await requireCompanyContext();
    const { id } = await params;
    const data = serviceSchema.parse(await req.json());
    const existing = await prisma.service.findFirst({ where: { id, companyId } });
    if (!existing) return fail("Serviço não encontrado", 404);

    // CRITICAL: update only the service record. Historical appointments keep
    // their own `serviceName` / `servicePriceCents` snapshots.
    const service = await prisma.service.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description || null,
        category: data.category || null,
        priceCents: Math.round(data.price * 100),
        durationMin: data.durationMin,
        imageUrl: data.imageUrl || null,
        active: data.active,
      },
    });
    return ok(service);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { companyId } = await requireCompanyContext();
    const { id } = await params;
    const existing = await prisma.service.findFirst({ where: { id, companyId } });
    if (!existing) return fail("Serviço não encontrado", 404);

    // Soft-delete: never destroy historical links to appointments.
    await prisma.service.update({ where: { id }, data: { active: false } });
    return ok({ message: "Serviço desativado" });
  } catch (e) {
    return handleError(e);
  }
}
