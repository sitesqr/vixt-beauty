import Link from "next/link";
import { LogoImage } from "@/components/brand/logo";

export const metadata = { title: "Sem conexão" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#10090C] px-6 text-center">
      <div className="h-20 w-28"><LogoImage priority /></div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">Você está sem conexão</h1>
        <p className="mx-auto max-w-md text-sm text-rose-100/55">
          Não foi possível carregar esta página. Verifique sua internet e tente novamente.
          Seus agendamentos salvos continuam disponíveis quando você voltar a ficar online.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-rose-400"
      >
        Tentar novamente
      </Link>
    </main>
  );
}
