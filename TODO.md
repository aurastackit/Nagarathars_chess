# Parked items

Things that are built but waiting on access, credentials or a decision. Tick
them off here as they're done.

## Access and credentials

- [ ] **CRON_SECRET doesn't reach the app.** `POST /api/cron/expire-changes-requests`
      still answers 503 `{"error":"CRON_SECRET is not set"}`. Check the Amplify build
      log for `amplify.yml from repo v3 - CRON_SECRET present - …`:
      - line missing → a build spec saved in the Amplify console overrides
        `amplify.yml` (App settings → Build settings); remove or replace it.
        (This would also mean the SES build check has never run.)
      - `NO` → the variable isn't in the build environment for `master`.
      Then redeploy, confirm the route answers 401 without auth, and run
      **Daily jobs** in GitHub Actions — expect `{"checked":0,"expired":[]}`.
- [ ] **Local `.env` keys.** Save working `S3_*` and `SES_*` values in
      `Nagarathars_chess/.env` (its LastWriteTime must change), then:
  - [ ] SES v2 `GetAccount`: report `ProductionAccessEnabled` and the daily quota.
        If still sandbox, follow the production-access request (players won't get
        email until it's approved).
  - [ ] Delete the 6 test files from the S3 bucket:
    - `registrations/nagarthar-s-chess-championship-mv6su84w/ageProof-fbd20224-4eb0-4cf1-a0f7-c942683ee1a7.jpg`
    - `registrations/nagarthar-s-chess-championship-mv6su84w/passportPhoto-598409a1-6352-405b-ae4f-01eda4c7adf0.jpg`
    - `registrations/nagarthar-s-chess-championship-mv6su84w/ageProof-2c85f0b7-377c-401e-81fe-64efdba8be0c.jpg`
    - `registrations/nagarthar-s-chess-championship-mv6su84w/passportPhoto-46761ef1-9427-4021-92de-6a0f03f9fcbf.jpg`
    - `registrations/nagarthar-s-chess-championship-mv6su84w/passportPhoto-444b9139-00e9-4aa3-ac57-77daf35af10e.png`
    - `registrations/nagarthar-s-chess-championship-mv6su84w/passportPhoto-fefa352f-d2ab-47e6-93d3-455ebfe3a15b.png`
- [ ] **Test emails.** Confirm whether the sign-in code and waitlist confirmation
      sent to muthu.min98@gmail.com arrived (inbox or spam).

## Database move to Mumbai

- [ ] Amplify region (from the console URL) — the expected gain assumes `ap-south-1`.
- [ ] Supabase: confirm the organization has a free active-project slot.
- [ ] Follow `scripts/db-move/README.md`. Nothing touches the live database until
      "start migration".

## Live tests skipped (need CRON_SECRET or local SES keys)

- [ ] Daily expiry job on live (needs CRON_SECRET).
- [ ] Real email delivery of the changes-requested and "Fix by" emails.
- [ ] Poster upload end to end (needs working local S3 keys; the bucket's CORS
      also only allows the production origin, so test from the live admin).

## Follow-ups

- [ ] Migration: make `Registration.registrationNo` NOT NULL once every row has a
      number (number any rows created before the Step 1 deploy first).
- [ ] Home page takes ~2.75 s on live (others ~1.45 s): some helper reads the
      database in sequence; moot after the Mumbai move, otherwise parallelise.
- [ ] Home page layout shift 0.061 (the footer moves when a section above it loads).
- [ ] Oversized age proof (> 1 MB) gets "Invalid upload request" instead of
      "…must be under 1 MB" (planned for Step 4).
