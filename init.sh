#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    printf "Error: A supported Node.js version and npm must be installed and in PATH.\n" >&2
    exit 1
fi

NODE_VERSION="$(node --version)"
if ! node -e '
const [major, minor] = process.versions.node.split(".").map(Number);
const supported =
  (major === 20 && minor >= 19) ||
  (major === 22 && minor >= 13) ||
  major >= 24;
process.exit(supported ? 0 : 1);
'; then
    printf "Error: Use Node.js 20.19+, 22.13+, or 24+; found %s.\n" "$NODE_VERSION" >&2
    exit 1
fi

printf "Using Node.js %s and npm %s.\n" "$NODE_VERSION" "$(npm --version)"
printf "Installing locked project dependencies...\n"
npm ci

printf "\nSetup complete. Common commands:\n"
printf "  Start locally:       npm run dev\n"
printf "  Verify changes:      npm run lint && npm test\n"
printf "  Check Worker config: npm run worker:check\n"
