const net = require('net');
const Influx = require('influx');

const HOST = '127.0.0.1';
const PORT = 6969;

const influx = new Influx.InfluxDB({
  host: '127.0.0.1',
  database: 'pm2DEV',
  schema: [
    {
      measurement: 'host',
      fields: {
        load0: Influx.FieldType.FLOAT,
        load1: Influx.FieldType.FLOAT,
        load2: Influx.FieldType.FLOAT,
        free: Influx.FieldType.INTEGER,
        total: Influx.FieldType.INTEGER,
        used: Influx.FieldType.INTEGER,
        path: Influx.FieldType.STRING,
        duration: Influx.FieldType.INTEGER,
      },
      tags: [
        'host',
      ],
    },
    {
      measurement: 'pm2',
      fields: {
        cpu: Influx.FieldType.INTEGER,
        memory: Influx.FieldType.INTEGER,
        loopDelay: Influx.FieldType.FLOAT,
      },
      tags: [
        'host', 'pm_id', 'name', 'pid',
      ],
    },
  ],
});

function saveToDB(data) {
  const result = [];
  const time = data.lastUpdated;
  const system = data.system;

  result.push({
    measurement: 'host',
    tags: { host: system.hostname },
    fields: {
      load0: system.load[0],
      load1: system.load[1],
      load2: system.load[2],
      free: system.memory.free,
      total: system.memory.total,
      used: system.memory.used,
    },
  });

  for(const item of data.processes) {
    result.push({
      measurement: 'pm2',
      tags: { 
        host: system.hostname,
        pm_id: item.id,
        name: item.name,
        pid: item.pid,
      },
      fields: item.monit,
    });
  }

  influx.writePoints(result).then().catch(console.log);
}


net.createServer(function (sock) {
  console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
  
  sock.on('data', function (data) {
    // console.log(Date.now(), data.length);
    try{
      const json = JSON.parse(data);
      if(json.type === 'system') {
        saveToDB(json.data);
      }
    } catch(err) {
      console.log(err);
    }
  });

  sock.on('close', function (data) {
    console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
  });

}).listen(PORT, HOST);

console.log('Server listening on ' + HOST + ':' + PORT);
