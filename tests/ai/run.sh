#!/usr/bin/env bash
# Runs the four AI generators against a local stand-in for the Anthropic API.
# Checks request shape, typed parsing, prompt hardening and data minimisation
# without spending credits. It does not test the quality of real AI output.
set -euo pipefail
cd "$(dirname "$0")/../.."
node tests/ai/fake-anthropic.mjs &
fake=$!
trap 'kill $fake 2>/dev/null || true' EXIT
sleep 1
ANTHROPIC_API_KEY=test-key ANTHROPIC_BASE_URL=http://localhost:4010 ANTHROPIC_MODEL= \
  NODE_OPTIONS="--conditions=react-server" npx tsx tests/ai/generators.test.mts
