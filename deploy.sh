#!/usr/bin/env bash
# ============================================================
#  COT Blog PM2 Deploy Kit — Next.js Standalone
#  基于 Dawnlight Deploy Kit v2.0.0 适配
#  作者: kerntau
# ============================================================
#  可通过环境变量覆盖配置:
#    GIT_REPO, GIT_BRANCH, DEPLOY_DIR, NODE_MAJOR
#    APP_NAME, APP_PORT, APP_HOST, APP_DOMAIN
#    PM2_CONFIG
#    INSTALL_CMD, BUILD_CMD
#    SKIP_INSTALL, SKIP_BUILD, SKIP_STARTUP
#    CHECK_NOEXEC, FIX_ESBUILD_BIN, REBUILD_ESBUILD
#    HEALTH_CHECK, HEALTH_CHECK_TIMEOUT, HEALTH_CHECK_RETRIES
#    DEPLOY_LOG, KEEP_BACKUP, MIN_DISK_MB, MIN_MEM_MB
# ============================================================
set -Eeuo pipefail

# ────────────── 版本号 ──────────────
DEPLOY_SCRIPT_VERSION="1.0.0"

# ────────────── 默认配置 ──────────────
GIT_REPO="${GIT_REPO:-https://github.com/cotovo/homepage.git}"
GIT_BRANCH="${GIT_BRANCH:-main}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/cotovo}"
APP_NAME="${APP_NAME:-cotovo}"
APP_PORT="${APP_PORT:-3010}"
APP_HOST="${APP_HOST:-127.0.0.1}"
APP_DOMAIN="${APP_DOMAIN:-cot.wiki}"
PM2_CONFIG="${PM2_CONFIG:-ecosystem.config.cjs}"
INSTALL_CMD="${INSTALL_CMD:-pnpm install --frozen-lockfile}"
BUILD_CMD="${BUILD_CMD:-pnpm build}"
SKIP_INSTALL="${SKIP_INSTALL:-0}"
SKIP_BUILD="${SKIP_BUILD:-0}"
SKIP_STARTUP="${SKIP_STARTUP:-0}"
CHECK_NOEXEC="${CHECK_NOEXEC:-1}"
FIX_ESBUILD_BIN="${FIX_ESBUILD_BIN:-1}"
REBUILD_ESBUILD="${REBUILD_ESBUILD:-1}"

HEALTH_CHECK="${HEALTH_CHECK:-1}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-30}"
HEALTH_CHECK_RETRIES="${HEALTH_CHECK_RETRIES:-10}"
DEPLOY_LOG="${DEPLOY_LOG:-}"
KEEP_BACKUP="${KEEP_BACKUP:-0}"
MIN_DISK_MB="${MIN_DISK_MB:-1024}"
MIN_MEM_MB="${MIN_MEM_MB:-512}"

# Next.js standalone 产物路径（尊重 NEXT_DIST_DIR 自定义）
DIST_DIR="${NEXT_DIST_DIR:-.next}"
STANDALONE_DIR="${DIST_DIR}/standalone"
STANDALONE_SERVER="${STANDALONE_DIR}/server.js"

# ────────────── 颜色 & 样式 ──────────────
if [[ -t 1 ]] && [[ "${TERM:-}" != "dumb" ]]; then
  COLOR_RESET="\033[0m"
  COLOR_BLUE="\033[36m"
  COLOR_GREEN="\033[32m"
  COLOR_YELLOW="\033[33m"
  COLOR_RED="\033[31m"
  COLOR_BOLD="\033[1m"
  COLOR_DIM="\033[2m"
else
  COLOR_RESET="" COLOR_BLUE="" COLOR_GREEN="" COLOR_YELLOW=""
  COLOR_RED="" COLOR_BOLD="" COLOR_DIM=""
fi

# ────────────── 日志函数 ──────────────
_ts() { date '+%H:%M:%S'; }
log()  { printf "${COLOR_BLUE}[%s deploy]${COLOR_RESET} %s\n"  "$(_ts)" "$*"; }
ok()   { printf "${COLOR_GREEN}[%s   ok ]${COLOR_RESET} %s\n"  "$(_ts)" "$*"; }
warn() { printf "${COLOR_YELLOW}[%s warn ]${COLOR_RESET} %s\n" "$(_ts)" "$*"; }
err()  { printf "${COLOR_RED}[%s error]${COLOR_RESET} %s\n"    "$(_ts)" "$*" >&2; }
info() { printf "${COLOR_DIM}[%s info ]${COLOR_RESET} %s\n"    "$(_ts)" "$*"; }
line() { printf "%*s\n" "${1:-72}" '' | tr ' ' "${2:--}"; }

# ────────────── 计时工具 ──────────────
DEPLOY_START_TIME=""
_now_sec() {
  if date '+%s' &>/dev/null; then
    date '+%s'
  else
    printf '0'
  fi
}
timer_start() { DEPLOY_START_TIME="$(_now_sec)"; }
timer_elapsed() {
  local end
  end="$(_now_sec)"
  if [[ "$DEPLOY_START_TIME" == "0" || "$end" == "0" ]]; then
    printf "N/A"
  else
    local diff=$(( end - DEPLOY_START_TIME ))
    printf "%dm%ds" $(( diff / 60 )) $(( diff % 60 ))
  fi
}

_stage_start=0
stage_begin() {
  _stage_start="$(_now_sec)"
  log "$1"
}
stage_end() {
  local now
  now="$(_now_sec)"
  local msg="$1"
  if [[ "$_stage_start" != "0" && "$now" != "0" ]]; then
    local diff=$(( now - _stage_start ))
    ok "${msg} (耗时 ${diff}s)"
  else
    ok "$msg"
  fi
}

