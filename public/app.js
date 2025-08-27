// Initialize Socket.IO connection
const socket = io();

// DOM elements
const currentTempElement = document.getElementById('currentTemp');
const lastUpdatedElement = document.getElementById('lastUpdated');
const tempFahrenheitElement = document.getElementById('tempFahrenheit');
const statusElement = document.getElementById('status');
const minTempElement = document.getElementById('minTemp');
const maxTempElement = document.getElementById('maxTemp');
const avgTempElement = document.getElementById('avgTemp');
const totalReadingsElement = document.getElementById('totalReadings');
const clearHistoryButton = document.getElementById('clearHistory');
const timeRangeSelect = document.getElementById('timeRange');

// Temperature data storage
let temperatureData = [];
let chart = null;

// Initialize Chart.js
function initChart() {
    const ctx = document.getElementById('tempChart').getContext('2d');
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperature (°C)',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#667eea',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            const dataIndex = context[0].dataIndex;
                            const timestamp = temperatureData[dataIndex]?.timestamp;
                            if (timestamp) {
                                return new Date(timestamp).toLocaleString();
                            }
                            return '';
                        },
                        label: function(context) {
                            const temp = context.raw;
                            const fahrenheit = (temp * 9/5 + 32).toFixed(1);
                            return `${temp}°C (${fahrenheit}°F)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Time',
                        color: '#6b7280'
                    },
                    ticks: {
                        color: '#6b7280',
                        maxTicksLimit: 10,
                        callback: function(value, index) {
                            if (temperatureData[index]) {
                                const date = new Date(temperatureData[index].timestamp);
                                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            }
                            return '';
                        }
                    },
                    grid: {
                        color: 'rgba(107, 114, 128, 0.1)'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Temperature (°C)',
                        color: '#6b7280'
                    },
                    ticks: {
                        color: '#6b7280'
                    },
                    grid: {
                        color: 'rgba(107, 114, 128, 0.1)'
                    }
                }
            },
            animation: {
                duration: 500,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Update temperature display
function updateTemperatureDisplay(temp, timestamp) {
    currentTempElement.textContent = temp.toFixed(2);
    lastUpdatedElement.textContent = `Last updated: ${new Date(timestamp).toLocaleString()}`;
    
    // Convert to Fahrenheit
    const fahrenheit = (temp * 9/5 + 32).toFixed(1);
    tempFahrenheitElement.textContent = `${fahrenheit} °F`;
}

// Update statistics
function updateStatistics() {
    if (temperatureData.length === 0) {
        minTempElement.textContent = '--';
        maxTempElement.textContent = '--';
        avgTempElement.textContent = '--';
        totalReadingsElement.textContent = '0';
        return;
    }
    
    const temperatures = temperatureData.map(d => d.temperature);
    const min = Math.min(...temperatures);
    const max = Math.max(...temperatures);
    const avg = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
    
    minTempElement.textContent = `${min.toFixed(2)}°C`;
    maxTempElement.textContent = `${max.toFixed(2)}°C`;
    avgTempElement.textContent = `${avg.toFixed(2)}°C`;
    totalReadingsElement.textContent = temperatures.length.toString();
}

// Update chart with filtered data
function updateChart() {
    if (!chart) return;
    
    let dataToShow = [...temperatureData];
    const timeRange = timeRangeSelect.value;
    
    if (timeRange !== 'all') {
        const limit = parseInt(timeRange);
        dataToShow = dataToShow.slice(-limit);
    }
    
    const labels = dataToShow.map(d => new Date(d.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    }));
    const temperatures = dataToShow.map(d => d.temperature);
    
    chart.data.labels = labels;
    chart.data.datasets[0].data = temperatures;
    chart.update('none'); // No animation for frequent updates
}

// Update connection status
function updateStatus(status, message) {
    statusElement.className = `status ${status}`;
    statusElement.textContent = message;
}

// Socket event handlers
socket.on('connect', () => {
    console.log('Connected to server');
    updateStatus('connected', 'Connected');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    updateStatus('disconnected', 'Disconnected');
});

socket.on('temperature', (data) => {
    console.log('Temperature update:', data);
    
    // Add to temperature data
    temperatureData.push(data);
    
    // Keep only last 100 readings to prevent memory issues
    if (temperatureData.length > 100) {
        temperatureData.shift();
    }
    
    // Update display
    updateTemperatureDisplay(data.temperature, data.timestamp);
    updateStatistics();
    updateChart();
});

socket.on('temperatureHistory', (history) => {
    console.log('Received temperature history:', history.length, 'readings');
    temperatureData = [...history];
    updateStatistics();
    updateChart();
    
    // Update current temperature if we have data
    if (history.length > 0) {
        const latest = history[history.length - 1];
        updateTemperatureDisplay(latest.temperature, latest.timestamp);
    }
});

socket.on('error', (error) => {
    console.error('Temperature sensor error:', error);
    
    // Show error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = error.message;
    
    // Insert after header
    const header = document.querySelector('header');
    header.insertAdjacentElement('afterend', errorDiv);
    
    // Remove error message after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
});

// Event listeners
clearHistoryButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the temperature history?')) {
        temperatureData = [];
        updateStatistics();
        updateChart();
        console.log('Temperature history cleared');
    }
});

timeRangeSelect.addEventListener('change', () => {
    updateChart();
});

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('Temperature Monitor initialized');
    updateStatus('connecting', 'Connecting...');
    initChart();
    
    // Fetch initial data via API (fallback)
    fetch('/api/temperature/history')
        .then(response => response.json())
        .then(history => {
            if (history && history.length > 0) {
                console.log('Loaded temperature history from API:', history.length, 'readings');
                temperatureData = history;
                updateStatistics();
                updateChart();
                
                // Update current temperature
                const latest = history[history.length - 1];
                updateTemperatureDisplay(latest.temperature, latest.timestamp);
            }
        })
        .catch(error => {
            console.log('Could not load temperature history from API:', error.message);
        });
});

// Add some visual feedback for interactions
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn')) {
        e.target.style.transform = 'scale(0.95)';
        setTimeout(() => {
            e.target.style.transform = '';
        }, 150);
    }
});

// Update chart responsively
window.addEventListener('resize', () => {
    if (chart) {
        chart.resize();
    }
});
