import { redirect } from "next/navigation";
import { Users, CalendarDays, Mail, Phone } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/dashboard/ui";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session?.companyId) redirect("/login");

  const grouped = await prisma.appointment.groupBy({
    by: ["clientId", "clientName", "clientPhone"],
    where: { companyId: session.companyId },
    _count: true,
    _sum: { servicePriceCents: true },
    orderBy: { _count: { clientId: "desc" } },
  });

  const emails = await prisma.user.findMany({
    where: { id: { in: grouped.map((g) => g.clientId) } },
    select: { id: true, email: true },
  });
  const emailMap = new Map(emails.map((u) => [u.id, u.email]));

  return (
    <>
      <PageHeader title="Clientes" description="Clientes que já realizaram agendamentos nesta salão." />
      {grouped.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum cliente ainda" description="Os clientes aparecerão aqui após o primeiro agendamento." />
      ) : (
        <div className="vixt-card overflow-hidden">
          <div className="divide-y divide-white/[0.05]">
            {grouped.map((g) => (
              <div key={g.clientId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-rose-800 text-sm font-bold text-white">{g.clientName.charAt(0)}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{g.clientName}</p>
                  <div className="mt-0.5 flex flex-wrap gap-x-4 text-xs text-rose-100/45">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{emailMap.get(g.clientId) || "—"}</span>
                    {g.clientPhone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{g.clientPhone}</span>}
                  </div>
                </div>
                <span className="flex items-center gap-1 text-xs text-rose-100/60"><CalendarDays className="h-3.5 w-3.5" /> {g._count} agendamento(s)</span>
                <span className="w-24 text-right text-sm font-semibold text-rose-300">{((g._sum.servicePriceCents || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