# ────────────── 部署日志 tee ──────────────
setup_deploy_log() {
  mkdir -p storage/logs 2>/dev/null || true
  if [[ -z "$DEPLOY_LOG" ]]; then
    DEPLOY_LOG="storage/logs/deploy-$(date '+%Y%m%d-%H%M%S').log"
  fi
  exec > >(tee -a "$DEPLOY_LOG") 2>&1
  info "部署日志输出到: ${DEPLOY_LOG}"
}

# ────────────── 临时文件 & 清理 ──────────────
make_temp_file() {
  local tmp=''
  if tmp="$(mktemp 2>/dev/null)"; then
    printf '%s' "$tmp"
    return 0
  fi
  tmp="${TMPDIR:-/tmp}/pm2-startup.$$.log"
  : > "$tmp"
  printf '%s' "$tmp"
}

_cleanup_files=()
register_cleanup() { _cleanup_files+=("$1"); }
cleanup() {
  for f in "${_cleanup_files[@]:-}"; do
    [[ -n "$f" && -f "$f" ]] && rm -f "$f" 2>/dev/null || true
  done
}

# ────────────── ERR trap（含回滚） ──────────────
_deploy_phase="初始化"
set_phase() { _deploy_phase="$1"; }

on_error() {
  local exit_code=$?
  err "═══════════════════════════════════════════════════════"
  err "  部署失败！失败阶段: ${_deploy_phase}"
  err "  退出码: ${exit_code}"
  err "═══════════════════════════════════════════════════════"

  if [[ -d ".next.bak" ]]; then
    warn "检测到 .next.bak 备份，尝试回滚..."
    rm -rf .next 2>/dev/null || true
    if mv .next.bak .next 2>/dev/null; then
      ok "已回滚 .next 到上一个版本"
      if command -v pm2 &>/dev/null && [[ -f "$PM2_CONFIG" ]]; then
        warn "尝试用旧版本重启 PM2..."
        pm2 startOrReload "$PM2_CONFIG" --update-env 2>/dev/null && \
          ok "PM2 已使用旧版本重启" || \
          err "PM2 重启失败，请手动检查"
      fi
    else
      err "回滚失败，请手动恢复"
    fi
  fi

  exit "$exit_code"
}
trap on_error ERR
trap cleanup EXIT

# ────────────── 操作系统 & 架构检测 ──────────────
detect_os() {
  local kernel distro arch pkg_mgr

  kernel="$(uname -s 2>/dev/null || echo 'Unknown')"
  arch="$(uname -m 2>/dev/null || echo 'unknown')"
  distro="Unknown"
  pkg_mgr="unknown"

  case "$kernel" in
    Linux)
      if grep -qiE '(microsoft|wsl)' /proc/version 2>/dev/null; then
        kernel="Linux (WSL)"
      fi
      if [[ -f /etc/os-release ]]; then
        # 子 shell 读取，避免污染脚本变量
        distro="$(source /etc/os-release 2>/dev/null && echo "${PRETTY_NAME:-${NAME:-Unknown}}")"
        local id_lower id_like
        id_lower="$(source /etc/os-release 2>/dev/null && echo "${ID:-}")"
        id_like="$(source /etc/os-release 2>/dev/null && echo "${ID_LIKE:-}")"
        case "$id_lower" in
          ubuntu|debian|linuxmint|pop)       pkg_mgr="apt" ;;
          centos|rhel|rocky|almalinux|ol)    pkg_mgr="yum" ;;
          fedora)                             pkg_mgr="dnf" ;;
          arch|manjaro|endeavouros)           pkg_mgr="pacman" ;;
          alpine)                             pkg_mgr="apk" ;;
          opensuse*|sles)                     pkg_mgr="zypper" ;;
          *)
            case "$id_like" in
              *debian*|*ubuntu*)      pkg_mgr="apt" ;;
              *rhel*|*centos*|*fedora*) pkg_mgr="yum" ;;
              *arch*)                 pkg_mgr="pacman" ;;
              *suse*)                 pkg_mgr="zypper" ;;
            esac
            ;;
        esac
      elif [[ -f /etc/redhat-release ]]; then
        distro="$(cat /etc/redhat-release)"
        pkg_mgr="yum"
      elif [[ -f /etc/alpine-release ]]; then
        distro="Alpine $(cat /etc/alpine-release)"
        pkg_mgr="apk"
      fi
      ;;
    Darwin)
      distro="macOS $(sw_vers -productVersion 2>/dev/null || echo '?')"
      pkg_mgr="brew"
      ;;
    MINGW*|MSYS*|CYGWIN*)
      distro="Windows (${kernel})"
      pkg_mgr="N/A"
      ;;
  esac

  local arch_display="$arch"
  case "$arch" in
    x86_64|amd64)   arch_display="x86_64 (amd64)" ;;
    aarch64|arm64)   arch_display="aarch64 (arm64)" ;;
    armv7l|armv7)    arch_display="armv7l (32-bit ARM)" ;;
    i686|i386)       arch_display="x86 (32-bit)" ;;
  esac

  OS_KERNEL="$kernel"
  OS_DISTRO="$distro"
  OS_ARCH="$arch"
  OS_ARCH_DISPLAY="$arch_display"
  OS_PKG_MGR="$pkg_mgr"

  info "操作系统: ${OS_KERNEL}"
  info "发行版  : ${OS_DISTRO}"
  info "CPU 架构: ${OS_ARCH_DISPLAY}"
  info "包管理器: ${OS_PKG_MGR}"
}

