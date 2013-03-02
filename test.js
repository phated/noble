var noble = require('./index');

console.log('noble');

noble.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    noble.startScanning();
  } else {
    noble.stopScanning();
  }
});

noble.on('scanStart', function() {
  console.log('on -> scanStart');
});

noble.on('scanStop', function() {
  console.log('on -> scanStop');
});



noble.on('peripheralDiscover', function(peripheral) {
  console.log('on -> peripheralDiscover: ' + peripheral);

  noble.stopScanning();

  peripheral.on('connect', function() {
    console.log('on -> peripheral connect');
    this.updateRssi();
  });

  // peripheral.on('connectFailure', function(reason) {
  //   console.log('on -> peripheral connect failure');
  //   console.log(reason);
  // });

  peripheral.on('disconnect', function() {
    console.log('on -> peripheral disconnect');
  });

  peripheral.on('rssiUpdate', function(rssi) {
    console.log('on -> peripheral RSSI update ' + rssi);
    this.discoverServices();
  });

  peripheral.on('servicesDiscover', function(services) {
    console.log('on -> peripheral services discovered ' + services);

    var serviceIndex = 2;

    services[serviceIndex].on('includedServicesDiscover', function(includedServiceUuids) {
      console.log('on -> service included services discovered ' + includedServiceUuids);
      this.discoverCharacteristics();
    });

    services[serviceIndex].on('characteristicsDiscover', function(characteristics) {
      console.log('on -> service characteristics discovered ' + characteristics);

      var characteristicIndex = 0;

      characteristics[characteristicIndex].on('read', function(data) {
        console.log('on -> characteristic read ' + data);
        console.log(data);
      });

      characteristics[characteristicIndex].on('write', function() {
        console.log('on -> characteristic write ');
      });

      characteristics[characteristicIndex].on('broadcast', function(state) {
        console.log('on -> characteristic broadcast ' + state);
      });

      //characteristics[characteristicIndex].read();
      //characteristics[characteristicIndex].write(new Buffer('hello'));
      characteristics[characteristicIndex].broadcast(true);
    });

    services[serviceIndex].on('characteristicRead', function(characteristic, data) {
      console.log('on -> service characteristic read ' + characteristic + ' ' + data);
      peripheral.disconnect();
    });

    services[serviceIndex].on('characteristicWrite', function(characteristic) {
      console.log('on -> service characteristic write ' + characteristic);
      peripheral.disconnect();
    });

    services[serviceIndex].on('characteristicBroadcast', function(characteristic, state) {
      console.log('on -> service characteristic broadcast ' + characteristic + ' ' + state);
      peripheral.disconnect();
    });

    services[serviceIndex].discoverIncludedServices();
  });

  peripheral.on('serviceIncludedServicesDiscover', function(service, includedServiceUuids) {
    console.log('on -> peripheral service included services discovered ' + service + ' ' + includedServiceUuids);
  });

  peripheral.on('serviceCharacteristicsDiscover', function(service, characteristics) {
    console.log('on -> peripheral service characteristics discovered ' + service + ' ' + characteristics);
  });

  peripheral.on('serviceCharacteristicRead', function(service, characteristic, data) {
    console.log('on -> peripheral service characteristic read ' + service + ' ' + characteristic + ' ' + data);
  });

  peripheral.on('serviceCharacteristicWrite', function(service, characteristic) {
    console.log('on -> peripheral service characteristic write ' + service + ' ' + characteristic);
  });

  peripheral.on('serviceCharacteristicBroadcast', function(service, characteristic, state) {
    console.log('on -> peripheral service characteristic broadcast ' + service + ' ' + characteristic + ' ' + state);
  });

  peripheral.connect();
});

noble.on('peripheralConnect', function(peripheral) {
  console.log('on -> peripheralConnect: ' + peripheral);
});

// noble.on('peripheralConnectFailure', function(peripheral, reason) {
//   console.log('on -> peripheralConnectFailure: ');
//   console.log(peripheral);
//   console.log(reason);
// });

noble.on('peripheralDisconnect', function(peripheral) {
  console.log('on -> peripheralDisconnect: ' + peripheral);
});

noble.on('peripheralRssiUpdate', function(peripheral, rssi) {
  console.log('on -> peripheralRssiUpdate: ' + peripheral + ' ' + rssi);
});

noble.on('peripheralServicesDiscover', function(peripheral, services) {
  console.log('on -> peripheralServicesDiscover: ' + peripheral + ' ' + services);
});

noble.on('peripheralServiceIncludedServicesDiscover', function(peripheral, service, includedServiceUuids) {
  console.log('on -> peripheralServicesDiscover: ' + peripheral + ' ' + service + ' ' + includedServiceUuids);
});

noble.on('peripheralServiceCharacteristicsDiscover', function(peripheral, service, characteristics) {
  console.log('on -> peripheralServiceCharacteristicsDiscover: ' + peripheral + ' ' + service + ' ' + characteristics);
});

noble.on('peripheralServiceCharacteristicRead', function(peripheral, service, characteristic, data) {
  console.log('on -> peripheralServiceCharacteristicRead: ' + peripheral + ' ' + service + ' ' + characteristic + ' ' + data);
});

noble.on('peripheralServiceCharacteristicWrite', function(peripheral, service, characteristic) {
  console.log('on -> peripheralServiceCharacteristicWrite: ' + peripheral + ' ' + service + ' ' + characteristic);
});

noble.on('peripheralServiceCharacteristicBroadcast', function(peripheral, service, characteristic, state) {
  console.log('on -> peripheralServiceCharacteristicBroadcast: ' + peripheral + ' ' + service + ' ' + characteristic + ' ' + state);
});