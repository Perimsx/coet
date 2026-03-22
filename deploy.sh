#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="${APP_ROOT:-$SCRIPT_DIR}"
cd "${APP_ROOT}"

APP_NAME="${APP_NAME:-${PM2_APP_NAME:-coet-blog}}"
APP_PORT="${APP_PORT:-${PORT:-1021}}"
PM2_CONFIG="${PM2_CONFIG:-ecosystem.config.cjs}"
STORAGE_DIR="${STORAGE_DIR:-storage}"
SETTINGS_DIR="${SETTINGS_DIR:-${STORAGE_DIR}/settings}"
LOG_DIR="${LOG_DIR:-${STORAGE_DIR}/logs}"
DEPLOY_LOG="${DEPLOY_LOG:-${LOG_DIR}/deploy.log}"
ENV_FILE="${ENV_FILE:-.env}"
ENV_EXAMPLE_FILE="${ENV_EXAMPLE_FILE:-.env.example}"
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-http://127.0.0.1:${APP_PORT}}"
INSTALL_TIMEOUT="${INSTALL_TIMEOUT:-600}"
BUILD_TIMEOUT="${BUILD_TIMEOUT:-900}"
HEALTH_RETRIES="${HEALTH_RETRIES:-20}"
NODE_BUILD_MEMORY="${NODE_BUILD_MEMORY:-1024}"
CURL_RETRY_COUNT="${CURL_RETRY_COUNT:-3}"
CURL_RETRY_DELAY="${CURL_RETRY_DELAY:-2}"
CURL_CONNECT_TIMEOUT="${CURL_CONNECT_TIMEOUT:-10}"
DEPLOY_SOURCE="${DEPLOY_SOURCE:-}"
GITHUB_SOURCE="${GITHUB_SOURCE:-}"
GITHUB_SOURCE_DEFAULT="${GITHUB_SOURCE_DEFAULT:-https://github.com/kerntau/Coet.git}"
LOCAL_SOURCE="${LOCAL_SOURCE:-}"
DB_SYNC_MODE="${DB_SYNC_MODE:-}"
RUN_INDEXING_AFTER_DEPLOY="${RUN_INDEXING_AFTER_DEPLOY:-1}"
SKIP_GIT_PULL="${SKIP_GIT_PULL:-0}"
AUTO_CONFIRM="${AUTO_CONFIRM:-0}"
PROTECTED_SERVER_FILES="${PROTECTED_SERVER_FILES:-.user.ini .htaccess}"

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
CURRENT_STEP_CODE="INIT"
CURRENT_STEP_TITLE="初始化"
STEP_CURRENT=0
STEP_TOTAL=8

PREEXISTING_STORAGE=0
PREEXISTING_ENV=0
PLAN_STORAGE_STATUS=""
PLAN_ENV_STATUS=""
FINAL_STORAGE_STATUS=""
FINAL_ENV_STATUS=""
SMTP_PASSWORD_STATUS="未配置"
DATABASE_LOCATION="./storage/db/blog.sqlite"
PM2_STATUS_TEXT="未知"
PM2_PID_TEXT="-"

timestamp() {
  date '+%Y-%m-%d %H:%M:%S'
}

rule() {
  printf '%b%s%b\n' "${BLUE}" "======================================================================" "${RESET}"
}

badge() {
  case "$1" in
    step)
      printf '%b[STEP]%b' "${MAGENTA}${BOLD}" "${RESET}"
      ;;
    ok)
      printf '%b[ OK ]%b' "${GREEN}${BOLD}" "${RESET}"
      ;;
    warn)
      printf '%b[WARN]%b' "${YELLOW}${BOLD}" "${RESET}"
      ;;
    fail)
      printf '%b[FAIL]%b' "${RED}${BOLD}" "${RESET}"
      ;;
    *)
      printf '%b[INFO]%b' "${CYAN}${BOLD}" "${RESET}"
      ;;
  esac
}

log_line() {
  local level="$1"
  shift
  printf '%s %b[%s]%b %s\n' \
    "$(badge "${level}")" \
    "${DIM}" \
    "$(timestamp)" \
    "${RESET}" \
    "$*"
}

banner() {
  printf '\n'
  rule
  printf '%b' "${CYAN}${BOLD}"
  cat <<'EOF'
   ______            __  ____             __           
  / ____/___  ____  / /_/ __ \___  ____  / /___  __    
 / /   / __ \/ __ \/ __/ / / / _ \/ __ \/ / __ \/ /    
/ /___/ /_/ / /_/ / /_/ /_/ /  __/ /_/ / / /_/ / /     
\____/\____/\____/\__/\____/\___/ .___/_/\____/_/      
                               /_/                      
EOF
  printf '%b' "${RESET}"
  printf '%b%s%b\n' "${BOLD}${CYAN}" "  Coet 中文部署控制台 | 高级部署模式已就绪" "${RESET}"
  printf '%b%s%b\n' "${DIM}" "  构建、切换、重启、收录，一次走完" "${RESET}"
  printf '%b%s%b\n' "${DIM}" "  保护 .env 与 storage，步骤清晰，结果一屏可见" "${RESET}"
  printf '%b%s%b\n' "${DIM}" "  适合首发部署、增量更新、线上救火三种场景" "${RESET}"
  rule
}

