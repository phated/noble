var debug = require('debug')('nobleBindings');

var events = require('events');
var util = require('util');

var bindings = require('../build/Release/binding.node');
var NobleBindings = bindings.Noble;

inherits(NobleBindings, events.EventEmitter);

// extend prototype
function inherits(target, source) {
  for (var k in source.prototype) {
    target.prototype[k] = source.prototype[k];
  }
}

var nobleBindings = new NobleBindings();

nobleBindings.peripherals = {};

nobleBindings.on('xpcEvent', function(event) {
  var kCBMsgId = event.kCBMsgId;
  var kCBMsgArgs = event.kCBMsgArgs;

  debug('xpcEvent: ' + JSON.stringify(event, undefined, 2));

  this.emit('kCBMsgId' + kCBMsgId, kCBMsgArgs);
});

nobleBindings.on('xpcError', function(message) {
  console.error('xpcError: ' + message);
});

nobleBindings.sendCBMsg = function(id, args) {
  this.sendXpcMessage({
    kCBMsgId: id,
    kCBMsgArgs: args
  });
};

nobleBindings.init = function() {
  this.timer = setTimeout(function(){}, 2147483647); // TODO: add worker in bindings instead

  this.sendCBMsg(1, {
    kCBMsgArgAlert: 1,
    kCBMsgArgName: 'node'
  });
};

nobleBindings.on('kCBMsgId4', function(args) {
  var state = ['unknown', 'resetting', 'unsupported', 'unauthorized', 'poweredOff', 'poweredOn'][args.kCBMsgArgState];
  debug('state change ' + state);
  this.emit('stateChange', state);
});

nobleBindings.startScanning = function(serviceUuids, allowDuplicates) {
  var args = {
    kCBMsgArgOptions: {},
    kCBMsgArgUUIDs: []
  };

  if (serviceUuids) {
    for(var i = 0; i < serviceUuids.length; i++) {
      args.kCBMsgArgUUIDs[i] = new Buffer(serviceUuids[i], 'hex');
    }
  }

  if (allowDuplicates) {
    args.kCBMsgArgOptions.kCBScanOptionAllowDuplicates = 1;
  }

  this.sendCBMsg(7, args);

  this.emit('scanStart');
};

nobleBindings.stopScanning = function() {
  this.sendCBMsg(8, null);

  this.emit('scanStop');
};

nobleBindings.on('kCBMsgId13', function(args) {
  var uuid = args.kCBMsgArgPeripheral.kCBMsgArgUUID.toString('hex');
  var handle = args.kCBMsgArgPeripheral.kCBMsgArgPeripheralHandle;
  var advertisement = {
    localName: args.kCBMsgArgAdvertisementData.kCBAdvDataLocalName,
    servicesData: args.kCBMsgArgAdvertisementData.kCBAdvDataServiceData,
    txPowerLevel: args.kCBMsgArgAdvertisementData.kCBAdvDataTxPowerLevel,
    serviceUuids: []
  };
  var rssi = args.kCBMsgArgRssi;

  for(var i = 0; i < args.kCBMsgArgAdvertisementData.kCBAdvDataServiceUUIDs.length; i++) {
    advertisement.serviceUuids.push(args.kCBMsgArgAdvertisementData.kCBAdvDataServiceUUIDs[i].toString('hex'));
  }  

  debug('peripheral ' + uuid + ' discovered');

  this.peripherals[uuid] = this.peripherals[handle] = {
    uuid: uuid,
    handle: handle,
    advertisement: advertisement,
    rssi: rssi
  };

  this.emit('peripheralDiscover', uuid, advertisement, rssi);
});

nobleBindings.connectPeripheral = function(uuid) {
  this.sendCBMsg(9, {
    kCBMsgArgOptions: {
      kCBConnectOptionNotifyOnDisconnection: 1
    },
    kCBMsgArgPeripheralHandle: this.peripherals[uuid].handle
  });
};

nobleBindings.on('kCBMsgId14', function(args) {
  var uuid = args.kCBMsgArgUUID.toString('hex');
  var handle = args.kCBMsgArgPeripheralHandle;

  debug('peripheral ' + uuid + ' connected');

  this.emit('peripheralConnect', uuid);
});

nobleBindings.disconnectPeripheral = function(uuid) {
  this.sendCBMsg(10, {
    kCBMsgArgPeripheralHandle: this.peripherals[uuid].handle
  });
};

nobleBindings.on('kCBMsgId15', function(args) {
  var uuid = args.kCBMsgArgUUID.toString('hex');
  var handle = args.kCBMsgArgPeripheralHandle;

  debug('peripheral ' + uuid + ' disconnected');

  this.emit('peripheralDisconnect', uuid);
});

nobleBindings.updatePeripheralRssi = function(uuid) {
  this.sendCBMsg(16, {
    kCBMsgArgPeripheralHandle: this.peripherals[uuid].handle
  });
};

nobleBindings.on('kCBMsgId20', function(args) {
  var handle = args.kCBMsgArgPeripheralHandle;
  var uuid = this.peripherals[handle].uuid;
  var rssi = args.kCBMsgArgData;

  this.peripherals[handle].rssi = rssi;

  debug('peripheral ' + uuid + ' RSSI update ' + rssi);

  this.emit('peripheralRssiUpdate', uuid, rssi);
});

nobleBindings.discoverPeripheralServices = function(uuid, uuids) {
  var args = {
    kCBMsgArgPeripheralHandle: this.peripherals[uuid].handle,
    kCBMsgArgUUIDs: []
  };

  if (uuids) {
    for(var i = 0; i < uuids.length; i++) {
      args.kCBMsgArgUUIDs[i] = new Buffer(uuids[i], 'hex');
    }
  }

  this.sendCBMsg(17, args);
};

nobleBindings.on('kCBMsgId21', function(args) {
  var handle = args.kCBMsgArgPeripheralHandle;
  var uuid = this.peripherals[handle].uuid;
  var serviceUuids = [];

  this.peripherals[handle].services = {};

  for(var i = 0; i < args.kCBMsgArgServices.length; i++) {
    var service = {
      uuid: args.kCBMsgArgServices[i].kCBMsgArgUUID.toString('hex'),
      startHandle: args.kCBMsgArgServices[i].kCBMsgArgServiceStartHandle,
      endHandle: args.kCBMsgArgServices[i].kCBMsgArgServiceEndHandle
    };

    this.peripherals[handle][service.uuid] = this.peripherals[handle][service.startHandle] = service;

    serviceUuids.push(service.uuid);
  }

  this.emit('peripheralServicesDiscover', uuid, serviceUuids);
});

nobleBindings.setupXpcConnection();
nobleBindings.init();

module.exports = nobleBindings;