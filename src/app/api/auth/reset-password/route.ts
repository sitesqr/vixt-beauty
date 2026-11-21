import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { handleError, ok, fail } from "@/lib/api";
import { resetPasswordSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const data = resetPasswordSchema.parse(await req.json());
    const tokenHash = createHash("sha256").update(data.token).digest("hex");

    const reset = await prisma.passwordReset.findUnique({
      where: { tokenHash },
    });

    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      return fail("Token inválido ou expirado", 400);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash: await hashPassword(data.password) },
      }),
      prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return ok({ message: "Senha redefinida com sucesso." });
  } catch (error) {
    return handleError(error);
  }
}
