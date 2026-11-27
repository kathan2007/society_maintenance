# MongoDB Backup & Restore Guide

## Overview
The database is hosted on **MongoDB Atlas** (`societydata.fw00kxp.mongodb.net`).

---

## Backup (mongodump)

```bash
# Full database backup
mongodump \
  --uri="mongodb+srv://<user>:<password>@societydata.fw00kxp.mongodb.net/societyDB" \
  --out=./backup/$(date +%Y-%m-%d)

# Compress backup
tar -czf backup-$(date +%Y-%m-%d).tar.gz ./backup/$(date +%Y-%m-%d)/
```

## Restore (mongorestore)

```bash
# Restore from backup directory
mongorestore \
  --uri="mongodb+srv://<user>:<password>@societydata.fw00kxp.mongodb.net/societyDB" \
  --dir=./backup/2026-11-01 \
  --drop  # WARNING: drops existing data first
```

## Atlas Automated Backups

MongoDB Atlas (free tier M0) does **not** include automated backups. To enable:
1. Upgrade to M2+ tier
2. Go to Atlas → Database → Backup → Enable Continuous Backup

## Export specific collections

```bash
# Export only Maintenance collection to JSON
mongoexport \
  --uri="mongodb+srv://<user>:<password>@societydata.fw00kxp.mongodb.net/societyDB" \
  --collection=maintenances \
  --out=maintenances-backup.json
```

## Environment variables for backup scripts

Store `MONGO_URI` in `.env` and reference it:
```bash
source .env
mongodump --uri="$MONGO_URI" --out=./backup/$(date +%Y-%m-%d)
```

## Recommended schedule (via cron or GitHub Actions)

```
# Daily backup at 2AM UTC
0 2 * * * /path/to/backup-script.sh
```

## Atlas Connection String format

```
mongodb+srv://<username>:<password>@societydata.fw00kxp.mongodb.net/societyDB?retryWrites=true&w=majority
```

> **Important:** Never commit credentials to git. Always use environment variables.
