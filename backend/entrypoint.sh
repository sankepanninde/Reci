#!/bin/sh
set -e

echo "=== [entrypoint] Starting ==="
echo "[entrypoint] PATH: $PATH"
echo "[entrypoint] node: $(which node || echo 'not found')"
echo "[entrypoint] pnpm: $(which pnpm || echo 'not found')"

export PATH="/root/.local/share/pnpm:/usr/local/bin:$PATH"

echo "[entrypoint] pnpm (after PATH fix): $(which pnpm || echo 'not found')"

echo "=== [entrypoint] Running: prisma migrate deploy ==="
pnpm exec prisma migrate deploy

echo "=== [entrypoint] Running: node src/index.js ==="
exec node src/index.js
