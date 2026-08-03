#!/usr/bin/env bash
set -Eeuo pipefail

# Upload this file to a server and run: bash install.sh
REPOSITORY_URL="${REPOSITORY_URL:-https://github.com/kerntau/blog.git}"
BRANCH="${BRANCH:-main}"
TARGET_DIR="${TARGET_DIR:-/srv/xuzhan}"
WEB_NAME="${CMS_PM2_WEB_NAME:-xstack-core}"
API_NAME="${CMS_PM2_API_NAME:-xstack-cms-api}"
WEB_PORT="${CMS_WEB_PORT:-3010}"
API_PORT="${CMS_API_PORT:-8080}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
CURRENT_DIR="$(pwd -P)"
APP_UID="$(id -u)"
APP_GID="$(id -g)"
STEP_INDEX=0
STEP_TOTAL=12
STEP_LABEL=""
STEP_STARTED_AT=0
SERVER_IP=""
SITE_URL=""
INITIAL_ADMIN_PASSWORD=""

if [ -t 1 ] && [ "${NO_COLOR:-}" != "1" ]; then
  C_RESET=$'\033[0m'
  C_BOLD=$'\033[1m'
  C_DIM=$'\033[2m'
  C_BLUE=$'\033[38;5;75m'
  C_CYAN=$'\033[38;5;80m'
  C_GREEN=$'\033[38;5;114m'
  C_YELLOW=$'\033[38;5;221m'
  C_RED=$'\033[38;5;203m'
else
  C_RESET=''
  C_BOLD=''
  C_DIM=''
  C_BLUE=''
  C_CYAN=''
  C_GREEN=''
  C_YELLOW=''
  C_RED=''
fi

print_banner() {
  printf '\n%s╭──────────────────────────────────────────────────────────────╮%s\n' "$C_BLUE" "$C_RESET"
  printf '%s│%s  %sXUZHAN · 首次部署向导%s                                  %s│%s\n' "$C_BLUE" "$C_RESET" "$C_BOLD" "$C_RESET" "$C_BLUE" "$C_RESET"
  printf '%s│%s  自动安装环境 · 拉取代码 · 配置环境 · 构建 · 启动         %s│%s\n' "$C_BLUE" "$C_RESET" "$C_BLUE" "$C_RESET"
  printf '%s╰──────────────────────────────────────────────────────────────╯%s\n\n' "$C_BLUE" "$C_RESET"
}

step_begin() {
  STEP_INDEX=$((STEP_INDEX + 1))
  STEP_LABEL="$1"
  STEP_STARTED_AT="$(date +%s)"
  printf '%s[%02d/%02d]%s %s%s%s\n' "$C_BLUE" "$STEP_INDEX" "$STEP_TOTAL" "$C_RESET" "$C_BOLD" "$STEP_LABEL" "$C_RESET"
}

step_success() {
  local elapsed=$(( $(date +%s) - STEP_STARTED_AT ))
  printf '%s  ✔ 完成%s %s(%ss)%s\n' "$C_GREEN" "$C_RESET" "$C_DIM" "$elapsed" "$C_RESET"
}

step_note() {
  printf '%s  • %s%s\n' "$C_DIM" "$*" "$C_RESET"
}

log() { step_note "$*"; }
fail() {
  printf '\n%s  ✖ 部署失败%s\n' "$C_RED" "$C_RESET" >&2
  printf '%s  %s%s\n' "$C_RED" "$*" "$C_RESET" >&2
  printf '%s  当前阶段：%s%s\n' "$C_DIM" "${STEP_LABEL:-未开始}" "$C_RESET" >&2
  exit 1
}

run_root() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    fail "需要 root 权限或 sudo：$*"
  fi
}

version_major() {
  printf '%s\n' "$1" | sed -E 's/^v?([0-9]+).*/\1/'
}

node_ready() {
  command -v node >/dev/null 2>&1 && [ "$(version_major "$(node --version 2>/dev/null)")" -ge 20 ] 2>/dev/null
}

go_ready() {
  if ! command -v go >/dev/null 2>&1; then return 1; fi
  local version minor
  version="$(go version 2>/dev/null)"
  minor="$(printf '%s\n' "$version" | sed -nE 's/.*go1\.([0-9]+).*/\1/p')"
  [ -n "$minor" ] && [ "$minor" -ge 26 ]
}

