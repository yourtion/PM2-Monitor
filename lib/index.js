module.exports = function (conf) {
  const pmx = require('pmx');
  const rpc = require('pm2-axon-rpc');
  const axon = require('pm2-axon');
  const net = require('net');
  const utils = require('./utils');
  const debug = utils.debug('model');

  const PROCESS_NAME = 'pm2-monit-daemon';
  const PM2_ROOT_PATH = utils.getPM2home();
  const RPC_PATH = 'unix://' + PM2_ROOT_PATH + '/rpc.sock';
  const PUB_PATH = 'unix://' + PM2_ROOT_PATH + '/pub.sock';
  const Probe = pmx.probe();
  const req = axon.socket('req');
  const rpcClient = new rpc.Client(req);
  const SOCKET = new net.Socket();

  // default: 30 secs
  const WORKER_INTERVAL = isNaN(parseInt(conf.workerInterval, 10)) ? 30 * 1000 : parseInt(conf.workerInterval, 10) * 1000;

  SOCKET.on('connect', function () {
    debug('CONNECTED TO:' + SOCKET.remoteAddress + ':' + SOCKET.remotePort);
    req.connect(RPC_PATH);
    sendSystemData();
  });

  SOCKET.on('data', function (data) {
    debug('DATA:' + data);
  });

  SOCKET.on('close', function () {
    debug('Connection closed');
  });

  SOCKET.on('error', function (error) {
    debug('ERROR:' + error);
  });

  function connectServer(server, callback) {
    const SERVER = conf.server.split(':');
    if(SERVER.length !== 2) return;
    const HOST = SERVER[0];
    const PORT = SERVER[1];
    SOCKET.connect(PORT, HOST, callback);
  }

  function sendSystemData() {
    if(SOCKET.destroyed) return;
    rpcClient.call('getSystemData', {}, function (err, data) {
      if(err) return;
      debug('getSystemData', JSON.stringify(data));
      const monit = { type: 'system', data };
      SOCKET.write(JSON.stringify(monit));
    });
  }

  function sendMonitorData() {
    if(SOCKET.destroyed) return;
    rpcClient.call('getMonitorData', {}, function (err, data) {
      if(err) return;
      debug('getMonitorData', JSON.stringify(data));
      const monit = { type: 'monit', data };
      SOCKET.write(JSON.stringify(monit));
    });
  }

  if(conf.server) {
    connectServer(conf.server);
  }

  setInterval(function (){
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

};
