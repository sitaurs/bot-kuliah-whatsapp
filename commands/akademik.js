import fs from 'fs-extra';
import path from 'path';
import moment from 'moment-timezone';
import config from '../config.js';
import logger from '../utils/logger.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

moment.locale('id');
moment.tz.setDefault("Asia/Jakarta");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const jadwalPath = path.join(__dirname, '../data/jadwal.json');
const kalenderPath = path.join(__dirname, '../data/kalender.json');

// Inisialisasi data jika belum ada
const initJadwal = async () => {
  if (!await fs.pathExists(jadwalPath)) {
    await fs.writeJson(jadwalPath, {});
  }

  if (!await fs.pathExists(kalenderPath)) {
    await fs.writeJson(kalenderPath, { kalender_akademik: [], libur_nasional: [] });
  }
};
initJadwal();

// Konversi hari Inggris ke Indonesia
const convertHari = (hari) => {
  switch (hari) {
    case 'MONDAY': return 'SENIN';
    case 'TUESDAY': return 'SELASA';
    case 'WEDNESDAY': return 'RABU';
    case 'THURSDAY': return 'KAMIS';
    case 'FRIDAY': return 'JUMAT';
    case 'SATURDAY': return 'SABTU';
    case 'SUNDAY': return 'MINGGU';
    default: return hari;
  }
};

// Ambil jadwal
const getJadwalHariIni = async () => {
  const hari = convertHari(moment().format('dddd').toUpperCase());
  return await getJadwalByDay(hari);
};

const getJadwalBesok = async () => {
  const hari = convertHari(moment().add(1, 'days').format('dddd').toUpperCase());
  return await getJadwalByDay(hari);
};

const getJadwalByDay = async (day) => {
  try {
    const jadwal = await fs.readJson(jadwalPath);
    return { hari: day, jadwal: jadwal[day] || [] };
  } catch (error) {
    logger.error(`❗ Error mengambil jadwal: ${error.message}`);
    return { hari: day, jadwal: [] };
  }
};

// Ambil semua jadwal dalam seminggu
const getJadwalSeminggu = async () => {
  try {
    const jadwal = await fs.readJson(jadwalPath);
    const hariList = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU'];

    const hasil = {};
    hariList.forEach(hari => {
      hasil[hari] = jadwal[hari] || [];
    });

    return hasil;
  } catch (err) {
    logger.error(`❗ Error mengambil jadwal mingguan: ${err.message}`);
    return {};
  }
};

// Format jadwal untuk pengiriman ke WhatsApp
const formatJadwal = ({ hari, jadwal }) => {
  if (!jadwal || jadwal.length === 0) {
    return `📅 *JADWAL HARI ${hari}*\n\n🚫 Tidak ada perkuliahan hari ini. Gunakan waktumu dengan bijak!`;
  }

  let msg = `📅 *JADWAL HARI ${hari}*\n\n📚 Berikut jadwal kuliah:\n\n`;
  jadwal.forEach((item, i) => {
    msg += `🔹 ${i + 1}. ${item.matkul}\n    🕒 ${item.jam} | 📍${item.ruang}\n`;
  });
  msg += `\n✅ Jangan lupa hadir tepat waktu ya!`;
  return msg;
};

// Ambil & format kalender akademik
const getKalender = async () => {
  try {
    return await fs.readJson(kalenderPath);
  } catch (error) {
    logger.error(`❗ Error mengambil kalender: ${error.message}`);
    return { kalender_akademik: [], libur_nasional: [] };
  }
};

const formatKalender = (kalenderData) => {
  let msg = `📆 *KALENDER AKADEMIK SEMESTER GENAP 2024/2025*\n\n📖 *Agenda Akademik:*\n`;
  kalenderData.kalender_akademik.forEach(item => {
    msg += `🔸 ${item.period}\n     📌 ${item.event}\n\n`;
  });

  msg += `🗓️ *Hari Libur Nasional & Cuti Bersama:*\n`;
  kalenderData.libur_nasional.forEach(item => {
    msg += `🔹 ${item.tanggal}\n     📌 ${item.event}\n\n`;
  });

  return msg;
};

// Kirim jadwal & kalender via WhatsApp
const sendJadwal = async (sock, chatId) => {
  try {
    const jadwalHariIni = await getJadwalHariIni();
    await sock.sendMessage(chatId, { text: formatJadwal(jadwalHariIni) });
    logger.info(`✅ Jadwal dikirim ke ${chatId}`);
  } catch (error) {
    logger.error(`❗ Error kirim jadwal: ${error.message}`);
    await sock.sendMessage(chatId, { text: "❗ Gagal mengambil jadwal hari ini." });
  }
};

const sendKalender = async (sock, chatId) => {
  try {
    const kalender = await getKalender();
    await sock.sendMessage(chatId, { text: formatKalender(kalender) });
    logger.info(`✅ Kalender dikirim ke ${chatId}`);
  } catch (error) {
    logger.error(`❗ Error kirim kalender: ${error.message}`);
    await sock.sendMessage(chatId, { text: "❗ Gagal mengambil kalender akademik." });
  }
};

// Ekspor semua fungsi
export default {
  getJadwalHariIni,
  getJadwalBesok,
  getJadwalByDay,
  getJadwalSeminggu,
  getKalender,
  sendJadwal,
  sendKalender,
  formatJadwal,
  formatKalender
};

export {
  getJadwalHariIni,
  getJadwalBesok,
  getJadwalByDay,
  getJadwalSeminggu,
  getKalender,
  sendJadwal,
  sendKalender,
  formatJadwal,
  formatKalender
};
