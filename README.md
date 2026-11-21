# VIXT Beauty

Plataforma SaaS multiempresas para gestão de **salões de beleza femininos**.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Prisma 7 · PostgreSQL · Tailwind CSS · Recharts · jose (JWT) · bcrypt · Zod.

---

## 1. Visão geral

O VIXT Beauty é um produto comercial independente, inspirado na arquitetura do VIXT Barber (referência técnica), porém pensado desde o início para a realidade de salões femininos: cabelo, coloração, unhas, sobrancelhas, maquiagem, estética e procedimentos.

### Modelo comercial
- **Proprietárias** pagam assinatura mensal (planos Starter / Profissional / Empresarial) com 14 dias de teste.
- **Clientes finais** têm cadastro **100% gratuito**. Uma conta global serve para agendar em qualquer salão parceiro.
- O financeiro da plataforma (faturas/pagamentos das proprietárias) é **separado** do financeiro do salão (receitas, comissões e despesas).

### Ambientes
| Ambiente | Rota | Descrição |
|---|---|---|
| Super Admin | `/admin` | Controle total da plataforma |
| Proprietária | `/dashboard` | Gestão do salão |
| Cliente | `/cliente` | Agendamentos e avaliações |
| Página pública | `/b/{slug}` | Vitrine de cada salão |

### Identidade visual
Preto sofisticado, rosé gold, nude, champagne, branco e tons suaves de rosa. Logotipo em `public/images/vixt-beauty-logo-opt.png` (versão otimizada) e favicon/ícones PWA em `public/icons/`.

---

## 2. Rodando localmente

### Pré-requisitos
- Node.js 20.9+ (testado com 22)
- PostgreSQL 14+

### Passos
```bash
npm install
cp .env.example .env   # edite DATABASE_URL e JWT_SECRET
npx prisma migrate deploy
npm run db:seed
npm run dev            # http://localhost:3001
```

### Credenciais de demonstração (seed)
| Perfil | E-mail | Senha |
|---|---|---|
| Super Admin | `admin@vixtbeauty.com` | `Admin@123` |
| Proprietária | `demo@vixtbeauty.com` | `Demo@123` |
| Cliente | `cliente@vixtbeauty.com` | `Cliente@123` |

Salão demo: `/b/belle-essence`

---

## 3. Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão PostgreSQL |
| `JWT_SECRET` | Segredo para assinar tokens — `openssl rand -base64 64` |
| `NEXT_PUBLIC_APP_URL` | URL base da aplicação |
| `NODE_ENV` | `development` ou `production` |
| `GOOGLE_CLIENT_ID` | Client ID OAuth do Google (verificação do ID token no servidor) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | O mesmo Client ID, usado pelo botão no navegador |
| `ASAAS_API_KEY` | API key da sua conta Asaas (também configurável em `/admin/asaas`) |
| `ASAAS_ENVIRONMENT` | `sandbox` ou `production` |
| `ASAAS_WALLET_ID` | ID da carteira Asaas (opcional) |
| `ASAAS_WEBHOOK_TOKEN` | Token de segurança do webhook (opcional, recomendado) |
| `EVOLUTION_API_URL` | URL base da Evolution API (ex.: `https://evolution.seudominio.com`) |
| `EVOLUTION_API_KEY` | Chave global da Evolution API (header `apikey`) |
| `EVOLUTION_INSTANCE` | Nome da instância WhatsApp conectada na Evolution |
| `CRON_SECRET` | Segredo que protege o endpoint de lembretes (`Authorization: Bearer <CRON_SECRET>`) |

### Lembrete automático de WhatsApp (10 minutos antes)
O sistema avisa a cliente automaticamente quando está chegando a sua vez no salão.

Fluxo:
1. Configure a Evolution API (`EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`) e o `CRON_SECRET` no `.env`/painel do Render.
2. Crie um **Cron Job** no Render (ou qualquer agendador externo) que chame `GET https://seu-dominio/api/cron/appointment-reminders` **a cada 1 minuto**, com o header `Authorization: Bearer <CRON_SECRET>`.
3. O job consulta agendamentos ativos que iniciam entre 7 e 10 minutos à frente, envia a mensagem via Evolution API e registra uma notificação interna (`APPOINTMENT_REMINDER`) para a cliente.
4. O campo `reminder_sent_at` do agendamento garante idempotência: cada agendamento recebe no máximo um lembrete. Se a API falhar, o campo é liberado para nova tentativa; se o horário for remarcado, o lembrete é reagendado.

> Sem as variáveis da Evolution configuradas, o envio roda em **modo dry-run**: a mensagem apenas aparece no log do servidor (`[whatsapp:dry-run]`), sem enviar de fato. Útil para desenvolver/testar sem credenciais.

### Carteira Asaas (pagamentos das assinaturas)
O painel **SUPER ADMIN → Carteira Asaas** (`/admin/asaas`) permite configurar API key, ambiente e carteira, visualizar saldo e cobranças, e registrar o webhook no Asaas.

Fluxo:
1. Configure a API key em `/admin/asaas` (salva criptografada no banco) ou via `.env`.
2. Clique em **Configurar webhook no Asaas** — registra `https://seu-dominio/api/asaas/webhook`.
3. Em **Cobranças**, use **Cobrar no Asaas** para gerar um PIX de uma fatura pendente.
4. Quando o pagamento é confirmado, o webhook marca a fatura como paga e reativa a assinatura automaticamente (idempotente por `eventId`).

