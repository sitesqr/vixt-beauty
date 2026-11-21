import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleError, ok } from "@/lib/api";
import { z } from "zod";

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN");
    const plans = await prisma.plan.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { subscriptions: true } } },
    });
    return ok(plans);
  } catch (e) {
    return handleError(e);
  }
}

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  priceCents: z.coerce.number().int().min(0),
  trialDays: z.coerce.number().int().min(0).default(14),
  maxProfessionals: z.coerce.number().int().min(1),
  maxServices: z.coerce.number().int().min(1),
  features: z.array(z.string()).default([]),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export async function POST(req: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");
    const data = schema.parse(await req.json());
    const plan = await prisma.plan.create({
      data: { ...data, features: JSON.stringify(data.features) },
    });
    return ok(plan, 201);
  } catch (e) {
    return handleError(e);
  }
}
