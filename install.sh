#!/bin/sh
# shellcheck shell=sh
set -e

# ══════════════════════════════════════════════════════════════════════════════
#  DeployKit — installer
#  https://get.deploykit.dev
#
#  Usage:
#    curl -fsSL https://get.deploykit.dev | sh
#    curl -fsSL https://get.deploykit.dev | sh -s -- --domain deploy.example.com --email you@example.com
#    curl -fsSL https://get.deploykit.dev | sh -s -- --domain deploy.example.com --email you@example.com --admin-email admin@example.com --admin-password secret123
# ══════════════════════════════════════════════════════════════════════════════

DEPLOYKIT_VERSION="latest"
DEPLOYKIT_REPO="https://github.com/shakarr/deploykit.git"
DEPLOYKIT_BRANCH="master"
DEPLOYKIT_DIR="/opt/deploykit"
COMPOSE_FILE="docker-compose.prod.yml"

DOMAIN=""
ACME_EMAIL=""
ADMIN_EMAIL=""
ADMIN_PASSWORD=""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()   { printf "  ${GREEN}✓${NC} %s\n" "$1"; }
warn()  { printf "  ${YELLOW}⚠${NC}  %s\n" "$1"; }
error() { printf "\n  ${RED}✗ Error:${NC} %s\n\n" "$1" >&2; exit 1; }
info()  { printf "  ${BLUE}→${NC} %s\n" "$1"; }
step()  { printf "\n${BOLD}[%s/%s] %s${NC}\n" "$1" "$TOTAL_STEPS" "$2"; }

# Parse args
TOTAL_STEPS=7

while [ $# -gt 0 ]; do
  case "$1" in
    --domain)         DOMAIN="$2";         shift 2 ;;
    --email)          ACME_EMAIL="$2";     shift 2 ;;
    --admin-email)    ADMIN_EMAIL="$2";    shift 2 ;;
    --admin-password) ADMIN_PASSWORD="$2"; shift 2 ;;
    --dir)            DEPLOYKIT_DIR="$2";  shift 2 ;;
    --branch)         DEPLOYKIT_BRANCH="$2"; shift 2 ;;
    -h|--help)
      printf "\n${BOLD}DeployKit installer${NC}\n\n"
      printf "  ${BOLD}Usage:${NC}\n"
      printf "    curl -fsSL https://get.deploykit.dev | sh -s -- [options]\n\n"
      printf "  ${BOLD}Options:${NC}\n"
      printf "    --domain    <domain>    Dashboard domain (e.g. deploy.example.com)  ${YELLOW}required${NC}\n"
      printf "    --email     <email>     Let's Encrypt email                          ${YELLOW}required${NC}\n"
      printf "    --admin-email    <e>    Pre-create admin account (optional)\n"
      printf "    --admin-password <p>    Admin password — min 8 chars (optional)\n"
      printf "    --dir       <path>      Install directory  [default: /opt/deploykit]\n"
      printf "    --branch    <branch>    Git branch         [default: master]\n\n"
      printf "  ${BOLD}Examples:${NC}\n"
      printf "    # Minimal:\n"
      printf "    curl -fsSL https://get.deploykit.dev | sh -s -- \\\\\n"
      printf "      --domain deploy.example.com --email you@example.com\n\n"
      printf "    # With admin account pre-created:\n"
      printf "    curl -fsSL https://get.deploykit.dev | sh -s -- \\\\\n"
      printf "      --domain deploy.example.com --email you@example.com \\\\\n"
      printf "      --admin-email admin@example.com --admin-password mypassword123\n\n"
      exit 0
      ;;
    *) shift ;;
  esac
done

# ─── Banner ──────────────────────────────────────────────────────────────────
printf "\n${CYAN}${BOLD}"
printf "  ╔══════════════════════════════════════════╗\n"
printf "  ║         ⚡  DeployKit                    ║\n"
printf "  ║      Self-hosted PaaS installer          ║\n"
printf "  ╚══════════════════════════════════════════╝\n"
printf "${NC}\n"

# ─── Interactive prompt if no args ───────────────────────────────────────────
if [ -z "$DOMAIN" ] || [ -z "$ACME_EMAIL" ]; then
  printf "  ${BOLD}No arguments detected — entering interactive mode.${NC}\n\n"

  if [ -z "$DOMAIN" ]; then
    printf "  Dashboard domain (e.g. deploy.example.com): "
    read -r DOMAIN
  fi

  if [ -z "$ACME_EMAIL" ]; then
    printf "  Email for SSL certificates: "
    read -r ACME_EMAIL
  fi

  printf "  Admin email    (leave blank to register via UI): "
  read -r ADMIN_EMAIL

  if [ -n "$ADMIN_EMAIL" ]; then
    printf "  Admin password (min 8 chars): "
    stty -echo 2>/dev/null || true
    read -r ADMIN_PASSWORD
    stty echo 2>/dev/null || true
    printf "\n"
  fi
fi

