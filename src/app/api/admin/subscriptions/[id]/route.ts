import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleError, ok, fail } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireRole("SUPER_ADMIN");
    const { id } = await params;
    const body = await req.json();
    const sub = await prisma.subscription.findUnique({ where: { id } });
    if (!sub) return fail("Assinatura não encontrada", 404);

    const data: any = {};
    if (body.status) data.status = body.status;
    if (body.cancelAtPeriodEnd !== undefined) data.cancelAtPeriodEnd = body.cancelAtPeriodEnd;
    if (body.status === "CANCELLED") data.canceledAt = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({ where: { id }, data });
      if (body.status) {
        const companyStatus = body.status === "ACTIVE" ? "ACTIVE" : body.status === "CANCELLED" ? "CANCELLED" : body.status === "PAST_DUE" ? "PAST_DUE" : undefined;
        if (companyStatus) await tx.company.update({ where: { id: sub.companyId }, data: { status: companyStatus } });
      }
      return updated;
    });
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