install_hint() {
  local tool="$1"
  case "${OS_PKG_MGR:-unknown}" in
    apt)    printf "sudo apt update && sudo apt install -y %s" "$tool" ;;
    yum)    printf "sudo yum install -y %s" "$tool" ;;
    dnf)    printf "sudo dnf install -y %s" "$tool" ;;
    pacman) printf "sudo pacman -Sy --noconfirm %s" "$tool" ;;
    apk)    printf "sudo apk add %s" "$tool" ;;
    zypper) printf "sudo zypper install -y %s" "$tool" ;;
    brew)   printf "brew install %s" "$tool" ;;
    *)      printf "请手动安装 %s" "$tool" ;;
  esac
}

# ────────────── 系统资源预检 ──────────────
check_disk_space() {
  local avail_kb
  avail_kb="$(df -Pk "$DEPLOY_DIR" 2>/dev/null | awk 'NR==2 {print $4}' || echo '0')"

  if [[ "$avail_kb" =~ ^[0-9]+$ ]] && (( avail_kb > 0 )); then
    local avail_mb=$(( avail_kb / 1024 ))
    if (( avail_mb < MIN_DISK_MB )); then
      err "磁盘可用空间不足: ${avail_mb}MB (最低要求: ${MIN_DISK_MB}MB)"
      err "请清理磁盘空间后重试"
      exit 1
    fi
    info "磁盘可用空间: ${avail_mb}MB ✓"
  else
    warn "无法检测磁盘可用空间，跳过检查"
  fi
}

check_memory() {
  local avail_mb=0

  if [[ -f /proc/meminfo ]]; then
    local mem_available
    mem_available="$(awk '/^MemAvailable:/ {print int($2/1024)}' /proc/meminfo 2>/dev/null || echo '0')"
    if [[ "$mem_available" == "0" ]]; then
      mem_available="$(awk '/^MemFree:/ {print int($2/1024)}' /proc/meminfo 2>/dev/null || echo '0')"
    fi
    avail_mb="$mem_available"
  elif command -v sysctl &>/dev/null; then
    local page_size free_pages
    page_size="$(sysctl -n hw.pagesize 2>/dev/null || echo '4096')"
    free_pages="$(vm_stat 2>/dev/null | awk '/Pages free/ {gsub(/\./,""); print $3}' || echo '0')"
    if [[ "$free_pages" =~ ^[0-9]+$ ]]; then
      avail_mb=$(( free_pages * page_size / 1024 / 1024 ))
    fi
  fi

  if (( avail_mb > 0 )); then
    if (( avail_mb < MIN_MEM_MB )); then
      warn "可用内存较低: ${avail_mb}MB (建议 >= ${MIN_MEM_MB}MB)"
      warn "Next.js 构建可能因内存不足而失败"
    else
      info "可用内存: ${avail_mb}MB ✓"
    fi
  else
    warn "无法检测可用内存，跳过检查"
  fi
}

check_ulimits() {
  local open_files
  open_files="$(ulimit -n 2>/dev/null || echo '0')"
  if [[ "$open_files" =~ ^[0-9]+$ ]] && (( open_files > 0 && open_files < 1024 )); then
    warn "当前 open files 限制较低: ${open_files} (建议 >= 1024)"
    warn "可运行: ulimit -n 65535"
  elif [[ "$open_files" =~ ^[0-9]+$ ]] && (( open_files > 0 )); then
    info "open files 限制: ${open_files} ✓"
  fi
}

check_port_conflict() {
  local existing_pm2_pid=""
  if command -v pm2 &>/dev/null; then
    existing_pm2_pid="$(pm2 pid "$APP_NAME" 2>/dev/null || echo '')"
  fi

  local conflict_pid=""
  local _ss_out=""
  if command -v ss &>/dev/null; then
    _ss_out="$(ss -tlnp "sport = :${APP_PORT}" 2>/dev/null || true)"
    if [[ -n "$_ss_out" ]]; then
      conflict_pid="$(echo "$_ss_out" | awk 'NR>1 {match($0, /pid=([0-9]+)/, arr); if(arr[1]) print arr[1]}' | head -1 || echo '')"
    fi
  fi

  if [[ -z "$conflict_pid" ]] && command -v lsof &>/dev/null; then
    conflict_pid="$(lsof -ti ":${APP_PORT}" -sTCP:LISTEN 2>/dev/null | head -1 || echo '')"
  fi

  if [[ -z "$conflict_pid" ]] && command -v netstat &>/dev/null; then
    conflict_pid="$(netstat -tlnp 2>/dev/null | awk -v port=":${APP_PORT}" '$4 ~ port {split($7,a,"/"); print a[1]}' | head -1 || echo '')"
  fi

  if [[ -z "$conflict_pid" ]] && ! command -v ss &>/dev/null && ! command -v lsof &>/dev/null && ! command -v netstat &>/dev/null; then
    warn "无法检测端口占用 (未找到 ss/lsof/netstat)"
    return 0
  fi

  if [[ -n "$conflict_pid" && "$conflict_pid" != "0" ]]; then
    if [[ -n "$existing_pm2_pid" && "$conflict_pid" == "$existing_pm2_pid" ]]; then
      info "端口 ${APP_PORT} 被当前 PM2 实例 (PID: ${conflict_pid}) 占用，重载时将自动替换 ✓"
      return 0
    fi
    local proc_name=""
    proc_name="$(ps -p "$conflict_pid" -o comm= 2>/dev/null || echo 'unknown')"
    err "端口 ${APP_PORT} 已被占用!"
    err "  PID: ${conflict_pid}  进程: ${proc_name}"
    err "  请先停止占用端口的进程，或更改 APP_PORT 环境变量"
    exit 1
  fi

  info "端口 ${APP_PORT} 可用 ✓"
}

