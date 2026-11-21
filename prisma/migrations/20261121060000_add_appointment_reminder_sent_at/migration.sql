-- Controle de idempotência para o lembrete automático de WhatsApp (10 min antes).
ALTER TABLE "appointments" ADD COLUMN "reminder_sent_at" TIMESTAMP(3);
