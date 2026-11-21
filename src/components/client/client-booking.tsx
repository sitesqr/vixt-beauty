"use client";

import { useEffect, useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { BookingWidget } from "@/components/booking/booking-widget";
import { cn } from "@/lib/utils";

type Shop = { id: string; name: string; slug: string; city: string | null; state: string | null };
type Service = { id: string; name: string; durationMin: number; priceCents: number };
type Pro = { id: string; name: string };

export function ClientBooking({ shops }: { shops: Shop[] }) {
  const [companyId, setCompanyId] = useState(shops[0]?.id || "");
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Pro[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    fetch(`/api/public/shop/${shops.find((s) => s.id === companyId)?.slug}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setServices(j.data.services.map((s: any) => ({ id: s.id, name: s.name, durationMin: s.durationMin, priceCents: s.priceCents })));
          setProfessionals(j.data.professionals.map((p: any) => ({ id: p.id, name: p.name })));
        }
      })
      .finally(() => setLoading(false));
  }, [companyId, shops]);

  if (shops.length === 0) return <p className="vixt-card p-10 text-center text-rose-100/45">Nenhum salão disponível no momento.</p>;

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {shops.map((s) => (
          <button key={s.id} onClick={() => setCompanyId(s.id)} className={cn("flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition", companyId === s.id ? "border-rose-500 bg-rose-500/10 text-rose-300" : "border-white/10 text-rose-100/60 hover:text-white")}>
            <Building2 className="h-4 w-4" /> {s.name}
          </button>
        ))}
      </div>
      {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-rose-400" /></div> : (
        <BookingWidget key={companyId} companyId={companyId} mode="client" services={services} professionals={professionals} />
      )}
    </>
  );
}
