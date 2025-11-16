module.exports = {
  apps: [
    {
      name: 'base-flashloan-arb-bot',
      script: 'src/index.js',
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
