import { NextRequest } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { handleError, ok, fail } from "@/lib/api";
import { z } from "zod";

const googleSchema = z.object({
  credential: z.string().min(1, "Credencial do Google ausente"),
});

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Autenticação/cadastro de clientes com Google (One Tap / botão).
 * Verifica o ID token diretamente com o Google e cria ou reaproveita a conta.
 * Apenas contas CLIENT são criadas aqui — proprietárias e SUPER ADMIN não.
 */
export async function POST(req: NextRequest) {
  try {
    const { credential } = googleSchema.parse(await req.json());

    if (!process.env.GOOGLE_CLIENT_ID) {
      return fail("Login com Google não configurado nesta instalação", 503);
    }

    // Verifica assinatura, audiência, emissor e validade do token.
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch {
      return fail("Sessão do Google inválida ou expirada. Tente novamente.", 401);
    }
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.email_verified) {
      return fail("Conta Google inválida ou e-mail não verificado", 401);
    }

    const email = payload.email.toLowerCase();
    const googleId = payload.sub;
    const name = payload.name || email.split("@")[0];
    const avatarUrl = payload.picture || null;

    // Procura primeiro pelo googleId; depois pelo e-mail (vincula conta existente).
    let user = await prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email },
        include: { memberships: { select: { companyId: true } } },
      });

      if (existingByEmail) {
        // Vincula o Google a uma conta de cliente já existente.
        if (existingByEmail.role !== "CLIENT") {
          return fail("Este e-mail pertence a uma conta administrativa. Use login com senha.", 403);
        }
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { googleId, avatarUrl: avatarUrl ?? existingByEmail.avatarUrl, emailVerified: true },
          include: { memberships: { select: { companyId: true } } },
        });
      } else {
        user = await prisma.user.create({
          data: {
            name,
            email,
            googleId,
            avatarUrl,
            role: "CLIENT",
            authProvider: "GOOGLE",
            emailVerified: true,
          },
          include: { memberships: { select: { companyId: true } } },
        });

        await prisma.notification.create({
          data: {
            userId: user.id,
            type: "SYSTEM",
            title: "Bem-vinda ao VIXT Beauty!",
            message: "Sua conta foi criada com o Google. Agora você já pode agendar nos salões parceiros.",
          },
        });
      }
    } else if (!user.active) {
      return fail("Esta conta está desativada", 403);
    }

    await createSession(user);

    return ok({ redirect: "/cliente", role: user.role, name: user.name });
  } catch (error) {
    return handleError(error);
  }
}
