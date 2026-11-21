import "server-only";
import { digitsOnly } from "./utils";

/**
 * Integração com a Evolution API (https://evolution-api.com) para envio de
 * mensagens de texto via WhatsApp. As credenciais vêm de variáveis de ambiente:
 *
 *  EVOLUTION_API_URL   — ex.: https://evolution.seudominio.com
 *  EVOLUTION_API_KEY   — chave global da API (header apikey)
 *  EVOLUTION_INSTANCE  — nome da instância conectada
 *
 * Quando EVOLUTION_API_URL não está definida, o modo "dry-run" é ativado: a
 * mensagem apenas é registrada no log do servidor. Útil para desenvolvimento.
 */

export type WhatsAppConfig = {
  apiUrl: string;
  apiKey: string;
  instance: string;
  configured: boolean;
};

export function getWhatsAppConfig(): WhatsAppConfig {
  const apiUrl = (process.env.EVOLUTION_API_URL || "").replace(/\/+$/, "");
  const apiKey = process.env.EVOLUTION_API_KEY || "";
  const instance = process.env.EVOLUTION_INSTANCE || "";
  return {
    apiUrl,
    apiKey,
    instance,
    configured: Boolean(apiUrl && apiKey && instance),
  };
}

export class WhatsAppError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status = 500, details?: unknown) {
    super(message);
    this.name = "WhatsAppError";
    this.status = status;
    this.details = details;
  }
}

/** Normaliza um telefone brasileiro para o formato E.164 usado pela Evolution (55DDDNUMERO). */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let d = digitsOnly(phone);
  // Remove o "0" de DDD nacional e o código do país se já estiver presente.
  if (d.startsWith("550")) d = `55${d.slice(3)}`;
  else if (d.startsWith("0")) d = d.slice(1);
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  if (!/^55\d{10,11}$/.test(d)) return null;
  return d;
}

export type SendTextResult = {
  sent: boolean;
  dryRun: boolean;
  messageId?: string;
};

/**
 * Envia uma mensagem de texto. Retorna sent:false em modo dry-run (sem credenciais).
 * Lança WhatsAppError em caso de falha na API.
 */
export async function sendWhatsAppText(
  phone: string | null | undefined,
  text: string,
  opts?: { instance?: string }
): Promise<SendTextResult> {
  const number = toWhatsAppNumber(phone);
  if (!number) throw new WhatsAppError("Telefone do cliente inválido para WhatsApp", 400);

  const cfg = getWhatsAppConfig();
  if (!cfg.configured) {
    console.warn(`[whatsapp:dry-run] Para ${number}: ${text}`);
    return { sent: false, dryRun: true };
  }

  const instance = opts?.instance || cfg.instance;
  const res = await fetch(`${cfg.apiUrl}/message/sendText/${encodeURIComponent(instance)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: cfg.apiKey,
    },
    body: JSON.stringify({
      number,
      text,
      options: { delay: 1000, presence: "composing" },
    }),
    cache: "no-store",
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json?.response?.message || json?.message || `Erro Evolution API (${res.status})`;
    throw new WhatsAppError(message, res.status, json);
  }

  const messageId = json?.key?.id || json?.id || undefined;
  return { sent: true, dryRun: false, messageId };
}
