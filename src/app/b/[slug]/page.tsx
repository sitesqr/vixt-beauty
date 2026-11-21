import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Phone, Star, Clock, Scissors, ArrowLeft, Globe2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { PublicShopClient } from "@/components/public/public-shop-client";

export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function loadShop(slug: string) {
  const res = await fetch(`${API_URL}/api/public/shop/${slug}`, { cache: "no-store" });
  if (!res.ok) return null;
  const json = await res.json();
  return json.success ? json.data : null;
}

export default async function PublicShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await loadShop(slug);
  if (!shop) notFound();

  const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  return (
    <div className="min-h-screen bg-ink-950">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-rose-100/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> <Logo href="" />
          </Link>
          <Link href="/cadastro-cliente" className="vixt-btn-primary !py-2 text-xs">Criar conta grátis</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(238,121,152,.16),transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-5 py-12 sm:py-16">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-3xl border border-white/10 bg-ink-850 text-3xl font-extrabold text-rose-400 shadow-glow">
              {shop.logoUrl ? <img src={shop.logoUrl} alt={shop.name} className="h-full w-full object-cover" /> : shop.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <span className="vixt-badge bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Aberta para agendamentos
                </span>
                {shop.reviews.length > 0 && (
                  <span className="flex items-center gap-1 text-sm text-champagne-400">
                    <Star className="h-4 w-4 fill-champagne-400" />
                    <strong className="text-white">{shop.ratingAvg.toFixed(1)}</strong>
                    <span className="text-rose-100/45">({shop.reviews.length} avaliações)</span>
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{shop.name}</h1>
              {shop.description && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-rose-100/60">{shop.description}</p>}
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-rose-100/60">
                {shop.address && (
                  <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-rose-400" />{shop.address}{shop.neighborhood ? `, ${shop.neighborhood}` : ""} — {shop.city}/{shop.state}</span>
                )}
                {shop.phone && <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-rose-400" />{shop.phone}</span>}
                {shop.whatsapp && (
                  <a href={`https://wa.me/${shop.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300">
                    <Globe2 className="h-4 w-4" /> WhatsApp
                  </a>
                )}
              </div>
            </div>
            <a href="#agendar" className="vixt-btn-primary shrink-0 !px-6">
              <Scissors className="h-4 w-4" /> Agendar horário
            </a>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-10">
            <section>
              <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-white"><Scissors className="h-5 w-5 text-rose-400" /> Serviços e preços</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {shop.services.map((s: any) => (
                  <div key={s.id} className="vixt-card flex items-start gap-4 p-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-400">
                      <Scissors className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white">{s.name}</p>
                      {s.description && <p className="mt-0.5 text-xs text-rose-100/45">{s.description}</p>}
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-base font-bold text-rose-300">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(s.priceCents / 100)}</span>
                        <span className="flex items-center gap-1 text-xs text-rose-100/45"><Clock className="h-3 w-3" /> {s.durationMin} min</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {shop.professionals.length > 0 && (
              <section>
                <h2 className="mb-5 text-xl font-bold text-white">Nossa equipe</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {shop.professionals.map((p: any) => (
                    <div key={p.id} className="vixt-card flex items-center gap-4 p-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-rose-500 to-rose-800 text-lg font-bold text-white">
                        {p.photoUrl ? <img src={p.photoUrl} alt={p.name} className="h-full w-full object-cover" /> : p.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white">{p.name}</p>
                        <p className="truncate text-xs text-rose-100/45">{p.specialties?.join(" · ") || "Profissional"}</p>
                        {p.bio && <p className="mt-1 line-clamp-2 text-xs text-rose-100/45">{p.bio}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {shop.reviews.length > 0 && (
              <section>
                <h2 className="mb-5 text-xl font-bold text-white">Avaliações</h2>
                <div className="space-y-3">
                  {shop.reviews.map((r: any) => (
                    <div key={r.id} className="vixt-card p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">{r.client.name}</span>
                        <span className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-champagne-400 text-champagne-400" />)}</span>
                      </div>
                      {r.comment && <p className="mt-2 text-sm text-rose-100/60">{r.comment}</p>}
                      <p className="mt-2 text-[11px] text-rose-100/40">{new Date(r.createdAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-5">
            <div className="vixt-card p-5">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-white"><Clock className="h-4 w-4 text-rose-400" /> Horário de funcionamento</h3>
              <div className="space-y-2.5">
                {shop.workingHours.map((wh: any) => (
                  <div key={wh.id} className="flex justify-between text-sm">
                    <span className="text-rose-100/60">{dayNames[wh.dayOfWeek]}</span>
                    <span className="font-medium text-rose-50">{wh.openTime} – {wh.closeTime}</span>
                  </div>
                ))}
              </div>
            </div>
            <div id="agendar" className="scroll-mt-24">
              <PublicShopClient
                companyId={shop.id}
                services={shop.services.map((s: any) => ({ id: s.id, name: s.name, durationMin: s.durationMin, priceCents: s.priceCents }))}
                professionals={shop.professionals.map((p: any) => ({ id: p.id, name: p.name }))}
              />
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-rose-100/40">
        Página oficial de {shop.name} · Impulsionada por <Link href="/" className="text-rose-400">VIXT Beauty</Link>
      </footer>
    </div>
  );
}
