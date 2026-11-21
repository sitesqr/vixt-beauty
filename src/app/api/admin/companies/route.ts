import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleError, ok } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");
    const q = new URL(req.url).searchParams;
    const status = q.get("status");
    const search = q.get("search");

    const companies = await prisma.company.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(search
          ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { slug: { contains: search, mode: "insensitive" } }] }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { name: true, email: true } },
        subscriptions: { include: { plan: { select: { name: true, priceCents: true } } }, orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { appointments: true, professionals: true, services: true } },
      },
    });

    // client count per company (global client accounts linked by appointments)
    const withClients = await Promise.all(
      companies.map(async (c) => {
        const clients = await prisma.appointment.groupBy({
          by: ["clientId"],
          where: { companyId: c.id },
        });
        return { ...c, clientCount: clients.length };
      })
    );

    return ok(withClients);
  } catch (e) {
    return handleError(e);
  }
}
