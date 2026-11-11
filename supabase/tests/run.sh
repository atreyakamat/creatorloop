#!/usr/bin/env bash
# Applies every migration to a throwaway local Postgres DB and runs the access-rule tests.
# Connection comes from the standard PG* env vars (PGHOST, PGUSER, PGPASSWORD, PGPORT).
#   PGHOST=localhost PGUSER=postgres ./supabase/tests/run.sh
# Every T…/G… line should read the same as its "(expect …)". ERROR lines are
# blocked actions and are expected.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
db=creatorloop_test
psql -d postgres -q -c "drop database if exists $db" -c "create database $db"
psql -d "$db" -v ON_ERROR_STOP=1 -q -f "$here/00_supabase_stubs.sql"
for m in "$here"/../migrations/*.sql; do
  psql -d "$db" -v ON_ERROR_STOP=1 -q -f "$m"
done
for t in "$here"/[1-9]*.sql; do
  echo "── $(basename "$t")"
  psql -d "$db" -q -f "$t" 2>&1 | grep -E "^ *[TG][0-9]|ERROR" | sed 's/^ *//'
done
