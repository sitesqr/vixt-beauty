import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/auth";
import { handleError, ok } from "@/lib/api";
import { forgotPasswordSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const { email } = forgotPasswordSchema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success — don't reveal which emails exist.
    if (user) {
      const token = generateToken();
      const tokenHash = createHash("sha256").update(token).digest("hex");
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      // In production: send e-mail with `token`. In dev we log it.
      console.log(`[PASSWORD RESET] ${email} -> token: ${token}`);
    }

    return ok({ message: "Se este e-mail estiver cadastrado, você receberá as instruções em breve." });
  } catch (error) {
    return handleError(error);
  }
}
