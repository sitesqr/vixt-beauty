CREATE TYPE "auth_provider" AS ENUM ('CREDENTIALS', 'GOOGLE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "auth_provider" "auth_provider" NOT NULL DEFAULT 'CREDENTIALS',
ADD COLUMN     "google_id" TEXT,
ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

