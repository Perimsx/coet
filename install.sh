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

log() { printf '[install] %s\n' "$*"; }
fail() { printf '[install] ERROR: %s\n' "$*" >&2; exit 1; }

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
    run_root apt-get update
    run_root apt-get install -y ca-certificates curl git tar gzip xz-utils build-essential
  elif command -v dnf >/dev/null 2>&1; then
    run_root dnf install -y ca-certificates curl git tar gzip xz gcc gcc-c++ make
  elif command -v yum >/dev/null 2>&1; then
    run_root yum install -y ca-certificates curl git tar gzip xz gcc gcc-c++ make
  elif command -v apk >/dev/null 2>&1; then
    run_root apk add --no-cache ca-certificates curl git tar gzip xz build-base
  elif command -v pacman >/dev/null 2>&1; then
    run_root pacman -Sy --noconfirm ca-certificates curl git tar gzip xz base-devel
  else
    fail "无法识别 Linux 包管理器，请先安装 Git、curl、tar 和编译工具"
  fi
}

install_node() {
  if node_ready; then return; fi
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
  if go_ready; then return; fi
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

wait_for_env() {
  local file="$1" example="$2"
  [ -f "$file" ] && return
  log "缺少环境文件：$file"
  log "请上传文件（可参考 $example），上传完成后回到此终端按 Enter 继续"
  [ -t 0 ] || fail "当前终端不可交互，请上传 $file 后重新运行脚本"
  while [ ! -f "$file" ]; do
    read -r -p "上传完成后按 Enter：" _
  done
}

start_services() {
  local api_binary="$TARGET_DIR/storage/bin/cms-api"
  local web_server="$TARGET_DIR/.next/standalone/server.js"
  [ -x "$api_binary" ] || [ -f "$api_binary" ] || fail "Go API 构建产物不存在：$api_binary"
  [ -f "$web_server" ] || fail "Next.js 构建产物不存在：$web_server"

  if pm2 describe "$API_NAME" >/dev/null 2>&1; then
    pm2 restart "$API_NAME" --update-env
  else
    pm2 start "$api_binary" --name "$API_NAME" --cwd "$TARGET_DIR/backend" --update-env
  fi
  if pm2 describe "$WEB_NAME" >/dev/null 2>&1; then
    PORT="$WEB_PORT" HOSTNAME=127.0.0.1 pm2 restart "$WEB_NAME" --update-env
  else
    PORT="$WEB_PORT" HOSTNAME=127.0.0.1 pm2 start "$web_server" --name "$WEB_NAME" --cwd "$TARGET_DIR" --update-env
  fi
  pm2 save
}

health_check() {
  local url="$1" attempts=30
  while [ "$attempts" -gt 0 ]; do
    if curl -fsS --max-time 3 "$url" >/dev/null 2>&1; then return; fi
    attempts=$((attempts - 1))
    sleep 1
  done
  fail "健康检查失败：$url，请查看 pm2 logs"
}

main() {
  [ "$(uname -s)" = "Linux" ] || fail "此单文件首次部署脚本面向 Linux 服务器"
  install_base_packages
  install_node
  install_go
  install_node_tools
  prepare_repository
  adopt_env_files
  wait_for_env "$TARGET_DIR/.env" "$TARGET_DIR/.env.example"
  wait_for_env "$TARGET_DIR/backend/.env" "$TARGET_DIR/backend/.env.example"
  load_runtime_ports

  cd "$TARGET_DIR"
  log "安装项目依赖并初始化运行目录"
  npm run setup
  log "构建 Next.js 和 Go API（首次部署暂不重启）"
  CMS_REPOSITORY_DIR="$TARGET_DIR" CMS_DEPLOY_SKIP_RESTART=true node scripts/deploy.mjs
  log "启动 API 和 Next.js"
  start_services
  health_check "http://127.0.0.1:${API_PORT}/api/v1/health"
  health_check "http://127.0.0.1:${WEB_PORT}/"
  log "首次部署完成：API :${API_PORT}，Next.js :${WEB_PORT}"
}

main "$@"
