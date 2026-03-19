#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="${APP_ROOT:-$SCRIPT_DIR}"
cd "${APP_ROOT}"

APP_NAME="${APP_NAME:-coet-blog}"
APP_PORT="${PORT:-1021}"
PM2_CONFIG="${PM2_CONFIG:-ecosystem.config.cjs}"
LOG_DIR="${LOG_DIR:-storage/logs}"
DEPLOY_LOG="${LOG_DIR}/deploy.log"
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-http://127.0.0.1:${APP_PORT}}"
INSTALL_TIMEOUT="${INSTALL_TIMEOUT:-600}"
BUILD_TIMEOUT="${BUILD_TIMEOUT:-900}"
HEALTH_RETRIES="${HEALTH_RETRIES:-20}"
NODE_BUILD_MEMORY="${NODE_BUILD_MEMORY:-1024}"
DEPLOY_SOURCE="${DEPLOY_SOURCE:-}"
GITHUB_SOURCE="${GITHUB_SOURCE:-}"
LOCAL_SOURCE="${LOCAL_SOURCE:-}"
DB_SYNC_MODE="${DB_SYNC_MODE:-}"
RUN_INDEXING_AFTER_DEPLOY="${RUN_INDEXING_AFTER_DEPLOY:-1}"
SKIP_GIT_PULL="${SKIP_GIT_PULL:-0}"
AUTO_CONFIRM="${AUTO_CONFIRM:-0}"

IS_INTERACTIVE=0
if [[ -t 0 && -t 1 ]]; then
  IS_INTERACTIVE=1
fi

if [[ -t 1 ]]; then
  RESET=$'\033[0m'
  BOLD=$'\033[1m'
  DIM=$'\033[2m'
  CYAN=$'\033[36m'
  GREEN=$'\033[32m'
  YELLOW=$'\033[33m'
  RED=$'\033[31m'
  MAGENTA=$'\033[35m'
  BLUE=$'\033[34m'
else
  RESET=""
  BOLD=""
  DIM=""
  CYAN=""
  GREEN=""
  YELLOW=""
  RED=""
  MAGENTA=""
  BLUE=""
fi

DEPLOY_TEMP_DIR=""
DEPLOY_SOURCE_LABEL="当前仓库"
INDEXING_STATUS="未执行"
STEP_CURRENT=0
STEP_TOTAL=8

timestamp() {
  date '+%Y-%m-%d %H:%M:%S'
}

rule() {
  printf '%b%s%b\n' "${BLUE}" "============================================================" "${RESET}"
}

banner() {
  printf '\n'
  rule
  printf '%b%s%b\n' "${BOLD}${CYAN}" "                     Coet 中文部署控制台                     " "${RESET}"
  printf '%b%s%b\n' "${DIM}" "               构建、切换、重启、收录，一次走完               " "${RESET}"
  printf '%b%s%b\n' "${DIM}" "              高亮日志、中文引导、结果看板一屏看清            " "${RESET}"
  rule
}

section() {
  STEP_CURRENT="$((STEP_CURRENT + 1))"
  printf '\n'
  rule
  printf '%b[%02d/%02d]%b %b%s%b\n' \
    "${BOLD}${MAGENTA}" \
    "${STEP_CURRENT}" \
    "${STEP_TOTAL}" \
    "${RESET}" \
    "${BOLD}" \
    "$1" \
    "${RESET}"
  printf '%b[%s]%b %s\n' "${DIM}" "$(timestamp)" "${RESET}" "阶段开始，正在推进这一环。"
  rule
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

cleanup() {
  if [[ -n "${DEPLOY_TEMP_DIR}" && -d "${DEPLOY_TEMP_DIR}" ]]; then
    rm -rf "${DEPLOY_TEMP_DIR}"
  fi
}

on_error() {
  local line="$1"
  fail "部署在第 ${line} 行中断，请查看日志定位原因。"
}

trap cleanup EXIT
trap 'on_error ${LINENO}' ERR

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "缺少必要命令：$1"
    exit 1
  fi
}

require_any_command() {
  local label="$1"
  shift

  for command_name in "$@"; do
    if command -v "${command_name}" >/dev/null 2>&1; then
      return 0
    fi
  done

  fail "缺少必要命令：${label}"
  exit 1
}

