#!/usr/bin/env bash
# Applies every migration to a throwaway local Postgres DB and runs the access-rule tests.
# Connection comes from the standard PG* env vars (PGHOST, PGUSER, PGPASSWORD, PGPORT).
#   PGHOST=localhost PGUSER=postgres ./supabase/tests/run.sh
# Each check prints "ID what -> actual (expect expected)". ERROR lines are blocked
# actions and are expected. The script exits 1 if any actual differs from expected.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
db=creatorloop_test
psql -d postgres -q -c "drop database if exists $db" -c "create database $db" 2>/dev/null
psql -d "$db" -v ON_ERROR_STOP=1 -q -f "$here/00_supabase_stubs.sql"
for m in "$here"/../migrations/*.sql; do
  psql -d "$db" -v ON_ERROR_STOP=1 -q -f "$m"
done
out="$(mktemp)"
for t in "$here"/[1-9]*.sql; do
  echo "── $(basename "$t")"
  psql -d "$db" -q -f "$t" 2>&1 | grep -E "^ *[A-Z][0-9]+[a-z]? |ERROR" | sed 's/^ *//' | tee -a "$out"
done
total=$(grep -c "(expect " "$out" || true)
failed=$(awk -F' -> ' '/\(expect / { split($2, a, " \\(expect "); want=a[2]; sub(/\)$/, "", want); if (a[1] != want) print }' "$out")
echo
if [ -n "$failed" ]; then
  echo "FAILED:"; echo "$failed"; exit 1
fi
echo "All $total checks passed."
