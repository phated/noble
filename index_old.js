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

nobleBindings.peripheralUuidToHandle = {};
nobleBindings.peripheralHandleToUuid = {};
nobleBindings.peripheralServiceHandles = {};
nobleBindings.peripheralServiceIncludedServices = {};
nobleBindings.peripheralServiceCharacteristics = {};
nobleBindings.peripheralServiceCharacteristicsDescriptors = {};

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
  var uuid = args.kCBMsgArgPeripheral.kCBMsgArgUUID.toString('hex');
  var handle = args.kCBMsgArgPeripheral.kCBMsgArgPeripheralHandle;
  var localName = args.kCBMsgArgAdvertisementData.kCBAdvDataLocalName;
  var servicesData = args.kCBMsgArgAdvertisementData.kCBAdvDataServiceData;

  var serviceUUIDs = [];
  for(var i = 0; i < args.kCBMsgArgAdvertisementData.kCBAdvDataServiceUUIDs.length; i++) {
    serviceUUIDs[i] = args.kCBMsgArgAdvertisementData.kCBAdvDataServiceUUIDs[i].toString('hex');
  }

  var txPowerLevel = args.kCBMsgArgAdvertisementData.kCBAdvDataTxPowerLevel;
  var rssi = args.kCBMsgArgRssi;

  console.log('UUID ' + uuid);
  console.log('Handle ' + handle);
  console.log('Local Name ' + localName);
  console.log('Service Data ' + servicesData);
  console.log('Service UUIDs ');
  for(var i = 0; i < serviceUUIDs.length; i++) {
    console.log('\t' + serviceUUIDs[i]);
  }
  console.log('TX Power Level ' + txPowerLevel);
  console.log('RSSI ' + rssi);

  this.peripheralUuidToHandle[uuid] = handle;
  this.peripheralHandleToUuid[handle] = uuid;

  this.connectPeripheral(uuid);
});

nobleBindings.on('kCBMsgId14', function(args) {
  var uuid = args.kCBMsgArgUUID.toString('hex');
  var handle = args.kCBMsgArgPeripheralHandle;

  console.log(uuid + ' connected');

  this.updatePeripheralRssi(uuid);
});

nobleBindings.on('kCBMsgId15', function(args) {
  var uuid = args.kCBMsgArgUUID.toString('hex');
  var handle = args.kCBMsgArgPeripheralHandle;

  console.log(uuid + ' disconnected');
});

nobleBindings.on('kCBMsgId20', function(args) {
  var handle = args.kCBMsgArgPeripheralHandle;
  var uuid = this.peripheralHandleToUuid[handle];
  var rssi = args.kCBMsgArgData;

  console.log(uuid + ' RSSI updated ' + rssi);

  this.discoverPeripheralServices(uuid);
});

nobleBindings.on('kCBMsgId21', function(args) {
  var handle = args.kCBMsgArgPeripheralHandle;
  var uuid = this.peripheralHandleToUuid[handle];
  var services = [];

  for(var i = 0; i < args.kCBMsgArgServices.length; i++) {
    services[i] = {
      uuid: args.kCBMsgArgServices[i].kCBMsgArgUUID.toString('hex'),
      startHandle: args.kCBMsgArgServices[i].kCBMsgArgServiceStartHandle,
      endHandle: args.kCBMsgArgServices[i].kCBMsgArgServiceEndHandle
    };
  }

  console.log(uuid + ' services discovered');
  for(var i = 0; i < services.length; i++) {
    console.log('\t' + services[i].uuid);
  }

  this.peripheralServiceHandles[uuid] = services;

  this.discoverPeripheralServiceIncludedServices(uuid, services[2].uuid, []);
});

/*
  result ???

  CBErrorUnknown,

  CBATTErrorInvalidHandle         = 0x01,
  CBATTErrorReadNotPermitted        = 0x02,
  CBATTErrorWriteNotPermitted       = 0x03,
  CBATTErrorInvalidPdu          = 0x04,
  CBATTErrorInsufficientAuthentication  = 0x05,
  CBATTErrorRequestNotSupported     = 0x06,
  CBATTErrorInvalidOffset         = 0x07,
  CBATTErrorInsufficientAuthorization   = 0x08,
  CBATTErrorPrepareQueueFull        = 0x09,
  CBATTErrorAttributeNotFound       = 0x0A,
  CBATTErrorAttributeNotLong        = 0x0B,
  CBATTErrorInsufficientEncryptionKeySize = 0x0C,
  CBATTErrorInvalidAttributeValueLength = 0x0D,
  CBATTErrorUnlikelyError         = 0x0E,
  CBATTErrorInsufficientEncryption    = 0x0F,
  CBATTErrorUnsupportedGroupType      = 0x10,
  CBATTErrorInsufficientResources     = 0x11,
*/

