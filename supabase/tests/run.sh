#!/usr/bin/env bash
# Applies the migration to a throwaway local Postgres DB and runs the access-rule tests.
# Usage: DB_URL=postgres://postgres@localhost/postgres ./supabase/tests/run.sh
# Every line starting with T should read the same as its "(expect …)"; ERROR lines are
# blocked actions and are expected.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
admin="${DB_URL:-postgres://postgres@localhost/postgres}"
psql "$admin" -q -c "drop database if exists creatorloop_test" -c "create database creatorloop_test"
test_db="${admin%/*}/creatorloop_test"
psql "$test_db" -v ON_ERROR_STOP=1 -q -f "$here/00_supabase_stubs.sql" -f "$here/../migrations/0001_init.sql"
psql "$test_db" -q -f "$here/10_rls.sql" 2>&1 | grep -E "^ *T[0-9]|ERROR" | sed 's/^ *//'
