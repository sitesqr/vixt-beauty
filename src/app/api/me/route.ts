import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hashPassword, verifyPassword } from "@/lib/auth";
import { handleError, ok, fail } from "@/lib/api";
import { z } from "zod";

export async function GET() {
  try {
    const session = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, phone: true, avatarUrl: true, role: true, createdAt: true },
    });
    return ok(user);
  } catch (e) {
    return handleError(e);
  }
}

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().optional().nullable(),
  newPassword: z.string().min(8).optional().or(z.literal("")),
  currentPassword: z.string().optional().or(z.literal("")),
});

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth();
    const data = schema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return fail("Usuário não encontrado", 404);

    const update: any = { name: data.name, phone: data.phone || null };
    if (data.newPassword) {
      // Contas criadas com Google não têm senha atual: permitir definir a primeira senha.
      if (user.passwordHash) {
        if (!data.currentPassword || !(await verifyPassword(data.currentPassword, user.passwordHash))) {
          return fail("Senha atual incorreta", 400);
        }
      }
      update.passwordHash = await hashPassword(data.newPassword);
      update.authProvider = "CREDENTIALS";
    }

    const updated = await prisma.user.update({ where: { id: session.userId }, data: update, select: { id: true, name: true, email: true, phone: true } });
    return ok(updated);
  } catch (e) {
    return handleError(e);
  }
}
