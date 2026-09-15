#!/usr/bin/env bash
set -euo pipefail

production_url=${PRODUCTION_URL:-https://it-academy.uz}
production_www_url=${PRODUCTION_WWW_URL:-https://www.it-academy.uz}
production_url=${production_url%/}
production_www_url=${production_www_url%/}

failures=0

expect_status() {
  local base_url=$1
  local route=$2
  local expected=$3
  local actual
  actual=$(curl --silent --show-error --retry 2 --retry-all-errors --max-time 15 \
    --output /dev/null --write-out '%{http_code}' "$base_url$route")
  if [[ $actual != "$expected" ]]; then
    echo "FAIL $base_url$route expected=$expected actual=$actual" >&2
    failures=$((failures + 1))
  else
    echo "PASS $base_url$route status=$actual"
  fi
}

expect_indexable() {
  local base_url=$1
  local route=$2
  local headers
  headers=$(curl --silent --show-error --retry 2 --retry-all-errors --max-time 15 \
    --output /dev/null --dump-header - "$base_url$route")
  if printf '%s\n' "$headers" | grep -Eiq '^x-robots-tag:.*(noindex|nofollow)'; then
    echo "FAIL $base_url$route sends a blocking X-Robots-Tag" >&2
    failures=$((failures + 1))
  else
    echo "PASS $base_url$route is indexable"
  fi
}

for route in / /courses /b2b /nodejs /admin-panel; do
  expect_status "$production_url" "$route" 200
  expect_indexable "$production_url" "$route"
done

expect_status "$production_url" /cms/content.php 200
expect_status "$production_url" /cms/auth/me.php 401
expect_status "$production_url" /api/students.php 401
expect_status "$production_url" /config.php 403
expect_status "$production_www_url" / 200
expect_indexable "$production_www_url" /

index_html=$(curl --silent --show-error --retry 2 --retry-all-errors --max-time 15 \
  "$production_url/")
for marker in 1413969527493790 connect.facebook.net/en_US/fbevents.js; do
  if ! grep -Fq "$marker" <<<"$index_html"; then
    echo "FAIL production HTML is missing $marker" >&2
    failures=$((failures + 1))
  else
    echo "PASS production HTML contains $marker"
  fi
done

asset_routes=$(printf '%s\n' "$index_html" \
  | grep -Eo '(src|href)="/assets/[^"]+"' \
  | sed -E 's/^(src|href)="//; s/"$//' \
  | sort -u || true)
if [[ -z $asset_routes ]]; then
  echo "FAIL production HTML references no hashed assets" >&2
  failures=$((failures + 1))
else
  while IFS= read -r asset_route; do
    expect_status "$production_url" "$asset_route" 200
  done <<<"$asset_routes"
fi

if [[ -n ${DEPLOY_SHA:-} ]]; then
  deploy_meta=$(curl --silent --show-error --retry 2 --retry-all-errors --max-time 15 \
    "$production_url/deploy-meta.json")
  if ! DEPLOY_META=$deploy_meta DEPLOY_SHA=$DEPLOY_SHA node -e '
    const meta = JSON.parse(process.env.DEPLOY_META);
    if (meta.commit !== process.env.DEPLOY_SHA) process.exit(1);
  '; then
    echo "FAIL deployed release marker does not match $DEPLOY_SHA" >&2
    failures=$((failures + 1))
  else
    echo "PASS deployed release marker matches $DEPLOY_SHA"
  fi
fi

if (( failures > 0 )); then
  echo "$failures production smoke check(s) failed." >&2
  exit 1
fi

echo "Production smoke checks passed."
