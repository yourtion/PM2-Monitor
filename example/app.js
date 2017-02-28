var net = require('net');

var HOST = '127.0.0.1';
var PORT = 6969;

net.createServer(function(sock) {
  console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);

  sock.on('data', function(data) {
    console.log(new Date(), data.length);
    var json = JSON.parse(data);
    // console.log(json);
    if(json.type === 'system') {
      console.log(json.data.system);
    }
    if(json.type === 'monit') {
      // console.log(json.data);
      for(var item of json.data) {
        console.log(item.pid, item.name);
        console.log(item.pm2_env.axm_monitor);
        console.log(item.monit);
      }
    }
  });

  sock.on('close', function(data) {
    console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
  });

}).listen(PORT, HOST);

console.log('Server listening on ' + HOST +':'+ PORT);
