var events = require('events');
var util = require('util');

var bindings = require('./build/Release/binding.node');
var NobleBindings = bindings.Noble;

inherits(NobleBindings, events.EventEmitter);

// extend prototype
function inherits(target, source) {
  for (var k in source.prototype) {
    target.prototype[k] = source.prototype[k];
  }
}

var nobleBindings = new NobleBindings();


nobleBindings.on('xpcEvent', function(event) {
  var kCBMsgId = event.kCBMsgId;
  var kCBMsgArgs = event.kCBMsgArgs;
  console.log('xpcEvent = ');
  console.log(event);
  this.emit('kCBMsgId' + kCBMsgId, kCBMsgArgs);
});

nobleBindings.on('xpcError', function(message) {
  console.log(message);
});

nobleBindings.on('kCBMsgId4', function(args) {
  var state = ['unknown', 'resetting', 'unsupported', 'unauthorized', 'poweredOff', 'poweredOn'][args.kCBMsgArgState];
  console.log('state = ' + state);
});

nobleBindings.on('kCBMsgId13', function(args) {
  console.log('UUID ' + args.kCBMsgArgPeripheral.kCBMsgArgUUID.toString('hex'));
  console.log('Handle ' + args.kCBMsgArgPeripheral.kCBMsgArgPeripheralHandle);
  console.log('Service UUIDs ');
  for(var i = 0; i < args.kCBMsgArgAdvertisementData.kCBAdvDataServiceUUIDs.length; i++) {
    console.log('\t' + args.kCBMsgArgAdvertisementData.kCBAdvDataServiceUUIDs[i].toString('hex'));
  }
  console.log('Local Name ' + args.kCBMsgArgAdvertisementData.kCBAdvDataLocalName);
  console.log('RSSI ' + args.kCBMsgArgRssi);
});

nobleBindings.sendCBMsg = function(id, args) {
  this.sendXpcMessage({
    kCBMsgId: id,
    kCBMsgArgs: args
  });
};

nobleBindings.init = function() {
  this.sendCBMsg(1, {
    kCBMsgArgAlert: 1,
    kCBMsgArgName: 'node'
  });
};

nobleBindings.startScanning = function(serviceUUIDs, allowDuplicates) {
  var arg = {
    kCBMsgArgOptions: {},
    kCBMsgArgUUIDs: []
  };

  if (serviceUUIDs) {
    for(var i = 0; i < serviceUUIDs.length; i++) {
      arg.kCBMsgArgUUIDs[i] = new Buffer(serviceUUIDs[i], 'hex');
    }
  }

  if (allowDuplicates) {
    arg.kCBMsgArgOptions.kCBScanOptionAllowDuplicates = 1;
  }

  this.sendCBMsg(7, arg);
};

nobleBindings.stopScanning = function() {
  this.sendCBMsg(8, null);
};

nobleBindings.setupXpcConnection();
nobleBindings.init();

nobleBindings.startScanning();
// nobleBindings.stopScanning();


// function Noble() {
//   this._bindings = new NobleBindings();
//   this._peripherals = {};

//   var self = this;

//   this._bindings.on('stateChange', function(state) {
//     self.emit('stateChange', state);
//   });

//   this._bindings.on('scanStart', function(state) {
//     self.emit('scanStart');
//   });

//   this._bindings.on('scanStop', function(state) {
//     self.emit('scanStop');
//   });

//   this._bindings.on('peripheralDiscover', function(uuid, localName, services, rssi) {
//     var peripheral = self._peripherals[uuid] = new NoblePeripheral(uuid, localName, services, rssi);

//     self.emit('peripheralDiscover', peripheral);
//   });

//   this._bindings.on('peripheralConnect', function(uuid) {
//     var peripheral = self._peripherals[uuid];

//     self.emit('peripheralConnect', peripheral);
//     peripheral.emit('connect');
//   });

//   this._bindings.on('peripheralConnectFailure', function(uuid, reason) {
//     var peripheral = self._peripherals[uuid];

//     self.emit('peripheralConnectFailure', peripheral, reason);
//     peripheral.emit('connectFailure', reason);
//   });

//   this._bindings.on('peripheralDisconnect', function(uuid) {
//     var peripheral = self._peripherals[uuid];

//     self.emit('peripheralDisconnect', peripheral);
//     peripheral.emit('disconnect');
//   });

//   this._bindings.on('peripheralRssiUpdate', function(uuid, rssi) {
//     var peripheral = self._peripherals[uuid];
//     peripheral.rssi = rssi;

//     self.emit('peripheralRssiUpdate', peripheral, rssi);
//     peripheral.emit('rssiUpdate', rssi);
//   });

//   this._bindings.on('peripheralServicesDiscover', function(uuid, services) {
//     var peripheral = self._peripherals[uuid];
//     peripheral.services = services;

//     self.emit('peripheralServicesDiscover', peripheral, services);
//     peripheral.emit('servicesDiscover', services);
//   });
// }

// util.inherits(Noble, events.EventEmitter);

// Noble.prototype.startScanning = function(serviceUUIDs, allowDuplicates) {
//   this._bindings.startScanning(serviceUUIDs, allowDuplicates);
// };

// Noble.prototype.stopScanning = function(serviceUUIDs, allowDuplicates) {
//   this._bindings.stopScanning();
// };

// Noble.prototype.connectPeripheral = function(uuid) {
//   this._bindings.connectPeripheral(uuid);
// };

// Noble.prototype.disconnectPeripheral = function(uuid) {
//   this._bindings.disconnectPeripheral(uuid);
// };

// Noble.prototype.updatePeripheralRssi = function(uuid) {
//   this._bindings.updatePeripheralRssi(uuid);
// };

// Noble.prototype.discoverPeripheralServices = function(uuid, serviceUUIDs) {
//   this._bindings.discoverPeripheralServices(uuid, serviceUUIDs);
// };


// var noble = new Noble();
// module.exports = noble;

// function NoblePeripheral(uuid, localName, services, rssi) {
//   this.uuid = uuid;
//   this.localName = localName;
//   this.services = services;
//   this.rssi = rssi;
// }

// util.inherits(NoblePeripheral, events.EventEmitter);

// NoblePeripheral.prototype.connect = function() {
//   noble.connectPeripheral(this.uuid);
// };

// NoblePeripheral.prototype.disconnect = function() {
//   noble.disconnectPeripheral(this.uuid);
// };

// NoblePeripheral.prototype.updateRssi = function() {
//   noble.updatePeripheralRssi(this.uuid);
// };

// NoblePeripheral.prototype.discoverServices = function(serviceUUIDs) {
//   noble.discoverPeripheralServices(this.uuid, serviceUUIDs);
// };