run_with_timeout() {
  local seconds="$1"
  shift

  if command -v timeout >/dev/null 2>&1; then
    timeout "${seconds}" "$@"
  else
    "$@"
  fi
}

prompt_text() {
  local label="$1"
  local default_value="${2:-}"
  local answer=""

  if [[ "${IS_INTERACTIVE}" != "1" ]]; then
    printf '%s' "${default_value}"
    return
  fi

  if [[ -n "${default_value}" ]]; then
    read -r -p "${label} [默认: ${default_value}]：" answer
  else
    read -r -p "${label}：" answer
  fi

  if [[ -z "${answer}" ]]; then
    answer="${default_value}"
  fi

  printf '%s' "${answer}"
}

prompt_choice() {
  local title="$1"
  shift
  local options=("$@")
  local input=""
  local index=1

  if [[ "${IS_INTERACTIVE}" != "1" ]]; then
    printf '%s' "1"
    return
  fi

  printf '\n%b%s%b\n' "${BOLD}${CYAN}" "${title}" "${RESET}"
  for option in "${options[@]}"; do
    printf '  %b[%s]%b %s\n' "${BLUE}" "${index}" "${RESET}" "${option}"
    ((index++))
  done

  while true; do
    read -r -p "请输入选项序号 [默认: 1]：" input
    input="${input:-1}"
    if [[ "${input}" =~ ^[1-9][0-9]*$ ]] && (( input >= 1 && input <= ${#options[@]} )); then
      printf '%s' "${input}"
      return
    fi
    warn "输入无效，请重新选择。"
  done
}

print_deploy_plan() {
  printf '\n'
  rule
  printf '%b%s%b\n' "${BOLD}${CYAN}" "部署作战面板" "${RESET}"
  printf '  %-12s %s\n' "应用名称" "${APP_NAME}"
  printf '  %-12s %s\n' "部署来源" "${DEPLOY_SOURCE_LABEL}"
  printf '  %-12s %s\n' "运行端口" "${APP_PORT}"
  printf '  %-12s %s\n' "数据库同步" "${DB_SYNC_MODE}"
  printf '  %-12s %s\n' "收录流程" "$( [[ "${RUN_INDEXING_AFTER_DEPLOY}" == "1" ]] && printf '部署后自动执行' || printf '已关闭' )"
  printf '  %-12s %s\n' "日志文件" "${DEPLOY_LOG}"
  rule
}

normalize_source_mode() {
  case "$1" in
    "" )
      if [[ "${IS_INTERACTIVE}" == "1" ]]; then
        local choice
        choice="$(prompt_choice "请选择本次部署来源" \
          "当前仓库直接部署（默认）" \
          "从 GitHub 下载归档后部署" \
          "使用本地目录或压缩包部署")"
        case "${choice}" in
          1) printf '%s' "current" ;;
          2) printf '%s' "github" ;;
          3) printf '%s' "local" ;;
        esac
      else
        printf '%s' "current"
      fi
      ;;
    current|repo)
      printf '%s' "current"
      ;;
    github)
      printf '%s' "github"
      ;;
    local|file)
      printf '%s' "local"
      ;;
    *)
      fail "不支持的部署来源：$1"
      exit 1
      ;;
  esac
}

resolve_db_sync_mode() {
  if [[ ! -f drizzle.config.ts && ! -f drizzle.config.js && ! -f drizzle.config.cjs && ! -f drizzle.config.mjs ]]; then
    printf '%s' "skip"
    return
  fi

  case "${DB_SYNC_MODE}" in
    skip|safe|force)
      printf '%s' "${DB_SYNC_MODE}"
      return
      ;;
    "")
      ;;
    *)
      fail "不支持的数据库同步模式：${DB_SYNC_MODE}"
      exit 1
      ;;
  esac

  if [[ "${IS_INTERACTIVE}" == "1" && "${AUTO_CONFIRM}" != "1" ]]; then
    local choice
    choice="$(prompt_choice "检测到 Drizzle 配置，是否同步数据库结构" \
      "安全同步（pnpm db:push）" \
      "强制同步（pnpm db:push --accept-data-loss）" \
      "跳过本次数据库同步")"
    case "${choice}" in
      1) printf '%s' "safe" ;;
      2) printf '%s' "force" ;;
      3) printf '%s' "skip" ;;
    esac
  else
    printf '%s' "safe"
  fi
}

