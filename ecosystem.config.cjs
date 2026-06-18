const path = require('path')

module.exports = {
  apps: [
    {
      name: 'cotovo',
      cwd: path.resolve(__dirname),
      script: '.next/standalone/server.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      restart_delay: 2000,
      max_restarts: 20,
      kill_timeout: 5000,
      listen_timeout: 10000,
      merge_logs: true,
      time: true,
      out_file: './storage/logs/pm2-out.log',
      error_file: './storage/logs/pm2-error.log',
      env: {
        NODE_ENV: 'production',
        HOSTNAME: '127.0.0.1',
        PORT: '3010',
      },
    },
  ],
}
