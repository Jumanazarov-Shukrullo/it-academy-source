#!/usr/bin/env bash
# Deploy a previously verified build to the production Plesk docroot over FTPS.
# This intentionally never uploads .htaccess, deletes old files, or changes the database.
set -euo pipefail

control_root=$(cd "$(dirname "$0")/../.." && pwd)
release_root=${RELEASE_ROOT:-$control_root}
[[ $release_root == /* ]] || release_root="$control_root/$release_root"
cd "$control_root"

: "${DEPLOY_SHA:?DEPLOY_SHA is required}"
: "${PROD_FTP_HOST:?PROD_FTP_HOST is required}"
: "${PROD_FTP_USER:?PROD_FTP_USER is required}"
: "${PROD_FTP_PASSWORD:?PROD_FTP_PASSWORD is required}"
: "${PROD_FTP_REMOTE_DIR:?PROD_FTP_REMOTE_DIR is required}"

[[ $DEPLOY_SHA =~ ^[0-9a-f]{40}$ ]] || {
  echo "DEPLOY_SHA must be a full 40-character commit SHA." >&2
  exit 1
}
[[ $PROD_FTP_HOST =~ ^[A-Za-z0-9.-]+(:[0-9]{1,5})?$ ]] || {
  echo "PROD_FTP_HOST must be a hostname with an optional port." >&2
  exit 1
}
[[ $PROD_FTP_REMOTE_DIR == /* ]] || {
  echo "PROD_FTP_REMOTE_DIR must be an absolute FTPS path." >&2
  exit 1
}
[[ $PROD_FTP_REMOTE_DIR != *..* && $PROD_FTP_REMOTE_DIR != *beta* ]] || {
  echo "Unsafe production remote directory." >&2
  exit 1
}

command -v lftp >/dev/null || { echo "lftp is required." >&2; exit 1; }
test -f "$release_root/app/dist/index.html"
test -f "$release_root/app/dist/deploy-meta.json"
test -d "$release_root/app/dist/assets"
test -d "$release_root/server/api"
test -d "$release_root/server/cms"

for protected_path in .htaccess api cms uploads; do
  if [[ -e $release_root/app/dist/$protected_path ]]; then
    echo "Refusing to deploy: app/dist unexpectedly contains $protected_path." >&2
    exit 1
  fi
done

task_tmp=$(mktemp -d)
trap 'rm -rf -- "$task_tmp"' EXIT
target_marker="$task_tmp/deploy-target"

# The marker is a one-time Plesk setup guard. It prevents beta credentials or an
# incorrect remote directory from ever receiving a production deployment.
lftp -u "$PROD_FTP_USER","$PROD_FTP_PASSWORD" "ftp://$PROD_FTP_HOST" >/dev/null <<LFTP
set cmd:fail-exit yes
set ftp:ssl-allow true
set ftp:ssl-force true
set ftp:ssl-protect-data true
set ssl:verify-certificate yes
set net:max-retries 2
set net:timeout 30
cd "$PROD_FTP_REMOTE_DIR"
get .deploy-target -o "$target_marker"
bye
LFTP

if [[ $(tr -d '\r\n' < "$target_marker") != it-academy.uz ]]; then
  echo "Production target marker is missing or incorrect; nothing was uploaded." >&2
  exit 1
fi

echo "Deploying immutable release $DEPLOY_SHA"
echo "Uploads are atomic per file; old files, runtime config, uploads, and .htaccess are preserved."

# Backend first so the old frontend remains compatible while new static assets
# upload. New hashed assets and public files land before index.html. The release
# marker is last, so it identifies only a completed upload sequence.
lftp -u "$PROD_FTP_USER","$PROD_FTP_PASSWORD" "ftp://$PROD_FTP_HOST" <<LFTP
set cmd:fail-exit yes
set ftp:ssl-allow true
set ftp:ssl-force true
set ftp:ssl-protect-data true
set ssl:verify-certificate yes
set net:max-retries 2
set net:timeout 30
set mirror:parallel-transfer-count 5
set xfer:use-temp-file yes
cd "$PROD_FTP_REMOTE_DIR"
mirror -R --no-perms --verbose "$release_root/server/api" api
mirror -R --no-perms --verbose --exclude-glob config.php "$release_root/server/cms" cms
mirror -R --no-perms --verbose --exclude-glob index.html --exclude-glob deploy-meta.json "$release_root/app/dist" .
put "$release_root/app/dist/index.html" -o index.html
put "$release_root/app/dist/deploy-meta.json" -o deploy-meta.json
bye
LFTP

echo "Release $DEPLOY_SHA uploaded."