start_step() {
  CURRENT_STEP_CODE="$1"
  CURRENT_STEP_TITLE="$2"
  STEP_CURRENT="$((STEP_CURRENT + 1))"

  printf '\n'
  rule
  printf '%s %b第 %02d/%02d 步%b %s\n' \
    "$(badge step)" \
    "${BOLD}" \
    "${STEP_CURRENT}" \
    "${STEP_TOTAL}" \
    "${RESET}" \
    "${CURRENT_STEP_TITLE}"
  printf '%b%s%b\n' "${DIM}" "推进刻度：$(render_progress_bar "${STEP_CURRENT}" "${STEP_TOTAL}")" "${RESET}"
  rule
  log_line info "阶段开始：${CURRENT_STEP_TITLE}"
}

mark_step_ok() {
  log_line ok "$1"
}

mark_step_warn() {
  log_line warn "$1"
}

cleanup() {
  if [[ -n "${DEPLOY_TEMP_DIR}" && -d "${DEPLOY_TEMP_DIR}" ]]; then
    rm -rf "${DEPLOY_TEMP_DIR}"
  fi
}

normalize_env_value() {
  printf '%s' "$1" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"//' -e 's/"$//'
}

env_file_value() {
  local key="$1"
  if [[ ! -f "${ENV_FILE}" ]]; then
    return 0
  fi

  local line=""
  line="$(grep -E "^[[:space:]]*${key}=" "${ENV_FILE}" | tail -n 1 || true)"
  if [[ -z "${line}" ]]; then
    return 0
  fi

  normalize_env_value "${line#*=}"
}

value_or_default() {
  local value="$1"
  local fallback="$2"
  if [[ -n "${value}" ]]; then
    printf '%s' "${value}"
  else
    printf '%s' "${fallback}"
  fi
}

refresh_plan_state() {
  if [[ -d "${STORAGE_DIR}" ]]; then
    PREEXISTING_STORAGE=1
    PLAN_STORAGE_STATUS="已存在，部署时保护不覆盖"
  else
    PREEXISTING_STORAGE=0
    PLAN_STORAGE_STATUS="当前不存在，首次部署将初始化"
  fi

  if [[ -f "${ENV_FILE}" ]]; then
    PREEXISTING_ENV=1
    PLAN_ENV_STATUS="已存在，部署时保护不覆盖"
  else
    PREEXISTING_ENV=0
    if [[ -f "${ENV_EXAMPLE_FILE}" ]]; then
      PLAN_ENV_STATUS="当前不存在，可参考 .env.example"
    else
      PLAN_ENV_STATUS="当前不存在，请手动上传 .env"
    fi
  fi
}

resolve_database_location() {
  local value="${DATABASE_URL:-}"
  if [[ -z "${value}" ]]; then
    value="$(env_file_value "DATABASE_URL")"
  fi
  DATABASE_LOCATION="$(value_or_default "${value}" "./storage/db/blog.sqlite")"
}

resolve_smtp_password_status() {
  local value="${SMTP_PASS:-}"
  if [[ -z "${value}" ]]; then
    value="$(env_file_value "SMTP_PASS")"
  fi

  if [[ -n "${value}" ]]; then
    SMTP_PASSWORD_STATUS="已在 .env 配置"
  else
    SMTP_PASSWORD_STATUS="未配置"
  fi
}

resolve_pm2_status() {
  PM2_STATUS_TEXT="未启动"
  PM2_PID_TEXT="-"

  if ! command -v pm2 >/dev/null 2>&1; then
    PM2_STATUS_TEXT="未安装"
    return
  fi

  local pid=""
  pid="$(pm2 pid "${APP_NAME}" 2>/dev/null | tail -n 1 | tr -d '\r' || true)"
  if [[ "${pid}" =~ ^[0-9]+$ ]] && (( pid > 0 )); then
    PM2_STATUS_TEXT="online"
    PM2_PID_TEXT="${pid}"
    return
  fi

  if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
    PM2_STATUS_TEXT="已注册，等待拉起"
  fi
}

refresh_runtime_state() {
  if [[ -d "${STORAGE_DIR}" ]]; then
    FINAL_STORAGE_STATUS="已就绪"
  else
    FINAL_STORAGE_STATUS="未就绪"
  fi

  if [[ -f "${ENV_FILE}" ]]; then
    FINAL_ENV_STATUS="已就绪"
  else
    FINAL_ENV_STATUS="缺失，请尽快补齐"
  fi

  resolve_database_location
  resolve_smtp_password_status
  resolve_pm2_status
}

table_border() {
  printf '+----------------------+--------------------------------------------------------------+\n'
}

table_row() {
  printf '| %-20s | %-60s |\n' "$1" "$2"
}

