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

Characteristic.prototype.read = function() {
  this._service.readCharacteristic(this.uuid);
};

Characteristic.prototype.write = function(data, notify) {
  this._service.writeCharacteristic(this.uuid, data, notify);
};

Characteristic.prototype.broadcast = function(broadcast) {
  this._service.broadcastCharacteristic(this.uuid, broadcast);
};

module.exports = Characteristic;