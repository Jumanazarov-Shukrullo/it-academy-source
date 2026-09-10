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
