CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'BARBER');

ALTER TABLE "User"
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'BARBER';

UPDATE "User"
SET "role" = 'ADMIN'
WHERE "id" = (SELECT "id" FROM "User" ORDER BY "id" ASC LIMIT 1);

DO $$
DECLARE
  duplicate_group RECORD;
  booked_count INTEGER;
BEGIN
  FOR duplicate_group IN
    SELECT "barberId", "date", "time"
    FROM "Schedule"
    GROUP BY "barberId", "date", "time"
    HAVING COUNT(*) > 1
  LOOP
    SELECT COUNT(*)
      INTO booked_count
    FROM "Schedule" s
    WHERE s."barberId" = duplicate_group."barberId"
      AND s."date" = duplicate_group."date"
      AND s."time" = duplicate_group."time"
      AND EXISTS (
        SELECT 1 FROM "Appointment" a WHERE a."scheduleId" = s."id"
      );

    IF booked_count > 1 THEN
      RAISE EXCEPTION
        'Existem múltiplos agendamentos no mesmo horário (% / % / %). Resolva os dados antes da migração.',
        duplicate_group."barberId", duplicate_group."date", duplicate_group."time";
    END IF;
  END LOOP;
END $$;

DELETE FROM "Schedule" s
WHERE NOT EXISTS (
  SELECT 1 FROM "Appointment" a WHERE a."scheduleId" = s."id"
)
AND EXISTS (
  SELECT 1
  FROM "Schedule" older
  WHERE older."barberId" = s."barberId"
    AND older."date" = s."date"
    AND older."time" = s."time"
    AND older."id" < s."id"
);


CREATE UNIQUE INDEX "Schedule_barberId_date_time_key"
ON "Schedule"("barberId", "date", "time");
