const net = require('net');

const HOST = '127.0.0.1';
const PORT = 6969;

net.createServer(function (sock) {
  console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);

  sock.write(JSON.stringify({ action: 'enableLog' }));

  sock.on('data', function (data) {
    const json = JSON.parse(data);
    if(json.type === 'log') {
      console.log(json.data);
    }
  });

  sock.on('close', function (data) {
    console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
  });

}).listen(PORT, HOST);

console.log('Server listening on ' + HOST + ':' + PORT);
