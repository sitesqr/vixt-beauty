import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import { handleError, ok, fail } from "@/lib/api";
import { loginSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { memberships: { select: { companyId: true } } },
    });

    if (!user || !user.active || !(await verifyPassword(password, user.passwordHash))) {
      return fail("E-mail ou senha incorretos", 401);
    }

    await createSession(user);

    let redirect = "/dashboard";
    if (user.role === "SUPER_ADMIN") redirect = "/admin";
    else if (user.role === "CLIENT") redirect = "/cliente";

    return ok({ redirect, role: user.role, name: user.name });
  } catch (error) {
    return handleError(error);
  }
}