# ────────────── 依赖版本校验 ──────────────
validate_port() {
  if ! [[ "$APP_PORT" =~ ^[0-9]+$ ]]; then
    err "APP_PORT 必须是数字，当前值: ${APP_PORT}"
    exit 1
  fi
  if (( APP_PORT < 1 || APP_PORT > 65535 )); then
    err "APP_PORT 超出范围 (1-65535): ${APP_PORT}"
    exit 1
  fi
}

require_cmd() {
  local cmd="$1"
  local hint="$2"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    err "$hint"
    exit 1
  fi
}

# ────────────── 自动安装依赖工具 ──────────────
NODE_MAJOR="${NODE_MAJOR:-20}"

auto_install_node() {
  if command -v node &>/dev/null; then
    return 0
  fi

  log "Node.js 未找到，自动安装 Node.js ${NODE_MAJOR} LTS..."

  case "${OS_PKG_MGR:-unknown}" in
    apt)
      # NodeSource 安装 Node.js
      log "添加 NodeSource ${NODE_MAJOR}.x 仓库..."
      curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
      apt-get install -y nodejs
      ;;
    yum|dnf)
      curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
      "${OS_PKG_MGR}" install -y nodejs
      ;;
    *)
      err "不支持的包管理器: ${OS_PKG_MGR:-unknown}"
      err "请手动安装 Node.js >= ${NODE_MAJOR}: https://nodejs.org/"
      exit 1
      ;;
  esac

  if ! command -v node &>/dev/null; then
    err "Node.js 自动安装失败"
    exit 1
  fi
  ok "Node.js 安装成功: $(node -v)"
}

auto_install_pnpm() {
  # 从 package.json 读取目标版本
  local pm_version=""
  if [[ -f "package.json" ]] && command -v node &>/dev/null; then
    pm_version="$(node -e "
      try {
        const pkg = require('./package.json');
        console.log(pkg.packageManager || '');
      } catch(e) {}
    " 2>/dev/null || echo '')"
  fi
  if [[ -z "$pm_version" ]]; then
    pm_version="pnpm@10"
  fi

  local target_major
  target_major="$(echo "$pm_version" | grep -oE '[0-9]+' | head -1)"

  # 检查已有 pnpm 是否兼容当前 Node.js
  if command -v pnpm &>/dev/null; then
    local current_ver current_major
    current_ver="$(pnpm --version 2>/dev/null || echo 'unknown')"
    current_major="$(echo "$current_ver" | grep -oE '^[0-9]+')"

    if [[ "$current_major" == "$target_major" ]]; then
      ok "pnpm 已安装: v${current_ver} ✓"
      return 0
    fi

    warn "pnpm 版本不兼容: 当前 v${current_ver}, 需要 ${pm_version}"
    warn "卸载旧版本后重装..."
    npm uninstall -g pnpm 2>/dev/null || true
    # 清理 corepack 缓存中的旧版本
    if command -v corepack &>/dev/null; then
      corepack disable 2>/dev/null || true
      corepack enable 2>/dev/null || true
    fi
    # 确保旧二进制被移除
    local old_bin
    old_bin="$(which pnpm 2>/dev/null || echo '')"
    if [[ -n "$old_bin" ]] && [[ -f "$old_bin" ]]; then
      rm -f "$old_bin" 2>/dev/null || true
    fi
  fi

  log "安装 ${pm_version}..."

  if command -v corepack &>/dev/null; then
    corepack enable 2>/dev/null || true
    corepack prepare "$pm_version" --activate
  elif command -v npm &>/dev/null; then
    npm install -g "$pm_version"
  else
    err "无法自动安装 pnpm (corepack 和 npm 均不可用)"
    exit 1
  fi

  if ! command -v pnpm &>/dev/null; then
    err "pnpm 自动安装失败"
    err "可尝试手动安装: npm install -g ${pm_version}"
    exit 1
  fi
  ok "pnpm 安装成功: v$(pnpm --version)"
}

auto_install_pm2() {
  if command -v pm2 &>/dev/null; then
    return 0
  fi

  log "pm2 未找到，自动安装..."
  pnpm add -g pm2

  if ! command -v pm2 &>/dev/null; then
    # fallback to npm if pnpm global fails
    npm install -g pm2 || true
  fi

  if ! command -v pm2 &>/dev/null; then
    err "pm2 自动安装失败"
    exit 1
  fi
  ok "pm2 安装成功"
}

check_node_version() {
  local node_ver
  node_ver="$(node -v 2>/dev/null || echo 'unknown')"
  local major
  major="$(node -p "parseInt(process.versions.node.split('.')[0], 10)" 2>/dev/null || echo '0')"
  if ! [[ "$major" =~ ^[0-9]+$ ]] || (( major < 18 )); then
    err "Node.js 版本过低: ${node_ver} (需要 >= 18)"
    err "安装提示: $(install_hint nodejs)"
    exit 1
  fi
  info "Node.js: ${node_ver} (major: ${major}) ✓"
}

