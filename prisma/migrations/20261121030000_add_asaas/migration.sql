CREATE TABLE "asaas_customers" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "wallet_id" TEXT,
    "email" TEXT,
    "cpf_cnpj" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asaas_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asaas_events" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payment_id" TEXT,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asaas_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asaas_config" (
    "id" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'sandbox',
    "api_key" TEXT NOT NULL,
    "wallet_id" TEXT,
    "webhook_token" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asaas_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asaas_customers_company_id_key" ON "asaas_customers"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "asaas_customers_customer_id_key" ON "asaas_customers"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "asaas_events_event_id_key" ON "asaas_events"("event_id");

-- CreateIndex
CREATE INDEX "asaas_events_event_type_idx" ON "asaas_events"("event_type");

-- AddForeignKey
ALTER TABLE "asaas_customers" ADD CONSTRAINT "asaas_customers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