print_named_table() {
  local title="$1"
  shift

  printf '\n'
  rule
  printf '%b%s%b\n' "${BOLD}${CYAN}" "${title}" "${RESET}"
  table_border
  while (($#)); do
    table_row "$1" "$2"
    shift 2
  done
  table_border
}

format_duration() {
  local total="$1"
  local hours=$((total / 3600))
  local minutes=$(((total % 3600) / 60))
  local seconds=$((total % 60))

  if (( hours > 0 )); then
    printf '%02dh %02dm %02ds' "${hours}" "${minutes}" "${seconds}"
  elif (( minutes > 0 )); then
    printf '%02dm %02ds' "${minutes}" "${seconds}"
  else
    printf '%02ds' "${seconds}"
  fi
}

render_progress_bar() {
  local current="$1"
  local total="$2"
  local width="${3:-26}"
  local percent=0
  local filled=0

  if (( total > 0 )); then
    percent=$(( current * 100 / total ))
    if (( percent > 100 )); then
      percent=100
    fi
    filled=$(( percent * width / 100 ))
  fi

  local fill_bar=""
  local empty_bar=""
  fill_bar="$(printf '%*s' "${filled}" '' | tr ' ' '#')"
  empty_bar="$(printf '%*s' "$((width - filled))" '' | tr ' ' '-')"

  printf '[%s%s] %3d%%' "${fill_bar}" "${empty_bar}" "${percent}"
}

format_bytes() {
  local bytes="${1:-0}"

  awk -v bytes="${bytes}" '
    function human(x, units, i) {
      split("B KB MB GB TB", units, " ")
      i = 1
      while (x >= 1024 && i < 5) {
        x /= 1024
        i++
      }
      if (i == 1) {
        return sprintf("%d %s", x, units[i])
      }
      return sprintf("%.1f %s", x, units[i])
    }
    BEGIN {
      print human(bytes)
    }
  '
}

render_download_bar() {
  local current="$1"
  local total="$2"
  local width="${3:-32}"
  local percent=0
  local filled=0

  if (( total > 0 )); then
    percent=$(( current * 100 / total ))
    if (( percent > 100 )); then
      percent=100
    fi
    filled=$(( percent * width / 100 ))
  fi

  local fill_bar=""
  local empty_bar=""
  fill_bar="$(printf '%*s' "${filled}" '' | tr ' ' '=')"
  empty_bar="$(printf '%*s' "$((width - filled))" '' | tr ' ' '.')"

  printf '[%s%s] %3d%%' "${fill_bar}" "${empty_bar}" "${percent}"
}

download_with_pretty_progress() {
  local url="$1"
  local output_path="$2"
  local label="${3:-GitHub 归档}"
  local content_length=""
  local total_bytes=0
  local current_bytes=0
  local curl_pid=""
  local tick=0
  local spinner='|/-\'

  content_length="$(
    curl -fsSLI $(curl_retry_args) "${url}" |
      awk -F': ' 'tolower($1)=="content-length"{gsub(/\r/,"",$2); print $2}' |
      tail -n 1 || true
  )"
  if [[ "${content_length}" =~ ^[0-9]+$ ]]; then
    total_bytes="${content_length}"
  fi

  log_line info "下载地址：${url}"

  log_line info "下载失败时会自动重试 ${CURL_RETRY_COUNT} 次"

  if [[ "${IS_INTERACTIVE}" != "1" ]]; then
    curl -fL --progress-bar $(curl_retry_args) "${url}" -o "${output_path}"
    printf '\n'
    return
  fi

  log_line info "下载面板：${label}"

  curl -fL --silent --show-error $(curl_retry_args) "${url}" -o "${output_path}" &
  curl_pid="$!"

  while kill -0 "${curl_pid}" >/dev/null 2>&1; do
    if [[ -f "${output_path}" ]]; then
      current_bytes="$(wc -c < "${output_path}" | tr -d ' ')"
    else
      current_bytes=0
    fi

    if (( total_bytes > 0 )); then
      printf '\r%b[DOWN]%b %s  %s / %s' \
        "${CYAN}${BOLD}" \
        "${RESET}" \
        "$(render_download_bar "${current_bytes}" "${total_bytes}")" \
        "$(format_bytes "${current_bytes}")" \
        "$(format_bytes "${total_bytes}")"
    else
      printf '\r%b[DOWN]%b [%c] 正在下载  %s' \
        "${CYAN}${BOLD}" \
        "${RESET}" \
        "${spinner:$((tick % 4)):1}" \
        "$(format_bytes "${current_bytes}")"
    fi

    tick=$((tick + 1))
    sleep 0.2
  done

  wait "${curl_pid}"

  if [[ -f "${output_path}" ]]; then
    current_bytes="$(wc -c < "${output_path}" | tr -d ' ')"
  else
    current_bytes=0
  fi

  if (( total_bytes > 0 )); then
    printf '\r%b[DOWN]%b %s  %s / %s\n' \
      "${GREEN}${BOLD}" \
      "${RESET}" \
      "$(render_download_bar "${total_bytes}" "${total_bytes}")" \
      "$(format_bytes "${current_bytes}")" \
      "$(format_bytes "${total_bytes}")"
  else
    printf '\r%b[DOWN]%b [==============================] 100%%  %s\n' \
      "${GREEN}${BOLD}" \
      "${RESET}" \
      "$(format_bytes "${current_bytes}")"
  fi
}

print_deploy_plan() {
  print_named_table \
    "部署作战面板" \
    "应用名称" "${APP_NAME}" \
    "部署来源" "${DEPLOY_SOURCE_LABEL}" \
    "运行端口" "${APP_PORT}" \
    ".env 状态" "${PLAN_ENV_STATUS}" \
    "storage 状态" "${PLAN_STORAGE_STATUS}" \
    "数据库位置" "${DATABASE_LOCATION}" \
    "邮件授权码" "${SMTP_PASSWORD_STATUS}" \
    "数据库同步" "${DB_SYNC_MODE}" \
    "收录流程" "$( [[ "${RUN_INDEXING_AFTER_DEPLOY}" == "1" ]] && printf '部署后自动执行' || printf '已关闭' )" \
    "日志文件" "${DEPLOY_LOG}"
}

print_failure_card() {
  local code="$1"
  local tip1="先看 deploy.log，再结合当前步骤名称回放日志。"
  local tip2="确认 .env、storage、数据库文件权限是否正常。"
  local tip3="必要时执行对应单步命令复现，例如 pnpm build 或 pm2 logs。"

  case "${code}" in
    CHECK_ENV)
      tip1="确认服务器已安装 node、pnpm、pm2、rsync，且命令可直接执行。"
      tip2="如果是首次部署，先准备好 .env，再执行脚本。"
      tip3="权限不足时，先确保当前用户对部署目录拥有读写权限。"
      ;;
    PREP_SOURCE)
      tip1="检查部署来源是否选对，GitHub 地址、本地路径、压缩包格式都要有效。"
      tip2="如果目标目录已有 storage，脚本会保护它，不会覆盖线上数据。"
      tip3="本地包缺少 package.json 时，请确认上传的是项目根目录而不是子目录。"
      ;;
    INSTALL)
      tip1="依赖安装失败时，先检查网络、镜像源和 pnpm-lock.yaml 是否匹配。"
      tip2="如服务器磁盘紧张，先清理 node_modules、pnpm store 或构建缓存。"
      tip3="可以单独执行 pnpm install 复现，并观察第一条报错。"
      ;;
    DB_SYNC)
      tip1="数据库同步前建议先备份 storage/db，尤其是 force 模式。"
      tip2="如果 drizzle 配置有变动，请确认 schema 与当前数据库兼容。"
      tip3="SQLite 文件不可写时，同步会失败，请先检查目录权限。"
      ;;
    BUILD)
      tip1="构建失败时，先单独执行 pnpm build，第一条红色报错最关键。"
      tip2="如果出现内存不足，可调大 NODE_BUILD_MEMORY 后重试。"
      tip3="字体、外部接口或环境变量缺失也会导致构建中断。"
      ;;
    RESTART)
      tip1="确认 ecosystem.config.cjs、PORT 与 .next/standalone/server.js 都已准备好。"
      tip2="执行 pm2 logs ${APP_NAME} 查看启动时的第一条错误。"
      tip3="如果进程名被改过，请同步检查 PM2_APP_NAME 与 APP_NAME。"
      ;;
    HEALTH)
      tip1="服务已重启但健康检查失败时，先看 pm2 logs ${APP_NAME}。"
      tip2="确认端口 ${APP_PORT} 未被占用，反向代理和防火墙规则也要检查。"
      tip3="如果首页依赖外部资源响应慢，可先手动 curl ${HEALTH_ENDPOINT} 复测。"
      ;;
    INDEXING)
      tip1="收录步骤失败不会阻塞上线，但建议补查 NEXT_PUBLIC_SITE_URL、SITE_URL、INDEXNOW_KEY、BAIDU_PUSH_TOKEN。"
      tip2="同时确认 robots.txt 未错误屏蔽抓取。"
      tip3="可以单独执行 pnpm seo:push 查看更详细的返回信息。"
      ;;
  esac

  print_named_table \
    "排查建议卡片" \
    "失败阶段" "${CURRENT_STEP_TITLE}" \
    "建议 1" "${tip1}" \
    "建议 2" "${tip2}" \
    "建议 3" "${tip3}" \
    "日志文件" "${DEPLOY_LOG}"
}

