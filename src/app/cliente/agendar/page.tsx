import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/ui";
import { ClientBooking } from "@/components/client/client-booking";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/login");
  const shops = await prisma.company.findMany({
    where: { status: { in: ["ACTIVE", "TRIAL"] } },
    select: { id: true, name: true, slug: true, city: true, state: true },
    orderBy: { name: "asc" },
  });
  return (
    <>
      <PageHeader title="Agendar horário" description="Escolha um salão, serviço e profissional." />
      <ClientBooking shops={shops} />
    </>
  );
}
