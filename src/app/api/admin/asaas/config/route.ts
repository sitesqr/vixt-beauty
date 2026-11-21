import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleError, ok } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  apiKey: z.string().min(1),
  environment: z.enum(["sandbox", "production"]).default("sandbox"),
  walletId: z.string().optional().nullable(),
  webhookToken: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN");
    const cfg = await prisma.asaasConfig.findFirst();
    return ok(cfg ? { ...cfg, apiKey: cfg.apiKey ? "••••••••" + cfg.apiKey.slice(-4) : "" } : null);
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");
    const data = schema.parse(await req.json());

    const existing = await prisma.asaasConfig.findFirst();
    const update = {
      apiKey: data.apiKey.startsWith("••") && existing ? existing.apiKey : data.apiKey,
      environment: data.environment,
      walletId: data.walletId || null,
      webhookToken: data.webhookToken || null,
      active: data.active,
    };

    const cfg = existing
      ? await prisma.asaasConfig.update({ where: { id: existing.id }, data: update })
      : await prisma.asaasConfig.create({ data: update });

    return ok({ ...cfg, apiKey: "••••••••" + cfg.apiKey.slice(-4) });
  } catch (e) {
    return handleError(e);
  }
}
