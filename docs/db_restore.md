# Database Restore Guide

This document describes how to restore a PostgreSQL backup created with `scripts/backup_db.sh`.

## Prerequisites
- PostgreSQL installed locally or access to a remote database
- AWS CLI configured with access to the backup bucket

## Steps
1. **Download the backup file**
   ```bash
   aws s3 cp s3://<your-bucket>/db_backup_<timestamp>.dump ./db.dump
   ```
2. **Restore into your database**
   ```bash
   pg_restore --clean --no-owner -d <connection-string> ./db.dump
   ```
3. **Verify**
   After the command completes, check that the expected tables and data are present.

Replace `<your-bucket>` with the value of `S3_BUCKET` used during backup and `<connection-string>` with your target `DATABASE_URL`.

