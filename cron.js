import cron from 'node-cron';
import config from '../config.js';
import reminderHandler from '../commands/reminder.js';
import logger from './logger.js';

const initScheduler = (sock) => {
  try {
    // ⏰ Jadwal pagi (06:00)
    cron.schedule(config.reminderSettings.jadwalPagi, () => {
      logger.info('⏰ Mengirim pengingat pagi (jadwal kuliah)...');
      reminderHandler.sendMorningReminder(sock);
    }, {
      timezone: 'Asia/Jakarta'
    });

    // 🌙 Reminder tugas malam (19:00)
    cron.schedule(config.reminderSettings.tugasMalam, () => {
      logger.info('⏰ Mengirim pengingat malam (tugas)...');
      reminderHandler.sendTasksReminder(sock);
    }, {
      timezone: 'Asia/Jakarta'
    });

    // 🔄 Reminder dinamis tiap menit
    cron.schedule('* * * * *', () => {
      logger.info('🔄 Cek reminder dinamis: jadwal & tugas mendekati deadline...');
      reminderHandler.sendJadwalReminderDynamic(sock);
      reminderHandler.sendTasksReminder(sock);
    }, {
      timezone: 'Asia/Jakarta'
    });

    logger.info('✅ Semua jadwal cron berhasil diinisialisasi.');
  } catch (error) {
    logger.error(`❌ Gagal inisialisasi scheduler: ${error.message}`);
  }
};

export default {
  initScheduler
};
