const pmx = require('pmx');
pmx.initModule({
  widget: {
    logo: 'https://app.keymetrics.io/img/logo/keymetrics-300.png',
    theme: [ '#141A1F', '#222222', '#3ff', '#3ff' ],
    el: { probes: true, actions: true },
    block: { actions: false, issues: true, meta: true, main_probes: [ 'test-probe' ]},
  },
}, function (_err, conf) {
  require('./lib/index')(conf);
});

pmx.configureModule({
  human_info: [
    [ 'Git', 'https://github.com/yourtion/pm2-monit-daemon.git' ],
    [ 'Comment', 'pm2 set pm2-monit-daemon:server IP:PORT' ],
  ],
});
