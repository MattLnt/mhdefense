-- This is an empty migration.-- Anti-double-booking : un seul créneau "actif" par startsAt.
-- Index UNIQUE partiel (impossible en Prisma pur). Les statuts
-- non-occupants (CANCELLED, NO_SHOW) libèrent le slot.

CREATE UNIQUE INDEX "Booking_active_slot_unique"
ON "Booking" ("startsAt")
WHERE "status" IN ('HELD', 'CONFIRMED', 'COMPLETED');