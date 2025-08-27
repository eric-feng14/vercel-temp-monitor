// max6675-node.js
const spi = require('spi-device');

const dev = spi.open(0, 0, err => {
  if (err) throw err;
  console.log('SPI opened: bus 0, device 0 (CE0)');
  const loop = setInterval(readTemp, 1000);

  process.on('SIGINT', () => {
    clearInterval(loop);
    dev.close(() => process.exit(0));
  });
});

function readTemp() {
  const message = [{
    sendBuffer: Buffer.from([0x00, 0x00]), // clock out 16 bits
    receiveBuffer: Buffer.alloc(2),
    byteLength: 2,
    speedHz: 500000
  }];

  dev.transfer(message, (err, [{ receiveBuffer: buf }]) => {
    if (err) return console.error('SPI transfer error:', err);

    const raw16 = (buf[0] << 8) | buf[1];
    const value = raw16 >> 3;              // match your Python shift
    if (value & 0x8000) {                  // match your Python fault check
      console.log('Thermocouple not connected!');
      return;
    }
    const tempC = value * 0.25;            // 0.25 °C / LSB
    console.log(`Temperature: ${tempC.toFixed(2)} °C`);
  });
}
