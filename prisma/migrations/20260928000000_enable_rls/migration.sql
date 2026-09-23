-- Enable Row Level Security on every table in the public schema.
--
-- Prisma connects as the table owner, and table owners bypass RLS by
-- default (RLS is not FORCE'd here), so the application's own queries are
-- unaffected. This closes off direct table access to any other Postgres
-- role that is not the owner and has no explicit policy granted.
--
-- Hand-written: RLS is not part of Prisma's schema model, so there is
-- nothing for `prisma migrate diff` to generate here.

ALTER TABLE "public"."Tournament" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Registration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Player" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Round" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Pairing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ClassProgram" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ClassEnrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ContactMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."AdminActivityLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ClassWaitlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
