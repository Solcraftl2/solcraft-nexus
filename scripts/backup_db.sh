#!/usr/bin/env bash
set -euo pipefail

DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="db_backup_${DATE}.dump"

if [[ -n "${DATABASE_URL:-}" ]]; then
  pg_dump "${DATABASE_URL}" -Fc -f "$BACKUP_FILE"
else
  pg_dump -Fc -f "$BACKUP_FILE"
fi

if [[ -z "${S3_BUCKET:-}" ]]; then
  echo "S3_BUCKET environment variable not set" >&2
  exit 1
fi

aws s3 cp "$BACKUP_FILE" "s3://${S3_BUCKET}/$BACKUP_FILE"
rm "$BACKUP_FILE"
