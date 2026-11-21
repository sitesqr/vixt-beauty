import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, hashPassword } from "@/lib/auth";
import { handleError, ok, fail } from "@/lib/api";
import { shopRegisterSchema } from "@/lib/validations";
import { addMinutes, slugify } from "@/lib/utils";

/** SUPER_ADMIN manually creates a company + owner. */
export async function POST(req: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");
    const body = await req.json();
    const data = shopRegisterSchema.parse(body);

    const plan = await prisma.plan.findUnique({ where: { id: data.planId } });
    if (!plan) return fail("Plano inválido", 400);
    if (await prisma.user.findUnique({ where: { email: data.email } })) return fail("E-mail já cadastrado", 409);
    const slug = data.slug || slugify(data.companyName);
    if (await prisma.company.findUnique({ where: { slug } })) return fail("Identificador já em uso", 409);

    const now = new Date();
    const trialEndsAt = addMinutes(now, plan.trialDays * 24 * 60);
    const result = await prisma.$transaction(async (tx) => {
      const owner = await tx.user.create({
        data: {
          name: data.name, email: data.email, phone: data.phone,
          passwordHash: await hashPassword(data.password), role: "OWNER", emailVerified: true,
        },
      });
      const company = await tx.company.create({
        data: {
          ownerId: owner.id, name: data.companyName, slug,
          phone: data.phone, whatsapp: data.whatsapp || data.phone,
          address: data.address, city: data.city, state: data.state.toUpperCase(),
          status: "TRIAL", trialEndsAt, settings: "{}",
        },
      });
      await tx.membership.create({ data: { userId: owner.id, companyId: company.id, role: "ADMIN" } });
      await tx.subscription.create({
        data: {
          companyId: company.id, planId: plan.id, status: "TRIALING",
          currentPeriodStart: now, currentPeriodEnd: trialEndsAt, trialEndsAt, provider: "SIMULATED",
        },
      });
      for (let d = 1; d <= 6; d++) {
        await tx.workingHour.create({ data: { companyId: company.id, dayOfWeek: d, openTime: "09:00", closeTime: "20:00" } });
      }
      await tx.cancellationPolicy.create({ data: { companyId: company.id } });
      return { company, owner };
    });
    return ok(result, 201);
  } catch (e) {
    return handleError(e);
  }
}
