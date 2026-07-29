#!/usr/bin/env bash
#
# DrGodly Web Telehealth - 1-Command Hetzner CX23 Server Installer.
# Matches ForgeChat automated deployment architecture.
#
set -euo pipefail

cd "$(dirname "$0")"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)

echo "============================================================"
echo "🩺 DrGodly Web Telehealth - Hetzner Server Installer"
echo "============================================================"

# 1. Prerequisites Check
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is not installed. Install Docker first: curl -fsSL https://get.docker.com | sh"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "❌ Docker Compose v2 is required."; exit 1; }

# 2. Get Domain
DOMAIN="${1:-${DOMAIN:-}}"
if [ -z "$DOMAIN" ]; then
  echo -n "Enter domain for Hetzner deployment (e.g. clinic.drgodly.com): "
  read -r DOMAIN
fi

DOMAIN="$(echo "$DOMAIN" | tr -d '[:space:]')"
DOMAIN="${DOMAIN#http://}"; DOMAIN="${DOMAIN#https://}"; DOMAIN="${DOMAIN%%/*}"
[ -n "$DOMAIN" ] || { echo "❌ Domain is required."; exit 1; }

echo "✅ Target Domain: $DOMAIN"

# 3. Build & Deploy Containers (Clean No-Cache Build)
echo "🚀 Building and launching DrGodly Web Containers for $DOMAIN..."
DOMAIN="$DOMAIN" "${COMPOSE[@]}" build --no-cache
DOMAIN="$DOMAIN" "${COMPOSE[@]}" up -d

echo "============================================================"
echo "🎉 SUCCESS: DrGodly Web is deployed and running on Hetzner CX23!"
echo "🌐 URL: https://$DOMAIN"
echo "============================================================"
