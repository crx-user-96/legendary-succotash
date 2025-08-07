const https = require('https');
const chalk = require('chalk');
const gradient = require('gradient-string');

// সরাসরি teen থিম কালার রিটার্ন করে
function getTeenThemeColors() {
  return {
    cra: gradient("#81fcf8", "#853858"),
    co: gradient.teen,
    cb: chalk.hex("#a1d5f7"),
    cv: chalk.bold.hex("#ad0042"),
    error: gradient("#00a9c7", "#853858"),
  };
}

function fetchAndLogNotification(url) {
  https.get(url, (res) => {
    let data = '';

    res.on('data', chunk => data += chunk);

    res.on('end', () => {
      const { co } = getTeenThemeColors();
      console.log(co(data));
    });

  }).on('error', (err) => {
    console.error("Error fetching URL:", err.message);
  });
}

const url = "https://raw.githubusercontent.com/MR-MAHABUB-004/MAHABUB-BOT-STORAGE/refs/heads/main/notification.txt";

module.exports = {
  getThemeColors: getTeenThemeColors,
  
  log: (text, type) => {
    const { co, error } = getTeenThemeColors();
    switch (type) {
      case 'warn':
        process.stderr.write(error(`\r[ WARN ] `) + text + '\n');
        break;
      case 'error':
        console.log(chalk.bold.hex("#ff0000").bold(`[ ERROR ] `) + text + '\n');
        break;
      case 'load':
        console.log(co(`[ NEW USER ] `) + text + '\n');
        break;
      default:
        process.stderr.write(co(`\r[ ${String(type).toUpperCase()} ] `) + text + '\n');
        break;
    }
  },

  error: (text, type) => {
    process.stderr.write(chalk.hex("#ff0000")(`\r[ ${type} ] `) + text + '\n');
  },

  err: (text, type) => {
    const { co } = getTeenThemeColors();
    process.stderr.write(co(`[ ${type} ] `) + text + '\n');
  },

  warn: (text, type) => {
    const { co } = getTeenThemeColors();
    process.stderr.write(co(`\r[ ${type} ] `) + text + '\n');
  },

  loader: (data, option) => {
    const { co } = getTeenThemeColors();
    switch (option) {
      case 'warn':
        process.stderr.write(co(`[ SYSTEM ] `) + data + '\n');
        break;
      case 'error':
        process.stderr.write(chalk.hex("#ff0000")(`\r[ SYSTEM ] `) + data + '\n');
        break;
      default:
        console.log(co(`[ SYSTEM ] `) + data);
        break;
    }
  },

  fetchAndLogNotification,
  notificationURL: url,
};
