// tes.js
import crypto from 'crypto';
globalThis.crypto = crypto.webcrypto; // ✅ ini bagian penting

import * as baileys from '@whiskeysockets/baileys';
import reminder from './commands/reminder.js';
import P from 'pino';

const { makeWASocket, useMultiFileAuthState, DisconnectReason } = baileys;

const start = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: P({ level: 'info' }),
    defaultQueryTimeoutMs: undefined
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('🔌 Koneksi terputus. Reconnect:', shouldReconnect);
      if (shouldReconnect) start();
    } else if (connection === 'open') {
      console.log('✅ Bot berhasil terhubung! Mengirim reminder...\n');

      await testReminder(sock);
      console.log('✅ Reminder selesai terkirim ke semua grup.\n');

      process.exit(0);
    }
  });
};

const testReminder = async (sock) => {
  try {
    console.log('🕒 Kirim reminder pagi...');
    await reminder.sendMorningReminder(sock);
    console.log('✅ Reminder pagi terkirim!');

    console.log('🌙 Kirim reminder malam...');
    await reminder.sendEveningReminder(sock);
    console.log('✅ Reminder malam terkirim!');

    console.log('📋 Kirim reminder tugas...');
    await reminder.sendTasksReminder(sock);
    console.log('✅ Reminder tugas terkirim!');
  } catch (err) {
    console.error('❌ Gagal mengirim reminder:', err);
  }
};

start();
