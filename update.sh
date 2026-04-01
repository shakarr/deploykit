#!/bin/sh
set -e

# ══════════════════════════════════════════════════════════
#  DeployKit — Update script
#  Usage: cd /opt/deploykit && ./update.sh
# ══════════════════════════════════════════════════════════

DEPLOYKIT_DIR="/opt/deploykit"
COMPOSE_FILE="docker-compose.prod.yml"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

printf "\n${BOLD}Updating DeployKit...${NC}\n\n"

cd "$DEPLOYKIT_DIR"

# Pull latest code
printf "  ${BLUE}→${NC} Pulling latest changes...\n"
git fetch origin master >/dev/null 2>&1 \
  && git reset --hard origin/master >/dev/null 2>&1 \
  || { printf "  ${RED}✗${NC} Pull failed\n"; exit 1; }

# Fix CRLF if needed
find . -name "*.sh" -exec sed -i 's/\r$//' {} + 2>/dev/null || true
find . -name "Dockerfile" -exec sed -i 's/\r$//' {} + 2>/dev/null || true

# Rebuild and restart
printf "  ${BLUE}→${NC} Rebuilding images...\n"
if ! docker compose -f "$COMPOSE_FILE" build; then
  printf "\n  ${RED}✗${NC} Build failed. Check the output above.\n"
  exit 1
fi

printf "  ${BLUE}→${NC} Restarting services...\n"
docker compose -f "$COMPOSE_FILE" up -d

# Migrations run automatically via entrypoint.sh
printf "  ${BLUE}→${NC} Waiting for API (migrations run on startup)...\n"
sleep 8

# Verify
for _ in $(seq 1 20); do
  if docker exec deploykit-api sh -c 'curl -sf http://localhost:4000/health >/dev/null 2>&1'; then
    printf "\n  ${GREEN}✓${NC} DeployKit updated!\n\n"
    exit 0
  fi
  sleep 3
done

printf "\n  ${GREEN}✓${NC} Update applied. API may still be starting — check: docker logs deploykit-api\n\n"