read_env_value() {
  local file="$1" key="$2"
  [ -f "$file" ] || return 0
  awk -F= -v key="$key" '
    $1 ~ "^[[:space:]]*" key "[[:space:]]*$" {
      value = $0
      sub(/^[^=]*=/, "", value)
      sub(/^[[:space:]]+/, "", value)
      sub(/[[:space:]]+$/, "", value)
      print value
      exit
    }
  ' "$file" | sed -E 's/^"(.*)"$/\1/; s/^'"'"'(.*)'"'"'$/\1/'
}

env_key_present() {
  local file="$1" key="$2"
  [ -f "$file" ] || return 1
  awk -F= -v key="$key" '$1 ~ "^[[:space:]]*" key "[[:space:]]*$" { found = 1; exit } END { exit !found }' "$file"
}

append_env_value() {
  local file="$1" key="$2" value="$3"
  printf '\n%s=%s\n' "$key" "$value" | run_root tee -a "$file" >/dev/null
}

replace_env_value() {
  local file="$1" key="$2" value="$3" temporary_file
  temporary_file="$(mktemp)"
  awk -F= -v key="$key" -v value="$value" '
    $1 ~ "^[[:space:]]*" key "[[:space:]]*$" {
      print key "=" value
      replaced = 1
      next
    }
    { print }
  ' "$file" > "$temporary_file"
  run_root mv "$temporary_file" "$file"
}

ensure_env_value() {
  local file="$1" key="$2" value="$3" current
  if ! env_key_present "$file" "$key"; then
    append_env_value "$file" "$key" "$value"
    return
  fi
  current="$(read_env_value "$file" "$key")"
  if [ -z "$current" ] || { [ "$key" = "CMS_ADMIN_PASSWORD" ] && [ "$current" = "change-me-now" ]; }; then
    replace_env_value "$file" "$key" "$value"
  fi
}

sync_env_value() {
  local file="$1" key="$2" value="$3"
  if env_key_present "$file" "$key"; then
    replace_env_value "$file" "$key" "$value"
  else
    append_env_value "$file" "$key" "$value"
  fi
}

random_value() {
  local bytes="${1:-32}"
  node -e "console.log(require('crypto').randomBytes(${bytes}).toString('base64url'))"
}