sync_standalone_assets() {
  rm -rf .next/standalone/public .next/standalone/.next/static
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
    warn "未安装 curl，跳过健康检查。"
    return
  fi

  local attempt=1
  while (( attempt <= HEALTH_RETRIES )); do
    if curl -fsSL --connect-timeout 3 --max-time 8 "${HEALTH_ENDPOINT}" >/dev/null 2>&1; then
      success "健康检查通过：${HEALTH_ENDPOINT}"
      return 0
    fi

    printf '%b.%b' "${DIM}" "${RESET}"
    sleep 2
    ((attempt++))
  done

  printf '\n'
  fail "健康检查失败，服务在 ${HEALTH_RETRIES} 次尝试后仍不可用。"
  return 1
}

verify_local_robots() {
  if ! command -v curl >/dev/null 2>&1; then
    warn "未安装 curl，跳过 robots 检查。"
    return 0
  fi

  local robots_url="${HEALTH_ENDPOINT%/}/robots.txt"
  local robots_content
  robots_content="$(curl -fsSL --connect-timeout 3 --max-time 8 "${robots_url}" || true)"

  if [[ -z "${robots_content}" ]]; then
    warn "未能读取 robots.txt，后续仍会尝试执行收录推送。"
    return 0
  fi

  if grep -Eq '^[[:space:]]*Allow:[[:space:]]*/[[:space:]]*$' <<<"${robots_content}" || \
    ! grep -Eq '^[[:space:]]*Disallow:[[:space:]]*/[[:space:]]*$' <<<"${robots_content}"; then
    success "robots.txt 已放行公开页面抓取。"
  else
    warn "robots.txt 放行规则看起来异常，请关注搜索引擎抓取设置。"
  fi
}

resolve_github_archive_url() {
  local source="$1"

  if [[ "${source}" =~ ^https?:// ]]; then
    printf '%s' "${source}"
    return
  fi

  local repository="${source}"
  local ref="main"

  if [[ "${source}" == *"@"* ]]; then
    repository="${source%@*}"
    ref="${source##*@}"
  fi

  if [[ ! "${repository}" =~ ^[^/]+/[^/]+$ ]]; then
    fail "GitHub 来源格式错误，请使用 owner/repo@ref 或完整归档 URL。"
    exit 1
  fi

  printf 'https://codeload.github.com/%s/tar.gz/%s' "${repository}" "${ref}"
}

extract_archive() {
  local archive_path="$1"
  local target_dir="$2"

  mkdir -p "${target_dir}"

  case "${archive_path}" in
    *.tar.gz|*.tgz)
      require_command tar
      tar -xzf "${archive_path}" -C "${target_dir}"
      ;;
    *.tar)
      require_command tar
      tar -xf "${archive_path}" -C "${target_dir}"
      ;;
    *.zip)
      if command -v unzip >/dev/null 2>&1; then
        unzip -oq "${archive_path}" -d "${target_dir}" >/dev/null
      elif command -v bsdtar >/dev/null 2>&1; then
        bsdtar -xf "${archive_path}" -C "${target_dir}"
      else
        fail "解压 zip 需要 unzip 或 bsdtar。"
        exit 1
      fi
      ;;
    *)
      fail "暂不支持的压缩包格式：${archive_path}"
      exit 1
      ;;
  esac
}

detect_release_root() {
  local search_root="$1"

  if [[ -f "${search_root}/package.json" ]]; then
    printf '%s' "${search_root}"
    return
  fi

  local manifest_path=""
  manifest_path="$(find "${search_root}" -mindepth 1 -maxdepth 3 -type f -name package.json | head -n 1 || true)"

  if [[ -z "${manifest_path}" ]]; then
    fail "发布源中未找到 package.json，无法识别为可部署的 Coet 项目。"
    exit 1
  fi

  dirname "${manifest_path}"
}

sync_release_to_workspace() {
  local source_root="$1"

  require_command rsync

  info "正在同步发布文件到部署目录（会保留 .env、storage、.git 等本地资产）"
  rsync -a --delete \
    --exclude '.git/' \
    --exclude '.env' \
    --exclude 'node_modules/' \
    --exclude '.next/' \
    --exclude '.contentlayer/' \
    --exclude 'storage/' \
    --exclude 'tmp/' \
    --exclude '.deploy-cache/' \
    "${source_root}/" "${APP_ROOT}/"
  success "发布文件同步完成"
}

