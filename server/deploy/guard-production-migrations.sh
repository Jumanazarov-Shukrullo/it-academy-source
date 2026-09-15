#!/usr/bin/env bash
set -euo pipefail

deploy_sha=${DEPLOY_SHA:?DEPLOY_SHA is required}

if [[ ${GITHUB_EVENT_NAME:-} == workflow_dispatch ]]; then
  if [[ ${SCHEMA_CONFIRMED:-false} != true ]]; then
    echo "Manual production deploy blocked: confirm schema compatibility in the workflow form." >&2
    exit 1
  fi
  exit 0
fi

before_sha=${BEFORE_SHA:-}
if [[ -z $before_sha || $before_sha == 0000000000000000000000000000000000000000 ]]; then
  echo "No previous push SHA is available; use a manual deploy with schema confirmation." >&2
  exit 1
fi

if git diff --quiet "$before_sha" "$deploy_sha" -- server/sql; then
  exit 0
fi

echo "Automatic production deploy blocked because server/sql changed." >&2
echo "Apply and verify an expand-only migration manually, then run this workflow manually." >&2
exit 1
