import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/ui";
import { ClientAppointments } from "@/components/client/client-appointments";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/login");
  const appointments = await prisma.appointment.findMany({
    where: { clientId: session.userId },
    orderBy: { startAt: "desc" },
    include: {
      company: { select: { id: true, name: true, slug: true } },
      professional: { select: { name: true, id: true } },
      reviews: { select: { id: true } },
    },
  });
  return (
    <>
      <PageHeader title="Meus agendamentos" description="Acompanhe, cancele ou solicite remarcação." />
      <ClientAppointments initial={appointments.map((a) => ({
        id: a.id, startAt: a.startAt.toISOString(), endAt: a.endAt.toISOString(), status: a.status,
        serviceName: a.serviceName, servicePriceCents: a.servicePriceCents,
        professionalName: a.professionalName, professionalId: a.professionalId,
        companyName: a.company.name, companySlug: a.company.slug, companyId: a.company.id,
        alreadyReviewed: a.reviews.length > 0,
        rescheduleRequestedAt: a.rescheduleRequestedAt?.toISOString() || null,
      }))} />
    </>
  );
}