prepare_source_from_current_repo() {
  DEPLOY_SOURCE_LABEL="当前仓库"

  if [[ -d .git && "${SKIP_GIT_PULL}" != "1" ]]; then
    if git diff --quiet && git diff --cached --quiet; then
      info "当前工作区干净，执行 git pull --ff-only"
      git pull --ff-only
      success "仓库已更新到最新提交"
    else
      warn "当前工作区存在未提交改动，已跳过 git pull。"
    fi
  else
    info "已按配置跳过 git pull"
  fi
}

prepare_source_from_github() {
  require_command curl

  local source_input="${GITHUB_SOURCE}"
  if [[ -z "${source_input}" ]]; then
    source_input="$(prompt_text "请输入 GitHub 仓库来源（owner/repo@ref 或完整归档 URL）" "")"
  fi

  if [[ -z "${source_input}" ]]; then
    fail "GitHub 部署来源不能为空。"
    exit 1
  fi

  local archive_url
  archive_url="$(resolve_github_archive_url "${source_input}")"
  DEPLOY_SOURCE_LABEL="GitHub 归档"
  DEPLOY_TEMP_DIR="$(mktemp -d -t coet-deploy-XXXXXX)"

  local archive_path="${DEPLOY_TEMP_DIR}/release.tar.gz"
  local extract_dir="${DEPLOY_TEMP_DIR}/extract"

  info "开始从 GitHub 下载归档：${archive_url}"
  curl -fL --progress-bar "${archive_url}" -o "${archive_path}"
  success "GitHub 归档下载完成"

  info "正在解压 GitHub 归档"
  extract_archive "${archive_path}" "${extract_dir}"

  local source_root
  source_root="$(detect_release_root "${extract_dir}")"
  sync_release_to_workspace "${source_root}"
}

prepare_source_from_local() {
  local source_input="${LOCAL_SOURCE}"
  if [[ -z "${source_input}" ]]; then
    source_input="$(prompt_text "请输入本地目录或压缩包路径" "")"
  fi

  if [[ -z "${source_input}" ]]; then
    fail "本地部署来源不能为空。"
    exit 1
  fi

  local source_path="${source_input/#\~/$HOME}"
  if [[ ! -e "${source_path}" ]]; then
    fail "本地来源不存在：${source_path}"
    exit 1
  fi

  DEPLOY_SOURCE_LABEL="本地文件"
  DEPLOY_TEMP_DIR="$(mktemp -d -t coet-deploy-XXXXXX)"

  if [[ -d "${source_path}" ]]; then
    info "检测到本地目录，准备直接同步"
    sync_release_to_workspace "$(detect_release_root "${source_path}")"
    return
  fi

  local extract_dir="${DEPLOY_TEMP_DIR}/extract"
  info "检测到本地压缩包，准备解压：${source_path}"
  extract_archive "${source_path}" "${extract_dir}"
  sync_release_to_workspace "$(detect_release_root "${extract_dir}")"
}

prepare_release_source() {
  case "${DEPLOY_SOURCE}" in
    current)
      prepare_source_from_current_repo
      ;;
    github)
      prepare_source_from_github
      ;;
    local)
      prepare_source_from_local
      ;;
    *)
      fail "未知部署来源：${DEPLOY_SOURCE}"
      exit 1
      ;;
  esac
}

install_dependencies() {
  local install_args=(install)
  if [[ -f pnpm-lock.yaml ]]; then
    install_args+=(--frozen-lockfile)
  fi

  run_with_timeout "${INSTALL_TIMEOUT}" pnpm "${install_args[@]}"
  success "依赖安装完成"
}

run_database_sync() {
  local mode="$1"

  case "${mode}" in
    skip)
      info "已跳过数据库结构同步"
      ;;
    safe)
      pnpm db:push
      success "数据库结构已安全同步"
      ;;
    force)
      warn "即将执行带 accept-data-loss 的数据库同步，请确认这是你需要的。"
      pnpm db:push --accept-data-loss
      success "数据库结构已强制同步"
      ;;
    *)
      fail "未知数据库同步模式：${mode}"
      exit 1
      ;;
  esac
}

