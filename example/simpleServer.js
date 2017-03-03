const net = require('net');

const HOST = '127.0.0.1';
const PORT = 6969;

net.createServer(function (sock) {
  console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);

  sock.on('data', function (data) {
    console.log(Date.now(), data.length);
    // console.log('DATA', data);
    const json = JSON.parse(data);
    // console.log(json);
    if(json.type === 'system') {
      console.log(json.data.processes);
    }
    if(json.type === 'monit') {
      // console.log(json.data);
      for(const item of json.data) {
        // console.log(item.pid, item.name);
        // console.log(item.pm2_env.axm_monitor);
        // console.log(item.monit);
      }
    }
  });

  sock.on('close', function (data) {
    console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
  });

}).listen(PORT, HOST);

console.log('Server listening on ' + HOST + ':' + PORT);
