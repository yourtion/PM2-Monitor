const path = require('path');

exports.debug = function (name) {
  if (process.env.NODE_ENV === 'production') return () => { };
  return require('debug')('PM2-Monit:' + name);
};

exports.getPM2home = function () {
  if (process.env.PM2_HOME) return process.env.PM2_HOME;
  if (process.env.HOME && !process.env.HOMEPATH) { return path.resolve(process.env.HOME, '.pm2'); }
  if (process.env.HOME || process.env.HOMEPATH) { return path.resolve(process.env.HOMEDRIVE, process.env.HOME || process.env.HOMEPATH, '.pm2'); }
};
