# Deploying to beta.it-academy.uz

Host is Plesk shared hosting, **FTPS only (no SSH)**. So the database is loaded
through Plesk's web tools, not a shell.

## One-time host setup
1. **Create a MySQL database + user** in Plesk (Databases → Add). Note db name / user / password / host.
2. **Load the schema**: Plesk → that DB → phpMyAdmin → Import → upload `server/sql/schema.sql`.
3. **Create `cms/config.php` on the host** (NOT uploaded by deploy — it holds secrets).
   Copy `server/cms/config.sample.php`, fill in the real DB creds and the HolliHop key,
   and make sure `allowed_origins` includes `https://beta.it-academy.uz`. Put it at
   `<docroot>/cms/config.php`.
4. **Seed an admin user**. We can't run the CLI tool (no SSH), so generate the hash
   locally and INSERT via phpMyAdmin:
   ```bash
   php -r 'echo password_hash("YOUR_STRONG_PASSWORD", PASSWORD_DEFAULT), "\n";'
   ```
   Then in phpMyAdmin SQL:
   ```sql
   INSERT INTO admin_users (username, email, password_hash, role, is_active)
   VALUES ('admin', 'you@example.com', '<paste-hash>', 'admin', 1);
   ```
5. (Optional) create a writable `<docroot>/uploads` dir for media.

## Every deploy
1. Fill `server/deploy/.env.deploy` (copy from `.env.deploy.example`) with the beta FTP creds.
2. `bash server/deploy/deploy.sh` — builds the SPA and FTPS-mirrors `dist` + `api` + `cms`
   (excluding `config.php`) to the beta docroot.

## What is NOT here yet
- Static marketing images (`reference/live-site/*.jpg|png|svg`) — uploaded during the
  pixel-faithful marketing-page pass, when the pages that use them exist.
- Production cutover — explicitly out of scope; beta only.

## Automatic production deployment

`.github/workflows/deploy-production.yml` verifies every branch push and pull
request. It deploys only a push to `main`, or a manually selected commit through
`workflow_dispatch`.

A control-plane-only commit can include `[skip deploy]` in its commit message.
The build and verification job still runs, but the production upload is skipped.

One-time GitHub/Plesk setup:

1. Create a GitHub Environment named `production`.
2. Add these Environment secrets: `PROD_FTP_HOST`, `PROD_FTP_USER`,
   `PROD_FTP_PASSWORD`, and `PROD_FTP_REMOTE_DIR`.
3. In the production document root, create `.deploy-target` containing exactly
   `it-academy.uz`. The deploy exits before uploading anything if this marker is
   missing, so beta credentials cannot accidentally receive a production build.
4. Keep `cms/config.php` and `uploads/` on the host. They are never uploaded or
   deleted by the workflow.

The production workflow does not upload `.htaccess`, delete old hashed assets,
or apply SQL. PHP files are uploaded first using temporary remote names, static
assets follow, and `index.html` switches last. The final `deploy-meta.json`
records the deployed commit SHA. Deployments use one GitHub concurrency group,
so a later push cannot interrupt one already uploading. If several pushes land
while a deployment runs, GitHub keeps the newest pending release.

The verified artifact contains the built frontend plus that commit's `api/` and
`cms/` code. Deployment control scripts are always loaded from the workflow's
`main` revision, so the manual workflow can redeploy an older application commit
even when that commit predates these deployment scripts.

If `server/sql/` changes, an automatic production deploy stops before FTPS. Apply
and verify an expand-only migration manually, then use **Run workflow** and check
the schema-compatibility confirmation. A rollback uses the same manual workflow:

```bash
gh workflow run deploy-production.yml \
  --repo Laziz95m/it-academy-source \
  --ref main \
  -f ref=<known-good-commit-sha> \
  -f confirm_schema_compatible=true
```

This is a serialized, low-risk in-place FTPS release. Plesk exposes one document
root and no second traffic slot, so it is not a strict blue-green or provably
zero-downtime deployment.
