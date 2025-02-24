const os = require('os');
const { exec } = require('child_process');
const cron = require('node-cron');
const axios = require('axios');

async function getSystemInfo() {
    try {
        const temperature = await getTemperature();
        const memoryUsage = getMemoryUsage();
        const cpuUsage = getCpuUsage();
        const diskUsage = await getDiskUsage();
        const diskActivity = await getDiskActivity();

        const systemData = {
            temperature,
            cpuUsage,
            memoryUsage,
            diskUsage,
            diskActivity,
        };

        // Send data to the API
        await axios.post('http://raspberrypi.local:7000/system-info', systemData);
        console.log('System data sent to API');
    } catch (error) {
        console.error(error);
    }
}

// run job every minute
cron.schedule('* * * * *', () => {
    console.log('Fetching system info...');
    getSystemInfo();
});

// Function to get the CPU temperature (specific to Raspberry Pi)
function getTemperature() {
    return new Promise((resolve, reject) => {
        exec('vcgencmd measure_temp', (err, stdout, stderr) => {
            if (err) {
                reject(`Error fetching temperature: ${stderr}`);
            } else {
                // Parse the temperature
                const temp = stdout.match(/temp=(\d+\.\d+)/);
                if (temp) {
                    resolve(`${temp[1]}°C`);
                } else {
                    reject('Could not parse temperature.');
                }
            }
        });
    });
}

// Function to get the memory usage
function getMemoryUsage() {
    const totalMemory = os.totalmem() / (1024 * 1024); // in MB
    const freeMemory = os.freemem() / (1024 * 1024); // in MB
    const usedMemory = totalMemory - freeMemory;

    return {
        totalMemory: totalMemory.toFixed(2),
        usedMemory: usedMemory.toFixed(2),
        freeMemory: freeMemory.toFixed(2),
    };
}

// Function to get the disk usage
function getDiskUsage() {
    return new Promise((resolve, reject) => {
        exec('df -h /', (err, stdout, stderr) => {
            if (err) {
                reject(`Error fetching disk usage: ${stderr}`);
            } else {
                // Split the output lines
                const lines = stdout.split('\n');
                
                // The second line contains the actual disk usage information
                const diskInfo = lines[1].trim().split(/\s+/);
                
                if (diskInfo.length >= 5) {
                    const used = diskInfo[2];      // Used disk space
                    const avail = diskInfo[3];     // Available disk space
                    resolve({ used, available: avail });
                } else {
                    reject('Could not parse disk usage information.');
                }
            }
        });
    });
}

// Function to get CPU usage
function getCpuUsage() {
    const cpus = os.cpus();
    let totalIdle = 0, totalTick = 0;

    // Sum up the total CPU times
    cpus.forEach((cpu) => {
        for (let type in cpu.times) {
            totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - Math.floor((idle / total) * 100);

    return `${usage}%`;
}

// Function to get disk I/O statistics (optional, using iostat)
function getDiskActivity() {
    return new Promise((resolve, reject) => {
        exec('iostat -d 1 2', (err, stdout, stderr) => {
            if (err) {
                reject(`Error fetching disk activity: ${stderr}`);
            } else {
                // The last set of data provides current I/O activity
                const lines = stdout.trim().split('\n');
                const ioData = lines[lines.length - 1].trim().split(/\s+/);
                if (ioData.length >= 5) {
                    const readSpeed = ioData[2]; // KB/s read
                    const writeSpeed = ioData[3]; // KB/s write
                    resolve({ readSpeed, writeSpeed });
                } else {
                    reject('Could not parse disk I/O information.');
                }
            }
        });
    });
}

// Function to get memory-consuming processes
function getMemoryConsumingProcesses() {
    return new Promise((resolve, reject) => {
        exec('ps -eo pid,comm,%mem,rss --sort=-%mem | head -n 6', (err, stdout, stderr) => {
            if (err) {
                reject(`Error fetching memory-consuming processes: ${stderr}`);
            } else {
                resolve(stdout);
            }
        });
    });
}
getSystemInfo();