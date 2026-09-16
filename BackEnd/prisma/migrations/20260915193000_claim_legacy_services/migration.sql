-- Corrige serviços legados que ainda não tinham barbeiro associado.
-- Só atribui registros órfãos ao barbeiro inicial Brunão; não remove dados.
UPDATE "Service" AS s
SET "barberId" = b."id"
FROM "Barber" AS b
WHERE b."slug" = 'brunao'
  AND s."barberId" IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "Service" AS owned
    WHERE owned."barberId" = b."id"
      AND LOWER(TRIM(owned."name")) = LOWER(TRIM(s."name"))
  );
