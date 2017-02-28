var pmx = require('pmx');
var rpc = require('pm2-axon-rpc');
var axon = require('pm2-axon');
var net = require('net');
var utils = require('./utils');
var debug = utils.debug('model');

var PROCESS_NAME = 'pm2-monit-daemon';
var PM2_ROOT_PATH = utils.getPM2home();
var RPC_PATH = 'unix://' + PM2_ROOT_PATH + '/rpc.sock';
var PUB_PATH = 'unix://'+ PM2_ROOT_PATH +'/pub.sock'
var Probe = pmx.probe();
var req = axon.socket('req');
var rpcClient = new rpc.Client(req);
var SOCKET = new net.Socket();

var conf = pmx.initModule({
  widget: {
    logo: 'https://app.keymetrics.io/img/logo/keymetrics-300.png',
    theme: ['#141A1F', '#222222', '#3ff', '#3ff'],
    el : { probes: true, actions: true },
    block : { actions: false, issues: true, meta : true, main_probes: ['test-probe']},
  }
});

// default: 30 secs
var WORKER_INTERVAL = isNaN(parseInt(conf.workerInterval)) ? 30 * 1000 : parseInt(conf.workerInterval) * 1000;

SOCKET.on('connect' ,function() {
  debug('CONNECTED TO:' + SOCKET.remoteAddress + ':' + SOCKET.remotePort);
  req.connect(RPC_PATH);
  sendSystemData();
});

SOCKET.on('data', function(data) {
  debug('DATA:' + data);
});

SOCKET.on('close', function() {
  debug('Connection closed');
});

SOCKET.on('error', function(error) {
  debug('ERROR:' + error);
});

function connectServer(server, callback) {
  var SERVER = conf.server.split(':');
  if(SERVER.length !== 2) return;
  var HOST = SERVER[0];
  var PORT = SERVER[1];
  SOCKET.connect(PORT, HOST, callback);
}

function sendSystemData() {
  if(SOCKET.destroyed) return;
  rpcClient.call('getSystemData', {}, function (err, data) {
    if(err) return;
    debug('getSystemData', JSON.stringify(data));
    var monit = { type: 'system', data};
    SOCKET.write(JSON.stringify(monit));
  })
}

function sendMonitorData() {
  if(SOCKET.destroyed) return;
  rpcClient.call('getMonitorData', {}, function (err, data) {
    if(err) return;
    debug('getMonitorData', JSON.stringify(data));
    var monit = { type: 'monit', data};
    SOCKET.write(JSON.stringify(monit));
  })
}

if(conf.server) {
  connectServer(conf.server);
}

setInterval(function(){
  if(SOCKET.destroyed) {
    connectServer(conf.server, sendSystemData);
  } else {
    sendSystemData();
  }
}, WORKER_INTERVAL);

// var sock = axon.socket('pull');

// sock.connect('unix://'+ PM2_ROOT_PATH +'/pub.sock');

// sock.on('message', function (msg, data) {
//   if(data.process.name === PROCESS_NAME) return;
//   console.log(data);
// });
