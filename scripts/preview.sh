#!/usr/bin/env bash
# A local preview of the console, for trying Relay without an Instagram account and working on the UI without touching
# the live Worker. Builds two throwaway databases under .wrangler/preview the first time: your "real" one (empty, like a
# fresh install) and the demo one (schema + every migration + scripts/preview-seed.mjs). It opens in demo mode; flip
# Live / Demo at the top right. Log in at http://localhost:8791/login with the password in .dev.vars (created here if
# missing; preview only, git-ignored).
#
#   bash scripts/preview.sh           # start (builds the sample database if it isn't there)
#   bash scripts/preview.sh --reset   # rebuild the sample database first
set -euo pipefail
cd "$(dirname "$0")/.."
[ -d node_modules ] || npm install --no-audit --no-fund
DIR=.wrangler/preview
DB="$(node -e 'console.log(require("fs").readFileSync("wrangler.jsonc","utf8").match(/"database_name":\s*"([^"]+)"/)[1])')"
DEMO="$(node -e 'const m=require("fs").readFileSync("wrangler.jsonc","utf8").match(/"binding":\s*"DEMO_DB",\s*"database_name":\s*"([^"]+)"/);console.log(m?m[1]:"")')"
if [ "${1:-}" = "--reset" ] || [ ! -f "$DIR/seeded" ]; then
  rm -rf "$DIR" && mkdir -p "$DIR"
  run() { local db="$1"; shift; npx wrangler d1 execute "$db" --local --persist-to "$DIR" -y "$@" >/dev/null; }
  build() { run "$1" --file schema.sql; for f in $(ls migrations/*.sql | sort); do run "$1" --file "$f"; done; }
  build "$DB"
  node scripts/preview-seed.mjs > "$DIR/seed.sql"
  if [ -n "$DEMO" ]; then build "$DEMO"; run "$DEMO" --file "$DIR/seed.sql"; else run "$DB" --file "$DIR/seed.sql"; fi
  touch "$DIR/seeded"
fi
if [ ! -f .dev.vars ]; then
  printf 'ADMIN_PASSWORD=preview-%s\nREVIEW_PASSWORD=preview-review\nINBOUND_SECRET=dev\nMETA_VERIFY_TOKEN=dev\nMETA_APP_SECRET=dev-app-secret\nANTHROPIC_API_KEY=dev\n' "$(openssl rand -hex 6)" > .dev.vars
  echo "Created .dev.vars: the preview's login password is its ADMIN_PASSWORD."
fi
grep -q '^DEMO_DEFAULT=' .dev.vars || echo 'DEMO_DEFAULT=on' >> .dev.vars # the preview opens in demo mode
exec npx wrangler dev --local --port "${PORT:-8791}" --persist-to "$DIR"
