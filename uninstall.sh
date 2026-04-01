#!/bin/sh
set -e

# ══════════════════════════════════════════════════════════
#  DeployKit — Uninstall script
#  Usage: cd /opt/deploykit && ./uninstall.sh
# ══════════════════════════════════════════════════════════

RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'
BOLD='\033[1m'

printf "\n${RED}${BOLD}Uninstalling DeployKit${NC}\n\n"
printf "  ${YELLOW}This will remove DeployKit and all its data.${NC}\n"
printf "  ${YELLOW}User-deployed containers will NOT be affected.${NC}\n"
printf "\n"

printf "  Are you sure? (type 'yes' to confirm): "
read -r CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  printf "\n  Cancelled.\n\n"
  exit 0
fi

printf "\n"

cd /opt/deploykit 2>/dev/null || true

# Stop services
printf "  Stopping services...\n"
docker compose -f docker-compose.prod.yml down -v 2>/dev/null || true

# Remove images
printf "  Removing images...\n"
docker images -q "deploykit-*" 2>/dev/null | xargs -r docker rmi 2>/dev/null || true

# Remove data
printf "  Delete database and backups? (y/N): "
read -r DELETE_DATA
if [ "$DELETE_DATA" = "y" ] || [ "$DELETE_DATA" = "Y" ]; then
  docker volume rm deploykit_postgres-data deploykit_redis-data 2>/dev/null || true
  rm -rf /var/backups/deploykit
  printf "  Data deleted.\n"
fi

# Remove installation
rm -rf /opt/deploykit

printf "\n  ${RED}✓${NC} DeployKit has been removed.\n\n"
printf "  Note: Docker, user containers, and deploykit-network were left intact.\n\n"
