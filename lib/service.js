var debug = require('debug')('service');

var events = require('events');
var util = require('util');

function Service(peripheral, uuid) {
  this._peripheral = peripheral;
  this.uuid = uuid;
  this.includedServiceUuids = null;
  this.characteristics = null;
}

util.inherits(Service, events.EventEmitter);

Service.prototype.toString = function() {
  return JSON.stringify({
    uuid: this.uuid,
    includedServiceUuids: this.includedServiceUuids//,
    // characteristics: this.characteristics
  });
};

Service.prototype.discoverIncludedServices = function(serviceUuids) {
  this._peripheral.discoverServiceIncludedServices(this.uuid, serviceUuids);
};

Service.prototype.discoverCharacteristics = function(characteristicUuids) {
  this._peripheral.discoverServiceCharacteristics(this.uuid, characteristicUuids);
};

Service.prototype.readCharacteristic = function(uuid) {
  this._peripheral.readServiceCharacteristics(this.uuid, uuid);
};

module.exports = Service;