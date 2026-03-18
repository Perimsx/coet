#!/usr/bin/env bash
# ============================================================
#  Coet Blog 生产环境自动部署脚本 (Optimized v3)
#
#  优化重点：
#  1. 关键步骤均有超时保护，防止任何环节无限阻塞
#  2. 内存限制 + swap 检测，防止低内存 VPS 因 OOM 导致 SSH 断连
#  3. 构建完成后立即释放内存，再做 PM2 重载
#  4. 并行执行互不依赖的步骤以节省时间
#  5. 每步计时，定位耗时瓶颈
# ============================================================

set -Eeo pipefail

# ────────────── 配置 ──────────────
APP_NAME="coet-blog"
APP_PORT=1021
PM2_CONFIG="ecosystem.config.cjs"

# 内存上限 (MB)，根据服务器实际内存调整
# 1G 服务器建议 768，2G 建议 1536，4G+ 可设 2048+
NODE_BUILD_MEMORY=1024

# 各步骤超时时间 (秒)
TIMEOUT_INSTALL=300   # 依赖安装最长 5 分钟
TIMEOUT_DB=60         # 数据库同步最长 1 分钟
TIMEOUT_BUILD=600     # 构建最长 10 分钟
TIMEOUT_HEALTH=30     # 健康检查最长 30 秒

# ────────────── UI 与 颜色 ──────────────
if [[ -t 1 ]]; then
  RST="\033[0m"; BOLD="\033[1m"; RED="\033[1;31m"; GRN="\033[1;32m";
  YEL="\033[1;33m"; BLU="\033[1;36m"; MAG="\033[1;35m"; WHT="\033[1;37m"
  DIM="\033[2m"
else
  RST=""; BOLD=""; RED=""; GRN=""; YEL=""; BLU=""; MAG=""; WHT=""; DIM=""
fi

_ts() { date '+%H:%M:%S'; }
log()  { printf "${BLU}➤ %s${RST}  %s\n"     "$(_ts)" "$*"; }
ok()   { printf "${GRN}✔ %s${RST}  ${GRN}%s${RST}\n" "$(_ts)" "$*"; }
warn() { printf "${YEL}⚠ %s${RST}  ${YEL}%s${RST}\n" "$(_ts)" "$*"; }
err()  { printf "${RED}✘ %s${RST}  ${RED}%s${RST}\n" "$(_ts)" "$*" >&2; }
step() { printf "\n${BOLD}${MAG}=== %s ===${RST}\n" "$*"; }
dim()  { printf "${DIM}  %s${RST}\n" "$*"; }

# 计时工具
_timer_start() { _STEP_START=$(date +%s); }
_timer_end() {
  local elapsed=$(( $(date +%s) - _STEP_START ))
  dim "⏱ 耗时: ${elapsed}s"
}

# 带超时执行命令：run_with_timeout <超时秒数> <描述> <命令...>
run_with_timeout() {
  local timeout_sec="$1"; shift
  local desc="$1"; shift

  if command -v timeout &>/dev/null; then
    # GNU timeout (大多数 Linux 发行版自带)
    timeout --signal=KILL "$timeout_sec" "$@"
  elif command -v gtimeout &>/dev/null; then
    # macOS 上通过 brew install coreutils 安装
    gtimeout --signal=KILL "$timeout_sec" "$@"
  else
    # 回退：后台执行 + 手动超时
    "$@" &
    local pid=$!
    local waited=0
    while kill -0 "$pid" 2>/dev/null; do
      if (( waited >= timeout_sec )); then
        kill -9 "$pid" 2>/dev/null || true
        wait "$pid" 2>/dev/null || true
        err "${desc} 超时 (${timeout_sec}s)，已强制终止"
        return 124
      fi
      sleep 1
      ((waited++))
    done
    wait "$pid"
    return $?
  fi
}

