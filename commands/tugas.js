import fs from 'fs-extra';
import path from 'path';
import config from '../config.js';
import logger from '../utils/logger.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const tugasPath = path.join(__dirname, '../data/tugas.json');

const initTugas = async () => {
  if (!await fs.pathExists(tugasPath)) {
    await fs.writeJson(tugasPath, []);
  }
};
initTugas();

const getTugasList = async () => {
  try {
    return await fs.readJson(tugasPath);
  } catch (error) {
    logger.error(`❗ Error membaca tugas: ${error.message}`);
    return [];
  }
};

const getNewTaskId = async () => {
  const tasks = await getTugasList();
  return tasks.length === 0 ? 1 : Math.max(...tasks.map(task => task.id)) + 1;
};

const parseDeadline = (hariOffset, jamStr) => {
  const now = new Date();
  const [jam, menit] = jamStr.split('.').map(Number);
  const deadline = new Date(now);
  deadline.setDate(deadline.getDate() + parseInt(hariOffset));
  deadline.setHours(jam);
  deadline.setMinutes(menit);
  deadline.setSeconds(0);
  deadline.setMilliseconds(0);
  return deadline;
};

const addTugas = async (sock, chatId, sender, taskDesc) => {
  try {
    const regex = /(.+?) \+(\d{1,2}) (\d{1,2}\.\d{1,2})$/;
    const match = taskDesc.trim().match(regex);

    if (!match) {
      await sock.sendMessage(chatId, {
        text: '⚠️ Format salah. Contoh:\n!tugas tambah laporan RL +3 15.30'
      });
      return;
    }

    const [, deskripsi, hariOffset, jamStr] = match;
    const deadline = parseDeadline(hariOffset, jamStr);
    const deadlineISO = deadline.toISOString();
    const deadlineFormatted = format(deadline, "EEEE, dd MMMM yyyy 'pukul' HH:mm", { locale: id });

    const tasks = await getTugasList();
    const newId = await getNewTaskId();
    tasks.push({
      id: newId,
      task: deskripsi.trim(),
      addedBy: sender,
      createdAt: new Date().toISOString(),
      dueDate: deadlineISO
    });
    await fs.writeJson(tugasPath, tasks);

    await sock.sendMessage(chatId, {
      text: `✅ *TUGAS DITAMBAHKAN*\n\n📌 *ID:* ${newId}\n✍️ *Tugas:* ${deskripsi.trim()}\n⏰ *Deadline:* ${deadlineFormatted} WIB`
    });

    logger.info(`Tugas ditambahkan oleh ${sender}: ${deskripsi.trim()}`);
  } catch (error) {
    logger.error(`❗ Error menambah tugas: ${error.message}`);
    await sock.sendMessage(chatId, {
      text: "❌ Maaf, terjadi kesalahan saat menambahkan tugas."
    });
  }
};

const removeTugas = async (sock, chatId, sender, taskId) => {
  try {
    const id = parseInt(taskId);
    const tasks = await getTugasList();
    const newTasks = tasks.filter(task => task.id !== id);

    if (newTasks.length === tasks.length) {
      await sock.sendMessage(chatId, {
        text: `⚠️ Tugas dengan ID *${id}* tidak ditemukan.`
      });
      return;
    }

    await fs.writeJson(tugasPath, newTasks);
    await sock.sendMessage(chatId, {
      text: `🗑️ *TUGAS DIHAPUS*\n\nID: ${id}`
    });

    logger.info(`Tugas dengan ID ${id} dihapus oleh ${sender}`);
  } catch (error) {
    logger.error(`❗ Error menghapus tugas: ${error.message}`);
    await sock.sendMessage(chatId, {
      text: "❌ Maaf, terjadi kesalahan saat menghapus tugas."
    });
  }
};

const sendTugasList = async (sock, chatId) => {
  try {
    const tasks = await getTugasList();

    if (tasks.length === 0) {
      await sock.sendMessage(chatId, {
        text: `📋 *DAFTAR TUGAS*\n\n✅ Tidak ada tugas yang tercatat.\nGunakan \`!tugas tambah <deskripsi> +N HH.MM\` untuk menambahkan tugas baru.`
      });
      return;
    }

    let message = `📋 *DAFTAR TUGAS*\n\n`;
    tasks.forEach(task => {
      const tanggal = task.dueDate
        ? format(new Date(task.dueDate), "dd/MM/yyyy HH:mm")
        : new Date(task.createdAt).toLocaleDateString('id-ID');
      message += `🆔 *${task.id}*\n📌 ${task.task}\n🗓️ Deadline: ${tanggal}\n\n`;
    });

    message += `✍️ Tambah tugas: \`!tugas tambah <deskripsi> +N HH.MM\`\n🗑️ Hapus tugas: \`!tugas hapus <id>\``;

    await sock.sendMessage(chatId, { text: message });
    logger.info(`📨 Daftar tugas dikirim ke ${chatId}`);
  } catch (error) {
    logger.error(`❗ Error mengirim daftar tugas: ${error.message}`);
    await sock.sendMessage(chatId, {
      text: "❌ Maaf, terjadi kesalahan saat mengirim daftar tugas."
    });
  }
};

export default {
  getTugasList,
  addTugas,
  removeTugas,
  sendTugasList
};