[ -z "$DOMAIN" ]     && error "--domain is required. Run with --help for usage."
[ -z "$ACME_EMAIL" ] && error "--email is required. Run with --help for usage."

# ─── Step 1: Pre-flight ──────────────────────────────────────────────────────
step 1 "Pre-flight checks"

[ "$(id -u)" -ne 0 ] && error "Please run as root or with sudo."
log "Running as root"

if [ -f /etc/os-release ]; then
  # shellcheck disable=SC1091
  . /etc/os-release
  log "OS: ${PRETTY_NAME:-Unknown}"
fi

TOTAL_MEM=$(free -m 2>/dev/null | awk '/Mem:/{print $2}' || echo "unknown")
TOTAL_DISK=$(df -BG / 2>/dev/null | awk 'NR==2{gsub("G","",$4); print $4}' || echo "unknown")
log "RAM: ${TOTAL_MEM}MB  |  Disk: ${TOTAL_DISK}GB free"

if [ "$TOTAL_MEM" != "unknown" ] && [ "$TOTAL_MEM" -lt 512 ]; then
  warn "Less than 512MB RAM — DeployKit may be slow to start."
fi

log "Domain: ${DOMAIN}"
log "Email:  ${ACME_EMAIL}"

# ─── Step 2: Docker ──────────────────────────────────────────────────────────
step 2 "Docker"

if command -v docker >/dev/null 2>&1; then
  DOCKER_VERSION=$(docker --version | awk '{print $3}' | tr -d ',')
  log "Docker already installed: ${DOCKER_VERSION}"
else
  info "Installing Docker..."
  curl -fsSL https://get.docker.com | sh >/dev/null 2>&1 \
    || error "Docker install failed. Install manually: https://docs.docker.com/engine/install/"
  systemctl enable docker >/dev/null 2>&1 || true
  systemctl start  docker >/dev/null 2>&1 || true
  log "Docker installed"
fi

if docker compose version >/dev/null 2>&1; then
  log "Docker Compose: $(docker compose version --short 2>/dev/null || echo 'available')"
else
  info "Installing Docker Compose plugin..."
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -qq >/dev/null 2>&1
    apt-get install -y -qq docker-compose-plugin >/dev/null 2>&1
  elif command -v yum >/dev/null 2>&1; then
    yum install -y docker-compose-plugin >/dev/null 2>&1
  fi
  docker compose version >/dev/null 2>&1 \
    || error "Docker Compose install failed. See: https://docs.docker.com/compose/install/"
  log "Docker Compose installed"
fi

# ─── Step 3: Git ─────────────────────────────────────────────────────────────
step 3 "Git"

if command -v git >/dev/null 2>&1; then
  log "Git already installed: $(git --version | awk '{print $3}')"
else
  info "Installing Git..."
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -qq >/dev/null 2>&1 && apt-get install -y -qq git >/dev/null 2>&1
  elif command -v yum >/dev/null 2>&1; then
    yum install -y git >/dev/null 2>&1
  elif command -v apk >/dev/null 2>&1; then
    apk add --quiet git >/dev/null 2>&1
  fi
  command -v git >/dev/null 2>&1 || error "Git install failed. Install manually."
  log "Git installed"
fi

# ─── Step 4: Download ────────────────────────────────────────────────────────
step 4 "Downloading DeployKit"

if [ -d "$DEPLOYKIT_DIR/.git" ]; then
  info "Existing installation found — updating..."
  cd "$DEPLOYKIT_DIR"
  git fetch origin "$DEPLOYKIT_BRANCH" >/dev/null 2>&1 \
    && git reset --hard "origin/$DEPLOYKIT_BRANCH" >/dev/null 2>&1 \
    && log "Updated to latest" \
    || warn "Git update failed — using existing code."
else
  rm -rf "$DEPLOYKIT_DIR" 2>/dev/null || true
  info "Cloning repository..."
  git clone --depth 1 --branch "$DEPLOYKIT_BRANCH" "$DEPLOYKIT_REPO" "$DEPLOYKIT_DIR" >/dev/null 2>&1 \
    || error "Clone failed. Check your internet connection."
  log "Downloaded to ${DEPLOYKIT_DIR}"
fi

cd "$DEPLOYKIT_DIR"

# Fix CRLF line endings if present (Windows git checkout)
find . -name "*.sh" -exec sed -i 's/\r$//' {} + 2>/dev/null || true
find . -name "Dockerfile" -exec sed -i 's/\r$//' {} + 2>/dev/null || true

# ─── Step 5: Configure ───────────────────────────────────────────────────────
step 5 "Configuration"

ENV_FILE="${DEPLOYKIT_DIR}/.env"

if [ -f "$ENV_FILE" ]; then
  log "Existing .env found — keeping secrets, updating domain if changed."
  sed -i "s|^DOMAIN=.*|DOMAIN=${DOMAIN}|" "$ENV_FILE"
  sed -i "s|^ACME_EMAIL=.*|ACME_EMAIL=${ACME_EMAIL}|" "$ENV_FILE"