detect_server_ip() {
  local candidate
  candidate="$(curl -4fsS --max-time 5 https://api.ipify.org 2>/dev/null || true)"
  if [[ "$candidate" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
    printf '%s\n' "$candidate"
    return
  fi
  candidate="$(hostname -I 2>/dev/null | tr ' ' '\n' | awk '$0 ~ /^[0-9]+\./ { print; exit }' || true)"
  printf '%s\n' "${candidate:-127.0.0.1}"
}

adopt_env_files() {
  local relative source target source_file
  for relative in ".env" "backend/.env"; do
    target="$TARGET_DIR/$relative"
    [ -f "$target" ] && continue
    source_file=""
    for source in "$CURRENT_DIR/$relative" "$SCRIPT_DIR/$relative"; do
      if [ -f "$source" ] && [ "$source" != "$target" ]; then
        source_file="$source"
        break
      fi
    done
    [ -n "$source_file" ] || continue
    log "复制当前目录中的环境文件：$relative"
    run_root mkdir -p "$(dirname "$target")"
    run_root cp "$source_file" "$target"
  done
}

ensure_app_ownership() {
  if [ "$APP_UID" -ne 0 ] && [ -d "$TARGET_DIR" ]; then
    run_root chown -R "$APP_UID:$APP_GID" "$TARGET_DIR"
  fi
}

load_runtime_ports() {
  if [ -z "${CMS_WEB_PORT+x}" ]; then
    local configured_web_port
    configured_web_port="$(read_env_value "$TARGET_DIR/backend/.env" CMS_WEB_PORT)"
    [ -n "$configured_web_port" ] && WEB_PORT="$configured_web_port"
  fi
  if [ -z "${CMS_API_PORT+x}" ]; then
    local api_address configured_api_port
    api_address="$(read_env_value "$TARGET_DIR/backend/.env" CMS_API_ADDR)"
    if [[ "$api_address" =~ :([0-9]+)$ ]]; then
      configured_api_port="${BASH_REMATCH[1]}"
      API_PORT="$configured_api_port"
    elif [[ "$api_address" =~ ^[0-9]+$ ]]; then
      API_PORT="$api_address"
    fi
  fi
}

install_base_packages() {
  if command -v apt-get >/dev/null 2>&1; then
    log "检测到包管理器：apt"
    run_root apt-get update
    run_root apt-get install -y ca-certificates curl git tar gzip xz-utils build-essential
  elif command -v dnf >/dev/null 2>&1; then
    log "检测到包管理器：dnf"
    run_root dnf install -y ca-certificates curl git tar gzip xz gcc gcc-c++ make
  elif command -v yum >/dev/null 2>&1; then
    log "检测到包管理器：yum"
    run_root yum install -y ca-certificates curl git tar gzip xz gcc gcc-c++ make
  elif command -v apk >/dev/null 2>&1; then
    log "检测到包管理器：apk"
    run_root apk add --no-cache ca-certificates curl git tar gzip xz build-base
  elif command -v pacman >/dev/null 2>&1; then
    log "检测到包管理器：pacman"
    run_root pacman -Sy --noconfirm ca-certificates curl git tar gzip xz base-devel
  else
    fail "无法识别 Linux 包管理器，请先安装 Git、curl、tar 和编译工具"
  fi
}

install_node() {
  if node_ready; then
    log "Node.js 已满足要求：$(node --version)"
    return
  fi
  log "安装 Node.js 20+"
  if command -v apt-get >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | run_root bash -
    run_root apt-get install -y nodejs
  elif command -v dnf >/dev/null 2>&1; then
    run_root dnf module reset -y nodejs || true
    run_root dnf module enable -y nodejs:20 || true
    run_root dnf install -y nodejs
  elif command -v yum >/dev/null 2>&1; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | run_root bash -
    run_root yum install -y nodejs
  elif command -v apk >/dev/null 2>&1; then
    run_root apk add --no-cache nodejs npm
  elif command -v pacman >/dev/null 2>&1; then
    run_root pacman -S --noconfirm nodejs npm
  fi
  node_ready || fail "Node.js 20+ 安装失败，请手动安装后重新运行此脚本"
}

install_go() {
  if go_ready; then
    log "Go 已满足要求：$(go version | awk '{print $3}')"
    return
  fi
  log "安装 Go 1.26+"
  local go_version go_arch download_dir
  case "$(uname -m)" in
    x86_64) go_arch="amd64" ;;
    aarch64|arm64) go_arch="arm64" ;;
    *) fail "不支持的 CPU 架构：$(uname -m)" ;;
  esac
  go_version="$(curl -fsSL 'https://go.dev/VERSION?m=text' | head -n 1 | tr -d '\r')"
  [[ "$go_version" =~ ^go1\.[0-9]+([.][0-9]+)?$ ]] || fail "无法识别 Go 最新版本：$go_version"
  download_dir="$(mktemp -d)"
  curl -fL "https://go.dev/dl/${go_version}.linux-${go_arch}.tar.gz" -o "$download_dir/go.tgz"
  run_root rm -rf /usr/local/go
  run_root tar -C /usr/local -xzf "$download_dir/go.tgz"
  rm -rf -- "$download_dir"
  export PATH="/usr/local/go/bin:$PATH"
  go_ready || fail "Go 1.26+ 安装失败，请手动安装后重新运行此脚本"
}

install_node_tools() {
  log "准备 pnpm 和 PM2"
  if command -v corepack >/dev/null 2>&1; then
    run_root corepack enable || true
    corepack prepare pnpm@10.28.0 --activate || true
  fi
  if ! command -v pnpm >/dev/null 2>&1; then
    run_root npm install --global pnpm@10.28.0
  fi
  command -v pnpm >/dev/null 2>&1 || fail "pnpm 安装失败"
  if ! command -v pm2 >/dev/null 2>&1; then
    run_root npm install --global pm2
  fi
  command -v pm2 >/dev/null 2>&1 || fail "PM2 安装失败"
  log "pnpm：$(pnpm --version)，PM2：$(pm2 --version 2>/dev/null | head -n 1)"
}

