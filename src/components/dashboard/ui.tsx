import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-rose-100/45">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  hint,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  hint?: string;
  tone?: "brand" | "emerald" | "amber" | "violet" | "red";
}) {
  const tones = {
    brand: "bg-rose-500/10 text-rose-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/10 text-champagne-400",
    violet: "bg-violet-500/10 text-violet-400",
    red: "bg-red-500/10 text-red-400",
  };
  return (
    <div className="vixt-card p-5 transition hover:border-rose-500/25">
      <div className="flex items-start justify-between">
        <div className={cn("grid h-10 w-10 place-items-center rounded-xl", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        {trend !== undefined && (
          <span className={cn("flex items-center gap-0.5 text-xs font-semibold", trend >= 0 ? "text-emerald-400" : "text-red-400")}>
            {trend >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-5 text-2xl font-bold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs text-rose-100/45">{label}</p>
      {hint && <p className="mt-2 text-[11px] text-rose-100/40">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01] px-6 py-14 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.04] text-rose-100/45">
        <Icon className="h-6 w-6" />
      </div>
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-rose-100/45">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    TRIAL: "bg-amber-500/12 text-champagne-400 ring-amber-500/20",
    ACTIVE: "bg-emerald-500/12 text-emerald-400 ring-emerald-500/20",
    PAST_DUE: "bg-orange-500/12 text-orange-400 ring-orange-500/20",
    SUSPENDED: "bg-red-500/12 text-red-400 ring-red-500/20",
    CANCELLED: "bg-rose-100/45/12 text-rose-100/60 ring-rose-100/45/20",
    TRIALING: "bg-amber-500/12 text-champagne-400 ring-amber-500/20",
    PENDING: "bg-amber-500/12 text-champagne-400 ring-amber-500/20",
    PAID: "bg-emerald-500/12 text-emerald-400 ring-emerald-500/20",
    FAILED: "bg-red-500/12 text-red-400 ring-red-500/20",
    CONFIRMED: "bg-emerald-500/12 text-emerald-400 ring-emerald-500/20",
    COMPLETED: "bg-rose-500/12 text-rose-400 ring-rose-500/20",
    NO_SHOW: "bg-red-500/12 text-red-400 ring-red-500/20",
    RESCHEDULE_REQUESTED: "bg-violet-500/12 text-violet-400 ring-violet-500/20",
  };
  const labels: Record<string, string> = {
    TRIAL: "Teste",
    ACTIVE: "Ativa",
    PAST_DUE: "Inadimplente",
    SUSPENDED: "Suspensa",
    TRIALING: "Em teste",
    PENDING: "Pendente",
    PAID: "Pago",
    FAILED: "Falhou",
    CONFIRMED: "Confirmado",
    COMPLETED: "Concluído",
    CANCELLED: "Cancelado",
    NO_SHOW: "Não compareceu",
    RESCHEDULE_REQUESTED: "Remarcação",
  };
  return (
    <span className={cn("vixt-badge ring-1 ring-inset", map[status] || map.ACTIVE)}>
      {labels[status] || status}
    </span>
  );
}
