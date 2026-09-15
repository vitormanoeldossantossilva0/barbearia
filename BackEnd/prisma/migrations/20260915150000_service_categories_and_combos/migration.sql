-- Organiza serviços por categoria e permite combos compostos por serviços do próprio barbeiro.
CREATE TYPE "ServiceCategory" AS ENUM ('CORTE', 'BARBA', 'SOBRANCELHA', 'PINTURA', 'COMBO');

ALTER TABLE "Service"
  ADD COLUMN "category" "ServiceCategory" NOT NULL DEFAULT 'CORTE';

-- Mantém os serviços existentes, classificando os nomes já usados pelo MVP.
UPDATE "Service" SET "category" = 'BARBA' WHERE LOWER(TRIM("name")) = 'barba';
UPDATE "Service" SET "category" = 'SOBRANCELHA' WHERE LOWER(TRIM("name")) = 'sobrancelha';
UPDATE "Service" SET "category" = 'PINTURA' WHERE LOWER(TRIM("name")) = 'pintura';

CREATE INDEX "Service_barberId_category_idx" ON "Service"("barberId", "category");

CREATE TABLE "ServiceComboItem" (
    "comboId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,

    CONSTRAINT "ServiceComboItem_pkey" PRIMARY KEY ("comboId", "serviceId")
);

CREATE INDEX "ServiceComboItem_serviceId_idx" ON "ServiceComboItem"("serviceId");

ALTER TABLE "ServiceComboItem"
  ADD CONSTRAINT "ServiceComboItem_comboId_fkey"
  FOREIGN KEY ("comboId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceComboItem"
  ADD CONSTRAINT "ServiceComboItem_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
