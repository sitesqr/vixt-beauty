import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Clock, Star, MapPin, Scissors, ArrowRight } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard, EmptyState } from "@/components/dashboard/ui";
import { formatDateTime, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [upcoming, completed, shops, totalReviews] = await Promise.all([
    prisma.appointment.findMany({
      where: { clientId: session.userId, status: { in: ["CONFIRMED", "PENDING", "RESCHEDULE_REQUESTED"] }, startAt: { gte: new Date() } },
      orderBy: { startAt: "asc" }, take: 5,
      include: { company: { select: { name: true, slug: true } } },
    }),
    prisma.appointment.count({ where: { clientId: session.userId, status: "COMPLETED" } }),
    prisma.company.findMany({
      where: { status: { in: ["ACTIVE", "TRIAL"] } },
      select: { id: true, name: true, slug: true, city: true, state: true, description: true, _count: { select: { services: true, reviews: true } } },
      orderBy: { createdAt: "desc" }, take: 6,
    }),
    prisma.review.count({ where: { clientId: session.userId } }),
  ]);

  return (
    <>
      <PageHeader
        title={`Olá, ${session.name.split(" ")[0]}!`}
        description="Sua conta é gratuita e serve para agendar em qualquer salão parceira."
        action={<Link href="/cliente/agendar" className="vixt-btn-primary"><Scissors className="h-4 w-4" /> Novo agendamento</Link>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Próximos agendamentos" value={upcoming.length} icon={CalendarDays} />
        <StatCard label="Atendimentos concluídos" value={completed} icon={Clock} tone="emerald" />
        <StatCard label="Avaliações feitas" value={totalReviews} icon={Star} tone="amber" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="vixt-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Próximos horários</h2>
            <Link href="/cliente/agendamentos" className="flex items-center gap-1 text-xs text-rose-400">Ver todos <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState icon={CalendarDays} title="Nenhum agendamento" description="Escolha um salão e reserve seu horário." action={<Link href="/cliente/agendar" className="vixt-btn-primary !py-2 text-xs">Agendar agora</Link>} />
          ) : (
            <div className="space-y-3">
              {upcoming.map((a) => (
                <div key={a.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{a.serviceName}</span>
                    <span className="text-xs text-rose-300">{formatDateTime(a.startAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-rose-100/45">{a.company.name} · {a.professionalName}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="vixt-card p-5">
          <h2 className="mb-4 font-semibold text-white">Salãos disponíveis</h2>
          <div className="space-y-2">
            {shops.map((s) => (
              <Link key={s.id} href={`/b/${s.slug}`} className="flex items-center gap-3 rounded-xl border border-white/[0.06] p-3 transition hover:border-rose-500/40">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/10 font-bold text-rose-400">{s.name.charAt(0)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white">{s.name}</span>
                  <span className="flex items-center gap-1 text-[11px] text-rose-100/45"><MapPin className="h-3 w-3" />{s.city}/{s.state} · {s._count.services} serviços</span>
                </span>
                <ArrowRight className="h-4 w-4 text-rose-100/40" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
