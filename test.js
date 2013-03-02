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

    services[0].on('includedServicesDiscover', function(includedServiceUuids) {
      console.log('on -> service included services discovered ' + includedServiceUuids);
      peripheral.disconnect();
    });

    services[0].discoverIncludedServices();
  });

  peripheral.on('serviceIncludedServicesDiscover', function(service, includedServiceUuids) {
    console.log('on -> peripheral service included services discovered ' + service + ' ' + includedServiceUuids);
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

