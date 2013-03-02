var debug = require('debug')('noble');

var events = require('events');
var util = require('util');

var Peripheral = require('./peripheral');
var Service = require('./peripheral');

var bindings = require('./bindings');

function Noble() {
  this._bindings = bindings;
  this._peripherals = {};

  this._bindings.on('stateChange', this.onStateChange.bind(this));
  this._bindings.on('scanStart', this.onScanStart.bind(this));
  this._bindings.on('scanStop', this.onScanStop.bind(this));
  this._bindings.on('peripheralDiscover', this.onPeripheralDiscover.bind(this));
  this._bindings.on('peripheralConnect', this.onPeripheralConnect.bind(this));
  this._bindings.on('peripheralDisconnect', this.onPeripheralDisconnect.bind(this));
  this._bindings.on('peripheralRssiUpdate', this.onPeripheralRssiUpdate.bind(this));
  this._bindings.on('peripheralServicesDiscover', this.onPeripheralServicesDiscover.bind(this));
}

util.inherits(Noble, events.EventEmitter);

Noble.prototype.onStateChange = function(state) {
  debug('stateChange ' + state);
  this.emit('stateChange', state);
};

Noble.prototype.startScanning = function(serviceUuids, allowDuplicates) {
  this._bindings.startScanning(serviceUuids, allowDuplicates);
};

Noble.prototype.onScanStart = function() {
  debug('scanStart');
  this.emit('scanStart');
};

Noble.prototype.stopScanning = function() {
  this._bindings.stopScanning();
};

Noble.prototype.onScanStop = function() {
  debug('scanStop');
  this.emit('scanStop');
};

Noble.prototype.onPeripheralDiscover = function(uuid, advertisement, rssi) {
  var peripheral = new Peripheral(this, uuid, advertisement, rssi);

  this._peripherals[uuid] = peripheral;

  this.emit('peripheralDiscover', peripheral);
};

Noble.prototype.connectPeripheral = function(uuid) {
  this._bindings.connectPeripheral(uuid);
};

Noble.prototype.onPeripheralConnect = function(uuid) {
  var peripheral = this._peripherals[uuid];

  this.emit('peripheralConnect', peripheral);
  peripheral.emit('connect');
};

Noble.prototype.disconnectPeripheral = function(uuid) {
  this._bindings.disconnectPeripheral(uuid);
};

Noble.prototype.onPeripheralDisconnect = function(uuid) {
  var peripheral = this._peripherals[uuid];

  this.emit('peripheralDisconnect', peripheral);
  peripheral.emit('disconnect');
};

Noble.prototype.updatePeripheralRssi = function(uuid) {
  this._bindings.updatePeripheralRssi(uuid);
};

Noble.prototype.onPeripheralRssiUpdate = function(uuid, rssi) {
  var peripheral = this._peripherals[uuid];

  peripheral.rssi = rssi;

  this.emit('peripheralRssiUpdate', peripheral, rssi);

  peripheral.emit('rssiUpdate', rssi);
};

Noble.prototype.discoverPeripheralServices = function(uuid, uuids) {
  this._bindings.discoverPeripheralServices(uuid, uuids);
};

Noble.prototype.onPeripheralServicesDiscover = function(uuid, serviceUuids) {
  var peripheral = this._peripherals[uuid];
  var services = [];

  for (var i = 0; i < serviceUuids.length; i++) {
    services.push(new Service(peripheral, serviceUuids[i]));
  }

  peripheral.services = services;

  this.emit('peripheralServicesDiscover', peripheral, services);
  peripheral.emit('servicesDiscover', services);
};

module.exports = Noble;