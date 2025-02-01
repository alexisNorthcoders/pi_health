# System Health Monitoring Script

## Overview
This Node.js script collects system health metrics from a Raspberry Pi and sends them to a specified API endpoint. It runs automatically every minute using `node-cron`.

## Features
- **CPU Temperature Monitoring** (Specific to Raspberry Pi)
- **Memory Usage Monitoring** (Total, Used, Free Memory)
- **CPU Usage Calculation**
- **Disk Usage Monitoring**
- **Disk Activity (Read/Write Speed) Monitoring**
- **Memory-Consuming Processes Listing**
- **Automatic Data Posting** to an API every minute

## Requirements
- Node.js installed on your Raspberry Pi
- `sqlite3` installed if using local storage
- The following npm packages:
  ```sh
  npm install node-cron axios
  ```
- Ensure `vcgencmd` and `iostat` commands are available on the system (Raspberry Pi OS includes `vcgencmd` by default, but you may need to install `iostat` via `sysstat`).

## Installation
1. Clone this repository or copy the script to your Raspberry Pi.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Update the API endpoint in the script if needed:
   ```javascript
   await axios.post('http://raspberrypi.local:7000/system-info', systemData);
   ```
4. Run the script manually to test:
   ```sh
   node health.js
   ```
5. To keep it running in the background, use:
   ```sh
   pm2 start health.js --name system-monitor
   pm2 save
   pm2 startup
   ```

## How It Works
- **Data Collection**: The script gathers system metrics using `os` and `child_process.exec`.
- **Data Transmission**: The collected data is sent via an HTTP POST request to the specified API.
- **Automated Scheduling**: `node-cron` schedules the script to run every minute.

## Cron Job Scheduling
The script is scheduled to run every minute using:
```javascript
cron.schedule('* * * * *', () => {
    console.log('Fetching system info...');
    getSystemInfo();
});
```

