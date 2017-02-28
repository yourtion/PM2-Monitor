var pmx = require('pmx');
var rpc = require('pm2-axon-rpc');
var axon = require('pm2-axon');
var net = require('net');
var debug = require('debug')('PM2-Monit:module');

var req = axon.socket('req');
var rpcClient = new rpc.Client(req);

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

var SOCKET = new net.Socket();

if (process.env.PM2_HOME)
  PM2_ROOT_PATH = process.env.PM2_HOME;
else if (process.env.HOME && !process.env.HOMEPATH)
  PM2_ROOT_PATH = path.resolve(process.env.HOME, '.pm2');
else if (process.env.HOME || process.env.HOMEPATH)
  PM2_ROOT_PATH = path.resolve(process.env.HOMEDRIVE, process.env.HOME || process.env.HOMEPATH, '.pm2');

// default: 30 secs
var WORKER_INTERVAL = isNaN(parseInt(conf.workerInterval)) ? 30 * 1000 : parseInt(conf.workerInterval) * 1000;

function connectServer(server, callback) {
  var SERVER = conf.server.split(':');
  if(SERVER.length !== 2) return;
  var HOST = SERVER[0];
  var PORT = SERVER[1];
  SOCKET.connect(6969, '127.0.0.1', callback);
}

if(conf.server) {
  connectServer(conf.server);
    SOCKET.on('connect' ,function() {
    debug('CONNECTED TO:' + SOCKET.remoteAddress + ':' + SOCKET.remotePort);
    req.connect('unix://' + PM2_ROOT_PATH + '/rpc.sock');
    sendSystemData();
  });

  // 为客户端添加“data”事件处理函数
  // data是服务器发回的数据
  SOCKET.on('data', function(data) {
    debug('DATA:' + data);
  });

  // 为客户端添加“close”事件处理函数
  SOCKET.on('close', function() {
    debug('Connection closed');
  });

  SOCKET.on('error', function(error) {
    debug('ERROR:' + error);
  });
}

function sendSystemData() {
  if(SOCKET.destroyed) return;
  rpcClient.call('getSystemData',{}, function (err, data) {
    if(err) return;
    debug('getSystemData', JSON.stringify(data));
    var monit = { type: 'system', data};
    SOCKET.write(JSON.stringify(monit));
  })
}

function sendMonitorData() {
  if(SOCKET.destroyed) return;
  rpcClient.call('getMonitorData',{}, function (err, data) {
    if(err) return;
    debug('getMonitorData', JSON.stringify(data));
    var monit = { type: 'monit', data};
    SOCKET.write(JSON.stringify(monit));
  })
}

setInterval(function(){
  console.log(new Date());
  if(SOCKET.destroyed && conf.server) {
    connectServer(conf.server, sendMonitorData);
  } else {
    sendMonitorData();
  }
}, WORKER_INTERVAL);

// var sock = axon.socket('pull');

// sock.connect('unix://'+ PM2_ROOT_PATH +'/pub.sock');

// sock.on('message', function (msg, data) {
//   if(data.process.name === PROCESS_NAME) return;
//   console.log(data);
// });
