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
    prod : {
      user : 'deployer',
      host : ['nahis-wayard.fr'],
      ref  : 'origin/master',
      repo : 'git@github.com:NahisWayard/web-chat.git',
      path : '/home/deployer/web-chat',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