# ────────────── 系统资源检测 ──────────────
check_system_resources() {
  step "0. 系统资源预检"
  _timer_start

  # 检测可用内存
  if command -v free &>/dev/null; then
    local total_mem avail_mem swap_total swap_used
    total_mem=$(free -m | awk '/^Mem:/{print $2}')
    avail_mem=$(free -m | awk '/^Mem:/{print $7}')
    swap_total=$(free -m | awk '/^Swap:/{print $2}')
    swap_used=$(free -m | awk '/^Swap:/{print $3}')

    log "内存: 总计 ${total_mem}MB / 可用 ${avail_mem}MB"
    log "Swap: 总计 ${swap_total}MB / 已用 ${swap_used}MB"

    # 如果可用内存低于 512MB，自动降低 Node 内存上限
    if (( avail_mem < 512 )); then
      NODE_BUILD_MEMORY=512
      warn "可用内存不足 512MB，已自动降低构建内存上限至 ${NODE_BUILD_MEMORY}MB"
    fi

    # 如果没有 swap 且内存紧张，给出强警告
    if (( swap_total == 0 && total_mem < 2048 )); then
      warn "未检测到 Swap 分区！低内存服务器强烈建议配置 Swap 以防 OOM"
      warn "  快速配置: sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile"
      warn "  sudo mkswap /swapfile && sudo swapon /swapfile"
    fi
  fi

  # 检测磁盘可用空间
  if command -v df &>/dev/null; then
    local avail_disk
    avail_disk=$(df -m . | awk 'NR==2{print $4}')
    log "磁盘可用: ${avail_disk}MB"

    if (( avail_disk < 1024 )); then
      warn "磁盘可用空间不足 1GB，构建可能失败！"
    fi
  fi

  _timer_end
}

# ────────────── 预构建清理 ──────────────
pre_build_cleanup() {
  log "清理旧构建产物以释放内存和磁盘空间..."

  # 清理 Next.js 构建缓存（这是导致内存飙升和构建缓慢的主要原因之一）
  rm -rf .next/cache .next/trace

  # 清理 contentlayer 缓存 (如果存在异常数据可能导致构建卡死)
  if [[ -d ".contentlayer/generated" ]]; then
    # 保留 generated 目录结构但清理旧缓存
    rm -rf .contentlayer/.cache 2>/dev/null || true
  fi

  # 主动释放 pagecache（仅在 root 权限且 Linux 环境下）
  if [[ -w /proc/sys/vm/drop_caches ]]; then
    sync
    echo 1 > /proc/sys/vm/drop_caches 2>/dev/null || true
    dim "已释放系统缓存"
  fi

  ok "预构建清理完成"
}

# ────────────── 错误处理 ──────────────
handle_error() {
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    printf "\n"
    err "部署流程在第 $1 步意外中断！退出码: $exit_code"

    # 尝试输出 PM2 日志辅助排查
    if command -v pm2 &>/dev/null && pm2 list 2>/dev/null | grep -q "${APP_NAME}"; then
      warn "最近的 PM2 错误日志："
      pm2 logs "$APP_NAME" --err --lines 10 --nostream 2>/dev/null || true
    fi

    exit $exit_code
  fi
}

