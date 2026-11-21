"use client";

import { useEffect } from "react";

/** Registra o service worker da PWA (apenas em produção). */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          // Se houver uma nova versão esperando, ativa-a imediatamente.
          registration.addEventListener("updatefound", () => {
            const sw = registration.installing;
            if (!sw) return;
            sw.addEventListener("statechange", () => {
              if (sw.state === "installed" && navigator.serviceWorker.controller) {
                sw.postMessage({ type: "SKIP_WAITING" });
              }
            });
          });
        })
        .catch((err) => console.warn("[PWA] Falha ao registrar service worker:", err));
    };

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
