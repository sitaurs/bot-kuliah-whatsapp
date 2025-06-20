import fs from 'fs-extra';
import path from 'path';
import moment from 'moment-timezone';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

moment.tz.setDefault("Asia/Jakarta");

// Agar __dirname bisa digunakan di ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Pastikan direktori log ada
fs.ensureDirSync(path.join(__dirname, '../logs'));

// Format timestamp
const getTimestamp = () => moment().format('YYYY-MM-DD HH:mm:ss');

// Fungsi untuk menulis log ke file
const writeLog = (level, message) => {
  const timestamp = getTimestamp();
  const logLine = `[${timestamp}][${level.toUpperCase()}] ${message}\n`;

  // Format nama file log berdasarkan tanggal
  const today = moment().format('YYYY-MM-DD');
  const logFile = path.join(__dirname, '../logs', `${today}.log`);

  // Tulis ke file
  fs.appendFileSync(logFile, logLine);

  // Tampilkan di konsol
  console.log(`[${level.toUpperCase()}] ${message}`);
};

const info = (message) => writeLog('info', message);
const error = (message) => writeLog('error', message);
const warn = (message) => writeLog('warn', message);
const debug = (message) => writeLog('debug', message);

export default {
  info,
  error,
  warn,
  debug
};
