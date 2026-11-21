import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireAuth } from "@/lib/auth";
import { handleError, ok, fail } from "@/lib/api";
import { reviewSchema } from "@/lib/validations";

/** Public GET by slug; auth-protected POST. */
export async function GET(req: NextRequest) {
  try {
    const slug = new URL(req.url).searchParams.get("slug");
    if (!slug) return fail("Informe a salão", 400);
    const reviews = await prisma.review.findMany({
      where: { company: { slug } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        client: { select: { name: true } },
        professional: { select: { name: true } },
      },
    });
    return ok(reviews);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const data = reviewSchema.parse(body);
    const appointmentId = body.appointmentId as string | undefined;
    const companyId = body.companyId as string | undefined;
    if (!companyId) return fail("Informe a salão", 400);

    if (appointmentId) {
      const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
      if (!appt || appt.clientId !== session.userId || appt.status !== "COMPLETED") {
        return fail("Você só pode avaliar atendimentos concluídos seus", 403);
      }
    }

    const review = await prisma.$transaction(async (tx) => {
      const r = await tx.review.create({
        data: {
          companyId,
          clientId: session.userId,
          appointmentId: appointmentId || null,
          professionalId: body.professionalId || null,
          rating: data.rating,
          comment: data.comment || null,
        },
      });
      const company = await tx.company.findUnique({ where: { id: companyId }, select: { ownerId: true, name: true } });
      if (company) {
        await tx.notification.create({
          data: {
            userId: company.ownerId,
            companyId,
            type: "REVIEW_RECEIVED",
            title: "Nova avaliação recebida",
            message: `Você recebeu uma avaliação de ${data.rating} estrela(s).`,
          },
        });
      }
      return r;
    });
    return ok(review, 201);
  } catch (e) {
    return handleError(e);
  }
}
