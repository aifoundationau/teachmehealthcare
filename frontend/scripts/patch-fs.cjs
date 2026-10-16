const fs = require('fs');

const origReadlink = fs.readlink;
const origReadlinkSync = fs.readlinkSync;

function convertError(err) {
  if (err && (err.code === 'EISDIR' || err.code === 'UNKNOWN' || err.errno === -4068)) {
    const e = new Error(`EINVAL: invalid argument, readlink '${err.path}'`);
    e.code = 'EINVAL';
    e.errno = -4071;
    e.syscall = 'readlink';
    e.path = err.path;
    return e;
  }
  return err;
}

fs.readlink = function(path, options, callback) {
  const cb = typeof options === 'function' ? options : callback;
  const opts = typeof options === 'function' ? undefined : options;
  return origReadlink.call(fs, path, opts, (err, linkString) => {
    if (err) {
      cb(convertError(err), linkString);
    } else {
      cb(null, linkString);
    }
  });
};

fs.readlinkSync = function(path, options) {
  try {
    return origReadlinkSync.call(fs, path, options);
  } catch (err) {
    throw convertError(err);
  }
};

if (fs.promises && fs.promises.readlink) {
  const origPromisesReadlink = fs.promises.readlink;
  fs.promises.readlink = async function(path, options) {
    try {
      return await origPromisesReadlink.call(fs.promises, path, options);
    } catch (err) {
      throw convertError(err);
    }
  };
}
