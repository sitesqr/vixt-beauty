import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        priceCents: true,
        trialDays: true,
        maxProfessionals: true,
        maxServices: true,
        features: true,
      },
    });
    return ok(plans);
  } catch (e) {
    return handleError(e);
  }
}
