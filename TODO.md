# Parked items

Things that are built but waiting on access, credentials or a decision. Tick
them off here as they're done.

## Must fix before go-live

- [x] **Delete must remove the documents.** The admin Delete removes the photo,
      age proof and cached ID cards with the record (if S3 refuses, it says so and
      /api/admin/storage/cleanup removes them later); the app's IAM user may
      s3:DeleteObject. Step 9 added: replaced documents are deleted, and age proofs
      are deleted 90 days after the tournament (daily job, /admin/privacy). The
      sweep of older leftovers is under Follow-ups.
- [x] **Children under one email share one player profile** (found in Step 10, 23 Oct).
      Fixed in two migration steps (24 Oct): a player is now email + name + year of
      birth, so each child has their own profile, public page and place in pairings.
- [ ] **Unknown pages must return HTTP 404.** Not-found pages answer 200 (they show
      "Page not found" with noindex) because the root `loading.tsx` starts
      streaming before `notFound()` runs — public pages like
      `/tournaments/<bad-slug>` are soft 404s for search engines.

## Access and credentials

- [ ] **ORGANISERS_EMAIL doesn't reach the app** (set in Amplify, but the live
      preview page says it isn't — same symptom as CRON_SECRET). It receives
      contact-form messages and registration-error alerts, and is the Reply-To on
      player emails. Check the build log line "amplify.yml from repo v4 -
      CRON_SECRET present - … - ORGANISERS_EMAIL present - …".

- [ ] **CRON_SECRET doesn't reach the app.** `POST /api/cron/expire-changes-requests`
      still answers 503 `{"error":"CRON_SECRET is not set"}`. Check the Amplify build
      log for `amplify.yml from repo v3 - CRON_SECRET present - …`:
      - line missing → a build spec saved in the Amplify console overrides
        `amplify.yml` (App settings → Build settings); remove or replace it.
        (This would also mean the SES build check has never run.)
      - `NO` → the variable isn't in the build environment for `master`.
      Then redeploy, confirm the route answers 401 without auth, and run
      **Daily jobs** in GitHub Actions — expect `{"checked":0,"expired":[]}`, and
      from the age-proof clean-up `{"days":90,"deleted":[],"failed":[]}` (it then
      shows under "Recent clean-ups" on /admin/privacy).
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
- [ ] 3-day event reminder on live (same daily workflow, needs CRON_SECRET).
- [ ] Age-proof clean-up on live (same daily workflow, needs CRON_SECRET). Nothing
      is due before 27 Mar 2027 (90 days after the 27 Dec 2026 tournament).
- [ ] Real email delivery of the changes-requested and "Fix by" emails.
- [ ] Bulk approve / request-changes emails on live (a local production build has
      no SES keys, so sending fails by design and is logged as `email_failed`).
- [ ] Poster upload end to end (needs working local S3 keys; the bucket's CORS
      also only allows the production origin, so test from the live admin).
- [ ] Player detail page on live: approve / reject / request-changes emails, and
      photo + age-proof previews from S3 (locally only the inline legacy files work).

## Follow-ups

- [ ] Migration: make `Registration.registrationNo` NOT NULL once every row has a
      number (number any rows created before the Step 1 deploy first).
- [ ] Home page takes ~2.75 s on live (others ~1.45 s): some helper reads the
      database in sequence; moot after the Mumbai move, otherwise parallelise.
- [ ] Home page layout shift 0.061 (the footer moves when a section above it loads).
- [x] Oversized age proof (> 1 MB) gets "Invalid upload request" instead of
      "…must be under 1 MB" — fixed in Step 4.
- [ ] Admin pages are slow on live: the dashboard's first byte takes ~5–6 s
      (session check, tournament list and data are sequential trips to Sydney).
      The Mumbai move is the main fix; caching the tournament list would save a trip.
- [ ] Class enrolment still only logs a stub "email" — give it a real template
      when classes open.
- [ ] Date-change emails go out one by one while the admin waits on Save; fine for
      tens of players, move to a background job before it's hundreds.
- [x] Step 9: the register API accepts any submission for an email verified in
      the last 30 minutes, from any browser — tie it to the player session cookie
      that Step 8 adds. Done: registering and uploading need that cookie.
- [ ] Unused files in the bucket: uploads from forms never submitted, and files of
      registrations deleted before 22 Oct, stay (private) in S3. Chosen (23 Oct):
      an inline IAM policy giving the app's user s3:ListBucket on `registrations/`
      and `id-cards/` only (safer than a lifecycle rule, which can't tell used
      files from unused). Then: a dry-run list on /admin/privacy, deletion only
      after the owner's OK, and the daily job keeps it tidy. Without listing, deleting
      a registration can't find its cached ID cards (`id-cards/<id>/`), so the three
      from the 23 Oct Step 10 run are still there and will be on that list.
- [ ] Permanent automated tests in GitHub Actions with a separate test database and mock email.
- [ ] Completed tournament pages still show the seats bar ("0 / N seats filled" on /tournaments cards and the detail page); hide it once the event has ended.
- [ ] Admin tournament form accepts past dates, but the deadline must be before the start date, so a held event needs a past deadline too (no future-date block exists).
- [ ] CSP frame-src has no https://drive.google.com, so Google Drive videos in the lightbox would be blocked (only YouTube was added, 24 Oct).
