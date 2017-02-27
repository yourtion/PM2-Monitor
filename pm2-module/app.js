var pmx = require('pmx');
var rpc = require('pm2-axon-rpc');
var axon = require('pm2-axon');

var conf = pmx.initModule({
  widget: {
    logo: 'https://app.keymetrics.io/img/logo/keymetrics-300.png',
    theme: ['#141A1F', '#222222', '#3ff', '#3ff'],
    el : { probes: true, actions: true },
    block : { actions: false, issues: true, meta : true, main_probes: ['test-probe']},
  }
});

var PROCESS_NAME = 'pm2-monit-daemon';
var PM2_ROOT_PATH = '';
var Probe = pmx.probe();

if (process.env.PM2_HOME)
  PM2_ROOT_PATH = process.env.PM2_HOME;
else if (process.env.HOME && !process.env.HOMEPATH)
  PM2_ROOT_PATH = path.resolve(process.env.HOME, '.pm2');
else if (process.env.HOME || process.env.HOMEPATH)
  PM2_ROOT_PATH = path.resolve(process.env.HOMEDRIVE, process.env.HOME || process.env.HOMEPATH, '.pm2');

// default: 30 secs
var WORKER_INTERVAL = isNaN(parseInt(conf.workerInterval)) ? 30 * 1000 : parseInt(conf.workerInterval) * 1000;
console.log(conf);

// var sock = axon.socket('pull');

// sock.connect('unix://'+ PM2_ROOT_PATH +'/pub.sock');

// // var dataT = '';

// sock.on('message', function (msg, data) {
//   if(data.process.name === PROCESS_NAME) return;
//   console.log(data);
// });


// var req = axon.socket('req');
// var client = new rpc.Client(req);
// req.connect('unix:///Users/yourtion/.pm2/rpc.sock');


// client.call('getMonitorData',{}, function (err, n) {
// console.log(JSON.stringify(n));
// })
// client.call('getSystemData', {}, function (err, n) {
//   console.log(JSON.stringify(n));
// })
