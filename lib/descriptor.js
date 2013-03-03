var debug = require('debug')('descriptor');

var events = require('events');
var util = require('util');

function Descriptor(characteristic, uuid) {
  this._characteristic = characteristic;
  this.uuid = uuid;
}

util.inherits(Descriptor, events.EventEmitter);

Descriptor.prototype.toString = function() {
  return JSON.stringify({
    uuid: this.uuid
  });
};

module.exports = Descriptor;