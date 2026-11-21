import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleError, ok } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    await requireRole("SUPER_ADMIN");
    const { id } = await params;
    const body = await req.json();
    const plan = await prisma.plan.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || null,
        priceCents: body.priceCents,
        trialDays: body.trialDays,
        maxProfessionals: body.maxProfessionals,
        maxServices: body.maxServices,
        features: JSON.stringify(body.features || []),
        active: body.active,
        sortOrder: body.sortOrder,
      },
    });
    return ok(plan);
  } catch (e) {
    return handleError(e);
  }
}