nobleBindings.on('kCBMsgId27', function(args) {
  var handle = args.kCBMsgArgPeripheralHandle;
  var uuid = this.peripheralHandleToUuid[handle];
  var serviceStartHandle = args.kCBMsgArgServiceStartHandle;
  var result = args.kCBMsgArgResult;
  var services = [];

  var serviceUUID = null;
  for(var i = 0; i < this.peripheralServiceHandles[uuid].length; i++) {
    if (this.peripheralServiceHandles[uuid][i].startHandle === serviceStartHandle) {
      serviceUUID = this.peripheralServiceHandles[uuid][i].uuid;
      break;
    };
  }

  for(var i = 0; i < args.kCBMsgArgServices.length; i++) {
    services[i] = {
      uuid: args.kCBMsgArgServices[i].kCBMsgArgUUID.toString('hex'),
      startHandle: args.kCBMsgArgServices[i].kCBMsgArgServiceStartHandle,
      endHandle: args.kCBMsgArgServices[i].kCBMsgArgServiceEndHandle
    };
  }

  console.log(uuid + ' ' + serviceUUID + ' included services discovered');
  for(var i = 0; i < services.length; i++) {
    console.log('\t' + services[i].uuid);
  }

  this.peripheralServiceIncludedServices[uuid] = this.peripheralServiceIncludedServices[uuid] || {};
  this.peripheralServiceIncludedServices[uuid][serviceUUID] = services;

  this.discoverPeripheralServiceCharacteristics(uuid, serviceUUID, []);
});

nobleBindings.on('kCBMsgId28', function(args) {
  var handle = args.kCBMsgArgPeripheralHandle;
  var uuid = this.peripheralHandleToUuid[handle];
  var serviceStartHandle = args.kCBMsgArgServiceStartHandle;
  var result = args.kCBMsgArgResult;
  var characteristics = [];

  var serviceUUID = null;
  for(var i = 0; i < this.peripheralServiceHandles[uuid].length; i++) {
    if (this.peripheralServiceHandles[uuid][i].startHandle === serviceStartHandle) {
      serviceUUID = this.peripheralServiceHandles[uuid][i].uuid;
      break;
    };
  }

  for(var i = 0; i < args.kCBMsgArgCharacteristics.length; i++) {
    var properties = args.kCBMsgArgCharacteristics[i].kCBMsgArgCharacteristicProperties;

    characteristics[i] = {
      uuid: args.kCBMsgArgCharacteristics[i].kCBMsgArgUUID.toString('hex'),
      handle: args.kCBMsgArgCharacteristics[i].kCBMsgArgCharacteristicHandle,
      valueHandle: args.kCBMsgArgCharacteristics[i].kCBMsgArgCharacteristicValueHandle,
      properties: []
    };

    /*
  CBCharacteristicPropertyBroadcast         = 0x01,
  CBCharacteristicPropertyRead            = 0x02,
  CBCharacteristicPropertyWriteWithoutResponse    = 0x04,
  CBCharacteristicPropertyWrite           = 0x08,
  CBCharacteristicPropertyNotify            = 0x10,
  CBCharacteristicPropertyIndicate          = 0x20,
  CBCharacteristicPropertyAuthenticatedSignedWrites = 0x40,
  CBCharacteristicPropertyExtendedProperties      = 0x80,
    */

    if (properties & 0x01) {
      characteristics[i].properties.push('broadcast');
    } else if (properties & 0x02) {
      characteristics[i].properties.push('read');
    } else if (properties & 0x04) {
      characteristics[i].properties.push('writeWithoutResponse');
    } else if (properties & 0x08) {
      characteristics[i].properties.push('write');
    } else if (properties & 0x10) {
      characteristics[i].properties.push('notify');
    } else if (properties & 0x20) {
      characteristics[i].properties.push('indicate');
    } else if (properties & 0x40) {
      characteristics[i].properties.push('authenticatedSignedWrites');
    } else if (properties & 0x80) {
      characteristics[i].properties.push('extendedProperties');
    }
  }

  console.log(uuid + ' ' + serviceUUID + ' characteristics discovered');
  for(var i = 0; i < characteristics.length; i++) {
    console.log('\t' + JSON.stringify(characteristics[i]));
  }

  this.peripheralServiceCharacteristics[uuid] = this.peripheralServiceCharacteristics[uuid] || {};
  this.peripheralServiceCharacteristics[uuid][serviceUUID] = characteristics;

  // this.readPeripheralServiceCharacteristic(uuid, serviceUUID, characteristics[1].uuid);
  // this.writePeripheralServiceCharacteristic(uuid, serviceUUID, characteristics[0].uuid, new Buffer('3031', 'hex'), true);
  // this.notifyPeripheralServiceCharacteristic(uuid, serviceUUID, characteristics[0].uuid, true);
  //this.broadcastPeripheralServiceCharacteristic(uuid, serviceUUID, characteristics[0].uuid, true);

  this.discoverPeripheralServiceCharacteristicDescriptors(uuid, serviceUUID, characteristics[0].uuid);
});

