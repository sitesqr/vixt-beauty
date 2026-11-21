import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleError, ok } from "@/lib/api";

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN");
    const configs = await prisma.globalConfig.findMany();
    return ok(configs);
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");
    const body = await req.json();
    for (const [key, value] of Object.entries(body)) {
      await prisma.globalConfig.upsert({
        where: { key },
        update: { value: value as any },
        create: { key, value: value as any },
      });
    }
    return ok({ message: "Configurações globais salvas" });
  } catch (e) {
    return handleError(e);
  }
}
