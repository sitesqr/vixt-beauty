import Link from "next/link";
import { ShieldCheck, Users } from "lucide-react";
import { Logo, LogoImage } from "@/components/brand/logo";

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12 lg:px-16">
        <Logo />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
          <p className="mt-2 text-sm text-rose-100/60">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
        <p className="text-center text-xs text-rose-100/40">
          © {new Date().getFullYear()} VIXT Beauty ·{" "}
          <Link href="/" className="hover:text-rose-100/60">Voltar ao início</Link>
        </p>
      </div>

      <div className="relative hidden overflow-hidden border-l border-white/[0.06] bg-ink-900 lg:flex lg:items-center lg:justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_30%,rgba(238,121,152,.22),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="relative max-w-md px-10">
          <div className="mb-8 h-28 w-52">
            <LogoImage priority />
          </div>
          <h2 className="text-3xl font-bold leading-tight text-white">
            Seu negócio, <br />
            <span className="text-rose-400">sempre sob controle.</span>
          </h2>
          <p className="mt-4 text-rose-100/60">
            Junte-se a salões que já transformaram sua rotina com a VIXT Beauty.
          </p>
          <div className="mt-10 space-y-5">
            {[
              { icon: ShieldCheck, title: "Dados protegidos", desc: "Arquitetura multiempresa com isolamento total entre salões." },
              { icon: Users, title: "Feito para você", desc: "Computador, tablet ou celular — a mesma experiência em qualquer tela." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-rose-400">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-sm text-rose-100/45">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
