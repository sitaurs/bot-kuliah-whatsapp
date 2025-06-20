import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const skipPath = path.join(__dirname, '../data/jadwal_skip.json');

export default {
  name: 'liburlist',
  description: 'Menampilkan daftar kuliah yang diliburkan',
  async execute(msg, args, conn) {
    const sender = msg.key.remoteJid;

    try {
      const data = await fs.readJson(skipPath).catch(() => []);

      if (!data || data.length === 0) {
        return await conn.sendMessage(sender, {
          text: '📭 Belum ada matkul yang ditandai libur.'
        }, { quoted: msg });
      }

      const list = data.map((entry, i) => {
        return `${i + 1}. ${entry.matkul} - ${entry.tanggal}`;
      }).join('\n');

      return await conn.sendMessage(sender, {
        text: `📅 *Daftar Matkul yang Diliburkan:*\n\n${list}`
      }, { quoted: msg });

    } catch (err) {
      return await conn.sendMessage(sender, {
        text: '❌ Gagal membaca daftar libur.'
      }, { quoted: msg });
    }
  }
};
