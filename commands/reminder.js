import * as akademikHandler from './akademik.js';
import tugasHandler from './tugas.js';
import config from '../config.js';
import logger from '../utils/logger.js';
import fs from 'fs-extra';
import moment from 'moment-timezone';

moment.locale('id');
moment.tz.setDefault("Asia/Jakarta");

const skipPath = './data/jadwal_skip.json';

const loadSkipList = async () => {
  return await fs.readJson(skipPath).catch(() => []);
};

// 🔔 Reminder pagi jam 06.00
const sendMorningReminder = async (sock) => {
  try {
    const jadwalHariIni = await akademikHandler.getJadwalHariIni();
    const skipList = await loadSkipList();
    const today = moment().format('YYYY-MM-DD');
    let message = `🌅 *SELAMAT PAGI KELAS 1D!*\n\n📌 Berikut adalah jadwal kuliah *hari ini* (${jadwalHariIni.hari}):\n\n`;

    const filtered = jadwalHariIni.jadwal.filter(j =>
      !skipList.find(s => s.tanggal === today && s.matkul === j.matkul)
    );

    if (filtered.length === 0) {
      message += `✅ Tidak ada jadwal kuliah hari ini. Gunakan waktumu dengan produktif ya! 🚀`;
    } else {
      filtered.forEach((item, index) => {
        message += `🔹 ${index + 1}. ${item.matkul}\n    🕒 ${item.jam} | 📍${item.ruang}\n`;
      });
      message += `\n⏰ Jangan lupa hadir tepat waktu ya!`;
    }

    for (const groupId of config.groupIds) {
      await sock.sendMessage(groupId, { text: message });
    }

    logger.info("📨 Morning reminder terkirim ke semua grup");
  } catch (error) {
    logger.error(`❗ Error mengirim morning reminder: ${error.message}`);
  }
};

// 🔔 Reminder tugas otomatis: H-3, H-2, H-1, 5 jam, 1 jam
const sendTasksReminder = async (sock) => {
  try {
    const tasks = await tugasHandler.getTugasList();
    const now = moment();
    const filtered = tasks.filter(task => task.dueDate);

    const reminders = filtered.filter(task => {
      const due = moment(task.dueDate);
      const diffMinutes = due.diff(now, 'minutes');
      const diffHours = due.diff(now, 'hours');
      const diffDays = due.diff(now, 'days');

      const targetTimes = [4320, 2880, 1440, 300, 60]; // minutes: 3d, 2d, 1d, 5h, 1h

      return targetTimes.includes(diffMinutes);
    });

    const expired = filtered.filter(task => moment(task.dueDate).isBefore(now));

    for (const task of reminders) {
      const deadline = moment(task.dueDate).format('dddd, DD MMMM YYYY HH:mm');
      for (const groupId of config.groupIds) {
        await sock.sendMessage(groupId, {
          text: `⏰ *REMINDER TUGAS*\n📌 ${task.task}\n🗓️ Deadline: ${deadline} WIB`
        });
      }
    }

    // Otomatis hapus tugas yang sudah lewat
    if (expired.length > 0) {
      const tasksLeft = tasks.filter(t => !expired.find(e => e.id === t.id));
      await fs.writeJson('./data/tugas.json', tasksLeft, { spaces: 2 });
    }
  } catch (error) {
    logger.error(`❗ Error reminder tugas dinamis: ${error.message}`);
  }
};

// 🔔 Reminder 15 menit sebelum kuliah dimulai
const sendJadwalReminderDynamic = async (sock) => {
  try {
    const jadwalHariIni = await akademikHandler.getJadwalHariIni();
    const skipList = await loadSkipList();
    const now = moment();

    for (const item of jadwalHariIni.jadwal) {
      const [start] = item.jam.split('-');
      const [jam, menit] = start.trim().split('.').map(Number);
      const waktuKuliah = moment().set({ hour: jam, minute: menit, second: 0 });

      const bedaMenit = waktuKuliah.diff(now, 'minutes');

      if (bedaMenit === 15 && !skipList.find(s => s.tanggal === now.format('YYYY-MM-DD') && s.matkul === item.matkul)) {
        for (const groupId of config.groupIds) {
          await sock.sendMessage(groupId, {
            text: `📢 *15 MENIT LAGI KULIAH!*\n🔔 Mata Kuliah: ${item.matkul}\n🕒 ${item.jam}\n📍 ${item.ruang}`
          });
        }
      }
    }
  } catch (err) {
    logger.error(`❗ Error jadwal dynamic reminder: ${err.message}`);
  }
};

export default {
  sendMorningReminder,
  sendTasksReminder,
  sendJadwalReminderDynamic
};
