import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleError, ok } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");
    const status = new URL(req.url).searchParams.get("status");
    const invoices = await prisma.invoice.findMany({
      where: status ? { status: status as any } : {},
      orderBy: { createdAt: "desc" },
      include: {
        company: { select: { name: true, slug: true } },
        payments: true,
      },
    });
    return ok(invoices);
  } catch (e) {
    return handleError(e);
  }
}
