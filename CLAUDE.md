@AGENTS.md

## Working rules

1. **Scope:** do exactly the task asked, nothing extra. Other issues you notice go in `TODO.md` as one line each — don't fix them.
2. **Database safety:** local `.env` points at the PRODUCTION database. Never run `prisma migrate dev`, `migrate reset` or `db push`. Show the owner any migration SQL before saving it.
3. **Testing:** after every change run `npm run check` (lint + types + tests + build). If it fails, fix it before reporting.
4. **Commits:** commit each finished task locally with a clear message.
5. **NEVER `git push`.** Pushing deploys to production via Amplify. Only push when the owner writes exactly "approved to push".
6. **Push report:** before asking for approval, give the owner:
   - commits to be pushed (`git log origin/master..HEAD --oneline`)
   - files changed
   - migrations included (with SQL)
   - new env vars, and whether they're in `amplify.yml`
   - the `npm run check` result
   - what to check on the live site after deploy
7. **Replies:** keep them short — what changed, test result, anything the owner must decide.
