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

Peripheral.prototype.readServiceCharacteristics = function(uuid, characteristicUuid) {
  this._noble.readPeripheralServiceCharacteristic(this.uuid, uuid, characteristicUuid);
};

Peripheral.prototype.writeServiceCharacteristics = function(uuid, characteristicUuid, data, notify) {
  this._noble.writePeripheralServiceCharacteristic(this.uuid, uuid, characteristicUuid, data, notify);
};

Peripheral.prototype.broadcastServiceCharacteristics = function(uuid, characteristicUuid, broadcast) {
  this._noble.broadcastPeripheralServiceCharacteristic(this.uuid, uuid, characteristicUuid, broadcast);
};

Peripheral.prototype.notifyServiceCharacteristics = function(uuid, characteristicUuid, notify) {
  this._noble.notifyPeripheralServiceCharacteristic(this.uuid, uuid, characteristicUuid, notify);
};

Peripheral.prototype.discoverServiceCharacteristicDescriptors = function(uuid, characteristicUuid) {
  this._noble.discoverPeripheralServiceCharacteristicDescriptors(this.uuid, uuid, characteristicUuid);
};

Peripheral.prototype.readServiceCharacteristicDescriptorValue = function(uuid, characteristicUuid, descriptorUuid) {
  this._noble.readServiceCharacteristicDescriptorValue(this.uuid, uuid, characteristicUuid, descriptorUuid);
};

module.exports = Peripheral;
