import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  Users,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Star,
  Check,
  Flower2,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";

const features = [
  { icon: CalendarDays, title: "Agenda inteligente", desc: "Agendamentos online 24/7 com bloqueio automático de horários ocupados." },
  { icon: Users, title: "Clientes fiéis", desc: " Uma conta única para a cliente agendar em diferentes salões parceiros." },
  { icon: Sparkles, title: "Equipe e serviços", desc: "Cadastre profissionais, serviços de beleza, preços, comissões e disponibilidade." },
  { icon: ChartNoAxesCombined, title: "Gestão financeira", desc: "Faturamento, despesas e comissões com relatórios claros e elegantes." },
  { icon: Smartphone, title: "Página pública", desc: "Seu salão com endereço próprio para compartilhar no Instagram e WhatsApp." },
  { icon: ShieldCheck, title: "Multiempresas", desc: "Arquitetura isolada por salão, pronta para crescer com você." },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-ink-950">
      {/* Glow rosé/champagne */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(238,121,152,.16),transparent_60%)]" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo href="/" />
        <nav className="hidden items-center gap-7 text-sm text-rose-100/60 md:flex">
          <a href="#recursos" className="transition hover:text-rose-200">Recursos</a>
          <a href="#planos" className="transition hover:text-rose-200">Planos</a>
          <Link href="/login" className="transition hover:text-rose-200">Entrar</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-rose-100/70 hover:text-rose-200 md:hidden">Entrar</Link>
          <Link href="/cadastro-salao" className="vixt-btn-primary !py-2.5">
            Começar grátis <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-16 md:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-400/25 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-200">
            <Flower2 className="h-3.5 w-3.5" />
            A plataforma completa para o seu salão de beleza
          </div>
          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-white md:text-6xl">
            Gestão de salão{" "}
            <span className="vixt-gradient-text">com beleza e simplicidade.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-rose-100/60 md:text-lg">
            Agendamentos, clientes, profissionais, comissões e financeiro em um só lugar.
            Seu salão funciona enquanto você faz o que mais ama: cuidar da beleza de cada cliente.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/cadastro-salao" className="vixt-btn-primary w-full px-6 sm:w-auto">
              Abrir meu salão <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/cadastro-cliente" className="vixt-btn-ghost w-full sm:w-auto">
              Sou cliente — quero agendar
            </Link>
          </div>
          <p className="mt-4 text-xs text-rose-100/40">
            ✓ 14 dias grátis · ✓ Sem cartão de crédito · ✓ Cancele quando quiser
          </p>
        </div>

        {/* Product mockup */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="absolute -inset-6 rounded-3xl bg-rose-500/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-champagne-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              <span className="ml-3 text-xs text-rose-100/40">app.vixtbeauty.com/dashboard</span>
            </div>
            <div className="grid gap-4 bg-ink-950 p-5 md:grid-cols-4">
              {[
                ["Agendamentos hoje", "12", "+3 vs ontem"],
                ["Faturamento mensal", "R$ 8.450", "+18% este mês"],
                ["Clientes ativos", "324", "+27 este mês"],
                ["Comissões pendentes", "R$ 1.280", "4 profissionais"],
              ].map(([label, value, sub]) => (
                <div key={label} className="rounded-xl border border-white/[0.06] bg-ink-850 p-4">
                  <p className="text-[11px] text-rose-100/50">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-white">{value}</p>
                  <p className="mt-1 text-[11px] text-rose-300">{sub}</p>
                </div>
              ))}
              <div className="rounded-xl border border-white/[0.06] bg-ink-850 p-5 md:col-span-3">
                <p className="mb-4 text-sm font-semibold text-white">Agenda de hoje</p>
                <div className="space-y-2.5">
                  {[
                    ["09:00", "Corte Feminino", "Ana Paula Ribeiro", "R$ 65"],
                    ["10:30", "Escova e Penteado", "Juliana Alves", "R$ 45"],
                    ["13:00", "Design de Sobrancelhas", "Juliana Alves", "R$ 40"],
                  ].map(([time, service, pro, price]) => (
                    <div key={time} className="flex items-center gap-4 rounded-lg bg-ink-900 px-3 py-2.5 text-xs">
                      <span className="font-mono font-semibold text-rose-300">{time}</span>
                      <span className="flex-1 text-rose-50">{service}</span>
                      <span className="text-rose-100/40">{pro}</span>
                      <span className="text-rose-100/60">{price}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-ink-850 p-5">
                <p className="mb-4 text-sm font-semibold text-white">Serviços top</p>
                {[
                  ["Corte Feminino", 82],
                  ["Coloração", 64],
                  ["Manicure", 48],
                ].map(([name, pct]) => (
                  <div key={name as string} className="mb-3">
                    <div className="mb-1 flex justify-between text-[11px] text-rose-100/50">
                      <span>{name}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-rose-400" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-champagne-400">Recursos</p>
          <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">Tudo que sua operação precisa</h2>
          <p className="mt-3 text-rose-100/60">Ferramentas pensadas para o dia a dia de um salão moderno.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="vixt-card p-6 transition hover:border-rose-400/40">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-rose-500/10 text-rose-300">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-rose-100/60">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="planos" className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-champagne-400">Planos</p>
          <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">Simples e sem surpresas</h2>
          <p className="mt-3 text-rose-100/60">Apenas proprietárias pagam. Clientes são sempre gratuitas.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { name: "Starter", price: "R$ 49", desc: "Para começar", features: ["3 profissionais", "20 serviços", "Agenda online", "Página pública"], highlight: false },
            { name: "Profissional", price: "R$ 89", desc: "Para crescer", features: ["10 profissionais", "Serviços ilimitados", "Comissões", "Relatórios completos"], highlight: true },
            { name: "Empresarial", price: "R$ 179", desc: "Para redes", features: ["Profissionais ilimitados", "Múltiplas unidades", "API", "Suporte prioritário"], highlight: false },
          ].map((p) => (
            <div key={p.name} className={`relative rounded-2xl border p-7 ${p.highlight ? "border-rose-400/50 bg-rose-500/[0.07] shadow-glow" : "border-white/[0.07] bg-ink-900"}`}>
              {p.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-rose-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Mais escolhido</span>}
              <p className="text-sm font-semibold text-rose-50">{p.name}</p>
              <p className="mt-1 text-xs text-rose-100/50">{p.desc}</p>
              <p className="mt-5 text-4xl font-extrabold text-white">{p.price}<span className="text-sm font-normal text-rose-100/50">/mês</span></p>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-rose-50/90">
                    <Check className="h-4 w-4 text-champagne-400" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/cadastro-salao" className={`mt-8 w-full ${p.highlight ? "vixt-btn-primary" : "vixt-btn-ghost"}`}>
                Testar 14 dias grátis
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Brand CTA */}
      <section className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl border border-rose-400/20 bg-gradient-to-br from-rose-500/[0.10] via-ink-900 to-ink-900 px-6 py-14 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(238,121,152,.16),transparent_65%)]" />
          <div className="relative mx-auto mb-6 h-28 w-44">
            <img src="/images/vixt-beauty-logo.svg" alt="VIXT Beauty — Gestão Inteligente para Salões de Beleza" className="h-full w-full object-contain" loading="lazy" />
          </div>
          <h2 className="relative text-3xl font-bold text-white md:text-4xl">
            Sua beleza começa com uma boa agenda.
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sm text-rose-100/60">
            Junte-se aos salões que já usam a VIXT Beauty para crescer. Comece grátis por 14 dias.
          </p>
          <Link href="/cadastro-salao" className="vixt-btn-primary relative mt-8">
            Abrir meu salão <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="relative border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-rose-100/40 md:flex-row">
          <Logo />
          <p>© {new Date().getFullYear()} VIXT Beauty. Todos os direitos reservados.</p>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-champagne-400 text-champagne-400" />)}
            <span className="ml-1 text-xs">Feito para salões de beleza</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