on_error() {
  local exit_code="$1"
  local line="$2"
  printf '\n'
  log_line fail "部署在第 ${line} 行中断，当前步骤：${CURRENT_STEP_TITLE}"
  print_failure_card "${CURRENT_STEP_CODE}"
  exit "${exit_code}"
}

trap cleanup EXIT
trap 'on_error $? $LINENO' ERR

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log_line fail "缺少必要命令：$1"
    exit 1
  fi
}

require_any_command() {
  local label="$1"
  shift

  local command_name=""
  for command_name in "$@"; do
    if command -v "${command_name}" >/dev/null 2>&1; then
      return 0
    fi
  done

  log_line fail "缺少必要命令：${label}"
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

curl_retry_args() {
  printf '%s\n' \
    "--retry" "${CURL_RETRY_COUNT}" \
    "--retry-delay" "${CURL_RETRY_DELAY}" \
    "--retry-all-errors" \
    "--connect-timeout" "${CURL_CONNECT_TIMEOUT}"
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
    read -r -p "${label} [默认: ${default_value}]: " answer
  else
    read -r -p "${label}: " answer
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

  printf '\n%b%s%b\n' "${BOLD}${CYAN}" "${title}" "${RESET}" >&2
  for option in "${options[@]}"; do
    printf '  %b[%s]%b %s\n' "${BLUE}" "${index}" "${RESET}" "${option}" >&2
    ((index++))
  done

  while true; do
    read -r -p "请输入选项序号 [默认: 1]: " input
    input="${input:-1}"
    if [[ "${input}" =~ ^[1-9][0-9]*$ ]] && (( input >= 1 && input <= ${#options[@]} )); then
      printf '%s' "${input}"
      return
    fi
    log_line warn "输入无效，请重新选择。"
  done
}

refresh_source_label() {
  case "${DEPLOY_SOURCE}" in
    current)
      DEPLOY_SOURCE_LABEL="当前仓库"
      ;;
    github)
      DEPLOY_SOURCE_LABEL="GitHub 归档"
      ;;
    local)
      DEPLOY_SOURCE_LABEL="本地目录或压缩包"
      ;;
  esac
}

normalize_source_mode() {
  case "$1" in
    "")
      if [[ "${IS_INTERACTIVE}" == "1" ]]; then
        local choice=""
        choice="$(prompt_choice \
          "请选择本次部署来源" \
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
      log_line fail "不支持的部署来源：$1"
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
      log_line fail "不支持的数据库同步模式：${DB_SYNC_MODE}"
      exit 1
      ;;
  esac

  if [[ "${IS_INTERACTIVE}" == "1" && "${AUTO_CONFIRM}" != "1" ]]; then
    local choice=""
    choice="$(prompt_choice \
      "检测到 Drizzle 配置，是否同步数据库结构" \
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

check_environment() {
  require_command node
  require_command pnpm
  require_command pm2
  require_command rsync

  if [[ "${DEPLOY_SOURCE}" == "current" || -d .git ]]; then
    require_command git
  fi

  log_line info "Node 版本：$(node -v)"
  log_line info "pnpm 版本：$(pnpm -v)"
  log_line info ".env 状态：${PLAN_ENV_STATUS}"
  log_line info "storage 状态：${PLAN_STORAGE_STATUS}"
  log_line info "数据库位置：${DATABASE_LOCATION}"
  log_line info "邮件授权码：${SMTP_PASSWORD_STATUS}"
  mark_step_ok "环境检查完成"
}

resolve_github_archive_url() {
  local source="$1"
  local source_without_ref="${source}"
  local repository=""
  local ref="main"

  if [[ "${source}" == *"@"* && ! "${source}" =~ ^https?://codeload\.github\.com/ ]]; then
    source_without_ref="${source%@*}"
    ref="${source##*@}"
  fi

  if [[ "${source_without_ref}" =~ ^https?://codeload\.github\.com/ ]]; then
    printf '%s' "${source_without_ref}"
    return
  fi

  if [[ "${source_without_ref}" =~ ^https?://github\.com/([^/]+/[^/]+)(\.git)?/?$ ]]; then
    repository="${BASH_REMATCH[1]}"
    repository="${repository%.git}"
    printf 'https://codeload.github.com/%s/tar.gz/%s' "${repository}" "${ref}"
    return
  fi

  if [[ "${source_without_ref}" =~ ^https?://github\.com/([^/]+/[^/]+)/tree/([^/?#]+)/*$ ]]; then
    repository="${BASH_REMATCH[1]}"
    repository="${repository%.git}"
    if [[ "${ref}" == "main" ]]; then
      ref="${BASH_REMATCH[2]}"
    fi
    printf 'https://codeload.github.com/%s/tar.gz/%s' "${repository}" "${ref}"
    return
  fi

  if [[ "${source_without_ref}" =~ ^https?:// ]]; then
    printf '%s' "${source_without_ref}"
    return
  fi

  repository="${source_without_ref}"
  repository="${repository%.git}"

  if [[ ! "${repository}" =~ ^[^/]+/[^/]+$ ]]; then
    log_line fail "GitHub 来源格式错误，请使用 owner/repo@ref 或完整归档 URL"
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
      require_any_command "unzip 或 bsdtar" unzip bsdtar
      if command -v unzip >/dev/null 2>&1; then
        unzip -oq "${archive_path}" -d "${target_dir}" >/dev/null
      else
        bsdtar -xf "${archive_path}" -C "${target_dir}"
      fi
      ;;
    *)
      log_line fail "暂不支持的压缩包格式：${archive_path}"
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
    log_line fail "发布源中未找到 package.json，无法识别为可部署项目"
    exit 1
  fi

  dirname "${manifest_path}"
}

sync_release_to_workspace() {
  local source_root="$1"
  local -a rsync_args=(
    -a
    --delete
    --exclude=.git/
    --exclude=node_modules/
    --exclude=.next/
    --exclude=.contentlayer/
    --exclude=tmp/
    --exclude=.deploy-cache/
    --exclude="${LOG_DIR}/"
  )
  local protected_file=""

  for protected_file in ${PROTECTED_SERVER_FILES}; do
    rsync_args+=("--exclude=${protected_file}")
  done

  if [[ "${PREEXISTING_ENV}" == "1" ]]; then
    rsync_args+=(--exclude=.env)
    log_line info ".env 已存在，本次同步不会覆盖环境文件"
  else
    log_line info ".env 当前不存在，如发布源中附带 .env 将一并同步"
  fi

  if [[ "${PREEXISTING_STORAGE}" == "1" ]]; then
    rsync_args+=(--exclude=storage/)
    log_line info "storage 已存在，本次同步不会覆盖运行时数据"
  else
    log_line info "storage 当前不存在，首次部署将按发布源或空目录初始化"
  fi

  log_line info "正在同步发布文件到部署目录"
  if [[ -n "${PROTECTED_SERVER_FILES}" ]]; then
    log_line info "服务器保护文件已跳过同步：${PROTECTED_SERVER_FILES}"
  fi

  rsync "${rsync_args[@]}" "${source_root}/" "${APP_ROOT}/"
}

ensure_runtime_directories() {
  mkdir -p "${STORAGE_DIR}/db" "${SETTINGS_DIR}" "${LOG_DIR}"
}

prepare_source_from_current_repo() {
  if [[ ! -d .git ]]; then
    mark_step_warn "当前目录不是 Git 仓库，已按现有代码直接继续"
    return
  fi

  if [[ "${SKIP_GIT_PULL}" == "1" ]]; then
    log_line info "已按配置跳过 git pull"
    return
  fi

  local dirty_non_storage=""
  local dirty_storage=""

  dirty_non_storage="$(git status --porcelain -- . ':(exclude)storage' || true)"
  dirty_storage="$(git status --porcelain -- storage || true)"

  if [[ -n "${dirty_non_storage}" ]]; then
    mark_step_warn "检测到 storage 之外仍有未提交改动，已跳过 git pull 保护现场"
    return
  fi

  if [[ -n "${dirty_storage}" ]]; then
    log_line info "检测到 storage 有运行时改动，将使用 autostash 保护后执行 git pull"
    git pull --ff-only --autostash
  else
    log_line info "工作区干净，执行 git pull --ff-only"
    git pull --ff-only
  fi
}

prepare_source_from_github() {
  require_command curl

  local source_input="${GITHUB_SOURCE}"
  if [[ -z "${source_input}" ]]; then
    source_input="$(prompt_text "请输入 GitHub 来源（owner/repo@ref、仓库 URL 或归档 URL）" "${GITHUB_SOURCE_DEFAULT}")"
  fi

  if [[ -z "${source_input}" ]]; then
    log_line fail "GitHub 部署来源不能为空"
    exit 1
  fi

  local archive_url=""
  archive_url="$(resolve_github_archive_url "${source_input}")"
  DEPLOY_TEMP_DIR="$(mktemp -d -t coet-deploy-XXXXXX)"

  local archive_path="${DEPLOY_TEMP_DIR}/release.tar.gz"
  local extract_dir="${DEPLOY_TEMP_DIR}/extract"

  log_line info "开始从 GitHub 下载归档：${archive_url}"
  download_with_pretty_progress "${archive_url}" "${archive_path}" "GitHub 归档下载"
  log_line info "归档下载完成，正在解压"
  extract_archive "${archive_path}" "${extract_dir}"
  sync_release_to_workspace "$(detect_release_root "${extract_dir}")"
}

prepare_source_from_local() {
  local source_input="${LOCAL_SOURCE}"
  if [[ -z "${source_input}" ]]; then
    source_input="$(prompt_text "请输入本地目录或压缩包路径" "")"
  fi

  if [[ -z "${source_input}" ]]; then
    log_line fail "本地部署来源不能为空"
    exit 1
  fi

  local source_path="${source_input/#\~/$HOME}"
  if [[ ! -e "${source_path}" ]]; then
    log_line fail "本地来源不存在：${source_path}"
    exit 1
  fi

  DEPLOY_TEMP_DIR="$(mktemp -d -t coet-deploy-XXXXXX)"

  if [[ -d "${source_path}" ]]; then
    log_line info "检测到本地目录，准备直接同步"
    sync_release_to_workspace "$(detect_release_root "${source_path}")"
    return
  fi

  local extract_dir="${DEPLOY_TEMP_DIR}/extract"
  log_line info "检测到本地压缩包，准备解压：${source_path}"
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
      log_line fail "未知部署来源：${DEPLOY_SOURCE}"
      exit 1
      ;;
  esac

  ensure_runtime_directories
  refresh_runtime_state
  mark_step_ok "发布源准备完成，目录与运行时资源已就绪"
}

install_dependencies() {
  local -a install_args=(install)
  if [[ -f pnpm-lock.yaml ]]; then
    install_args+=(--frozen-lockfile)
  fi

  log_line info "部署安装阶段已临时关闭 Husky，避免无 .git 环境下出现无关报错"
  HUSKY=0 run_with_timeout "${INSTALL_TIMEOUT}" pnpm "${install_args[@]}"
  mark_step_ok "依赖安装完成"
}

run_database_sync() {
  local mode="$1"

  case "${mode}" in
    skip)
      mark_step_ok "已按配置跳过数据库同步"
      ;;
    safe)
      pnpm db:push
      mark_step_ok "数据库结构已安全同步"
      ;;
    force)
      log_line warn "即将执行带 --accept-data-loss 的数据库同步，请确认已做好备份"
      pnpm db:push --accept-data-loss
      mark_step_ok "数据库结构已强制同步"
      ;;
    *)
      log_line fail "未知数据库同步模式：${mode}"
      exit 1
      ;;
  esac
}

build_application() {
  rm -rf .next/cache .next/trace
  export NODE_OPTIONS="--max-old-space-size=${NODE_BUILD_MEMORY}"
  export NEXT_TELEMETRY_DISABLED=1

  log_line info "构建内存上限：${NODE_BUILD_MEMORY} MB"
  run_with_timeout "${BUILD_TIMEOUT}" pnpm build
  unset NODE_OPTIONS

  sync_standalone_assets
  mark_step_ok "应用构建完成，standalone 资源已同步"
}

restart_service() {
  if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
    pm2 restart "${PM2_CONFIG}" --update-env
  else
    pm2 start "${PM2_CONFIG}"
  fi

  pm2 save >/dev/null
  refresh_runtime_state
  mark_step_ok "PM2 服务已更新，当前状态：${PM2_STATUS_TEXT}"
}

health_check() {
  require_command curl

  local attempt=1
  while (( attempt <= HEALTH_RETRIES )); do
    if curl -fsSL --connect-timeout 3 --max-time 8 "${HEALTH_ENDPOINT}" >/dev/null 2>&1; then
      mark_step_ok "健康检查通过：${HEALTH_ENDPOINT}"
      return 0
    fi

    printf '%b.%b' "${DIM}" "${RESET}"
    sleep 2
    ((attempt++))
  done

  printf '\n'
  log_line fail "健康检查失败，${HEALTH_RETRIES} 次尝试后服务仍不可用"
  return 1
}

verify_local_robots() {
  if ! command -v curl >/dev/null 2>&1; then
    log_line warn "未安装 curl，跳过 robots.txt 检查"
    return 0
  fi

  local robots_url="${HEALTH_ENDPOINT%/}/robots.txt"
  local robots_content=""
  robots_content="$(curl -fsSL --connect-timeout 3 --max-time 8 "${robots_url}" || true)"

  if [[ -z "${robots_content}" ]]; then
    log_line warn "未能读取 robots.txt，收录脚本仍会继续尝试执行"
    return 0
  fi

  if grep -Eq '^[[:space:]]*Allow:[[:space:]]*/[[:space:]]*$' <<<"${robots_content}" || ! grep -Eq '^[[:space:]]*Disallow:[[:space:]]*/[[:space:]]*$' <<<"${robots_content}"; then
    log_line info "robots.txt 看起来允许公开页面被抓取"
  else
    log_line warn "robots.txt 可能限制了抓取，请留意后续收录结果"
  fi
}

run_indexing_flow() {
  if [[ "${RUN_INDEXING_AFTER_DEPLOY}" != "1" ]]; then
    INDEXING_STATUS="已按配置跳过"
    mark_step_warn "已按配置跳过搜索引擎收录"
    return 0
  fi

  verify_local_robots

  if pnpm seo:push; then
    INDEXING_STATUS="执行完成"
    mark_step_ok "搜索引擎收录脚本执行完成"
  else
    INDEXING_STATUS="执行失败，但不阻塞上线"
    mark_step_warn "搜索引擎收录脚本执行失败，但主站已部署完成"
  fi
}

print_service_summary() {
  local elapsed="$1"
  refresh_runtime_state

  printf '\n'
  rule
  printf '%b%s%b\n' "${GREEN}${BOLD}" "  DEPLOYMENT COMPLETE | 版本已切换完成" "${RESET}"
  printf '%b%s%b\n' "${DIM}" "  服务状态、入口信息与部署结果如下" "${RESET}"
  rule

  print_named_table \
    "服务信息总览" \
    "应用名称" "${APP_NAME}" \
    "PM2 进程" "${APP_NAME}" \
    "运行状态" "${PM2_STATUS_TEXT}" \
    "进程 PID" "${PM2_PID_TEXT}" \
    "监听端口" "${APP_PORT}" \
    "健康检查" "${HEALTH_ENDPOINT}" \
    "部署来源" "${DEPLOY_SOURCE_LABEL}" \
    ".env 状态" "${FINAL_ENV_STATUS}" \
    "storage 状态" "${FINAL_STORAGE_STATUS}" \
    "数据库位置" "${DATABASE_LOCATION}" \
    "邮件授权码" "${SMTP_PASSWORD_STATUS}" \
    "收录状态" "${INDEXING_STATUS}" \
    "部署日志" "${DEPLOY_LOG}" \
    "总耗时" "$(format_duration "${elapsed}")"

  log_line ok "部署完成，站点已切到最新版本"
}

print_help() {
  cat <<'EOF'
用法:
  ./deploy.sh [选项]

选项:
  --source <current|github|local>
  --github <owner/repo@ref 或完整归档 URL>
  --local <本地目录或压缩包路径>
  --db-sync <skip|safe|force>
  --skip-git-pull
  --skip-indexing
  --yes
  --help
EOF
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
      --help)
        print_help
        exit 0
        ;;
      *)
        log_line fail "未知参数：$1"
        exit 1
        ;;
    esac
  done
}

parse_args "$@"

refresh_plan_state
refresh_runtime_state

# 所有的交互式 prompt 必须在日志重定向截断前执行
DEPLOY_SOURCE="$(normalize_source_mode "${DEPLOY_SOURCE}")"
refresh_source_label

if [[ "${DEPLOY_SOURCE}" == "github" && -z "${GITHUB_SOURCE}" ]]; then
  GITHUB_SOURCE="$(prompt_text "请输入 GitHub 来源（owner/repo@ref、仓库 URL 或归档 URL）" "${GITHUB_SOURCE_DEFAULT}")"
fi

if [[ "${DEPLOY_SOURCE}" == "local" && -z "${LOCAL_SOURCE}" ]]; then
  LOCAL_SOURCE="$(prompt_text "请输入本地目录或压缩包路径" "")"
fi

DB_SYNC_MODE="$(resolve_db_sync_mode)"

# 强制性后台秘密入口校验：严禁任何 admin 回退，未配置则阻塞输入
ADMIN_ENTRY_VAL="$(env_file_value "ADMIN_LOGIN_ENTRY")"
if [[ -z "${ADMIN_ENTRY_VAL}" ]]; then
  log_line warn "未在 .env 中检测到 ADMIN_LOGIN_ENTRY"
  ADMIN_ENTRY_VAL="$(prompt_text "请输入后台秘密入口路径 (严禁 admin, 建议使用复杂字符串)" "")"
  while [[ "${ADMIN_ENTRY_VAL}" == "admin" || -z "${ADMIN_ENTRY_VAL}" ]]; do
    log_line fail "入口路径不能为 admin 或为空，请重新输入"
    ADMIN_ENTRY_VAL="$(prompt_text "管理入口路径" "")"
  done
  printf "\nADMIN_LOGIN_ENTRY=%s\n" "${ADMIN_ENTRY_VAL}" >> "${ENV_FILE}"
  log_line ok "已自动补全配置至 .env: ${ADMIN_ENTRY_VAL}"
elif [[ "${ADMIN_ENTRY_VAL}" == "admin" ]]; then
  log_line fail "安全警告: 当前配置为默认值 admin，已触发强制中断逻辑"
  ADMIN_ENTRY_VAL="$(prompt_text "请重新输入后台秘密入口 (例如：cot_secret)" "")"
  while [[ "${ADMIN_ENTRY_VAL}" == "admin" || -z "${ADMIN_ENTRY_VAL}" ]]; do
    log_line fail "入口不能为 admin，请重输"
    ADMIN_ENTRY_VAL="$(prompt_text "新管理入口路径" "")"
  done
  sed -i "s/ADMIN_LOGIN_ENTRY=admin/ADMIN_LOGIN_ENTRY=${ADMIN_ENTRY_VAL}/g" "${ENV_FILE}"
  log_line ok "已强行覆盖无效的 admin 配置"
fi

mkdir -p "${LOG_DIR}"
touch "${DEPLOY_LOG}"
# 取得输入后开始持久化日志，屏蔽掉此后的冗余等待
exec > >(tee -a "${DEPLOY_LOG}") 2>&1

DEPLOY_START="$(date +%s)"

banner
log_line info "日志文件：${DEPLOY_LOG}"
log_line info "部署目录：${APP_ROOT}"
print_deploy_plan

start_step "CHECK_ENV" "检查部署环境"
check_environment

start_step "PREP_SOURCE" "准备发布源"
prepare_release_source

start_step "INSTALL" "安装依赖"
install_dependencies

start_step "DB_SYNC" "同步数据库"
run_database_sync "${DB_SYNC_MODE}"

start_step "BUILD" "构建应用"
build_application

start_step "RESTART" "重启服务"
restart_service

start_step "HEALTH" "健康检查"
health_check

start_step "INDEXING" "搜索引擎收录"
run_indexing_flow

DEPLOY_END="$(date +%s)"
ELAPSED="$((DEPLOY_END - DEPLOY_START))"
print_service_summary "${ELAPSED}"
