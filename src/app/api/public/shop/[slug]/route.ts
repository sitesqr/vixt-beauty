import { prisma } from "@/lib/prisma";
import { handleError, ok, fail } from "@/lib/api";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { slug } = await params;
    const company = await prisma.company.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        phone: true,
        whatsapp: true,
        address: true,
        neighborhood: true,
        city: true,
        state: true,
        status: true,
        workingHours: { where: { enabled: true }, orderBy: { dayOfWeek: "asc" } },
      },
    });
    if (!company) return fail("Salão não encontrada", 404);
    if (["SUSPENDED", "CANCELLED"].includes(company.status)) return fail("Salão indisponível", 403);

    const [services, professionals, reviews] = await Promise.all([
      prisma.service.findMany({
        where: { companyId: company.id, active: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, description: true, category: true, priceCents: true, durationMin: true, imageUrl: true },
      }),
      prisma.professional.findMany({
        where: { companyId: company.id, active: true },
        select: { id: true, name: true, photoUrl: true, bio: true, specialties: true, services: { select: { serviceId: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.review.findMany({
        where: { companyId: company.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, rating: true, comment: true, createdAt: true, client: { select: { name: true } } },
      }),
    ]);

    const avg = reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

    return ok({ ...company, services, professionals, reviews, ratingAvg: avg });
  } catch (e) {
    return handleError(e);
  }
}
