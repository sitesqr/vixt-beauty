import { NextRequest } from "next/server";
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
    await configureWebhook(webhookUrl);
    return ok({ webhookUrl });
  } catch (e) {
    if (e instanceof AsaasError) return fail(e.message, e.status);
    return handleError(e);
  }
}