check_pnpm_version() {
  local pnpm_ver
  pnpm_ver="$(pnpm --version 2>/dev/null || echo 'unknown')"
  info "pnpm: v${pnpm_ver}"

  if [[ -f "package.json" ]] && command -v node &>/dev/null; then
    local expected
    expected="$(node -e "
      try {
        const pkg = require('./package.json');
        const pm = pkg.packageManager || '';
        const match = pm.match(/pnpm@(\d+\.\d+\.\d+)/);
        if (match) console.log(match[1]);
      } catch(e) {}
    " 2>/dev/null || echo '')"

    if [[ -n "$expected" ]]; then
      if [[ "$pnpm_ver" == "$expected" ]]; then
        info "pnpm 版本与 package.json packageManager 字段匹配: ${expected} ✓"
      else
        warn "pnpm 版本不匹配: 当前 ${pnpm_ver}, package.json 声明 ${expected}"
        warn "建议运行: corepack use pnpm@${expected}"
      fi
    fi
  fi
}

# ────────────── noexec 挂载检测 ──────────────
check_noexec_mount() {
  if [[ "$CHECK_NOEXEC" != "1" ]]; then
    return 0
  fi

  if ! command -v findmnt >/dev/null 2>&1; then
    warn "findmnt 未找到，跳过 noexec 挂载检查"
    return 0
  fi

  local mount_opts mount_target
  mount_opts="$(findmnt -no OPTIONS -T "$DEPLOY_DIR" 2>/dev/null || true)"
  mount_target="$(findmnt -no TARGET -T "$DEPLOY_DIR" 2>/dev/null || true)"

  if [[ -n "$mount_opts" && "$mount_opts" == *noexec* ]]; then
    err "检测到 noexec 挂载点: ${mount_target:-unknown} (${mount_opts})"
    err "修复: mount -o remount,exec ${mount_target:-<mountpoint>}"
    exit 1
  fi
}

# ────────────── esbuild 二进制修复 ──────────────
fix_esbuild_binary() {
  if [[ "$FIX_ESBUILD_BIN" != "1" ]]; then
    return 0
  fi

  if [[ ! -d node_modules ]]; then
    warn "node_modules 未找到，跳过 esbuild 二进制修复"
    return 0
  fi

  local expected_platform=""
  case "${OS_ARCH:-}" in
    x86_64|amd64)   expected_platform="linux-x64" ;;
    aarch64|arm64)   expected_platform="linux-arm64" ;;
    armv7l|armv7)    expected_platform="linux-arm" ;;
  esac

  if [[ -n "$expected_platform" ]]; then
    local platform_dir="node_modules/@esbuild/${expected_platform}"
    if [[ -d node_modules/@esbuild ]] && [[ ! -d "$platform_dir" ]]; then
      warn "esbuild 平台包未匹配当前架构 (期望: ${expected_platform})"
      warn "可能需要重新安装: pnpm install --force"
    fi
  fi

  local path
  local found=0
  local fixed=0
  while IFS= read -r path; do
    found=1
    if [[ ! -x "$path" ]]; then
      chmod +x "$path"
      fixed=$((fixed + 1))
    fi
  done < <(find node_modules -type f -path "*/node_modules/@esbuild/*/bin/esbuild" 2>/dev/null || true)

  if (( found == 0 )); then
    warn "未在 node_modules 中找到 esbuild 二进制文件"
  elif (( fixed > 0 )); then
    ok "已修复 ${fixed} 个 esbuild 二进制文件的执行权限"
  else
    info "esbuild 二进制权限检查通过 ✓"
  fi

  if [[ "$REBUILD_ESBUILD" == "1" ]]; then
    stage_begin "重建 esbuild 包..."
    if pnpm rebuild esbuild 2>/dev/null; then
      stage_end "esbuild 重建完成"
    else
      warn "pnpm rebuild esbuild 失败，继续构建步骤"
    fi
  fi
}

# ────────────── .next 备份 & 回滚 ──────────────
backup_output() {
  if [[ -d ".next" ]]; then
    log "备份现有 .next 目录..."
    rm -rf .next.bak 2>/dev/null || true
    if cp -a .next .next.bak 2>/dev/null; then
      ok "已备份 .next -> .next.bak"
    else
      warn "备份 .next 失败，继续构建（无法回滚）"
    fi
  fi
}

cleanup_backup() {
  if [[ "$KEEP_BACKUP" == "1" ]]; then
    info "保留 .next.bak 备份 (KEEP_BACKUP=1)"
    return 0
  fi
  if [[ -d ".next.bak" ]]; then
    rm -rf .next.bak 2>/dev/null || true
    info "已清理 .next.bak 备份"
  fi
}

# ────────────── Next.js standalone 静态资源拷贝 ──────────────
copy_standalone_assets() {
  log "拷贝 Next.js standalone 静态资源..."

  # 拷贝 .next/static → .next/standalone/.next/static
  if [[ -d ".next/static" ]]; then
    mkdir -p "${STANDALONE_DIR}/.next/static"
    cp -a .next/static/. "${STANDALONE_DIR}/.next/static/"
    ok "已拷贝 .next/static → ${STANDALONE_DIR}/.next/static/"
  else
    err ".next/static 目录不存在，静态资源将无法加载"
    exit 1
  fi

  # 拷贝 public → .next/standalone/public
  if [[ -d "public" ]]; then
    mkdir -p "${STANDALONE_DIR}/public"
    cp -a public/. "${STANDALONE_DIR}/public/"
    ok "已拷贝 public → ${STANDALONE_DIR}/public/"
  else
    warn "public 目录不存在，跳过"
  fi
}

