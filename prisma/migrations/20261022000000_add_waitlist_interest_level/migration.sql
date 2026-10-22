-- Optional "Interested in" level on the classes waitlist. Nullable, no default:
-- existing rows keep NULL and nothing that reads the table changes.
ALTER TABLE "ClassWaitlist" ADD COLUMN "interestLevel" TEXT;
