'use strict';

module.exports = function (data, detail = false) {
  const result = {
    system: {},
    processes: [],
    lastUpdated: Date.now(),
  };

  // HOST Data
  [ 'hostname', 'uptime', 'time', 'load' ].forEach((key) => {
    result.system[key] = data.system[key];
  });

  result.system.memory = {
    free: data.system.memory.free,
    total: data.system.memory.total,
    used: data.system.memory.total - data.system.memory.free,
  };

  if(detail) result.system.cpus = data.system.cpus;

  for(const item of data.processes) {
    const process = {
      name: item.name,
      pid: item.pid,
    };
 
    process.monit = item.monit;
    process.id = item['pm_id'];

    const env = item['pm2_env'];
    if(env) {
      [ 'exec_mode', 'status', 'restart_time', 'unstable_restarts', 'created_at' ].forEach((key) => {
        process[key] = env[key];
      });
      const loopDelay = env['axm_monitor']['Loop delay'];
      if(loopDelay) {
        process.monit.loopDelay = parseFloat(loopDelay['value'].replace('ms', ''));
      }
    }

    result.processes.push(process);
  }

  return result;
};
