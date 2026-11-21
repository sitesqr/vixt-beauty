import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleError, ok, fail } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await requireRole("SUPER_ADMIN");
    const { id } = await params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        owner: true,
        subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 1 },
        invoices: { orderBy: { createdAt: "desc" }, take: 12 },
        workingHours: true,
        _count: { select: { appointments: true, professionals: true, services: true, reviews: true } },
      },
    });
    if (!company) return fail("Empresa não encontrada", 404);
    return ok(company);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireRole("SUPER_ADMIN");
    const { id } = await params;
    const body = await req.json();
    const data: any = {};

    if (body.status) data.status = body.status;
    if (body.name) data.name = body.name;
    if (body.trialEndsAt) data.trialEndsAt = new Date(body.trialEndsAt);

    const company = await prisma.company.update({ where: { id }, data });
    return ok(company);
  } catch (e) {
    return handleError(e);
  }
}
