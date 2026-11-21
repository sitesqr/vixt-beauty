"use client";

import { useEffect, useState } from "react";
import { Bell, Check, CalendarDays, Star, Receipt, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { cn, formatDateTime } from "@/lib/utils";

type N = { id: string; title: string; message: string; type: string; read: boolean; createdAt: string };

const iconFor: Record<string, React.ElementType> = {
  APPOINTMENT_CONFIRMED: CalendarDays,
  APPOINTMENT_REMINDER: CalendarDays,
  APPOINTMENT_CANCELLED: CalendarDays,
  RESCHEDULE_REQUEST: RefreshCw,
  REVIEW_RECEIVED: Star,
  INVOICE: Receipt,
  SYSTEM: Bell,
};

export function NotificationsList({ initial }: { initial: N[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState(initial);

  async function markRead(id?: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((p) => p.map((n) => !id || n.id === id ? { ...n, read: true } : n));
    router.refresh();
  }

  return (
    <div className="vixt-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
        <h2 className="font-semibold text-white">Notificações</h2>
        {items.some((n) => !n.read) && <button onClick={() => markRead()} className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300"><Check className="h-3.5 w-3.5" /> Marcar todas como lidas</button>}
      </div>
      {items.length === 0 ? <p className="p-10 text-center text-sm text-rose-100/45">Nenhuma notificação.</p> : (
        <div className="divide-y divide-white/[0.05]">
          {items.map((n) => {
            const Icon = iconFor[n.type] || Bell;
            return (
              <button key={n.id} onClick={() => markRead(n.id)} className={cn("flex w-full gap-4 p-5 text-left transition hover:bg-white/[0.02]", !n.read && "bg-rose-500/[0.04]")}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-400"><Icon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2"><span className="font-medium text-white">{n.title}</span>{!n.read && <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />}</span>
                  <span className="mt-0.5 block text-sm text-rose-100/60">{n.message}</span>
                  <span className="mt-1 block text-[11px] text-rose-100/40">{formatDateTime(n.createdAt)}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
