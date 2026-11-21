import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { handleError, ok, fail } from "@/lib/api";
import { clientRegisterSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = clientRegisterSchema.parse(body);

    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return fail("Este e-mail já está cadastrado", 409);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash: await hashPassword(data.password),
        role: "CLIENT",
      },
      include: { memberships: true },
    });

    await createSession(user);

    // notify welcome
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM",
        title: "Bem-vindo ao VIXT Beauty!",
        message: "Sua conta gratuita foi criada. Agora você já pode agendar em qualquer salão parceira.",
      },
    });

    return ok({ redirect: "/cliente", name: user.name }, 201);
  } catch (error) {
    return handleError(error);
  }
}
