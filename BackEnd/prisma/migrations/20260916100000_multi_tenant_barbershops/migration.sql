ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MASTER';

CREATE TABLE "Barbershop" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "whatsapp" TEXT,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Barbershop_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Barbershop_slug_key" ON "Barbershop"("slug");

INSERT INTO "Barbershop" ("name", "slug", "description")
VALUES ('Barbearia do Brunão', 'brunao', 'Seu estilo começa aqui.')
ON CONFLICT ("slug") DO NOTHING;

ALTER TABLE "Barber" ADD COLUMN "barbershopId" INTEGER;
ALTER TABLE "Barber" ADD COLUMN "imageUrl" TEXT;

UPDATE "Barber"
SET "barbershopId" = (SELECT "id" FROM "Barbershop" WHERE "slug" = 'brunao')
WHERE "barbershopId" IS NULL;

ALTER TABLE "Barber" ALTER COLUMN "barbershopId" SET NOT NULL;
CREATE INDEX "Barber_barbershopId_idx" ON "Barber"("barbershopId");
ALTER TABLE "Barber" ADD CONSTRAINT "Barber_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