# ────────────── PM2 健康检查 ──────────────
health_check() {
  if [[ "$HEALTH_CHECK" != "1" ]]; then
    info "跳过健康检查 (HEALTH_CHECK=0)"
    return 0
  fi

  log "执行 PM2 进程健康检查..."

  local retries=0
  local max_retries=$HEALTH_CHECK_RETRIES
  local status=""

  while (( retries < max_retries )); do
    sleep 2
    status="$(APP_NAME="$APP_NAME" pm2 jlist 2>/dev/null | node -e "
      let d='';
      process.stdin.on('data',c=>d+=c);
      process.stdin.on('end',()=>{
        try {
          const apps=JSON.parse(d);
          const app=apps.find(a=>a.name===process.env.APP_NAME);
          console.log(app ? app.pm2_env.status : 'not_found');
        } catch(e) { console.log('parse_error'); }
      });
    " 2>/dev/null || echo 'check_failed')"

    if [[ "$status" == "online" ]]; then
      ok "PM2 进程状态: online ✓"
      break
    fi

    retries=$((retries + 1))
    if (( retries < max_retries )); then
      info "等待进程启动 (${retries}/${max_retries})... 状态: ${status}"
    fi
  done

  if [[ "$status" != "online" ]]; then
    err "PM2 进程未能进入 online 状态 (最终状态: ${status})"
    err "查看日志: pm2 logs ${APP_NAME} --lines 50"
    return 1
  fi

  if command -v curl &>/dev/null; then
    log "执行 HTTP 健康检查: http://${APP_HOST}:${APP_PORT}/ ..."
    local http_retries=0
    local http_ok=0

    while (( http_retries < 5 )); do
      local http_code
      http_code="$(curl -sS -o /dev/null -w '%{http_code}' \
        --connect-timeout 5 --max-time 10 \
        "http://${APP_HOST}:${APP_PORT}/" 2>/dev/null || echo '000')"

      if [[ "$http_code" =~ ^[23] ]]; then
        ok "HTTP 健康检查通过 (status: ${http_code}) ✓"
        http_ok=1
        break
      fi

      http_retries=$((http_retries + 1))
      if (( http_retries < 5 )); then
        info "HTTP 检查重试 (${http_retries}/5)... status: ${http_code}"
        sleep 3
      fi
    done

    if (( http_ok == 0 )); then
      warn "HTTP 健康检查未通过 (最终 status: ${http_code})"
      warn "服务可能需要更长时间启动，请手动检查"
    fi
  elif command -v wget &>/dev/null; then
    log "执行 HTTP 健康检查 (wget): http://${APP_HOST}:${APP_PORT}/ ..."
    if wget -q --spider --timeout=10 "http://${APP_HOST}:${APP_PORT}/" 2>/dev/null; then
      ok "HTTP 健康检查通过 ✓"
    else
      warn "HTTP 健康检查未通过，请手动检查"
    fi
  else
    info "未找到 curl/wget，跳过 HTTP 健康检查"
  fi
}

# ────────────── PM2 startup ──────────────
setup_pm2_startup() {
  if [[ "$SKIP_STARTUP" == "1" ]]; then
    warn "跳过 PM2 startup 配置 (SKIP_STARTUP=1)"
    return 0
  fi

  log "配置 PM2 开机自启..."

  local is_root=0
  if [[ "$(id -u 2>/dev/null || echo '1000')" == "0" ]]; then
    is_root=1
  fi

  local startup_log
  startup_log="$(make_temp_file)"
  register_cleanup "$startup_log"

  if pm2 startup >"$startup_log" 2>&1; then
    ok "PM2 startup 配置成功"
  else
    if (( is_root == 0 )); then
      warn "PM2 startup 需要 root 权限"
      local sudo_cmd
      sudo_cmd="$(grep -oE 'sudo .*$' "$startup_log" 2>/dev/null | head -1 || echo '')"
      if [[ -n "$sudo_cmd" ]]; then
        printf "\n"
        warn "请手动执行以下命令:"
        printf "  ${COLOR_BOLD}%s${COLOR_RESET}\n\n" "$sudo_cmd"
      else
        warn "请查看输出并以 root 权限重新执行:"
        cat "$startup_log"
      fi
    else
      warn "PM2 startup 配置失败，请检查以下输出:"
      cat "$startup_log"
    fi
  fi

  rm -f "$startup_log" >/dev/null 2>&1 || true
}

