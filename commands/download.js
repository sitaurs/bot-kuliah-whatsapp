// commands/download.js
import { exec } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const downloadDir = path.join(__dirname, '../tmp');
fs.ensureDirSync(downloadDir);

const cleanOldFiles = () => {
  const now = Date.now();
  fs.readdir(downloadDir, (err, files) => {
    if (err) return;
    files.forEach(file => {
      const filePath = path.join(downloadDir, file);
      fs.stat(filePath, (err, stat) => {
        if (err) return;
        const age = (now - stat.mtimeMs) / 1000 / 60 / 60; // jam
        if (age > 4) fs.remove(filePath);
      });
    });
  });
};

const runYtDlp = (url, filename) => {
  return new Promise((resolve, reject) => {
    const filepath = path.join(downloadDir, filename);
    const cmd = `yt-dlp -o '${filepath}' '${url}'`;
    exec(cmd, (err) => {
      if (err) return reject(err);
      resolve(filepath);
    });
  });
};

const handleDownload = async (sock, chatId, platform, url) => {
  try {
    cleanOldFiles();
    const filename = `${Date.now()}_${platform}.mp4`;
    const filepath = await runYtDlp(url, filename);
    await sock.sendMessage(chatId, {
      video: fs.readFileSync(filepath),
      fileName: filename,
      caption: `✅ Berhasil download video dari ${platform.toUpperCase()}`
    });
    logger.info(`📥 Download success: ${filename}`);
  } catch (err) {
    logger.error(`❌ Download error: ${err.message}`);
    await sock.sendMessage(chatId, { text: `❌ Gagal download dari ${platform}. Pastikan link valid.` });
  }
};

export default {
  handleDownload
};
