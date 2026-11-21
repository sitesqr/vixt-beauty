"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Scissors,
  Users,
  UserCog,
  Wallet,
  Star,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Building2,
  LayoutGrid,
  CreditCard,
  Receipt,
  FileBarChart,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

type NavItem = { label: string; href: string; icon: React.ElementType };

const ownerNav: NavItem[] = [
  { label: "Visão geral", href: "/dashboard", icon: LayoutDashboard },
  { label: "Agenda", href: "/dashboard/agenda", icon: CalendarDays },
  { label: "Agendamentos", href: "/dashboard/agendamentos", icon: LayoutGrid },
  { label: "Profissionais", href: "/dashboard/profissionais", icon: UserCog },
  { label: "Serviços", href: "/dashboard/servicos", icon: Sparkles },
  { label: "Clientes", href: "/dashboard/clientes", icon: Users },
  { label: "Financeiro", href: "/dashboard/financeiro", icon: Wallet },
  { label: "Avaliações", href: "/dashboard/avaliacoes", icon: Star },
  { label: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
];

const adminNav: NavItem[] = [
  { label: "Visão geral", href: "/admin", icon: LayoutDashboard },
  { label: "Empresas", href: "/admin/empresas", icon: Building2 },
  { label: "Planos", href: "/admin/planos", icon: CreditCard },
  { label: "Assinaturas", href: "/admin/assinaturas", icon: Receipt },
  { label: "Cobranças", href: "/admin/cobrancas", icon: Wallet },
  { label: "Carteira Asaas", href: "/admin/asaas", icon: WalletCards },
  { label: "Relatórios", href: "/admin/relatorios", icon: FileBarChart },
  { label: "Configurações", href: "/admin/configuracoes", icon: Settings },
];

const clientNav: NavItem[] = [
  { label: "Início", href: "/cliente", icon: LayoutDashboard },
  { label: "Agendar", href: "/cliente/agendar", icon: CalendarDays },
  { label: "Meus agendamentos", href: "/cliente/agendamentos", icon: LayoutGrid },
  { label: "Avaliações", href: "/cliente/avaliacoes", icon: Star },
  { label: "Meu perfil", href: "/cliente/perfil", icon: Settings },
];

export function AppShell({
  children,
  variant,
  userName,
  userEmail,
  companyName,
  unreadCount = 0,
}: {
  children: React.ReactNode;
  variant: "owner" | "admin" | "client";
  userName: string;
  userEmail: string;
  companyName?: string;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  const nav = variant === "admin" ? adminNav : variant === "client" ? clientNav : ownerNav;
  const home = variant === "admin" ? "/admin" : variant === "client" ? "/cliente" : "/dashboard";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast("Você saiu da sua conta.");
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-white/[0.06] bg-ink-900 transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-[72px] items-center justify-between border-b border-white/[0.06] px-5">
          <Logo href={home} />
          <button className="text-rose-100/45 lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>

        {companyName && variant === "owner" && (
          <div className="mx-4 mt-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-rose-400">Salão</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-white">{companyName}</p>
          </div>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {nav.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== home && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-rose-500/12 text-rose-300 ring-1 ring-inset ring-rose-500/20"
                    : "text-rose-100/60 hover:bg-white/[0.04] hover:text-white"
                )}
              >
                <Icon className={cn("h-[18px] w-[18px]", active && "text-rose-400")} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.06] p-3">
          <div className="relative">
            <button
              onClick={() => setUserMenu(!userMenu)}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-white/[0.04]"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-400 to-rose-700 text-sm font-bold text-white">
                {userName.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-white">{userName}</span>
                <span className="block truncate text-[11px] text-rose-100/45">{userEmail}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-rose-100/45" />
            </button>
            {userMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-white/10 bg-ink-800 p-1 shadow-2xl">
                <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10">
                  <LogOut className="h-4 w-4" /> Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-4 border-b border-white/[0.06] bg-ink-950/85 px-5 backdrop-blur-xl sm:px-8">
          <button className="text-rose-100 lg:hidden" onClick={() => setOpen(true)}><Menu className="h-6 w-6" /></button>
          <div className="flex-1" />
          {variant !== "client" && (
            <Link href={variant === "admin" ? "/admin/configuracoes" : "/dashboard/notificacoes"} className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/[0.07] text-rose-100/60 hover:text-white">
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}
          <span className="hidden items-center gap-2 rounded-xl border border-champagne-500/20 bg-champagne-500/[0.07] px-3 py-2 text-xs text-champagne-300 sm:flex">
            <ShieldCheck className="h-3.5 w-3.5" /> Ambiente seguro
          </span>
        </header>

        <main className="mx-auto max-w-[1500px] p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
