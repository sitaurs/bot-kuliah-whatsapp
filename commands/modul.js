import fs from 'fs-extra';
import path from 'path';
import logger from '../utils/logger.js';

const modulRoot = path.join('./data/modul');

const matkulMap = {
  ppmk: 'prakpemrogramankomp',
  mem: 'medanelektromagnetik',
  prl: 'prakrangkaianlistrik',
  skr: 'sistemkomunikasiradio',
  stgm: 'salurantransmisigelombangmikro',
  pdt: 'prakteknikdigital',
  smm: 'sistemmodulasimultiplexing',
  mtk: 'matematikateknik',
  pdt2: 'prakdasarte'
};

export const getFolderName = (kode) => matkulMap[kode];

const listAllMatkul = async (sock, chatId) => {
  try {
    let msg = `📚 *DAFTAR MATA KULIAH & MODUL*\n\n`;
    for (const [code, folder] of Object.entries(matkulMap)) {
      const folderPath = path.join(modulRoot, folder);
      let files = [];
      if (await fs.pathExists(folderPath)) files = await fs.readdir(folderPath);
      msg += `📘 *${code.toUpperCase()}* → ${folder.replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase()}  \n   📎 ${files.length} modul tersedia\n\n`;
    }
    msg += `💡 *Contoh Perintah:*\n• !modul mtk → Lihat semua modul MTK\n• !modul mtk 1 → Ambil modul nomor 1\n• !modul hapus mtk 1 → Hapus modul nomor 1`;
    await sock.sendMessage(chatId, { text: msg });
  } catch (err) {
    logger.error(`Error list matkul: ${err.message}`);
    await sock.sendMessage(chatId, { text: '⚠️ Gagal mengambil daftar matkul.' });
  }
};

const listModul = async (sock, chatId, kode) => {
  try {
    const folder = matkulMap[kode];
    if (!folder) {
      await sock.sendMessage(chatId, { text: `❓ Kode matkul *${kode}* tidak dikenali.` });
      return;
    }

    const folderPath = path.join(modulRoot, folder);
    if (!await fs.pathExists(folderPath)) {
      await sock.sendMessage(chatId, { text: `📁 Belum ada file untuk *${folder}*.` });
      return;
    }

    const files = await fs.readdir(folderPath);
    if (files.length === 0) {
      await sock.sendMessage(chatId, { text: `📭 Tidak ada modul untuk *${folder}*.` });
      return;
    }

    let msg = `📄 *DAFTAR MODUL ${folder.toUpperCase()}*\n\n`;
    files.forEach((f, i) => msg += `📌 ${i + 1}. ${f}\n`);
    msg += `\n📥 *Gunakan:* !modul ${kode} <nomor>\n🗑️ *Hapus:* !modul hapus ${kode} <nomor>`;
    await sock.sendMessage(chatId, { text: msg });
  } catch (err) {
    logger.error(`Error modul list: ${err.message}`);
    await sock.sendMessage(chatId, { text: '⚠️ Gagal ambil modul.' });
  }
};

const sendModul = async (sock, chatId, kode, nomor) => {
  try {
    const folder = matkulMap[kode];
    if (!folder) {
      await sock.sendMessage(chatId, { text: `❓ Kode matkul *${kode}* tidak dikenali.` });
      return;
    }

    const folderPath = path.join(modulRoot, folder);
    const files = await fs.readdir(folderPath);
    const idx = parseInt(nomor) - 1;

    if (isNaN(idx) || idx < 0 || idx >= files.length) {
      await sock.sendMessage(chatId, { text: `❌ Modul nomor ${nomor} tidak ditemukan.` });
      return;
    }

    const fileName = files[idx];
    const filePath = path.join(folderPath, fileName);
    const ext = path.extname(fileName).toLowerCase();

    if (ext === '.txt') {
      const content = await fs.readFile(filePath, 'utf8');
      if (content.includes('http')) {
        await sock.sendMessage(chatId, { text: `🔗 *Modul Link ${kode.toUpperCase()} ${nomor}*\n${content.trim()}` });
        logger.info(`Link modul ${fileName} dikirim ke ${chatId}`);
        return;
      }
    }

    const file = await fs.readFile(filePath);
    let mimeType = 'application/octet-stream';
    if (ext === '.pdf') mimeType = 'application/pdf';
    else if (ext === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === '.doc') mimeType = 'application/msword';

    await sock.sendMessage(chatId, {
      document: file,
      fileName: fileName,
      mimetype: mimeType
    });

    logger.info(`Modul ${fileName} dikirim ke ${chatId}`);
  } catch (err) {
    logger.error(`Error kirim modul: ${err.message}`);
    await sock.sendMessage(chatId, { text: '❌ Gagal mengirim file modul.' });
  }
};

const hapusModul = async (sock, chatId, kode, nomor) => {
  try {
    const folder = matkulMap[kode];
    if (!folder) {
      await sock.sendMessage(chatId, { text: `❓ Kode matkul *${kode}* tidak dikenali.` });
      return;
    }

    const folderPath = path.join(modulRoot, folder);
    const files = await fs.readdir(folderPath);
    const idx = parseInt(nomor) - 1;

    if (isNaN(idx) || idx < 0 || idx >= files.length) {
      await sock.sendMessage(chatId, { text: `❌ Modul nomor ${nomor} tidak ditemukan.` });
      return;
    }

    const fileName = files[idx];
    const filePath = path.join(folderPath, fileName);

    await fs.remove(filePath);
    await sock.sendMessage(chatId, {
      text: `🗑️ *Modul Dihapus*\n\n📂 *Mata Kuliah:* ${kode.toUpperCase()}\n📄 *File:* ${fileName}`
    });

    logger.info(`Modul ${fileName} dihapus dari ${folder}`);
  } catch (err) {
    logger.error(`Error hapus modul: ${err.message}`);
    await sock.sendMessage(chatId, { text: '❌ Gagal menghapus file modul.' });
  }
};

export default {
  listAllMatkul,
  listModul,
  sendModul,
  hapusModul
};