nobleBindings.on('kCBMsgId35', function(args) {
  var handle = args.kCBMsgArgPeripheralHandle;
  var uuid = this.peripheralHandleToUuid[handle];
  var characteristicHandle = args.kCBMsgArgCharacteristicHandle;
  var isNotification = args.kCBMsgArgIsNotification;
  var data = args.kCBMsgArgData;


  console.log(uuid + ' read value ' + data + ' isNotification ' + isNotification);
});

nobleBindings.on('kCBMsgId36', function(args) {
  var handle = args.kCBMsgArgPeripheralHandle;
  var uuid = this.peripheralHandleToUuid[handle];
  var characteristicHandle = args.kCBMsgArgCharacteristicHandle;
  var result = args.kCBMsgArgResult;


  console.log(uuid + ' write value ' + result);
});

nobleBindings.on('kCBMsgId37', function(args) {
  var handle = args.kCBMsgArgPeripheralHandle;
  var uuid = this.peripheralHandleToUuid[handle];
  var characteristicHandle = args.kCBMsgArgCharacteristicHandle;
  var result = args.kCBMsgArgResult;
  var state = args.kCBMsgArgState;

  console.log(uuid + ' broadcast ' + result + ' ' + state);
});


nobleBindings.on('kCBMsgId38', function(args) {
  var handle = args.kCBMsgArgPeripheralHandle;
  var uuid = this.peripheralHandleToUuid[handle];
  var characteristicHandle = args.kCBMsgArgCharacteristicHandle;
  var result = args.kCBMsgArgResult;
  var state = args.kCBMsgArgState;

  console.log(uuid + ' notify ' + result + ' ' + state);
});

nobleBindings.on('kCBMsgId39', function(args) {
  var handle = args.kCBMsgArgPeripheralHandle;
  var uuid = this.peripheralHandleToUuid[handle];
  var characteristicHandle = args.kCBMsgArgCharacteristicHandle;
  var result = args.kCBMsgArgResult;
  var descriptors = []; //args.kCBMsgArgDescriptors;

  for(var i = 0; i < args.kCBMsgArgDescriptors.length; i++) {
    descriptors.push({
      handle: args.kCBMsgArgDescriptors[i].kCBMsgArgDescriptorHandle,
      uuid: args.kCBMsgArgDescriptors[i].kCBMsgArgUUID.toString('hex')
    });
  }

  console.log(uuid + ' descriptors discovered');
  for(var i = 0; i < descriptors.length; i++) {
    console.log('\t' + JSON.stringify(descriptors[i]));
  }

  this.readPeripheralServiceCharacteristicDescriptorValue(uuid, null, null, descriptors[0].handle);
});

nobleBindings.on('kCBMsgId42', function(args) {
  var handle = args.kCBMsgArgPeripheralHandle;
  var uuid = this.peripheralHandleToUuid[handle];
  var descriptorHandle = args.kCBMsgArgDescriptorHandle;
  var result = args.kCBMsgArgResult;
  var data = args.kCBMsgArgData;

  console.log(uuid + ' descriptor read ' + data.toString('hex'));

  this.writePeripheralServiceCharacteristicDescriptorValue(uuid, null, null, descriptorHandle, new Buffer('0100', 'hex'));
});

