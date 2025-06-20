import fs from 'fs-extra';
import path from 'path';
import logger from './logger.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Fungsi untuk membaca data dari file JSON
const readData = async (filename) => {
  try {
    const filePath = path.join(__dirname, '../data', filename);
    if (!await fs.pathExists(filePath)) {
      return null;
    }
    return await fs.readJson(filePath);
  } catch (error) {
    logger.error(`Error membaca data ${filename}: ${error.message}`);
    return null;
  }
};

// Fungsi untuk menulis data ke file JSON
const writeData = async (filename, data) => {
  try {
    const filePath = path.join(__dirname, '../data', filename);
    await fs.writeJson(filePath, data);
    return true;
  } catch (error) {
    logger.error(`Error menulis data ${filename}: ${error.message}`);
    return false;
  }
};

export default {
  readData,
  writeData
};
