var debug = require('debug')('service');

var events = require('events');
var util = require('util');

function Service(peripheral, uuid) {
  this._peripheral = peripheral;
  this.uuid = uuid;
}

util.inherits(Service, events.EventEmitter);

Service.prototype.toString = function() {
  return JSON.stringify({
    uuid: this.uuid
  });
};

module.exports = Service;