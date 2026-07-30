#!/usr/bin/env bash
#
# DrGodly Web Telehealth - Hetzner Standalone Container Installer.
#
set -euo pipefail

cd "$(dirname "$0")"

echo "============================================================"
echo "🩺 DrGodly Web Telehealth - Hetzner Standalone Installer"
echo "============================================================"

# 1. Prerequisites Check
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is not installed. Install Docker first: curl -fsSL https://get.docker.com | sh"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "❌ Docker Compose v2 is required."; exit 1; }

# 2. Check for .env file
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    echo "⚠️ .env file missing. Copying from .env.example..."
    cp .env.example .env
  else
    echo "❌ Missing .env file. Please create .env before deploying."
    exit 1
  fi
fi

# 3. Pull or Build & Deploy Standalone Container
echo "🚀 Pulling latest container from GHCR and starting application..."
docker compose pull || docker compose build --no-cache
docker compose up -d --force-recreate

echo "============================================================"
echo "🎉 SUCCESS: DrGodly Web is running standalone on Port 3000!"
echo "============================================================"
