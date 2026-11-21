import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyContext } from "@/lib/auth";
import { handleError, ok } from "@/lib/api";

export async function GET() {
  try {
    const { companyId } = await requireCompanyContext();
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        workingHours: { orderBy: { dayOfWeek: "asc" } },
        cancellationPolicy: true,
        subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    return ok(company);
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { companyId } = await requireCompanyContext();
    const body = await req.json();

    await prisma.$transaction(async (tx) => {
      await tx.company.update({
        where: { id: companyId },
        data: {
          name: body.name,
          description: body.description || null,
          logoUrl: body.logoUrl || null,
          phone: body.phone || null,
          whatsapp: body.whatsapp || null,
          cpfCnpj: body.cpfCnpj || null,
          address: body.address || null,
          city: body.city || null,
          state: body.state || null,
        },
      });

      if (Array.isArray(body.workingHours)) {
        for (const wh of body.workingHours) {
          await tx.workingHour.upsert({
            where: { companyId_dayOfWeek: { companyId, dayOfWeek: wh.dayOfWeek } },
            update: { openTime: wh.openTime, closeTime: wh.closeTime, enabled: wh.enabled },
            create: { companyId, dayOfWeek: wh.dayOfWeek, openTime: wh.openTime, closeTime: wh.closeTime, enabled: wh.enabled },
          });
        }
      }

      if (body.minAdvanceHours !== undefined || body.minRescheduleHours !== undefined) {
        await tx.cancellationPolicy.upsert({
          where: { companyId },
          update: {
            minAdvanceHours: body.minAdvanceHours ?? 4,
            minRescheduleHours: body.minRescheduleHours ?? 2,
          },
          create: {
            companyId,
            minAdvanceHours: body.minAdvanceHours ?? 4,
            minRescheduleHours: body.minRescheduleHours ?? 2,
          },
        });
      }
    });

    return ok({ message: "Configurações salvas" });
  } catch (e) {
    return handleError(e);
  }
}
