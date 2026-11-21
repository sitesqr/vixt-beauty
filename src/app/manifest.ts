import type { MetadataRoute } from "next";

/** Web App Manifest — torna o VIXT Beauty instalável na tela inicial do celular. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "VIXT Beauty — Gestão para salões",
    short_name: "VIXT Beauty",
    description:
      "Agenda, clientes, serviços e finanças para salões de beleza femininos em um só lugar.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#10090C",
    theme_color: "#10090C",
    lang: "pt-BR",
    categories: ["business", "lifestyle", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Minha agenda",
        short_name: "Agenda",
        description: "Ver agendamentos do dia",
        url: "/dashboard/agenda",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Agendar horário",
        short_name: "Agendar",
        description: "Novo agendamento",
        url: "/cliente/agendar",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
