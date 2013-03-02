var debug = require('debug')('peripheral');

var events = require('events');
var util = require('util');

function Peripheral(noble, uuid, advertisement, rssi) {
  this._noble = noble;
  this.uuid = uuid;
  this.advertisement = advertisement;
  this.rssi = rssi;
  this.services = null;
}

util.inherits(Peripheral, events.EventEmitter);

Peripheral.prototype.toString = function() {
  return JSON.stringify({
    uuid: this.uuid,
    advertisement: this.advertisement,
    rssi: this.rssi//,
    // services: this.services
  });
};

Peripheral.prototype.connect = function() {
  this._noble.connectPeripheral(this.uuid);
};

Peripheral.prototype.disconnect = function() {
  this._noble.disconnectPeripheral(this.uuid);
};

Peripheral.prototype.updateRssi = function() {
  this._noble.updatePeripheralRssi(this.uuid);
};

Peripheral.prototype.discoverServices = function(uuids) {
  this._noble.discoverPeripheralServices(this.uuid, uuids);
};

Peripheral.prototype.discoverServiceIncludedServices = function(uuid, serviceUuids) {
   this._noble.discoverPeripheralServiceIncludedServices(this.uuid, uuid, serviceUuids);
};

Peripheral.prototype.discoverServiceCharacteristics = function(uuid, characteristicUuids) {
  this._noble.discoverPeripheralServiceCharacteristics(this.uuid, uuid, characteristicUuids);
};

module.exports = Peripheral;