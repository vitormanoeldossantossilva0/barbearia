-- Add barber ownership to existing users without forcing existing rows to have an account.
ALTER TABLE "User" ADD COLUMN "barberId" INTEGER;
CREATE UNIQUE INDEX "User_barberId_key" ON "User"("barberId");

-- Add per-barber service price/ownership.
ALTER TABLE "Service" ADD COLUMN "price" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Service" ADD COLUMN "barberId" INTEGER;
CREATE INDEX "Service_barberId_idx" ON "Service"("barberId");

-- Existing services may be global/unassigned. New services are owned by a barber.
ALTER TABLE "AppointmentService" ADD COLUMN "price" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "User"
  ADD CONSTRAINT "User_barberId_fkey"
  FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Service"
  ADD CONSTRAINT "Service_barberId_fkey"
  FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Service_barberId_name_key" ON "Service"("barberId", "name");
