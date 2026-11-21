import "server-only";
import { prisma } from "./prisma";

/** Cliente da API Asaas v3. A chave e o ambiente vêm do banco (AsaasConfig) ou env. */
export type AsaasEnv = "sandbox" | "production";

export async function getAsaasConfig() {
  const cfg = await prisma.asaasConfig.findFirst({ where: { active: true } });
  const apiKey = cfg?.apiKey || process.env.ASAAS_API_KEY || "";
  const environment = (cfg?.environment || process.env.ASAAS_ENVIRONMENT || "sandbox") as AsaasEnv;
  const walletId = cfg?.walletId || process.env.ASAAS_WALLET_ID || null;
  const webhookToken = cfg?.webhookToken || process.env.ASAAS_WEBHOOK_TOKEN || null;
  const baseUrl =
    environment === "production"
      ? "https://api.asaas.com/v3"
      : "https://sandbox.asaas.com/api/v3";
  return { apiKey, environment, walletId, webhookToken, baseUrl, configured: Boolean(apiKey) };
}

export class AsaasError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status = 500, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  overrideKey?: string
): Promise<T> {
  const cfg = await getAsaasConfig();
  const key = overrideKey || cfg.apiKey;
  if (!key) throw new AsaasError("Asaas não configurado", 503);

  const res = await fetch(`${cfg.baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      access_token: key,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json?.errors?.[0]?.description || json?.message || `Erro Asaas (${res.status})`;
    throw new AsaasError(message, res.status, json);
  }
  return json as T;
}

export type AsaasCustomer = {
  id: string;
  name: string;
  email?: string;
  cpfCnpj?: string;
};

/** Cria (ou reaproveita) um cliente Asaas para a empresa. */
export async function ensureCustomer(company: {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpfCnpj?: string | null;
}): Promise<AsaasCustomer> {
  const existing = await prisma.asaasCustomer.findUnique({ where: { companyId: company.id } });
  if (existing) return { id: existing.customerId, name: company.name, email: existing.email || undefined };

  const cfg = await getAsaasConfig();
  const payload: Record<string, string> = {
    name: company.name,
    email: company.email || `contato+${company.id}@vixtbeauty.com`,
  };
  if (company.cpfCnpj) payload.cpfCnpj = company.cpfCnpj;
  if (company.phone) payload.mobilePhone = company.phone.replace(/\D/g, "");
  if (cfg.walletId) payload.walletId = cfg.walletId;

  const created = await request<AsaasCustomer>("POST", "/customers", payload);

  await prisma.asaasCustomer.create({
    data: {
      companyId: company.id,
      customerId: created.id,
      walletId: cfg.walletId,
      email: payload.email,
      cpfCnpj: payload.cpfCnpj || null,
    },
  });
  return created;
}

export type AsaasPayment = {
  id: string;
  status: string;
  value: number;
  netValue?: number;
  billingType: string;
  dueDate: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  customer?: string;
};

/** Cria uma cobrança (PIX + boleto) no Asaas para uma fatura. */
export async function createCharge(params: {
  customerId: string;
  valueCents: number;
  dueDate: Date;
  description: string;
  externalReference: string;
  walletId?: string | null;
}): Promise<AsaasPayment> {
  const cfg = await getAsaasConfig();
  const payload: Record<string, unknown> = {
    customer: params.customerId,
    billingType: "PIX",
    value: params.valueCents / 100,
    dueDate: params.dueDate.toISOString().slice(0, 10),
    description: params.description.slice(0, 120),
    externalReference: params.externalReference,
  };
  if (params.walletId || cfg.walletId) payload.walletId = params.walletId || cfg.walletId;

  return request<AsaasPayment>("POST", "/payments", payload);
}

/** Busca uma cobrança pelo ID do Asaas. */
export async function getPayment(paymentId: string): Promise<AsaasPayment> {
  return request<AsaasPayment>("GET", `/payments/${paymentId}`);
}

/** Consulta o saldo da carteira (conta) no Asaas. */
export async function getWalletBalance(): Promise<{ balance: number }> {
  const res = await request<{ balance?: number }>("GET", "/finance/balance");
  return { balance: res.balance ?? 0 };
}

/** Configura o webhook de pagamentos no Asaas. */
export async function configureWebhook(webhookUrl: string, authToken?: string | null) {
  const payload: Record<string, unknown> = {
    name: "VIXT Beauty - Assinaturas",
    url: webhookUrl,
    email: process.env.ASAAS_WEBHOOK_EMAIL || "admin@vixtbeauty.com",
    enabled: true,
    interrupted: false,
    apiVersion: 3,
    sendType: "SEQUENTIALLY",
    events: ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_OVERDUE"],
  };
  if (authToken) payload.authToken = authToken;
  return request<unknown>("POST", "/webhooks", payload);
}

/** Lista cobranças da carteira (para conciliação). */
export async function listPayments(limit = 50) {
  return request<{ data: AsaasPayment[] }>("GET", `/payments?limit=${limit}`);
}

/** ID do evento do webhook a partir do payload (suporta vários formatos). */
export function extractEventId(payload: Record<string, any>): string | null {
  return payload?.id || payload?.eventId || payload?.data?.id || null;
}