# ────────────── 部署前残留清理 ──────────────
cleanup_stale_residues() {
  log "清理历史残留..."

  # 1. 修复损坏的 corepack 状态（上次安装中断可能导致）
  if command -v corepack &>/dev/null; then
    corepack disable 2>/dev/null || true
    corepack enable 2>/dev/null || true
    info "corepack 状态已重置"
  fi

  # 2. 清理 npm 全局中损坏的 pnpm
  if command -v pnpm &>/dev/null; then
    if ! pnpm --version &>/dev/null 2>&1; then
      warn "pnpm 二进制损坏，清理中..."
      npm uninstall -g pnpm 2>/dev/null || true
      rm -f "$(which pnpm 2>/dev/null)" 2>/dev/null || true
    fi
  fi

  # 3. 探测并清理旧的部署目录残留（可能在不同位置）
  local stale_dirs=()

  # 当前目标目录
  [[ -d "$DEPLOY_DIR" ]] && stale_dirs+=("$DEPLOY_DIR")

  # 常见残留位置探测
  local candidates=(
    "/www/wwwroot/cot"
    "/www/wwwroot/cotovo"
    "/opt/cot-blog"
    "/opt/cotovo"
    "${HOME}/cot-blog"
    "${HOME}/cotovo"
  )
  for dir in "${candidates[@]}"; do
    # 跳过目标目录（已加入）
    [[ "$dir" == "$DEPLOY_DIR" ]] && continue
    # 只处理存在且看起来像部署残留的目录（有 package.json 或 .next）
    if [[ -d "$dir" ]] && [[ -f "${dir}/package.json" || -d "${dir}/.next" ]]; then
      stale_dirs+=("$dir")
    fi
  done

  for dir in "${stale_dirs[@]}"; do
    # 如果是 git 仓库且是目标目录，保留（后续 git pull 更新）
    if [[ "$dir" == "$DEPLOY_DIR" ]] && [[ -d "${dir}/.git" ]]; then
      # 检查 node_modules 是否损坏
      if [[ -d "${dir}/node_modules" ]] && [[ -f "${dir}/pnpm-lock.yaml" ]] && [[ ! -d "${dir}/node_modules/.pnpm" ]]; then
        warn "检测到 ${dir}/node_modules 结构异常，清理..."
        rm -rf "${dir}/node_modules" 2>/dev/null || true
      fi
      continue
    fi

    # 非目标目录的残留 → 提示并清理
    if [[ "$dir" != "$DEPLOY_DIR" ]]; then
      warn "发现旧部署残留: ${dir}"
      rm -rf "$dir" 2>/dev/null && ok "已清理: ${dir}" || warn "清理失败: ${dir}（可能需要 sudo）"
    fi
  done

  # 4. 清理孤立的 PM2 进程（旧名称）
  if command -v pm2 &>/dev/null; then
    local old_names=("cot-blog" "dawnlight-blog")
    for old_name in "${old_names[@]}"; do
      if OLD_NAME="$old_name" pm2 jlist 2>/dev/null | node -e "
        let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
          try{const a=JSON.parse(d);const f=a.find(x=>x.name===process.env.OLD_NAME);
          process.exit(f?0:1)}catch(e){process.exit(1)}
        });
      " 2>/dev/null; then
        warn "发现孤立 PM2 进程: ${old_name}，清理中..."
        pm2 delete "$old_name" 2>/dev/null || true
        ok "已清理 PM2 进程: ${old_name}"
      fi
    done
  fi

  ok "残留清理完成"
}

# ────────────── Banner ──────────────
print_banner() {
  local sep
  sep="$(line 74 '=')"
  printf "\n${COLOR_BLUE}%s${COLOR_RESET}\n" "$sep"
  cat <<'EOF'
   ██████╗ ███████╗████████╗
  ██╔════╝ ██╔════╝╚══██╔══╝
  ██║      █████╗     ██║
  ██║      ██╔══╝     ██║
  ╚██████╗ ██║        ██║
   ╚═════╝ ╚═╝        ╚═╝
  COT Blog — Next.js Standalone Deploy
EOF
  printf "${COLOR_BLUE}%s${COLOR_RESET}\n" "$sep"
  printf "  App    : %s\n" "$APP_NAME"
  printf "  Domain : %s\n" "$APP_DOMAIN"
  printf "  Script : v%s\n\n" "$DEPLOY_SCRIPT_VERSION"
}

# ────────────── Git 仓库克隆/更新 ──────────────
clone_or_update_repo() {
  require_cmd git "git 未找到。安装: $(install_hint git)"

  if [[ -d "${DEPLOY_DIR}/.git" ]]; then
    log "检测到已有仓库，拉取最新代码..."
    cd "$DEPLOY_DIR"
    git fetch origin "$GIT_BRANCH"
    git reset --hard "origin/${GIT_BRANCH}"
    git clean -fd -e '.env*' -e 'storage/'
    stage_end "代码更新完成"
  elif [[ -d "$DEPLOY_DIR" ]] && [[ ! -d "${DEPLOY_DIR}/.git" ]]; then
    err "目录 ${DEPLOY_DIR} 已存在但不是 git 仓库"
    err "请手动删除后重试: rm -rf ${DEPLOY_DIR}"
    exit 1
  else
    log "克隆仓库到 ${DEPLOY_DIR}..."
    mkdir -p "$(dirname "$DEPLOY_DIR")"
    git clone --branch "$GIT_BRANCH" --single-branch "$GIT_REPO" "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
    stage_end "仓库克隆完成"
  fi
}

