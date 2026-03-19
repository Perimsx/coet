const appName = process.env.PM2_APP_NAME || "coet-blog"
const port = process.env.PORT || "1021"

module.exports = {
  apps: [
    {
      name: appName,
      cwd: process.cwd(),
      script: "./.next/standalone/server.js",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: 5000,
      kill_timeout: 10000,
      listen_timeout: 15000,
      merge_logs: true,
      time: true,
      out_file: "./storage/logs/pm2-out.log",
      error_file: "./storage/logs/pm2-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      node_args: "--max-old-space-size=384",
      env: {
        NODE_ENV: "production",
        PORT: port,
        HOSTNAME: "0.0.0.0",
        NEXT_TELEMETRY_DISABLED: "1",
      },
    },
  ],
}
