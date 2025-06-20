import crypto from 'crypto';
import { webcrypto } from 'crypto';
const { subtle, getRandomValues } = webcrypto;

import { makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs-extra';
import path from 'path';

import config from './config.js';
import * as akademikHandler from './commands/akademik.js';
import reminderHandler from './commands/reminder.js';
import systemHandler from './commands/system.js';
import tugasHandler from './commands/tugas.js';
import modulHandler, { getFolderName } from './commands/modul.js';
import downloadHandler from './commands/download.js';
import liburkanHandler from './commands/liburkan.js';
import liburlistHandler from './commands/liburlist.js';
import { processGeminiChat } from './commands/gemini.js';

import cronJobs from './utils/cron.js';
import logger from './utils/logger.js';

const ensureDirectories = async () => {
  await fs.ensureDir('./auth_info_baileys');
  await fs.ensureDir('./data');
  if (!await fs.pathExists('./data/tugas.json')) {
    await fs.writeJson('./data/tugas.json', []);
  }
};

async function connectToWhatsApp() {
  await ensureDirectories();
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
    logger: pino({ level: 'info' }),
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      logger.info('✅ Bot berhasil terhubung!');
      cronJobs.initScheduler(sock);
    } else if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error instanceof Boom) &&
        lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        logger.warn('🔁 Koneksi terputus, mencoba kembali...');
        connectToWhatsApp();
      } else {
        logger.error('❌ Koneksi gagal. Silakan restart bot.');
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    if (!messages[0]) return;
    const msg = messages[0];

    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderNo = sender.split('@')[0];
    const isFromGroup = chatId.endsWith('@g.us');
    const isAllowedGroup = config.groupIds.includes(chatId);
    const isOwner = config.owner.includes(`${senderNo}@s.whatsapp.net`);
    const isAdmin = isOwner || config.systemCommands.allowedUsers.includes(`${senderNo}@s.whatsapp.net`);

    let body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    let cleanBody = body.replace(/[???-?]/g, '').trim();

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;

    logger.debug(`[DEBUG] chatId: ${chatId}, sender: ${sender}, isFromGroup: ${isFromGroup}`);
    logger.debug(`[DEBUG] cleanBody: ${cleanBody}`);
    logger.debug(`[DEBUG] msg.message full: ${JSON.stringify(msg.message, null, 2)}`);

    // ✅ Upload modul
    const docMsg = msg.message?.documentMessage ||
                   msg.message?.documentWithCaptionMessage?.message?.documentMessage;
    const rawCaption = docMsg?.caption || '';
    if (rawCaption.trim().toLowerCase().startsWith('!upload')) {
      try {
        if (!isAdmin) {
          await sock.sendMessage(chatId, { text: '⚠️ Hanya admin yang boleh upload modul.' });
          return;
        }

        const kode = rawCaption.split(' ')[1]?.toLowerCase();
        const folder = getFolderName(kode);
        if (!folder) {
          await sock.sendMessage(chatId, { text: `❌ Kode matkul tidak dikenali: ${kode}` });
          return;
        }

        const fileName = docMsg.fileName || `file_${Date.now()}.pdf`;
        const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: pino() });
        const targetPath = path.join('./data/modul', folder, fileName);

        await fs.ensureDir(path.dirname(targetPath));
        await fs.writeFile(targetPath, buffer);

        await sock.sendMessage(chatId, { text: `✅ File *${fileName}* disimpan ke *${folder}*.` });
        logger.info(`[UPLOAD] File ${fileName} disimpan ke ${targetPath}`);
        return;
      } catch (error) {
        logger.error(`[UPLOAD] Error: ${error.message}`);
        await sock.sendMessage(chatId, { text: '❌ Gagal upload modul.' });
        return;
      }
    }

    if (!cleanBody.startsWith('!')) return;

    try {
      const [cmd, ...args] = cleanBody.slice(1).split(' ');

      if (cmd === 'ask') {
        const prompt = args.join(' ').trim();
        if (!prompt) {
          await sock.sendMessage(chatId, { text: '❓ Pertanyaanmu kosong. Contoh: `!ask kapan uas?`' });
          return;
        }
        await processGeminiChat(sock, chatId, prompt);
        return;
      }

      if (cmd === 'help' || cmd === 'menu') await systemHandler.sendHelpMenu(sock, chatId);
      if (cmd === 'idgrup') await sock.sendMessage(chatId, { text: `ID grup ini: ${chatId}` });

      if (isAdmin) {
        if (cmd === 'status') await systemHandler.getSystemStatus(sock, chatId);
        if (cmd === 'reboot') await systemHandler.rebootSystem(sock, chatId);
        if (cmd === 'update') await systemHandler.updateSystem(sock, chatId);
        if (cmd === 'uptime') await systemHandler.getUptime(sock, chatId);
        if (cmd === 'memory') await systemHandler.getMemoryUsage(sock, chatId);
        if (cmd === 'cpu') await systemHandler.getCpuUsage(sock, chatId);
        if (cmd === 'disk') await systemHandler.getDiskUsage(sock, chatId);
      }

      if (cmd === 'jadwal') {
        const keyword = args[0]?.toLowerCase();
        if (keyword === 'besok') {
          const data = await akademikHandler.getJadwalBesok();
          await sock.sendMessage(chatId, { text: akademikHandler.formatJadwal(data) });
        } else {
          await akademikHandler.sendJadwal(sock, chatId);
        }
      }

      if (cmd === 'kalender') await akademikHandler.sendKalender(sock, chatId);

      if (cmd === 'tugas') {
        if (args[0] === 'tambah') await tugasHandler.addTugas(sock, chatId, sender, args.slice(1).join(' '));
        if (args[0] === 'hapus') await tugasHandler.removeTugas(sock, chatId, sender, args[1]);
        if (args[0] === 'list') await tugasHandler.sendTugasList(sock, chatId);
      }

      if (cmd === 'modul') {
        const kode = args[0];
        const nomor = args[1];
        if (!kode) {
          await modulHandler.listAllMatkul(sock, chatId);
        } else if (kode.toLowerCase() === 'hapus') {
          const kodeMatkul = args[1];
          const nomorModul = args[2];
          if (!isAdmin) {
            await sock.sendMessage(chatId, { text: '⚠️ Hanya admin yang bisa menghapus modul.' });
            return;
          }
          if (!kodeMatkul || !nomorModul) {
            await sock.sendMessage(chatId, { text: '⚠️ Format salah. Gunakan: !modul hapus <kode> <no>' });
            return;
          }
          await modulHandler.hapusModul(sock, chatId, kodeMatkul.toLowerCase(), nomorModul);
        } else if (!nomor) {
          await modulHandler.listModul(sock, chatId, kode.toLowerCase());
        } else {
          await modulHandler.sendModul(sock, chatId, kode.toLowerCase(), nomor);
        }
      }

      if (cmd === 'reminder') {
        if (args[0] === 'tugas') await reminderHandler.sendTugasReminderManual(sock, chatId);
        else if (args[0] === 'jadwal') await reminderHandler.sendJadwalReminder(sock, chatId);
        else {
          await sock.sendMessage(chatId, {
            text: '🔔 Gunakan:\n• `!reminder tugas`\n• `!reminder jadwal`'
          });
        }
      }

      if (cmd === 'liburkan') {
        if (!isAdmin) return sock.sendMessage(chatId, { text: '⚠️ Hanya admin yang bisa meliburkan matkul.' });
        await liburkanHandler.execute(msg, args, sock);
        return;
      }

      if (cmd === 'liburlist') {
        await liburlistHandler.execute(msg, args, sock);
        return;
      }

      if (['yt', 'tt', 'ig'].includes(cmd)) {
        const url = args[0];
        if (!url) return sock.sendMessage(chatId, { text: '⚠️ Kirim link video setelah perintah.' });
        await downloadHandler.handleDownload(sock, chatId, cmd, url);
      }
    } catch (err) {
      logger.error(`❌ Error saat proses command: ${err.message}`);
    }
  });
}

connectToWhatsApp();
