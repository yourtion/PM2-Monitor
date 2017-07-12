'use strict';

const pmx = require('pmx');
const rpc = require('pm2-axon-rpc');
const axon = require('pm2-axon');
const net = require('net');
const utils = require('./utils');
const debug = utils.debug('model');
const parser = require('./parser');

const PROCESS_NAME = 'pm2-monit-daemon';
const PM2_ROOT_PATH = utils.getPM2home();
const RPC_PATH = 'unix://' + PM2_ROOT_PATH + '/rpc.sock';
const PUB_PATH = 'unix://' + PM2_ROOT_PATH + '/pub.sock';
const Probe = pmx.probe();
const req = axon.socket('req');
const pull = axon.socket('pull');
const rpcClient = new rpc.Client(req);
const SOCKET = new net.Socket();
let SEND_LOG = false;

module.exports = function (conf) {
  
  // default: 30 secs
  const WORKER_INTERVAL = isNaN(parseInt(conf.workerInterval, 10)) ? 30 * 1000 : parseInt(conf.workerInterval, 10) * 1000;

  SOCKET.on('connect', function () {
    debug('CONNECTED TO:' + SOCKET.remoteAddress + ':' + SOCKET.remotePort);
    req.connect(RPC_PATH);
    sendSystemData();
  });

  SOCKET.on('data', function (data) {
    debug('DATA:' + data);
    const json = JSON.parse(data);
    if(json.action === 'enableLog') {
      SEND_LOG = true;
      pull.connect(PUB_PATH);
    }
    if(json.action === 'disableLog') {
      SEND_LOG = false;
      pull.disconnect();
    }
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
      // debug('getSystemData', JSON.stringify(data));
      const monit = { type: 'system', data: parser(data) };
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

  pull.on('message', function (msg, data) {
    if(SEND_LOG) {
      if(data.process.name === PROCESS_NAME) return;
      debug(data);
      const log = { type: 'log', data };
      SOCKET.write(JSON.stringify(log));
    }
  });

};