build_application() {
  rm -rf .next/cache .next/trace
  export NODE_OPTIONS="--max-old-space-size=${NODE_BUILD_MEMORY}"
  export NEXT_TELEMETRY_DISABLED=1

  info "构建内存上限：${NODE_BUILD_MEMORY} MB"
  run_with_timeout "${BUILD_TIMEOUT}" pnpm build
  unset NODE_OPTIONS

  sync_standalone_assets
  success "应用构建完成，standalone 资源已同步"
}

restart_service() {
  if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
    pm2 restart "${PM2_CONFIG}" --update-env
  else
    pm2 start "${PM2_CONFIG}"
  fi

  pm2 save >/dev/null
  success "PM2 服务已更新"
}

run_indexing_flow() {
  if [[ "${RUN_INDEXING_AFTER_DEPLOY}" != "1" ]]; then
    INDEXING_STATUS="已按配置跳过"
    info "已按配置跳过搜索引擎收录流程"
    return
  fi

  verify_local_robots

  if pnpm seo:push; then
    INDEXING_STATUS="执行完成"
    success "搜索引擎收录流程执行完成"
  else
    INDEXING_STATUS="执行失败（未阻断部署）"
    warn "搜索引擎收录流程执行失败，但主服务已完成部署。"
  fi
}

print_summary() {
  local elapsed="$1"

  printf '\n'
  rule
  printf '%b%s%b\n' "${BOLD}${GREEN}" "部署完成，站点已切到最新版本" "${RESET}"
  printf '%b%s%b\n' "${DIM}" "下面这张结果卡，就是这次发版的最终落点。" "${RESET}"
  rule
  printf '  %-12s %s\n' "应用名称" "${APP_NAME}"
  printf '  %-12s %s\n' "部署来源" "${DEPLOY_SOURCE_LABEL}"
  printf '  %-12s %s\n' "访问端口" "${APP_PORT}"
  printf '  %-12s %s\n' "健康地址" "${HEALTH_ENDPOINT}"
  printf '  %-12s %s\n' "收录状态" "${INDEXING_STATUS}"
  printf '  %-12s %ss\n' "部署耗时" "${elapsed}"
  printf '  %-12s %s\n' "部署日志" "${DEPLOY_LOG}"
  rule
  printf '\n'
}

parse_args() {
  while (($#)); do
    case "$1" in
      --source)
        DEPLOY_SOURCE="${2:-}"
        shift 2
        ;;
      --github)
        GITHUB_SOURCE="${2:-}"
        shift 2
        ;;
      --local)
        LOCAL_SOURCE="${2:-}"
        shift 2
        ;;
      --db-sync)
        DB_SYNC_MODE="${2:-}"
        shift 2
        ;;
      --skip-git-pull)
        SKIP_GIT_PULL=1
        shift
        ;;
      --skip-indexing)
        RUN_INDEXING_AFTER_DEPLOY=0
        shift
        ;;
      --yes)
        AUTO_CONFIRM=1
        shift
        ;;
      *)
        fail "未知参数：$1"
        exit 1
        ;;
    esac
  done
}

parse_args "$@"

mkdir -p "${LOG_DIR}"
touch "${DEPLOY_LOG}"
exec > >(tee -a "${DEPLOY_LOG}") 2>&1

DEPLOY_START="$(date +%s)"
DEPLOY_SOURCE="$(normalize_source_mode "${DEPLOY_SOURCE}")"
DB_SYNC_MODE="$(resolve_db_sync_mode)"

banner
printf '%b日志文件：%b %s\n' "${DIM}" "${RESET}" "${DEPLOY_LOG}"
printf '%b部署目录：%b %s\n' "${DIM}" "${RESET}" "${APP_ROOT}"
print_deploy_plan

section "第 1 步：检查部署环境"
require_command node
require_command pnpm
require_command pm2
info "Node 版本：$(node -v)"
info "pnpm 版本：$(pnpm -v)"
info "本次部署来源：${DEPLOY_SOURCE}"

section "第 2 步：准备发布源"
prepare_release_source

section "第 3 步：安装依赖"
install_dependencies

section "第 4 步：同步数据库"
run_database_sync "${DB_SYNC_MODE}"

section "第 5 步：构建应用"
build_application

section "第 6 步：重启服务"
restart_service

section "第 7 步：健康检查"
health_check

section "第 8 步：搜索引擎收录"
run_indexing_flow

DEPLOY_END="$(date +%s)"
ELAPSED="$((DEPLOY_END - DEPLOY_START))"
print_summary "${ELAPSED}"
