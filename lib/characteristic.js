var debug = require('debug')('service');

var events = require('events');
var util = require('util');

function Characteristic(service, uuid, properties) {
  this._service = service;
  this.uuid = uuid;
  this.properties = properties;
}

util.inherits(Characteristic, events.EventEmitter);

Characteristic.prototype.toString = function() {
  return JSON.stringify({
    uuid: this.uuid,
    properties: this.properties
  });
};

module.exports = Characteristic;