#!/usr/bin/env bash
# Deploy the SPA + PHP backend to BETA over FTPS. Never targets production.
#
# Fill server/deploy/.env.deploy (gitignored) with:
#   FTP_HOST=...            # e.g. ftp.it-academy.uz
#   FTP_USER=...            # Plesk FTP user for the beta subdomain
#   FTP_PASS=...
#   FTP_REMOTE_DIR=/        # docroot of beta.it-academy.uz (often / or /httpdocs)
#
# Then:  bash server/deploy/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/../.."   # repo root

ENV_FILE="server/deploy/.env.deploy"
[ -f "$ENV_FILE" ] || { echo "Missing $ENV_FILE (copy from .env.deploy.example)"; exit 1; }
set -a; . "$ENV_FILE"; set +a
: "${FTP_HOST:?}" "${FTP_USER:?}" "${FTP_PASS:?}" "${FTP_REMOTE_DIR:?}"

echo "==> Building SPA"
( cd app && npm ci --silent && npm run build )
cp server/deploy/htaccess app/dist/.htaccess

echo "==> Uploading to $FTP_HOST:$FTP_REMOTE_DIR (explicit FTPS on :21)"
# Explicit FTPS over port 21 (Plesk). ssl-force requires TLS; verify off for self-signed.
# --delete on the docroot mirror EXCLUDES api/cms/uploads so it never wipes the
# backend or user media. config.php is excluded — the host keeps its own (DB + HolliHop creds).
lftp -u "$FTP_USER","$FTP_PASS" "ftp://$FTP_HOST" <<EOF
set ftp:ssl-allow true
set ftp:ssl-force true
set ftp:ssl-protect-data true
set ssl:verify-certificate no
set net:timeout 30
set mirror:parallel-transfer-count 5
mirror -R --delete --no-perms --verbose -x '^(api|cms|uploads)/' app/dist "$FTP_REMOTE_DIR"
mirror -R --no-perms --verbose          server/api               "$FTP_REMOTE_DIR/api"
mirror -R --no-perms --verbose -X config.php server/cms           "$FTP_REMOTE_DIR/cms"
bye
EOF

echo "==> Done. Verify: https://beta.it-academy.uz/"
echo "   First deploy only: load server/sql/schema.sql + seed an admin via phpMyAdmin"
echo "   (see server/deploy/README.md), and create $FTP_REMOTE_DIR/cms/config.php on the host."
