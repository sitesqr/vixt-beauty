import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyContext } from "@/lib/auth";
import { handleError, ok, fail } from "@/lib/api";
import { serviceSchema } from "@/lib/validations";

export async function GET() {
  try {
    const { companyId } = await requireCompanyContext();
    const services = await prisma.service.findMany({
      where: { companyId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return ok(services);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { companyId } = await requireCompanyContext();
    const data = serviceSchema.parse(await req.json());

    const plan = await prisma.subscription.findFirst({
      where: { companyId, status: { in: ["ACTIVE", "TRIALING"] } },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });
    const count = await prisma.service.count({ where: { companyId } });
    if (plan && plan.plan.maxServices >= 0 && count >= plan.plan.maxServices) {
      return fail(`Seu plano permite até ${plan.plan.maxServices} serviços`, 403);
    }

    const service = await prisma.service.create({
      data: {
        companyId,
        name: data.name,
        description: data.description || null,
        category: data.category || null,
        priceCents: Math.round(data.price * 100),
        durationMin: data.durationMin,
        imageUrl: data.imageUrl || null,
        active: data.active,
      },
    });
    return ok(service, 201);
  } catch (e) {
    return handleError(e);
  }
}
