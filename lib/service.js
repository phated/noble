var debug = require('debug')('service');

var events = require('events');
var util = require('util');

function Service(peripheral, uuid) {
  this._peripheral = peripheral;
  this.uuid = uuid;
  this.includedServiceUuids = null;
}

util.inherits(Service, events.EventEmitter);

Service.prototype.toString = function() {
  return JSON.stringify({
    uuid: this.uuid,
    includedServiceUuids: this.includedServiceUuids
  });
};

Service.prototype.discoverIncludedServices = function(serviceUuids) {
  this._peripheral.discoverServiceIncludedServices(this.uuid, serviceUuids);
};

module.exports = Service;