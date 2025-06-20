import fetch from 'node-fetch';
import config from '../config.js';
import logger from '../utils/logger.js';
import * as akademikHandler from './akademik.js';
import tugasHandler from './tugas.js'; // default export

const chatHistory = {};

const resetChatHistoryIfNeeded = (userId) => {
  if (!chatHistory[userId]) chatHistory[userId] = [];
  if (chatHistory[userId].length > 10) {
    chatHistory[userId] = chatHistory[userId].slice(-10);
  }
};

export const processGeminiChat = async (sock, chatId, message) => {
  try {
    resetChatHistoryIfNeeded(chatId);

    const jadwalHariIni = await akademikHandler.getJadwalHariIni();
    const jadwalMingguan = await akademikHandler.getJadwalSeminggu(); // Pastikan fungsi ini ada
    const kalender = await akademikHandler.getKalender();
    const tugasList = await tugasHandler.getTugasList();

    const contextPrompt = `
Kamu adalah asisten kuliah pintar untuk mahasiswa kelas 1D. 
Tugasmu adalah menjawab pertanyaan seputar jadwal kuliah, kalender akademik, dan tugas. 
Jawaban harus singkat, to the point, dan boleh menggunakan emoji bila cocok.

📅 *Jadwal Hari Ini (${jadwalHariIni.hari}):*
${jadwalHariIni.jadwal.length > 0
  ? jadwalHariIni.jadwal.map(j => `- ${j.jam}: ${j.matkul} (${j.ruang})`).join('\n')
  : 'Tidak ada jadwal'}

📘 *Jadwal Mingguan:*
${Object.entries(jadwalMingguan).map(([hari, list]) =>
  `📌 ${hari}:\n${list.map(j => `- ${j.jam}: ${j.matkul} (${j.ruang})`).join('\n') || '  Tidak ada jadwal'}`
).join('\n\n')}

📆 *Kalender Akademik Lengkap:*
${kalender.kalender_akademik.map(k => `- ${k.event} (${k.period})`).join('\n')}

📝 *Daftar Tugas:*
${tugasList.length > 0
  ? tugasList.map(t => `- ${t.id}. ${t.task}`).join('\n')
  : 'Tidak ada tugas'}

User: ${message}
`;

    chatHistory[chatId].push({ role: 'user', content: message });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: contextPrompt }] }]
      })
    });

    const data = await response.json();
    console.log('[DEBUG] Gemini Response:', JSON.stringify(data, null, 2));

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      await sock.sendMessage(chatId, { text: '❌ Gemini tidak memberikan jawaban.' });
      logger.error(`Gemini response empty: ${JSON.stringify(data)}`);
      return;
    }

    chatHistory[chatId].push({ role: 'model', content: reply });
    await sock.sendMessage(chatId, { text: reply });
    logger.info(`Gemini response sent to ${chatId}`);
  } catch (error) {
    logger.error(`Gemini error: ${error.message}`);
    await sock.sendMessage(chatId, { text: '❌ Gagal menghubungi Gemini AI. Silakan coba lagi nanti.' });
  }
};
