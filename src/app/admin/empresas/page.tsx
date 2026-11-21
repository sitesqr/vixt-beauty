import Link from "next/link";
import { Building2, Search, Plus } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState, StatusBadge } from "@/components/dashboard/ui";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const session = await getSession();
  if (!session) return null;
  const { q, status } = await searchParams;

  const companies = await prisma.company.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { name: true, email: true } },
      subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { appointments: true, professionals: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Empresas"
        description={`${companies.length} estabelecimento(s) cadastrado(s).`}
        action={<Link href="/admin/empresas/nova" className="vixt-btn-primary"><Plus className="h-4 w-4" /> Nova empresa</Link>}
      />
      <div className="mb-5 flex flex-wrap gap-3">
        <form className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-100/45" />
          <input name="q" defaultValue={q} placeholder="Buscar por nome ou identificador..." className="vixt-input !pl-10" />
        </form>
        <div className="flex gap-2">
          {[["", "Todas"], ["ACTIVE", "Ativas"], ["TRIAL", "Em teste"], ["PAST_DUE", "Inadimplentes"], ["SUSPENDED", "Suspensas"]].map(([v, label]) => (
            <Link key={v} href={`/admin/empresas${v ? `?status=${v}` : ""}`} className={`rounded-xl border px-3 py-2.5 text-xs font-medium ${status === v || (!status && !v) ? "border-rose-500 bg-rose-500/10 text-rose-300" : "border-white/10 text-rose-100/60"}`}>{label}</Link>
          ))}
        </div>
      </div>

      {companies.length === 0 ? <EmptyState icon={Building2} title="Nenhuma empresa" description="Nenhuma empresa encontrada com esses filtros." /> : (
        <div className="vixt-card overflow-hidden">
          <div className="divide-y divide-white/[0.05]">
            {companies.map((c) => (
              <div key={c.id} className="flex flex-col gap-4 p-5 transition hover:bg-white/[0.02] lg:flex-row lg:items-center">
                <div className="flex flex-1 items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-lg font-bold text-rose-400">{c.name.charAt(0)}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{c.name}</p>
                    <p className="text-xs text-rose-100/45">{c.owner.name} · {c.owner.email} · /b/{c.slug}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-5 text-xs text-rose-100/60">
                  <span><strong className="text-white">{c._count.professionals}</strong> prof.</span>
                  <span><strong className="text-white">{c._count.appointments}</strong> agend.</span>
                  <span>{c.subscriptions?.[0]?.plan.name || "—"}</span>
                  <span>{formatDate(c.createdAt)}</span>
                </div>
                <StatusBadge status={c.status} />
                <Link href={`/admin/empresas/${c.id}`} className="vixt-btn-ghost !py-2 text-xs">Ver detalhes</Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
