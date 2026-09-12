-- O barbeiro passa a cadastrar somente horários (ex.: 09:00, 09:30, 10:00).
-- A data é escolhida pelo cliente no momento do agendamento.
CREATE TABLE "ScheduleTemplate" (
    "id" SERIAL NOT NULL,
    "time" TEXT NOT NULL,
    "barberId" INTEGER NOT NULL,
    CONSTRAINT "ScheduleTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ScheduleTemplate_barberId_time_key" ON "ScheduleTemplate"("barberId", "time");
CREATE INDEX "ScheduleTemplate_barberId_idx" ON "ScheduleTemplate"("barberId");

ALTER TABLE "Schedule" ADD COLUMN "templateId" INTEGER;
CREATE INDEX "Schedule_templateId_idx" ON "Schedule"("templateId");
CREATE INDEX "Schedule_barberId_date_idx" ON "Schedule"("barberId", "date");

ALTER TABLE "ScheduleTemplate"
  ADD CONSTRAINT "ScheduleTemplate_barberId_fkey"
  FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Schedule"
  ADD CONSTRAINT "Schedule_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "ScheduleTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
