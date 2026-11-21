import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/ui";
import { AppointmentsManager } from "@/components/dashboard/appointments-manager";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session?.companyId) redirect("/login");
  const appointments = await prisma.appointment.findMany({
    where: { companyId: session.companyId },
    orderBy: { startAt: "desc" },
    take: 200,
    include: { professional: { select: { name: true } }, service: { select: { name: true } } },
  });
  return (
    <>
      <PageHeader title="Agendamentos" description="Acompanhe e gerencie todos os agendamentos da salão." />
      <AppointmentsManager
        initial={appointments.map((a) => ({
          id: a.id, startAt: a.startAt.toISOString(), endAt: a.endAt.toISOString(), status: a.status,
          serviceName: a.serviceName, servicePriceCents: a.servicePriceCents,
          clientName: a.clientName, clientPhone: a.clientPhone,
          professionalName: a.professionalName, notes: a.notes,
          rescheduleRequestedAt: a.rescheduleRequestedAt?.toISOString() || null,
        }))}
      />
    </>
  );
}
