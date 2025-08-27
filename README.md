# Temperature Monitor Web Application

A real-time web-based temperature monitoring system for MAX6675 thermocouple sensors using Node.js, Express, and Socket.IO.

## Features

- **Real-time Temperature Display**: Live temperature readings in both Celsius and Fahrenheit
- **Interactive Charts**: Temperature history visualization with Chart.js
- **Statistics Dashboard**: Min, max, average temperatures and total readings
- **Real-time Updates**: WebSocket-based real-time data streaming
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Temperature History**: Store and display the last 100 temperature readings
- **Error Handling**: Graceful handling of sensor disconnections and errors

## Prerequisites

- Node.js (v12 or higher)
- Raspberry Pi with SPI enabled (if using MAX6675 sensor)
- MAX6675 thermocouple sensor (optional - app will run without hardware)

## Hardware Setup

Connect the MAX6675 to your Raspberry Pi:
- VCC → 3.3V or 5V
- GND → Ground
- SCK → SPI0_SCLK (GPIO 11)
- CS → SPI0_CE0 (GPIO 8)
- SO → SPI0_MISO (GPIO 9)

Make sure SPI is enabled on your Raspberry Pi:
```bash
sudo raspi-config
# Go to Interfacing Options → SPI → Yes
```

## Installation

1. Clone or navigate to the project directory:
```bash
cd /path/to/temp-monitor
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Start the Application

```bash
npm start
```

The application will:
- Start the web server on port 3000 (or PORT environment variable)
- Initialize the SPI connection to the MAX6675 sensor
- Begin temperature monitoring every second
- Serve the web interface

### Access the Web Interface

Open your web browser and navigate to:
- Local: `http://localhost:3000`
- Network: `http://[your-pi-ip]:3000`

### API Endpoints

The application provides REST API endpoints:

- `GET /api/temperature` - Get current temperature reading
- `GET /api/temperature/history` - Get temperature history

Example API response:
```json
{
  "temperature": 23.75,
  "timestamp": "2024-01-20T10:30:45.123Z"
}
```

## Configuration

### Environment Variables

- `PORT` - Web server port (default: 3000)

### Customization

You can modify the following settings in `server.js`:
- `MAX_HISTORY` - Number of temperature readings to keep (default: 100)
- Temperature reading interval (default: 1000ms)
- SPI configuration (bus, device, speed)

## File Structure

```
temp-monitor/
├── server.js              # Main server application
├── tempMonitor.js         # Original temperature monitoring script
├── package.json           # Project dependencies and scripts
├── public/                # Static web files
│   ├── index.html        # Main web interface
│   ├── style.css         # Styling
│   └── app.js            # Client-side JavaScript
└── README.md             # This file
```

## Features in Detail

### Web Interface

- **Current Temperature Display**: Large, easy-to-read temperature display
- **Temperature History Chart**: Interactive line chart showing temperature over time
- **Statistics Panel**: Shows min, max, average temperatures and total readings
- **Connection Status**: Shows real-time connection status to the server
- **Responsive Design**: Adapts to different screen sizes

### Real-time Updates

The application uses WebSockets (Socket.IO) for real-time communication:
- Temperature readings are pushed to all connected clients immediately
- No need to refresh the page to see new data
- Automatic reconnection if connection is lost

### Error Handling

- Graceful handling of sensor disconnections
- Web server continues running even if SPI initialization fails
- Error messages displayed in the web interface
- Automatic cleanup on shutdown

## Troubleshooting

### SPI Permission Issues
```bash
sudo usermod -a -G spi $USER
# Log out and back in
```

### Port Already in Use
```bash
# Check what's using port 3000
sudo netstat -tlnp | grep :3000

# Or use a different port
PORT=8080 npm start
```

### No Temperature Readings
1. Check SPI is enabled: `lsmod | grep spi`
2. Check wiring connections
3. Verify sensor is working: `dmesg | grep spi`

## Development

### Running Without Hardware
The application will start and serve the web interface even without the MAX6675 sensor connected. This is useful for:
- Development and testing
- UI/UX improvements
- Running on non-Raspberry Pi systems

### Testing the API
```bash
# Get current temperature
curl http://localhost:3000/api/temperature

# Get temperature history
curl http://localhost:3000/api/temperature/history
```

## License

ISC License

## Contributing

Feel free to submit issues and pull requests to improve the application.
