import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const skipPath = path.join(__dirname, '../data/jadwal_skip.json');

const ensureFile = async () => {
  if (!await fs.pathExists(skipPath)) {
    await fs.writeJson(skipPath, []);
  }
};
ensureFile();

export default {
  name: 'liburkan',
  description: 'Menandai mata kuliah yang libur pada tanggal tertentu',
  async execute(msg, args, conn) {
    const sender = msg.key.remoteJid;
    const input = args.join(' ').trim();

    const match = input.match(/^(.+?) (\\d{4}-\\d{2}-\\d{2})$/);
    if (!match) {
      return await conn.sendMessage(sender, {
        text: '⚠️ Format salah. Gunakan:\n!liburkan <matkul> <YYYY-MM-DD>'
      }, { quoted: msg });
    }

    const [, matkul, tanggal] = match;
    const newEntry = { tanggal, matkul: matkul.trim().toUpperCase() };
    const existing = await fs.readJson(skipPath).catch(() => []);

    const alreadyExists = existing.find(e => e.tanggal === tanggal && e.matkul === newEntry.matkul);
    if (alreadyExists) {
      return await conn.sendMessage(sender, {
        text: `✅ Mata kuliah "${matkul}" sudah ditandai libur untuk tanggal ${tanggal}.`
      }, { quoted: msg });
    }

    existing.push(newEntry);
    await fs.writeJson(skipPath, existing, { spaces: 2 });

    return await conn.sendMessage(sender, {
      text: `✅ Mata kuliah "${matkul}" diliburkan pada ${tanggal}.`
    }, { quoted: msg });
  }
};