# ════════════════════════════════════════════════════════════
#  主流程
# ════════════════════════════════════════════════════════════
main() {
  timer_start

  # ── 0. Banner ──
  print_banner

  # ── 0.5 清理历史残留 ──
  set_phase "残留清理"
  cleanup_stale_residues

  # ── 1. 操作系统 & 架构检测 ──
  set_phase "操作系统检测"
  detect_os
  printf "\n"

  # ── 2. 端口校验 ──
  set_phase "端口校验"
  validate_port

  # ── 2.5 静态导出守卫 ──
  if [[ "${STATIC_EXPORT:-}" == "true" ]]; then
    err "STATIC_EXPORT=true 与 standalone 部署模式不兼容"
    err "静态导出请使用 Cloudflare Pages / Nginx 等静态托管方案"
    exit 1
  fi

  # ── 3. Node.js 安装 ──
  set_phase "依赖工具检查"
  auto_install_node
  check_node_version

  # ── 4. Git 克隆/更新 ──
  set_phase "代码拉取"
  stage_begin "准备代码仓库..."
  clone_or_update_repo

  # ── 5. pnpm & pm2 安装（需要 package.json 读取版本） ──
  set_phase "包管理器安装"
  auto_install_pnpm
  auto_install_pm2

  # ── 6. corepack ──
  set_phase "corepack 检查"
  if command -v corepack >/dev/null 2>&1; then
    log "启用 corepack..."
    corepack enable >/dev/null 2>&1 || true
  else
    warn "corepack 未找到，使用当前 pnpm 版本"
  fi

  # ── 7. 工作目录验证 ──
  set_phase "工作目录验证"
  if [[ ! -f "package.json" ]]; then
    err "项目目录缺少 package.json: ${DEPLOY_DIR}"
    exit 1
  fi

  if [[ ! -f "$PM2_CONFIG" ]]; then
    err "PM2 配置文件未找到: ${PM2_CONFIG}"
    exit 1
  fi

  # ── 8. 设置部署日志 ──
  set_phase "日志初始化"
  setup_deploy_log

  # ── 9. pnpm 版本校验 ──
  set_phase "pnpm 版本校验"
  check_pnpm_version

  # ── 10. 系统预检 ──
  set_phase "系统资源预检"
  line 72 '─'
  log "系统资源预检..."
  check_noexec_mount
  check_disk_space
  check_memory
  check_ulimits
  check_port_conflict
  ok "系统预检完成"

  # ── 11. 输出配置摘要 ──
  printf "\n"
  line 72 '─'
  log "部署配置:"
  info "  仓库地址  : ${GIT_REPO}"
  info "  分支      : ${GIT_BRANCH}"
  info "  部署目录  : ${DEPLOY_DIR}"
  info "  监听地址  : ${APP_HOST}:${APP_PORT}"
  info "  应用名称  : ${APP_NAME}"
  info "  PM2 配置  : ${PM2_CONFIG}"
  info "  安装命令  : ${INSTALL_CMD}"
  info "  构建命令  : ${BUILD_CMD}"
  info "  产物路径  : ${STANDALONE_SERVER}"
  line 72 '─'
  printf "\n"

  # ── 12. 安装依赖 ──
  set_phase "依赖安装"
  if [[ "$SKIP_INSTALL" == "1" ]]; then
    warn "跳过依赖安装 (SKIP_INSTALL=1)"
  else
    stage_begin "安装依赖..."
    eval "$INSTALL_CMD"
    stage_end "依赖安装完成"
  fi

  # ── 13. esbuild 修复 ──
  set_phase "esbuild 二进制修复"
  fix_esbuild_binary

  # ── 14. 备份 & 构建 ──
  set_phase "项目构建"
  if [[ "$SKIP_BUILD" == "1" ]]; then
    warn "跳过构建 (SKIP_BUILD=1)"
  else
    backup_output
    stage_begin "构建生产输出..."
    eval "$BUILD_CMD"
    stage_end "构建完成"
  fi

  # ── 15. 构建产物检查 ──
  set_phase "构建产物验证"
  if [[ ! -f "$STANDALONE_SERVER" ]]; then
    err "缺少 ${STANDALONE_SERVER}，构建可能已失败"
    err "请确认 next.config.js 中 output 设置为 'standalone'"
    exit 1
  fi

  local output_size
  output_size="$(du -sm "${STANDALONE_DIR}" 2>/dev/null | awk '{print $1}' || echo '0')"
  if [[ "$output_size" =~ ^[0-9]+$ ]] && (( output_size > 0 )); then
    info "standalone 产物大小: ${output_size}MB ✓"
  else
    warn "无法检测构建产物大小"
  fi

  # ── 16. 拷贝静态资源 ──
  set_phase "静态资源拷贝"
  copy_standalone_assets

  # ── 17. 准备日志目录 & 环境变量 ──
  set_phase "PM2 启动准备"
  mkdir -p storage/logs

  export PM2_APP_NAME="$APP_NAME"
  export PORT="$APP_PORT"
  export HOSTNAME="$APP_HOST"
  export PM2_CWD="$DEPLOY_DIR"

  # ── 18. PM2 启动/重载 ──
  set_phase "PM2 启动"
  stage_begin "启动/重载 PM2 应用..."
  pm2 startOrReload "$PM2_CONFIG" --update-env
  stage_end "PM2 启动/重载 ${APP_NAME}"

  log "保存 PM2 进程列表..."
  pm2 save
  ok "PM2 进程列表已保存"

  # ── 19. 健康检查 ──
  set_phase "健康检查"
  if ! health_check; then
    err "健康检查失败"
    if [[ -d ".next.bak" ]]; then
      warn "触发回滚..."
      rm -rf .next 2>/dev/null || true
      mv .next.bak .next 2>/dev/null || true
      pm2 startOrReload "$PM2_CONFIG" --update-env 2>/dev/null || true
      ok "已回滚到上一版本"
    fi
    exit 1
  fi

  # ── 20. PM2 startup ──
  set_phase "PM2 开机自启"
  setup_pm2_startup

  # ── 21. 清理备份 ──
  set_phase "清理"
  cleanup_backup

  # ── 22. 完成 ──
  local total_time
  total_time="$(timer_elapsed)"

  printf "\n"
  line 72 '='
  printf "${COLOR_GREEN}${COLOR_BOLD}  部署完成${COLOR_RESET}\n"
  line 72 '='
  printf "  应用名称 : %s\n" "$APP_NAME"
  printf "  访问地址 : http://%s:%s\n" "$APP_HOST" "$APP_PORT"
  printf "  域名     : %s\n" "$APP_DOMAIN"
  printf "  部署耗时 : %s\n" "$total_time"
  printf "  部署日志 : %s\n" "$DEPLOY_LOG"
  printf "\n"
  printf "  常用命令:\n"
  printf "    ${COLOR_DIM}pm2 status${COLOR_RESET}          — 查看进程状态\n"
  printf "    ${COLOR_DIM}pm2 logs %s${COLOR_RESET}  — 查看日志\n" "$APP_NAME"
  printf "    ${COLOR_DIM}pm2 restart %s${COLOR_RESET} — 重启应用\n" "$APP_NAME"
  printf "    ${COLOR_DIM}pm2 monit${COLOR_RESET}           — 监控面板\n"
  line 72 '='
  printf "\n"
}

main "$@"