prepare_repository() {
  if [ -d "$TARGET_DIR/.git" ]; then
    log "使用已有仓库：$TARGET_DIR"
    ensure_app_ownership
    git -C "$TARGET_DIR" fetch origin "$BRANCH"
    git -C "$TARGET_DIR" checkout "$BRANCH"
    git -C "$TARGET_DIR" pull --ff-only origin "$BRANCH"
    return
  fi
  if [ -e "$TARGET_DIR" ] && [ "$(find "$TARGET_DIR" -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null)" ]; then
    if [ "$TARGET_DIR" = "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/install.sh" ]; then
      local clone_dir
      clone_dir="$(mktemp -d)"
      log "当前目录包含安装脚本，先克隆到临时目录再合并：$TARGET_DIR"
      run_root git clone --branch "$BRANCH" "$REPOSITORY_URL" "$clone_dir"
      run_root cp -a "$clone_dir/." "$TARGET_DIR/"
      run_root rm -rf -- "$clone_dir"
      ensure_app_ownership
      return
    fi
    fail "目标目录非空但不是 Git 仓库：$TARGET_DIR"
  fi
  run_root mkdir -p "$(dirname "$TARGET_DIR")"
  log "拉取仓库：$REPOSITORY_URL@$BRANCH"
  run_root git clone --branch "$BRANCH" "$REPOSITORY_URL" "$TARGET_DIR"
  ensure_app_ownership
}

