import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { handleError, ok } from "@/lib/api";

export async function GET() {
  try {
    const session = await requireAuth();
    const notifications = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return ok(notifications);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    if (body.id) {
      await prisma.notification.updateMany({ where: { id: body.id, userId: session.userId }, data: { read: true } });
    } else {
      await prisma.notification.updateMany({ where: { userId: session.userId }, data: { read: true } });
    }
    return ok({ message: "Atualizado" });
  } catch (e) {
    return handleError(e);
  }
}
