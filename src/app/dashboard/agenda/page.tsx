import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/ui";
import { BookingWidget } from "@/components/booking/booking-widget";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const session = await getSession();
  if (!session?.companyId) redirect("/login");

  const [services, professionals] = await Promise.all([
    prisma.service.findMany({ where: { companyId: session.companyId, active: true }, orderBy: { name: "asc" } }),
    prisma.professional.findMany({ where: { companyId: session.companyId, active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title="Nova agenda" description="Monte a agenda com disponibilidade em tempo real." />
      <BookingWidget
        companyId={session.companyId}
        mode="owner"
        services={services.map((s) => ({ id: s.id, name: s.name, durationMin: s.durationMin, priceCents: s.priceCents }))}
        professionals={professionals.map((p) => ({ id: p.id, name: p.name }))}
      />
    </>
  );
}
