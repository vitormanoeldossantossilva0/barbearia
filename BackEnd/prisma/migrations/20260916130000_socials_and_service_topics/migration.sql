-- Redes sociais públicas da barbearia e de cada barbeiro.
ALTER TABLE "Barbershop"
  ADD COLUMN "instagram" TEXT,
  ADD COLUMN "facebook" TEXT,
  ADD COLUMN "tiktok" TEXT;

ALTER TABLE "Barber"
  ADD COLUMN "instagram" TEXT,
  ADD COLUMN "facebook" TEXT,
  ADD COLUMN "tiktok" TEXT;

-- Tópicos configuráveis pela administração. Os serviços continuam pertencendo
-- a cada barbeiro, mas podem ser agrupados em tópicos da respectiva barbearia.
CREATE TABLE "ServiceTopic" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "barbershopId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceTopic_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceTopic_barbershopId_name_key" ON "ServiceTopic"("barbershopId", "name");
CREATE INDEX "ServiceTopic_barbershopId_idx" ON "ServiceTopic"("barbershopId");

ALTER TABLE "Service"
  ADD COLUMN "topicId" INTEGER;

CREATE INDEX "Service_topicId_idx" ON "Service"("topicId");

ALTER TABLE "ServiceTopic"
  ADD CONSTRAINT "ServiceTopic_barbershopId_fkey"
  FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Service"
  ADD CONSTRAINT "Service_topicId_fkey"
  FOREIGN KEY ("topicId") REFERENCES "ServiceTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Cria tópicos iniciais para todas as barbearias existentes e organiza os
-- serviços atuais sem apagar ou recriar os dados já cadastrados.
INSERT INTO "ServiceTopic" ("name", "description", "barbershopId")
SELECT 'Cortes', 'Cabelo, degradê, social e outros estilos.', id FROM "Barbershop"
UNION ALL
SELECT 'Barba', 'Serviços de barba e acabamento.', id FROM "Barbershop"
UNION ALL
SELECT 'Sobrancelha', 'Cuidados e acabamento de sobrancelhas.', id FROM "Barbershop"
UNION ALL
SELECT 'Pinturas', 'Pintura, platinado, luzes e outras técnicas.', id FROM "Barbershop";

UPDATE "Service" s
SET "topicId" = t.id
FROM "Barber" b
JOIN "ServiceTopic" t ON t."barbershopId" = b."barbershopId"
WHERE s."barberId" = b.id
  AND (
    (s."category" = 'CORTE' AND t."name" = 'Cortes') OR
    (s."category" = 'BARBA' AND t."name" = 'Barba') OR
    (s."category" = 'SOBRANCELHA' AND t."name" = 'Sobrancelha') OR
    (s."category" = 'PINTURA' AND t."name" = 'Pinturas')
  );
