module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME || 'cotovo',
      cwd: process.env.PM2_CWD || process.cwd(),
      script: '.next/standalone/server.js',
      interpreter: 'node',
      instances: Number(process.env.PM2_INSTANCES || 1),
      exec_mode: process.env.PM2_EXEC_MODE || 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: process.env.PM2_MAX_MEMORY || '512M',
      restart_delay: Number(process.env.PM2_RESTART_DELAY || 2000),
      max_restarts: Number(process.env.PM2_MAX_RESTARTS || 20),
      kill_timeout: Number(process.env.PM2_KILL_TIMEOUT || 5000),
      listen_timeout: Number(process.env.PM2_LISTEN_TIMEOUT || 10000),
      merge_logs: true,
      time: true,
      out_file: process.env.PM2_OUT_LOG || './storage/logs/pm2-out.log',
      error_file: process.env.PM2_ERROR_LOG || './storage/logs/pm2-error.log',
      env: {
        NODE_ENV: 'production',
        HOSTNAME: process.env.HOSTNAME || '127.0.0.1',
        PORT: process.env.PORT || '3010',
      },
    },
  ],
}