else
  info "Generating secrets..."

  # Fresh install — wipe any leftover volumes with old credentials
  docker compose -f "$COMPOSE_FILE" down -v >/dev/null 2>&1 || true

  DB_PASSWORD=$(openssl rand -hex 24)
  JWT_SECRET=$(openssl rand -hex 32)
  JWT_REFRESH_SECRET=$(openssl rand -hex 32)
  ENCRYPTION_KEY=$(openssl rand -hex 32)
  WEBHOOK_SECRET=$(openssl rand -hex 32)

  cat > "$ENV_FILE" << EOF
# DeployKit configuration — generated by installer
# Do not share this file.

DOMAIN=${DOMAIN}
ACME_EMAIL=${ACME_EMAIL}

# Database
DB_USER=deploykit
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=deploykit

# Auth
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}

# Encryption (env vars stored in DB)
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Webhooks
WEBHOOK_SECRET=${WEBHOOK_SECRET}
EOF

  chmod 600 "$ENV_FILE"
  log "Secrets generated and saved to ${ENV_FILE}"
fi

# ─── Step 6: Build & start ───────────────────────────────────────────────────
step 6 "Starting DeployKit"

mkdir -p /var/backups/deploykit

# Ensure shared network exists
docker network create deploykit-network >/dev/null 2>&1 || true

# Build — show output so errors are visible
info "Building images (this takes 2–4 minutes on first run)..."
if ! docker compose -f "$COMPOSE_FILE" build; then
  printf "\n"
  error "Build failed. Check the output above for details.\n  Debug: cd ${DEPLOYKIT_DIR} && docker compose -f ${COMPOSE_FILE} build"
fi
log "Images built"

# Start
info "Starting services..."
docker compose -f "$COMPOSE_FILE" up -d
log "Services started"

# Wait for all services
info "Waiting for services to be healthy..."
TIMEOUT=120
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  RUNNING=$(docker compose -f "$COMPOSE_FILE" ps 2>/dev/null | grep -c "Up" || true)
  [ "$RUNNING" -ge 4 ] 2>/dev/null && break
  sleep 3
  ELAPSED=$((ELAPSED + 3))
done

RUNNING=$(docker compose -f "$COMPOSE_FILE" ps 2>/dev/null | grep -c "Up" || true)
if [ "$RUNNING" -ge 4 ] 2>/dev/null; then
  log "All services healthy (${RUNNING} containers running)"
else
  warn "Some services may still be starting."
  docker compose -f "$COMPOSE_FILE" ps
fi

# ─── Step 7: Admin account ───────────────────────────────────────────────────
step 7 "Admin account"

API_READY=false
info "Waiting for API..."
for _ in $(seq 1 40); do
  if docker exec deploykit-api sh -c 'curl -sf http://localhost:4000/health >/dev/null 2>&1'; then
    API_READY=true
    break
  fi
  sleep 3
done

if [ "$API_READY" = false ]; then
  warn "API not responding yet."
  info "Check logs: docker logs deploykit-api"
  info "Once running, open https://${DOMAIN} to register."
elif [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  RESULT=$(docker exec deploykit-api sh -c "
    curl -sf \
      -H 'Content-Type: application/json' \
      -d '{\"0\":{\"json\":{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}}}' \
      'http://localhost:4000/trpc/auth.register?batch=1'
  " 2>&1 || echo "")

  if printf '%s' "$RESULT" | grep -q '"result"'; then
    log "Admin account created: ${ADMIN_EMAIL}"
  else
    warn "Admin account could not be created automatically."
    info "Open https://${DOMAIN} to register — first user becomes admin."
  fi
else
  info "No --admin-email provided. Open https://${DOMAIN} to create your admin account."
  info "The first user to register becomes admin."
fi

# ─── Done ────────────────────────────────────────────────────────────────────
printf "\n${GREEN}${BOLD}"
printf "  ╔══════════════════════════════════════════╗\n"
printf "  ║      ✓  DeployKit is ready!              ║\n"
printf "  ╚══════════════════════════════════════════╝\n"
printf "${NC}\n"

printf "  ${BOLD}Dashboard:${NC}  https://${DOMAIN}\n"
printf "  ${BOLD}Directory:${NC}  ${DEPLOYKIT_DIR}\n"
printf "\n"
printf "  ${BOLD}Useful commands:${NC}\n"
printf "    cd ${DEPLOYKIT_DIR}\n"
printf "    docker compose -f ${COMPOSE_FILE} ps           # container status\n"
printf "    docker compose -f ${COMPOSE_FILE} logs -f      # live logs\n"
printf "    docker compose -f ${COMPOSE_FILE} restart      # restart all\n"
printf "\n"
printf "  ${BOLD}Update DeployKit later:${NC}\n"
printf "    cd ${DEPLOYKIT_DIR} && ./update.sh\n"
printf "\n"
printf "  ${YELLOW}⚠  DNS: make sure an A record points ${DOMAIN} → this server's public IP.${NC}\n"
printf "\n"