### Pagamento pelo painel da proprietária
A proprietária vê um banner de arranque no dashboard quando a assinatura está em teste ou pendente, com o botão **Pagar assinatura** que leva a `/dashboard/assinatura`. Lá ela pode:
- **Gerar PIX** — QR Code e código copia-e-cola gerados no Asaas.
- **Pagar com cartão de crédito** — checkout hospedado seguro do Asaas.

Após o pagamento, o webhook ativa a assinatura automaticamente.

### Login com Google (opcional, apenas clientes)
1. No [Google Cloud Console](https://console.cloud.google.com/apis/credentials), crie uma credencial do tipo **ID do cliente OAuth**.
2. Em **Origens JavaScript autorizadas**, adicione `http://localhost:3001` (dev) e o domínio de produção (ex.: `https://vixt-beauty.onrender.com`).
3. Em **URIs de redirecionamento autorizados**, adicione também:
   - `https://vixt-beauty.onrender.com/auth/google/callback`
4. Copie o Client ID para as duas variáveis acima.
5. O botão aparece no login e no cadastro de cliente. Contas novas são criadas sem senha; contas já existentes com o mesmo e-mail são vinculadas automaticamente. Proprietárias e SUPER ADMIN continuam usando e-mail e senha.

> O fluxo usa OAuth com `response_type=id_token` e verificação do token no servidor via `google-auth-library` — não é necessário Client Secret.

---

## 4. Estrutura do projeto

```
prisma/
  schema.prisma        # modelo de dados (multiempresa, planos, agendamentos...)
  migrations/          # migrações SQL versionadas
  seed.ts              # planos + salão demo com serviços femininos
src/
  app/
    api/               # route handlers REST
    admin/             # painel do super admin
    dashboard/         # painel da proprietária
    cliente/           # área da cliente
    b/[slug]/          # página pública do salão
    manifest.ts        # Web App Manifest (PWA)
    offline/           # página de fallback sem conexão
  components/
    auth/ layout/ dashboard/ booking/ public/ client/ admin/ brand/ ui/
    pwa-register.tsx   # registro do service worker
  lib/
    prisma.ts auth.ts scheduling.ts validations.ts utils.ts api.ts
    whatsapp.ts        # integração Evolution API (lembretes)
public/
  images/              # logotipo VIXT Beauty (PNG otimizado)
  icons/               # ícones PWA (192/512/apple)
  sw.js                # service worker
```

---

## 5. PWA (instalável no celular)
O VIXT Beauty é uma **Progressive Web App**: pode ser instalada na tela inicial de Android/iOS e abre em modo standalone, sem barra do navegador.

- `src/app/manifest.ts` — nome, cores, ícones (192/512/maskable) e atalhos ("Minha agenda", "Agendar horário").
- `public/sw.js` — service worker com cache do app shell, estratégia network-first para navegação e cache-first para assets estáticos (JS/CSS/imagens). APIs dinâmicas **nunca** são cacheadas.
- `src/components/pwa-register.tsx` — registra o service worker **apenas em produção** (não interfere no HMR do `next dev`).
- `src/app/offline/page.tsx` — página exibida quando não há conexão.
- Ícones PNG gerados em `public/icons/` a partir do emblema da nova logotipo (recorte central). Ao trocar a logo, regenere os ícones e incremente a versão do cache em `public/sw.js`.

Para testar em produção: `npm run build && npm run start`, abra o site no celular (ou no Chrome DevTools → Application → Manifest) e use a opção **Instalar aplicativo**. O navegador exigirá **HTTPS** (Render já fornece).

> Ao atualizar o service worker, bump a versão das constantes `CACHE`/`RUNTIME` em `public/sw.js` para invalidar os caches antigos.

---

## 6. Decisões técnicas

- **Multi-tenancy por isolamento de dados:** todo endpoint da proprietária obtém `companyId` da sessão (membership), nunca do cliente.
- **Snapshots históricos:** agendamentos guardam nome/preço do serviço e nome da profissional, preservando o histórico.
- **Comissões:** ao concluir um agendamento, uma comissão é criada com a alíquota vigente da profissional.
- **Disponibilidade:** slots de 15 minutos respeitam horários, time-offs e antecedência mínima (timezone `America/Sao_Paulo`).
- **Pagamentos simulados:** planos, assinaturas, faturas e pagamentos são reais no banco com provedor `SIMULATED`, prontos para integração com Stripe/Mercado Pago.
- **Segurança:** bcrypt (custo 12), JWT assinado (jose), hash SHA-256 persistido em `sessions`, cookies httpOnly + sameSite, validação Zod.

---

## 7. Deploy (Render + Neon)

1. Crie um banco no Neon e copie a connection string.
2. Crie um Web Service no Render apontando para este repositório.
3. Configure as variáveis de ambiente.
4. Build: `npm run build` · Start: `npm run start`.

---

## 8. Scripts úteis

```bash
npm run dev          # desenvolvimento
npm run build        # build de produção
npm run start        # produção (aplica migrações no boot)
npm run db:seed      # dados de demonstração
npx prisma migrate dev --name descricao
npx prisma studio
```