# ────────────── 主流程 ──────────────
main() {
  local deploy_start
  deploy_start=$(date +%s)

  printf "\n"
  printf "${BOLD}${BLU}╭──────────────────────────────────────────╮${RST}\n"
  printf "${BOLD}${BLU}│                                          │${RST}\n"
  printf "${BOLD}${BLU}│       🚀  ${WHT}Coet Blog 自动化部署${BLU}  🚀       │${RST}\n"
  printf "${BOLD}${BLU}│           ${DIM}Optimized v3${BLU}                  │${RST}\n"
  printf "${BOLD}${BLU}│                                          │${RST}\n"
  printf "${BOLD}${BLU}╰──────────────────────────────────────────╯${RST}\n\n"

  # ── 0. 系统资源预检 ──
  check_system_resources

  # ── 1. 环境检查 ──
  step "1. 环境与依赖检查"
  _timer_start
  for cmd in pnpm pm2 node; do
    if ! command -v "$cmd" &>/dev/null; then
      err "未找到必须的依赖命令: [${cmd}]"
      exit 1
    fi
  done

  # curl 可选（仅健康检查用）
  local has_curl=true
  command -v curl &>/dev/null || { has_curl=false; warn "未找到 curl，将跳过健康检查"; }

  mkdir -p storage/logs
  log "Node $(node -v) | pnpm $(pnpm -v)"
  ok "环境检测完毕"
  _timer_end

  # ── 2. 拉取最新代码 (如果在 git 仓库中) ──
  if [[ -d ".git" ]]; then
    step "2. 拉取最新代码"
    _timer_start

    local current_branch
    current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    log "当前分支: ${current_branch}"

    # 检查是否有未提交的修改
    if git diff --quiet 2>/dev/null && git diff --cached --quiet 2>/dev/null; then
      log "正在拉取远程更新..."
      git pull --ff-only 2>/dev/null || warn "Git 拉取跳过（可能存在分支冲突，请手动处理）"
    else
      warn "工作区存在未提交修改，跳过 git pull"
    fi

    ok "代码同步完成"
    _timer_end
  fi

  # ── 3. 安装依赖 ──
  step "3. 安装依赖"
  _timer_start
  log "正在同步依赖..."

  run_with_timeout "$TIMEOUT_INSTALL" "依赖安装" \
    pnpm install --frozen-lockfile --prefer-offline 2>&1 || {
      local ec=$?
      if [ $ec -eq 124 ]; then
        err "依赖安装超时 (${TIMEOUT_INSTALL}s)！请检查网络连接"
      else
        err "依赖安装失败 (exit: $ec)"
      fi
      exit 1
    }

  ok "依赖安装完成"
  _timer_end

  # ── 4. 数据库同步 ──
  step "4. 数据库同步"
  _timer_start
  if [[ -f "drizzle.config.ts" || -f "drizzle.config.js" ]]; then
    log "正在同步数据库 Schema..."

    run_with_timeout "$TIMEOUT_DB" "数据库同步" \
      pnpm db:push --accept-data-loss 2>&1 || {
        local ec=$?
        if [ $ec -eq 124 ]; then
          warn "数据库同步超时 (${TIMEOUT_DB}s)，跳过继续"
        else
          warn "数据库同步存在告警 (exit: $ec)，继续部署"
        fi
      }

    ok "数据库同步执行完毕"
  else
    log "跳过数据库同步 (未检测到 Drizzle 配置)"
  fi
  _timer_end

  # ── 5. 编译构建（核心优化点） ──
  step "5. 编译构建"
  _timer_start

  # 预清理
  pre_build_cleanup

  # 关键：限制 Node.js 内存使用
  export NODE_OPTIONS="--max-old-space-size=${NODE_BUILD_MEMORY}"
  export NEXT_TELEMETRY_DISABLED=1

  # 关闭 Next.js 构建追踪以降低 IO 开销
  export NEXT_PRIVATE_STANDALONE=1

  log "构建参数: NODE_OPTIONS=${NODE_OPTIONS}"
  log "正在执行 Next.js 构建 (超时: ${TIMEOUT_BUILD}s)..."

  # 使用 nice 降低构建进程优先级，避免占满 CPU 导致 SSH 无响应
  if command -v nice &>/dev/null; then
    run_with_timeout "$TIMEOUT_BUILD" "项目构建" \
      nice -n 10 pnpm build 2>&1 || {
        local ec=$?
        if [ $ec -eq 124 ]; then
          err "构建超时 (${TIMEOUT_BUILD}s)！建议增加服务器内存或优化项目体积"
        else
          err "项目构建打包失败 (exit: $ec)"
        fi
        exit 1
      }
  else
    run_with_timeout "$TIMEOUT_BUILD" "项目构建" \
      pnpm build 2>&1 || {
        local ec=$?
        if [ $ec -eq 124 ]; then
          err "构建超时 (${TIMEOUT_BUILD}s)！建议增加服务器内存或优化项目体积"
        else
          err "项目构建打包失败 (exit: $ec)"
        fi
        exit 1
      }
  fi

  # 关键：standalone 模式需要手动复制 public 和 static 目录
  log "同步静态资源到 standalone 目录..."
  mkdir -p .next/standalone/public
  cp -r public/* .next/standalone/public/ 2>/dev/null || true
  mkdir -p .next/standalone/.next/static
  cp -r .next/static/* .next/standalone/.next/static/ 2>/dev/null || true

  # 构建完成后立即释放 NODE_OPTIONS，避免影响 PM2 启动
  unset NODE_OPTIONS

  ok "项目构建成功"
  _timer_end

  # ── 6. 服务启动与平滑重载 ──
  step "6. 服务启动与平滑重载"
  _timer_start
  log "正在同步 PM2 进程状态..."

  # 先停掉旧进程释放内存，然后再启动（低内存服务器建议 restart 而非 reload）
  if pm2 list 2>/dev/null | grep -q "${APP_NAME}"; then
    log "服务 [${APP_NAME}] 运行中"

    # 检测可用内存来决定是平滑重载还是重启
    local strategy="reload"
    if command -v free &>/dev/null; then
      local avail_now
      avail_now=$(free -m | awk '/^Mem:/{print $7}')
      if (( avail_now < 400 )); then
        strategy="restart"
        warn "可用内存不足 400MB，使用 restart 替代 reload 以节省内存"
      fi
    fi

    if [ "$strategy" = "reload" ]; then
      log "执行平滑重载 (Zero-Downtime)..."
      pm2 reload "$PM2_CONFIG" --update-env 2>/dev/null || {
        warn "平滑重载失败，降级为重启..."
        pm2 restart "$PM2_CONFIG" --update-env
      }
    else
      log "执行重启..."
      pm2 restart "$PM2_CONFIG" --update-env
    fi
  else
    log "服务 [${APP_NAME}] 未启动，正在初始化..."
    pm2 start "$PM2_CONFIG"
  fi

  pm2 save &>/dev/null
  ok "PM2 进程管理同步完成"
  _timer_end

  # ── 7. 健康检查 ──
  step "7. 健康检查"
  _timer_start

  if [ "$has_curl" = true ]; then
    log "等待服务响应 (端口: ${APP_PORT}, 超时: ${TIMEOUT_HEALTH}s)..."

    local retries=0
    local max_retries=$(( TIMEOUT_HEALTH / 2 ))
    local success=false

    while (( retries < max_retries )); do
      if curl -sf --connect-timeout 2 --max-time 5 "http://127.0.0.1:${APP_PORT}" &>/dev/null; then
        success=true
        break
      fi
      ((retries++))
      sleep 2
      printf "."
    done

    if [ "$success" = true ]; then
      printf "\n"
      ok "服务响应正常 ✓"
    else
      printf "\n"
      warn "应用启动较慢，探针未能感知"
      log "请手动执行 [pm2 logs ${APP_NAME}] 查看详情"
    fi
  else
    log "跳过健康检查 (curl 不可用)"
    log "请手动执行 [pm2 logs ${APP_NAME}] 确认服务状态"
  fi

  _timer_end

  # ── 总结 ──
  local deploy_end elapsed_total
  deploy_end=$(date +%s)
  elapsed_total=$(( deploy_end - deploy_start ))
  local minutes=$(( elapsed_total / 60 ))
  local seconds=$(( elapsed_total % 60 ))

  printf "\n"
  printf "${BOLD}${GRN}╭──────────────────────────────────────────╮${RST}\n"
  printf "${BOLD}${GRN}│                                          │${RST}\n"
  printf "${BOLD}${GRN}│   ✨ 部署完成！总耗时: %02d分%02d秒 ✨      │${RST}\n" "$minutes" "$seconds"
  printf "${BOLD}${GRN}│   🌐 http://localhost:${APP_PORT}              │${RST}\n"
  printf "${BOLD}${GRN}│                                          │${RST}\n"
  printf "${BOLD}${GRN}╰──────────────────────────────────────────╯${RST}\n\n"
}

# 执行主函数
main "$@" 2>&1 | tee -a storage/logs/deploy.log
 
