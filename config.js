// config.js (ESM)
import dotenv from 'dotenv';
dotenv.config();

const config = {
  // Nama bot
  botName: "AssistenKampus",

  // Nomor owner utama
  owner: ["6281358959349@s.whatsapp.net"],

  // Daftar grup yang menerima broadcast reminder
  groupIds: [
    "6282333701190-1598403147@g.us",
    "120363399448132967@g.us",
    "120363303003832667@g.us"
  ],

  // API KEY Gemini untuk fitur AI
  geminiApiKey: process.env.GEMINI_API_KEY || "AIzaSyAMKZ-AiXiJv0A43bC92ERTLMi4Ywwx_5c",

  // Pengaturan jadwal cron
  reminderSettings: {
    jadwalPagi: "0 6 * * *",   // 06:00 pagi
    tugasMalam: "0 19 * * *",  // 19:00 malam
    jadwalMalam: "0 21 * * *"  // (opsional) 21:00 malam
  },

  // Keyword dasar
  keywordJadwal: "!jadwal",
  keywordTugas: "!tugas",

  // Prefix & user izin untuk system command
  systemCommands: {
    prefix: "!",
    allowedUsers: ["62812345678@s.whatsapp.net"]
  }
};

export default config;
