#!/usr/bin/env bash

set -Eeuo pipefail

APP_NAME="${APP_NAME:-coet-blog}"
APP_PORT="${PORT:-1021}"
PM2_CONFIG="${PM2_CONFIG:-ecosystem.config.cjs}"
LOG_DIR="${LOG_DIR:-storage/logs}"
DEPLOY_LOG="${LOG_DIR}/deploy.log"
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-http://127.0.0.1:${APP_PORT}}"
INSTALL_TIMEOUT="${INSTALL_TIMEOUT:-600}"
BUILD_TIMEOUT="${BUILD_TIMEOUT:-900}"
HEALTH_RETRIES="${HEALTH_RETRIES:-15}"
NODE_BUILD_MEMORY="${NODE_BUILD_MEMORY:-1024}"

if [[ -t 1 ]]; then
  RESET=$'\033[0m'
  BOLD=$'\033[1m'
  DIM=$'\033[2m'
  CYAN=$'\033[36m'
  GREEN=$'\033[32m'
  YELLOW=$'\033[33m'
  RED=$'\033[31m'
  MAGENTA=$'\033[35m'
else
  RESET=""
  BOLD=""
  DIM=""
  CYAN=""
  GREEN=""
  YELLOW=""
  RED=""
  MAGENTA=""
fi

timestamp() {
  date '+%Y-%m-%d %H:%M:%S'
}

section() {
  printf '\n%b==> %s%b\n' "${BOLD}${MAGENTA}" "$1" "${RESET}"
}

info() {
  printf '%b[%s]%b %s\n' "${CYAN}" "$(timestamp)" "${RESET}" "$1"
}

success() {
  printf '%b[%s]%b %b%s%b\n' "${GREEN}" "$(timestamp)" "${RESET}" "${GREEN}" "$1" "${RESET}"
}

warn() {
  printf '%b[%s]%b %b%s%b\n' "${YELLOW}" "$(timestamp)" "${RESET}" "${YELLOW}" "$1" "${RESET}"
}

fail() {
  printf '%b[%s]%b %b%s%b\n' "${RED}" "$(timestamp)" "${RESET}" "${RED}" "$1" "${RESET}" >&2
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "Missing required command: $1"
    exit 1
  fi
}

run_with_timeout() {
  local seconds="$1"
  shift

  if command -v timeout >/dev/null 2>&1; then
    timeout "$seconds" "$@"
  else
    "$@"
  fi
}

sync_standalone_assets() {
  mkdir -p .next/standalone/public .next/standalone/.next/static

  if [[ -d public ]]; then
    cp -R public/. .next/standalone/public/
  fi

  if [[ -d .next/static ]]; then
    cp -R .next/static/. .next/standalone/.next/static/
  fi
}

health_check() {
  if ! command -v curl >/dev/null 2>&1; then
    warn "curl is not installed; skipping health check."
    return
  fi

  local attempt=1

  while (( attempt <= HEALTH_RETRIES )); do
    if curl -fsS --connect-timeout 2 --max-time 5 "${HEALTH_ENDPOINT}" >/dev/null 2>&1; then
      success "Health check passed at ${HEALTH_ENDPOINT}"
      return
    fi

    printf '%b.%b' "${DIM}" "${RESET}"
    sleep 2
    ((attempt++))
  done

  printf '\n'
  fail "Health check failed after ${HEALTH_RETRIES} attempts"
  return 1
}

mkdir -p "${LOG_DIR}"
touch "${DEPLOY_LOG}"
exec > >(tee -a "${DEPLOY_LOG}") 2>&1

trap 'fail "Deploy stopped unexpectedly at line ${LINENO}"' ERR

DEPLOY_START="$(date +%s)"

printf '\n%bCoet production deploy%b\n' "${BOLD}${CYAN}" "${RESET}"
printf '%bLog file:%b %s\n' "${DIM}" "${RESET}" "${DEPLOY_LOG}"

section "Check prerequisites"
require_command node
require_command pnpm
require_command pm2
info "Node $(node -v)"
info "pnpm $(pnpm -v)"

section "Update repository"
if [[ -d .git && "${SKIP_GIT_PULL:-0}" != "1" ]]; then
  if git diff --quiet && git diff --cached --quiet; then
    info "Pulling latest changes with fast-forward only"
    git pull --ff-only
  else
    warn "Worktree is dirty; skipping git pull."
  fi
else
  info "Skipping git pull"
fi

section "Install dependencies"
run_with_timeout "${INSTALL_TIMEOUT}" pnpm install --frozen-lockfile
success "Dependencies installed"

section "Sync database"
if [[ -f drizzle.config.ts || -f drizzle.config.js || -f drizzle.config.cjs || -f drizzle.config.mjs ]]; then
  pnpm db:push --accept-data-loss
  success "Database schema synced"
else
  warn "Drizzle config not found; skipping pnpm db:push."
fi

section "Build application"
rm -rf .next/cache .next/trace
export NODE_OPTIONS="--max-old-space-size=${NODE_BUILD_MEMORY}"
export NEXT_TELEMETRY_DISABLED=1
info "NODE_OPTIONS=${NODE_OPTIONS}"
run_with_timeout "${BUILD_TIMEOUT}" pnpm build
unset NODE_OPTIONS
sync_standalone_assets
success "Build completed"

section "Restart service"
if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
  pm2 restart "${PM2_CONFIG}" --update-env
else
  pm2 start "${PM2_CONFIG}"
fi
pm2 save >/dev/null
success "PM2 process updated"

section "Run health check"
health_check

DEPLOY_END="$(date +%s)"
ELAPSED="$((DEPLOY_END - DEPLOY_START))"

printf '\n%bDeploy finished successfully%b\n' "${BOLD}${GREEN}" "${RESET}"
printf '%bElapsed:%b %ss\n' "${DIM}" "${RESET}" "${ELAPSED}"
printf '%bApp:%b %s\n' "${DIM}" "${RESET}" "${APP_NAME}"
printf '%bEndpoint:%b %s\n\n' "${DIM}" "${RESET}" "${HEALTH_ENDPOINT}"
