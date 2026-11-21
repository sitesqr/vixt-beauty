import { redirect } from "next/navigation";
import { Star, MessageSquare } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/dashboard/ui";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/login");
  const reviews = await prisma.review.findMany({
    where: { clientId: session.userId },
    orderBy: { createdAt: "desc" },
    include: { company: { select: { name: true, slug: true } } },
  });
  return (
    <>
      <PageHeader title="Minhas avaliações" description="Avaliações que você fez em atendimentos concluídos." />
      {reviews.length === 0 ? <EmptyState icon={MessageSquare} title="Nenhuma avaliação" description="Avalie seus atendimentos concluídos para ajudar outros clientes." /> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reviews.map((r) => (
            <div key={r.id} className="vixt-card p-5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">{r.company.name}</span>
                <span className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-champagne-400 text-champagne-400" />)}</span>
              </div>
              {r.comment && <p className="mt-2 text-sm text-rose-100/60">{r.comment}</p>}
              <p className="mt-3 text-[11px] text-rose-100/40">{formatDate(r.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
