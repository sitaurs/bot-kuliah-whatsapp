// commands/system.js
import { exec } from 'child_process';
import si from 'systeminformation';
import moment from 'moment-timezone';
import logger from '../utils/logger.js';
import config from '../config.js';

moment.locale('id');
moment.tz.setDefault('Asia/Jakarta');

const isAuthorized = (chatId) => {
  const allowed = config.owner.concat(config.systemCommands.allowedUsers);
  return allowed.includes(chatId);
};

const getSystemStatus = async (sock, chatId) => {
  try {
    const cpu = await si.cpu();
    const load = await si.currentLoad();
    const mem = await si.mem();
    const disk = await si.fsSize();
    const uptime = await si.time();

    const message = `📊 *STATUS SISTEM VPS*\n\n` +
      `🧠 *CPU:* ${cpu.manufacturer} ${cpu.brand} (${cpu.cores} cores)\n` +
      `Load: ${load.currentLoad.toFixed(2)}%\n\n` +
      `💾 *Memory:* ${(mem.used / 1e9).toFixed(2)} GB / ${(mem.total / 1e9).toFixed(2)} GB (${((mem.used / mem.total) * 100).toFixed(2)}%)\n\n` +
      `🗂️ *Disk:* ${(disk[0].used / 1e9).toFixed(2)} GB / ${(disk[0].size / 1e9).toFixed(2)} GB (${((disk[0].used / disk[0].size) * 100).toFixed(2)}%)\n\n` +
      `⏱️ *Uptime:* ${moment.duration(uptime.uptime, 'seconds').humanize()}\n🕒 *Waktu:* ${moment().format('LLLL')}`;

    await sock.sendMessage(chatId, { text: message });
  } catch (err) {
    logger.error(`getSystemStatus: ${err.message}`);
    await sock.sendMessage(chatId, { text: '❌ Gagal mengambil status sistem.' });
  }
};

const rebootSystem = async (sock, chatId) => {
  if (!isAuthorized(chatId)) return sock.sendMessage(chatId, { text: '⚠️ Tidak punya izin.' });
  await sock.sendMessage(chatId, { text: '♻️ Restarting VPS dalam 10 detik...' });
  setTimeout(() => exec('sudo reboot'), 10000);
};

const updateSystem = async (sock, chatId) => {
  if (!isAuthorized(chatId)) return sock.sendMessage(chatId, { text: '⚠️ Tidak punya izin.' });
  await sock.sendMessage(chatId, { text: '🛠️ Update sistem sedang berjalan...' });
  exec('sudo apt update && sudo apt upgrade -y', (err, stdout) => {
    if (err) return sock.sendMessage(chatId, { text: `❌ Update gagal: ${err.message}` });
    sock.sendMessage(chatId, { text: `✅ Update selesai:\n\n${stdout.slice(0, 300)}...` });
  });
};

const getUptime = async (sock, chatId) => {
  const uptime = await si.time();
  await sock.sendMessage(chatId, { text: `⏱️ *Uptime:* ${moment.duration(uptime.uptime, 'seconds').humanize()}` });
};

const getMemoryUsage = async (sock, chatId) => {
  const mem = await si.mem();
  const msg = `💾 *Memory*\nUsed: ${(mem.used / 1e9).toFixed(2)} GB\nTotal: ${(mem.total / 1e9).toFixed(2)} GB\nUsage: ${((mem.used / mem.total) * 100).toFixed(2)}%`;
  await sock.sendMessage(chatId, { text: msg });
};

const getCpuUsage = async (sock, chatId) => {
  const cpu = await si.cpu();
  const load = await si.currentLoad();
  const msg = `🧠 *CPU*\n${cpu.manufacturer} ${cpu.brand}\nLoad: ${load.currentLoad.toFixed(2)}%`;
  await sock.sendMessage(chatId, { text: msg });
};

const getDiskUsage = async (sock, chatId) => {
  const disk = await si.fsSize();
  const msg = `🗂️ *Disk*\nUsed: ${(disk[0].used / 1e9).toFixed(2)} GB\nTotal: ${(disk[0].size / 1e9).toFixed(2)} GB\nUsage: ${((disk[0].used / disk[0].size) * 100).toFixed(2)}%`;
  await sock.sendMessage(chatId, { text: msg });
};

const sendHelpMenu = async (sock, chatId) => {
  try {
    const message = `✨ *PANDUAN PENGGUNA BOT KELAS* ✨\n\n` +
    `📦 *Sistem VPS:*\n` +
    `🔹 !status - Cek status server\n` +
    `🔹 !uptime - Waktu aktif server\n` +
    `🔹 !cpu - Info CPU\n` +
    `🔹 !memory - Info Memori\n` +
    `🔹 !disk - Info Disk\n` +
    `🔹 !reboot - Restart server\n` +
    `🔹 !update - Update sistem (apt)\n\n` +
    `📚 *Akademik:*\n` +
    `🔹 !jadwal - Jadwal kuliah hari ini\n` +
    `🔹 !jadwal besok - Jadwal kuliah besok\n` +
    `🔹 !kalender - Kalender akademik\n\n` +
    `📝 *Tugas Kuliah:*\n` +
    `🔹 !tugas list - Lihat semua tugas\n` +
    `🔹 !tugas tambah <isi> - Tambah tugas\n` +
    `🔹 !tugas hapus <id> - Hapus tugas\n\n` +
    `📂 *Modul Perkuliahan:*\n` +
    `🔹 !modul - Lihat semua matkul + kode\n` +
    `🔹 !modul <kode> - Lihat semua modul\n` +
    `🔹 !modul <kode> <no> - Ambil file/link\n\n` +
    `🤖 *Chat AI (Gemini):*\n` +
    `🔹 ask <pertanyaan> - Tanya bebas ke AI\n\n` +
    `📌 *Contoh:*\n` +
    `ask siapa penemu listrik?\n` +
    `!modul pdt\n` +
    `!modul skr 2`;

    await sock.sendMessage(chatId, { text: message });
    logger.info(`Help menu sent to ${chatId}`);
  } catch (err) {
    logger.error(`Help menu error: ${err.message}`);
    await sock.sendMessage(chatId, { text: '❌ Gagal mengirim menu bantuan.' });
  }
};

export default {
  getSystemStatus,
  rebootSystem,
  updateSystem,
  getUptime,
  getMemoryUsage,
  getCpuUsage,
  getDiskUsage,
  sendHelpMenu
};