nobleBindings.on('kCBMsgId43', function(args) {
  var handle = args.kCBMsgArgPeripheralHandle;
  var uuid = this.peripheralHandleToUuid[handle];
  var descriptorHandle = args.kCBMsgArgDescriptorHandle;
  var result = args.kCBMsgArgResult;

  console.log(uuid + ' descriptor write ' + result);
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
  var args = {
    kCBMsgArgOptions: {},
    kCBMsgArgUUIDs: []
  };

  if (serviceUUIDs) {
    for(var i = 0; i < serviceUUIDs.length; i++) {
      args.kCBMsgArgUUIDs[i] = new Buffer(serviceUUIDs[i], 'hex');
    }
  }

  if (allowDuplicates) {
    args.kCBMsgArgOptions.kCBScanOptionAllowDuplicates = 1;
  }

  this.sendCBMsg(7, args);
};


nobleBindings.stopScanning = function() {
  this.sendCBMsg(8, null);
};

nobleBindings.connectPeripheral = function(uuid) {
  this.sendCBMsg(9, {
    kCBMsgArgOptions: {
      kCBConnectOptionNotifyOnDisconnection: 1
    },
    kCBMsgArgPeripheralHandle: this.peripheralUuidToHandle[uuid]
  });
};


nobleBindings.disconnectPeripheral = function(uuid) {
  this.sendCBMsg(10, {
    kCBMsgArgPeripheralHandle: this.peripheralUuidToHandle[uuid]
  });
};

nobleBindings.updatePeripheralRssi = function(uuid) {
  this.sendCBMsg(16, {
    kCBMsgArgPeripheralHandle: this.peripheralUuidToHandle[uuid]
  });
};

nobleBindings.discoverPeripheralServices = function(uuid, serviceUUIDs) {
  var args = {
    kCBMsgArgPeripheralHandle: this.peripheralUuidToHandle[uuid],
    kCBMsgArgUUIDs: []
  };

  if (serviceUUIDs) {
    for(var i = 0; i < serviceUUIDs.length; i++) {
      args.kCBMsgArgUUIDs[i] = new Buffer(serviceUUIDs[i], 'hex');
    }
  }

  this.sendCBMsg(17, args);
};

nobleBindings.discoverPeripheralServiceIncludedServices = function(uuid, serviceUUID, serviceUUIDs) {
  var service = null;
  for(var i = 0; i < this.peripheralServiceHandles[uuid].length; i++) {
    if (this.peripheralServiceHandles[uuid][i].uuid === serviceUUID) {
      service = this.peripheralServiceHandles[uuid][i];
      break;
    };
  }

  var args = {
    kCBMsgArgPeripheralHandle: this.peripheralUuidToHandle[uuid],
    kCBMsgArgServiceStartHandle: service.startHandle,
    kCBMsgArgServiceEndHandle: service.endHandle,
    kCBMsgArgUUIDs: []
  };

  if (serviceUUIDs) {
    for(var i = 0; i < serviceUUIDs.length; i++) {
      args.kCBMsgArgUUIDs[i] = new Buffer(serviceUUIDs[i], 'hex');
    }
  }

  this.sendCBMsg(25, args);
};

nobleBindings.discoverPeripheralServiceCharacteristics = function(uuid, serviceUUID, characteristicUUIDs) {
  var service = null;
  for(var i = 0; i < this.peripheralServiceHandles[uuid].length; i++) {
    if (this.peripheralServiceHandles[uuid][i].uuid === serviceUUID) {
      service = this.peripheralServiceHandles[uuid][i];
      break;
    };
  }

  var args = {
    kCBMsgArgPeripheralHandle: this.peripheralUuidToHandle[uuid],
    kCBMsgArgServiceStartHandle: service.startHandle,
    kCBMsgArgServiceEndHandle: service.endHandle,
    kCBMsgArgUUIDs: []
  };

  if (characteristicUUIDs) {
    for(var i = 0; i < characteristicUUIDs.length; i++) {
      args.kCBMsgArgUUIDs[i] = new Buffer(characteristicUUIDs[i], 'hex');
    }
  }

  this.sendCBMsg(26, args);
};


nobleBindings.readPeripheralServiceCharacteristic = function(uuid, serviceUUID, characteristicUUID) {
  var characteristic = null;
  for(var i = 0; i < this.peripheralServiceCharacteristics[uuid][serviceUUID].length; i++) {
    if (this.peripheralServiceCharacteristics[uuid][serviceUUID][i].uuid === characteristicUUID) {
      characteristic = this.peripheralServiceCharacteristics[uuid][serviceUUID][i];
      break;
    };
  }

  this.sendCBMsg(29, {
    kCBMsgArgPeripheralHandle: this.peripheralUuidToHandle[uuid],
    kCBMsgArgCharacteristicHandle: characteristic.handle,
    kCBMsgArgCharacteristicValueHandle: characteristic.valueHandle
  });
};

nobleBindings.writePeripheralServiceCharacteristic = function(uuid, serviceUUID, characteristicUUID, value, notify) {
  var characteristic = null;
  for(var i = 0; i < this.peripheralServiceCharacteristics[uuid][serviceUUID].length; i++) {
    if (this.peripheralServiceCharacteristics[uuid][serviceUUID][i].uuid === characteristicUUID) {
      characteristic = this.peripheralServiceCharacteristics[uuid][serviceUUID][i];
      break;
    };
  }

  this.sendCBMsg(30, {
    kCBMsgArgPeripheralHandle: this.peripheralUuidToHandle[uuid],
    kCBMsgArgCharacteristicHandle: characteristic.handle,
    kCBMsgArgCharacteristicValueHandle: characteristic.valueHandle,
    kCBMsgArgData: value,
    kCBMsgArgType: (notify ? 1 : 0)
  });
};

nobleBindings.broadcastPeripheralServiceCharacteristic = function(uuid, serviceUUID, characteristicUUID, broadcast) {
  var characteristic = null;
  for(var i = 0; i < this.peripheralServiceCharacteristics[uuid][serviceUUID].length; i++) {
    if (this.peripheralServiceCharacteristics[uuid][serviceUUID][i].uuid === characteristicUUID) {
      characteristic = this.peripheralServiceCharacteristics[uuid][serviceUUID][i];
      break;
    };
  }

  this.sendCBMsg(31, {
    kCBMsgArgPeripheralHandle: this.peripheralUuidToHandle[uuid],
    kCBMsgArgCharacteristicHandle: characteristic.handle,
    kCBMsgArgCharacteristicValueHandle: characteristic.valueHandle,
    kCBMsgArgState: (broadcast ? 1 : 0)
  });
};

nobleBindings.notifyPeripheralServiceCharacteristic = function(uuid, serviceUUID, characteristicUUID, notify) {
  var characteristic = null;
  for(var i = 0; i < this.peripheralServiceCharacteristics[uuid][serviceUUID].length; i++) {
    if (this.peripheralServiceCharacteristics[uuid][serviceUUID][i].uuid === characteristicUUID) {
      characteristic = this.peripheralServiceCharacteristics[uuid][serviceUUID][i];
      break;
    };
  }

  this.sendCBMsg(32, {
    kCBMsgArgPeripheralHandle: this.peripheralUuidToHandle[uuid],
    kCBMsgArgCharacteristicHandle: characteristic.handle,
    kCBMsgArgCharacteristicValueHandle: characteristic.valueHandle,
    kCBMsgArgState: (notify ? 1 : 0)
  });
};

nobleBindings.discoverPeripheralServiceCharacteristicDescriptors = function(uuid, serviceUUID, characteristicUUID) {
  var characteristic = null;
  for(var i = 0; i < this.peripheralServiceCharacteristics[uuid][serviceUUID].length; i++) {
    if (this.peripheralServiceCharacteristics[uuid][serviceUUID][i].uuid === characteristicUUID) {
      characteristic = this.peripheralServiceCharacteristics[uuid][serviceUUID][i];
      break;
    };
  }

  this.sendCBMsg(34, {
    kCBMsgArgPeripheralHandle: this.peripheralUuidToHandle[uuid],
    kCBMsgArgCharacteristicHandle: characteristic.handle,
    kCBMsgArgCharacteristicValueHandle: characteristic.valueHandle
  });
};

nobleBindings.readPeripheralServiceCharacteristicDescriptorValue = function(uuid, serviceUUID, characteristicUUID, descriptorUUID) {

  this.sendCBMsg(40, {
    kCBMsgArgPeripheralHandle: this.peripheralUuidToHandle[uuid],
    kCBMsgArgDescriptorHandle: descriptorUUID // TODO: fix ...
  });
};

nobleBindings.writePeripheralServiceCharacteristicDescriptorValue = function(uuid, serviceUUID, characteristicUUID, descriptorUUID, data) {

  this.sendCBMsg(41, {
    kCBMsgArgPeripheralHandle: this.peripheralUuidToHandle[uuid],
    kCBMsgArgDescriptorHandle: descriptorUUID, // TODO: fix ...
    kCBMsgArgData: data
  });
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

