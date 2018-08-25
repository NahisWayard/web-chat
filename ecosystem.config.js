module.exports = {
  apps : [{
    name      : 'web-chat',
    script    : 'app.js',
    env: {
      NODE_ENV: 'development'
    },
    env_production : {
      NODE_ENV: 'production'
    }
  }],

  deploy : {
    production : {
      user : 'NahisWayard',
      host : '212.83.163.1',
      ref  : 'origin/master',
      repo : 'git@github.com:NahisWayard/web-chat.git',
      path : '/var/www/production',
      'post-deploy' : 'NODE_ENV=\'production\' && npm install && pm2 reload ecosystem.config.js'
    }
  }
};
