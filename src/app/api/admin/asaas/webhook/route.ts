import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleError, ok, fail } from "@/lib/api";
import { AsaasError, configureWebhook, getAsaasConfig } from "@/lib/asaas";

export async function POST() {
  try {
    await requireRole("SUPER_ADMIN");
    const cfg = await getAsaasConfig();
    if (!cfg.configured) return fail("Configure a API key do Asaas primeiro", 400);

    const baseUrl = process.env.RENDER_EXTERNAL_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/asaas/webhook`;

    // Gera um token seguro (>32 caracteres) e salva no banco para validar o header asaas-token.
    const authToken = cfg.webhookToken || `whsec_${randomBytes(32).toString("base64url")}`;
    await configureWebhook(webhookUrl, authToken);

    const dbConfig = await prisma.asaasConfig.findFirst();
    if (dbConfig) await prisma.asaasConfig.update({ where: { id: dbConfig.id }, data: { webhookToken: authToken } });

    return ok({ webhookUrl, authToken });
  } catch (e) {
    if (e instanceof AsaasError) return fail(e.message, e.status);
    return handleError(e);
  }
}
