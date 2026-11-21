import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { handleError, ok, fail } from "@/lib/api";
import { shopRegisterSchema } from "@/lib/validations";
import { addMinutes } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = shopRegisterSchema.parse(body);

    const plan = await prisma.plan.findUnique({ where: { id: data.planId } });
    if (!plan || !plan.active) return fail("Plano inválido", 400);

    const emailTaken = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailTaken) return fail("Este e-mail já está cadastrado", 409);

    const slugTaken = await prisma.company.findUnique({ where: { slug: data.slug } });
    if (slugTaken) return fail("Esse identificador público já está em uso. Escolha outro.", 409);

    const now = new Date();
    const trialEndsAt = addMinutes(now, plan.trialDays * 24 * 60);

    // Everything in one transaction: no orphan records if any step fails.
    const result = await prisma.$transaction(async (tx) => {
      const owner = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          passwordHash: await hashPassword(data.password),
          role: "OWNER",
          emailVerified: true,
        },
      });

      const company = await tx.company.create({
        data: {
          ownerId: owner.id,
          name: data.companyName,
          slug: data.slug,
          phone: data.phone,
          whatsapp: data.whatsapp || data.phone,
          address: data.address,
          city: data.city,
          state: data.state.toUpperCase(),
          status: "TRIAL",
          trialEndsAt,
          settings: JSON.stringify({ createdFrom: "self-registration" }),
        },
      });

      await tx.membership.create({
        data: { userId: owner.id, companyId: company.id, role: "ADMIN" },
      });

      await tx.subscription.create({
        data: {
          companyId: company.id,
          planId: plan.id,
          status: "TRIALING",
          currentPeriodStart: now,
          currentPeriodEnd: trialEndsAt,
          trialEndsAt,
          provider: "SIMULATED",
        },
      });

      // initial invoice of R$0 for the trial
      await tx.invoice.create({
        data: {
          companyId: company.id,
          number: `TRIAL-${Date.now()}-${company.id.slice(-6).toUpperCase()}`,
          amountCents: 0,
          status: "PAID",
          description: `Período de teste de ${plan.trialDays} dias — ${plan.name}`,
          dueDate: trialEndsAt,
          paidAt: now,
        },
      });

      // default working hours (Mon–Sat)
      for (let d = 1; d <= 6; d++) {
        await tx.workingHour.create({
          data: { companyId: company.id, dayOfWeek: d, openTime: "09:00", closeTime: "20:00" },
        });
      }

      await tx.cancellationPolicy.create({
        data: { companyId: company.id, minAdvanceHours: 4, minRescheduleHours: 2 },
      });

      return { owner, company };
    });

    await createSession({
      id: result.owner.id,
      role: "OWNER",
      name: result.owner.name,
      email: result.owner.email,
      memberships: [{ companyId: result.company.id }],
    });

    return ok(
      {
        redirect: "/dashboard",
        trialDays: plan.trialDays,
        slug: result.company.slug,
      },
      201
    );
  } catch (error) {
    return handleError(error);
  }
}
