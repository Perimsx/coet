/**
 * PM2 生产环境部署配置文件
 */
module.exports = {
  apps: [
    {
      name: 'coet-blog',
      cwd: process.cwd(),
      script: './.next/standalone/server.js',
      interpreter: 'node',

      // 单实例 fork 模式（适合低配 VPS）
      instances: 1,
      exec_mode: 'fork',

      // 自动重启策略
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',  // 降低内存阈值，更激进地回收异常进程
      restart_delay: 3000,         // 重启间隔 3 秒，避免频繁重启高 IO
      max_restarts: 10,            // 连续重启上限
      min_uptime: 5000,            // 运行不足 5 秒视为异常启动

      // 信号与超时
      kill_timeout: 8000,          // SIGINT 后 8 秒未退由 SIGKILL 强杀
      listen_timeout: 15000,       // 等待 ready 信号的超时
      shutdown_with_message: false,

      // 日志配置
      merge_logs: true,
      time: true,
      out_file: './storage/logs/pm2-out.log',
      error_file: './storage/logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      // Node.js 运行时参数
      node_args: '--max-old-space-size=384',  // 运行时限制 384MB（Next.js 生产模式通常 200MB 以内）

      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT: '1021',
        HOSTNAME: '0.0.0.0',
        NEXT_TELEMETRY_DISABLED: '1',
        NODE_TLS_REJECT_UNAUTHORIZED: '0',
      },
    },
  ],
}
