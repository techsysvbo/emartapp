module.exports = {
  apps: [
    {
      name: 'diaspora-connect-api',
      script: './server/server.js',
      cwd: __dirname,
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/log/diaspora-connect/error.log',
      out_file: '/var/log/diaspora-connect/out.log',
      merge_logs: true,
      max_memory_restart: '512M',
    },
  ],
};
