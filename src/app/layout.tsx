import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "VIXT Beauty — Gestão para salões",
    template: "%s | VIXT Beauty",
  },
  description:
    "Plataforma completa de gestão para salões e salões de beleza femininos. Agenda, clientes, serviços, comissões e finanças em um só lugar.",
  keywords: ["salão", "agendamento", "gestão", "salão de beleza feminino", "vixt beauty"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans antialiased"><ToastProvider>{children}</ToastProvider></body>
    </html>
  );
}