ensure_runtime_env() {
  local root_env="$TARGET_DIR/.env"
  local backend_env="$TARGET_DIR/backend/.env"
  local server_ip site_url shared_secret admin_password
  server_ip="$(detect_server_ip)"
  site_url="http://${server_ip}:${WEB_PORT}"
  shared_secret="$(random_value 32)"
  admin_password="$(random_value 18)"
  SERVER_IP="$server_ip"
  SITE_URL="$site_url"
  log "检测到服务器 IP：$server_ip"
  log "前台访问地址：$site_url"
  log "同步 API、端口、仓库路径和 PM2 运行配置"
  if [ -n "$(read_env_value "$root_env" CMS_NEXT_REVALIDATE_SECRET)" ]; then
    shared_secret="$(read_env_value "$root_env" CMS_NEXT_REVALIDATE_SECRET)"
  elif [ -n "$(read_env_value "$backend_env" CMS_NEXT_REVALIDATE_SECRET)" ]; then
    shared_secret="$(read_env_value "$backend_env" CMS_NEXT_REVALIDATE_SECRET)"
  fi

  if [ ! -f "$root_env" ]; then
    log "未找到 $root_env，按实际 IP 自动生成"
    run_root tee "$root_env" >/dev/null <<EOF
# 由 install.sh 自动生成；如需 HTTPS 或反向代理，请按实际情况修改
CMS_API_PROXY_URL=http://127.0.0.1:${API_PORT}
CMS_CONTENT_API_URL=http://127.0.0.1:${API_PORT}
CMS_NEXT_REVALIDATE_SECRET=${shared_secret}
NEXT_PUBLIC_SITE_URL=${site_url}
SITE_URL=${site_url}
CMS_BAIDU_PUSH_TOKEN=
CMS_INDEXNOW_KEY=
EOF
  else
    sync_env_value "$root_env" CMS_API_PROXY_URL "http://127.0.0.1:${API_PORT}"
    sync_env_value "$root_env" CMS_CONTENT_API_URL "http://127.0.0.1:${API_PORT}"
    sync_env_value "$root_env" CMS_NEXT_REVALIDATE_SECRET "$shared_secret"
    sync_env_value "$root_env" NEXT_PUBLIC_SITE_URL "$site_url"
    sync_env_value "$root_env" SITE_URL "$site_url"
  fi

  if [ ! -f "$backend_env" ]; then
    log "未找到 $backend_env，按实际端口和仓库路径自动生成"
    run_root mkdir -p "$(dirname "$backend_env")"
    run_root tee "$backend_env" >/dev/null <<EOF
# 由 install.sh 自动生成；反向代理配置不由本脚本管理
CMS_ENV_FILE=.env
CMS_API_ADDR=:${API_PORT}
CMS_DATABASE_PATH=../storage/db/blog.sqlite
CMS_ADMIN_PASSWORD=${admin_password}
CMS_COOKIE_SECURE=false
CMS_SESSION_DAYS=30
CMS_REPOSITORY_DIR=${TARGET_DIR}
CMS_GIT_BRANCH=${BRANCH}
CMS_GIT_REMOTE=origin
CMS_DEPLOY_SCRIPT=scripts/deploy.mjs
CMS_ROLLBACK_SCRIPT=scripts/deploy.mjs
CMS_RESTART_AFTER_DEPLOY=true
CMS_MANAGED_PROCESS=true
CMS_PM2_WEB_NAME=${WEB_NAME}
CMS_WEB_PORT=${WEB_PORT}
CMS_NEXT_REVALIDATE_URL=http://127.0.0.1:${WEB_PORT}/api/internal/revalidate
CMS_NEXT_REVALIDATE_SECRET=${shared_secret}
CMS_INDEXNOW_KEY=
CMS_BAIDU_PUSH_TOKEN=
EOF
    INITIAL_ADMIN_PASSWORD="$admin_password"
  else
    sync_env_value "$backend_env" CMS_ENV_FILE ".env"
    sync_env_value "$backend_env" CMS_API_ADDR ":${API_PORT}"
    sync_env_value "$backend_env" CMS_DATABASE_PATH "../storage/db/blog.sqlite"
    if ! env_key_present "$backend_env" CMS_ADMIN_PASSWORD || [ -z "$(read_env_value "$backend_env" CMS_ADMIN_PASSWORD)" ] || [ "$(read_env_value "$backend_env" CMS_ADMIN_PASSWORD)" = "change-me-now" ]; then
      ensure_env_value "$backend_env" CMS_ADMIN_PASSWORD "$admin_password"
      INITIAL_ADMIN_PASSWORD="$admin_password"
    fi
    sync_env_value "$backend_env" CMS_COOKIE_SECURE "false"
    sync_env_value "$backend_env" CMS_SESSION_DAYS "30"
    sync_env_value "$backend_env" CMS_REPOSITORY_DIR "$TARGET_DIR"
    sync_env_value "$backend_env" CMS_GIT_BRANCH "$BRANCH"
    sync_env_value "$backend_env" CMS_GIT_REMOTE "origin"
    sync_env_value "$backend_env" CMS_DEPLOY_SCRIPT "scripts/deploy.mjs"
    sync_env_value "$backend_env" CMS_ROLLBACK_SCRIPT "scripts/deploy.mjs"
    sync_env_value "$backend_env" CMS_RESTART_AFTER_DEPLOY "true"
    sync_env_value "$backend_env" CMS_MANAGED_PROCESS "true"
    sync_env_value "$backend_env" CMS_PM2_WEB_NAME "$WEB_NAME"
    sync_env_value "$backend_env" CMS_WEB_PORT "$WEB_PORT"
    sync_env_value "$backend_env" CMS_NEXT_REVALIDATE_URL "http://127.0.0.1:${WEB_PORT}/api/internal/revalidate"
    sync_env_value "$backend_env" CMS_NEXT_REVALIDATE_SECRET "$shared_secret"
  fi
}

start_services() {
  local api_binary="$TARGET_DIR/storage/bin/cms-api"
  local web_server="$TARGET_DIR/.next/standalone/server.js"
  [ -x "$api_binary" ] || [ -f "$api_binary" ] || fail "Go API 构建产物不存在：$api_binary"
  [ -f "$web_server" ] || fail "Next.js 构建产物不存在：$web_server"

  if pm2 describe "$API_NAME" >/dev/null 2>&1; then
    log "重启 PM2 API：$API_NAME"
    pm2 restart "$API_NAME" --update-env
  else
    log "创建 PM2 API：$API_NAME"
    pm2 start "$api_binary" --name "$API_NAME" --cwd "$TARGET_DIR/backend" --update-env
  fi
  if pm2 describe "$WEB_NAME" >/dev/null 2>&1; then
    log "重启 PM2 前台：$WEB_NAME"
    PORT="$WEB_PORT" HOSTNAME=127.0.0.1 pm2 restart "$WEB_NAME" --update-env
  else
    log "创建 PM2 前台：$WEB_NAME"
    PORT="$WEB_PORT" HOSTNAME=127.0.0.1 pm2 start "$web_server" --name "$WEB_NAME" --cwd "$TARGET_DIR" --update-env
  fi
  pm2 save
}

