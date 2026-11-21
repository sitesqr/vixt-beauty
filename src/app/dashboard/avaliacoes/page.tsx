import { redirect } from "next/navigation";
import { Star, MessageSquare } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/dashboard/ui";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session?.companyId) redirect("/login");
  const reviews = await prisma.review.findMany({
    where: { companyId: session.companyId },
    orderBy: { createdAt: "desc" },
    include: { client: { select: { name: true } }, professional: { select: { name: true } } },
  });
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";

  return (
    <>
      <PageHeader title="Avaliações" description="O que seus clientes estão dizendo." />
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
        <span className="text-4xl font-extrabold text-white">{avg}</span>
        <div>
          <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-5 w-5 ${i < Math.round(Number(avg)) ? "fill-champagne-400 text-champagne-400" : "text-rose-100/30"}`} />)}</div>
          <p className="mt-1 text-xs text-rose-100/60">{reviews.length} avaliação(ões)</p>
        </div>
      </div>
      {reviews.length === 0 ? (
        <EmptyState icon={MessageSquare} title="Nenhuma avaliação" description="Incentive seus clientes a avaliarem após o atendimento." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reviews.map((r) => (
            <div key={r.id} className="vixt-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-rose-500/15 text-xs font-bold text-rose-300">{r.client.name.charAt(0)}</span>
                  <span className="text-sm font-medium text-white">{r.client.name}</span>
                </div>
                <span className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-champagne-400 text-champagne-400" />)}</span>
              </div>
              {r.comment && <p className="mt-3 text-sm text-rose-100/60">{r.comment}</p>}
              <p className="mt-3 text-[11px] text-rose-100/40">{formatDate(r.createdAt)}{r.professional ? ` · ${r.professional.name}` : ""}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
