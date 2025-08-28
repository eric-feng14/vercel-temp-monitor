const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const spi = require('spi-device');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Store temperature data
let currentTemp = null;
let temperatureHistory = [];
const MAX_HISTORY = 100; // Keep last 100 readings

// Serve static files
app.use(express.static('public'));

// API endpoint to get current temperature
app.get('/api/temperature', (req, res) => {
  res.json({
    temperature: currentTemp,
    timestamp: new Date().toISOString()
  });
});

// API endpoint to get temperature history
app.get('/api/temperature/history', (req, res) => {
  res.json(temperatureHistory);
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send current temperature to newly connected client
  if (currentTemp !== null) {
    socket.emit('temperature', {
      temperature: currentTemp,
      timestamp: new Date().toISOString()
    });
  }
  
  // Send temperature history to newly connected client
  socket.emit('temperatureHistory', temperatureHistory);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Temperature monitoring setup
let dev = null;
let tempInterval = null;

function initializeSPI() {
  return new Promise((resolve, reject) => {
    dev = spi.open(0, 0, err => {
      if (err) {
        console.error('Failed to open SPI device:', err);
        reject(err);
        return;
      }
      console.log('SPI opened: bus 0, device 0 (CE0)');
      resolve();
    });
  });
}

function readTemp() {
  if (!dev) return;
  
  const message = [{
    sendBuffer: Buffer.from([0x00, 0x00]), // clock out 16 bits
    receiveBuffer: Buffer.alloc(2),
    byteLength: 2,
    speedHz: 500000
  }];

  dev.transfer(message, (err, [{ receiveBuffer: buf }]) => {
    if (err) {
      console.error('SPI transfer error:', err);
      return;
    }

    const raw16 = (buf[0] << 8) | buf[1];
    const value = raw16 >> 3;
    
    if (value & 0x8000) {
      console.log('Thermocouple not connected!');
      // Emit error to clients
      io.emit('error', { message: 'Thermocouple not connected!' });
      return;
    }
    
    const tempC = value * 0.25;
    const timestamp = new Date().toISOString();
    
    currentTemp = tempC;
    
    // Add to history
    const tempData = {
      temperature: tempC,
      timestamp: timestamp
    };
    
    temperatureHistory.push(tempData);
    
    // Keep only the last MAX_HISTORY readings
    if (temperatureHistory.length > MAX_HISTORY) {
      temperatureHistory.shift();
    }
    
    console.log(`Temperature: ${tempC.toFixed(2)} °C`);
    
    // Emit to all connected clients
    io.emit('temperature', tempData);
  });
}

// Graceful shutdown
function shutdown() {
  console.log('Shutting down...');
  if (tempInterval) {
    clearInterval(tempInterval);
  }
  if (dev) {
    dev.close(() => {
      console.log('SPI device closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the application
async function startApp() {
  try {
    // Initialize SPI
    await initializeSPI();
    
    // Start temperature monitoring
    tempInterval = setInterval(readTemp, 1000);
    
    // Start web server
    server.listen(PORT, () => {
      console.log(`Temperature monitor web server running on http://localhost:${PORT}`);
      console.log('Temperature monitoring started...');
    });
    
  } catch (error) {
    console.error('Failed to start application:', error);
    console.log('Starting web server without temperature monitoring...');
    
    // Start web server even if SPI fails (for development/testing)
    server.listen(PORT, () => {
      console.log(`Web server running on http://localhost:${PORT} (no temperature monitoring)`);
    });
  }
}

startApp();