health_check() {
  local url="$1" attempts=30 total=30
  log "等待服务响应：$url"
  while [ "$attempts" -gt 0 ]; do
    if curl -fsS --max-time 3 "$url" >/dev/null 2>&1; then
      log "健康检查通过"
      return
    fi
    attempts=$((attempts - 1))
    if [ $((attempts % 5)) -eq 0 ]; then
      log "服务仍在启动，剩余等待：${attempts}s"
    fi
    sleep 1
  done
  fail "健康检查失败：$url，请查看 pm2 logs"
}

print_summary() {
  printf '\n%s╭──────────────────────────────────────────────────────────────╮%s\n' "$C_GREEN" "$C_RESET"
  printf '%s│%s  %s首次部署完成%s                                      %s│%s\n' "$C_GREEN" "$C_RESET" "$C_BOLD" "$C_RESET" "$C_GREEN" "$C_RESET"
  printf '%s╰──────────────────────────────────────────────────────────────╯%s\n' "$C_GREEN" "$C_RESET"
  printf '  %s项目目录%s：%s\n' "$C_DIM" "$C_RESET" "$TARGET_DIR"
  printf '  %s服务器 IP%s：%s\n' "$C_DIM" "$C_RESET" "$SERVER_IP"
  printf '  %s前台地址%s：%s\n' "$C_DIM" "$C_RESET" "$SITE_URL"
  printf '  %sAPI 地址%s：http://127.0.0.1:%s\n' "$C_DIM" "$C_RESET" "$API_PORT"
  printf '  %sPM2 进程%s：%s、%s\n' "$C_DIM" "$C_RESET" "$API_NAME" "$WEB_NAME"
  if [ -n "$INITIAL_ADMIN_PASSWORD" ]; then
    printf '\n%s  ⚠ 首次管理员密码：%s%s\n' "$C_YELLOW" "$INITIAL_ADMIN_PASSWORD" "$C_RESET"
    printf '%s  登录后台后请立即修改管理员密码。%s\n' "$C_YELLOW" "$C_RESET"
  fi
  printf '\n%s  反向代理（Nginx/Caddy）未由本脚本配置。%s\n\n' "$C_DIM" "$C_RESET"
}

main() {
  print_banner
  step_begin "检查操作系统与运行权限"
  [ "$(uname -s)" = "Linux" ] || fail "此单文件首次部署脚本面向 Linux 服务器"
  log "CPU 架构：$(uname -m)"
  log "目标目录：$TARGET_DIR"
  step_success

  step_begin "安装系统基础依赖"
  install_base_packages
  step_success

  step_begin "准备 Node.js 20+"
  install_node
  step_success

  step_begin "准备 Go 1.26+"
  install_go
  step_success

  step_begin "准备 pnpm 与 PM2"
  install_node_tools
  step_success

  step_begin "拉取或同步项目仓库"
  prepare_repository
  step_success

  step_begin "生成并同步运行环境配置"
  adopt_env_files
  ensure_runtime_env
  load_runtime_ports
  step_success

  cd "$TARGET_DIR"
  step_begin "安装项目依赖并初始化运行目录"
  npm run setup
  step_success

  step_begin "构建 Next.js 和 Go API"
  CMS_REPOSITORY_DIR="$TARGET_DIR" CMS_DEPLOY_SKIP_RESTART=true node scripts/deploy.mjs
  step_success

  step_begin "启动 PM2 服务"
  start_services
  step_success

  step_begin "检查 Go API 健康状态"
  health_check "http://127.0.0.1:${API_PORT}/api/v1/health"
  step_success

  step_begin "检查 Next.js 前台健康状态"
  health_check "http://127.0.0.1:${WEB_PORT}/"
  step_success

  print_summary
}

main "$@"
