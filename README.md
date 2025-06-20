# 🤖 Bot Kuliah WhatsApp

![Lisensi ISC](https://img.shields.io/badge/License-ISC-blue.svg) ![Node.js](https://img.shields.io/badge/Node.js-18.x+-green.svg) ![Baileys](https://img.shields.io/badge/WhatsApp%20API-Baileys-brightgreen)

Selamat datang di **Bot Kuliah WhatsApp**! Bot ini adalah asisten pribadi yang dirancang khusus untuk membantu mahasiswa mengelola kehidupan perkuliahan dengan lebih efisien. Mulai dari pengingat jadwal, manajemen tugas, hingga akses cepat ke materi kuliah, semua terintegrasi dalam satu bot WhatsApp yang cerdas.

Bot ini ditenagai oleh **Node.js** dan **@whiskeysockets/baileys**, serta dilengkapi dengan kemampuan AI dari **Google Gemini** untuk menjawab pertanyaan secara kontekstual.

## 📜 Daftar Isi

- [✨ Fitur Unggulan](#-fitur-unggulan)
- [⚙️ Prasyarat](#-prasyarat)
- [🗂️ Struktur Proyek](#-struktur-proyek)
- [🚀 Instalasi & Konfigurasi](#-instalasi--konfigurasi)
- [▶️ Menjalankan Bot](#-menjalankan-bot)
- [📝 Panduan Perintah (Command)](#-panduan-perintah-command)
- [🔧 Panduan Kustomisasi & Modifikasi](#-panduan-kustomisasi--modifikasi)
- [📄 Lisensi](#-lisensi)

## ✨ Fitur Unggulan

-   📚 **Manajemen Akademik**: Akses cepat ke jadwal kuliah harian, mingguan, dan kalender akademik.
-   🔔 **Reminder Cerdas & Otomatis**:
    -   Pengingat jadwal kuliah setiap pagi.
    -   Notifikasi 15 menit sebelum kelas dimulai.
    -   Pengingat tugas yang mendekati tenggat waktu (H-3, H-2, H-1, dll.).
-   📝 **Manajemen Tugas**: Tambah, lihat, dan hapus daftar tugas dengan mudah langsung dari WhatsApp.
-   📂 **Bank Modul**: Unggah, kelola, dan minta materi atau modul perkuliahan per mata kuliah.
-   🤖 **Asisten AI (Gemini)**: Ajukan pertanyaan apa saja dan dapatkan jawaban kontekstual yang relevan dengan jadwal dan tugas kuliah Anda.
-   📥 **Downloader Media**: Unduh video dari YouTube, TikTok, dan Instagram langsung melalui perintah.
-   🖥️ **Manajemen Server**: Perintah khusus untuk admin memantau status VPS (CPU, RAM, Disk), melakukan reboot, dan update sistem.
-   🗓️ **Jadwal Fleksibel**: Tandai mata kuliah tertentu sebagai "libur" untuk menonaktifkan pengingat sementara.

## ⚙️ Prasyarat

Sebelum memulai, pastikan sistem Anda memenuhi persyaratan berikut:

1.  **Node.js**: Versi `18.x` atau yang lebih baru.
2.  **Server/VPS**: Sangat disarankan untuk menjalankan bot 24/7.
3.  **Akun WhatsApp**: Nomor aktif yang akan didedikasikan untuk bot.
4.  **API Key Google Gemini**: Diperlukan untuk fitur `!ask`. Dapatkan dari [Google AI Studio](https://aistudio.google.com/app/apikey).
5.  **yt-dlp**: Utility yang wajib terinstal di server untuk fitur downloader media. Ikuti [panduan instalasi resmi](https://github.com/yt-dlp/yt-dlp#installation).

## 🗂️ Struktur Proyek

```
/
├── auth_info_baileys/  # Menyimpan sesi login WhatsApp
├── commands/           # Logika untuk setiap perintah bot
│   ├── akademik.js       # Handle jadwal, kalender
│   ├── download.js       # Handle download media
│   ├── gemini.js         # Handle chat dengan AI
│   ├── liburkan.js       # Handle !liburkan
│   ├── liburlist.js      # Handle !liburlist
│   ├── modul.js          # Handle manajemen modul
│   ├── reminder.js       # Logika pengiriman reminder
│   ├── system.js         # Handle status VPS dan !help
│   └── tugas.js          # Handle manajemen tugas
├── data/               # File data (database JSON)
│   ├── jadwal.json
│   ├── jadwal_skip.json
│   ├── kalender.json
│   └── tugas.json
│   └── modul/          # Folder untuk menyimpan file modul
├── logs/               # File log harian
├── tmp/                # Folder sementara untuk file download
├── utils/              # Fungsi pendukung
│   ├── cron.js           # Inisialisasi cron jobs
│   ├── database.js       # Pembaca/penulis file JSON
│   └── logger.js         # Sistem logging
├── config.js           # File konfigurasi utama
├── index.js            # Titik masuk utama aplikasi
├── package.json        # Dependensi dan skrip proyek
└── README.md
```

## 🚀 Instalasi & Konfigurasi

Ikuti langkah-langkah ini untuk menjalankan bot Anda:

1.  **Clone Repositori**
    ```bash
    git clone [https://github.com/sitaurs/bot-kuliah-whatsapp.git](https://github.com/sitaurs/bot-kuliah-whatsapp.git)
    cd bot-kuliah-whatsapp
    ```

2.  **Install Dependensi**
    ```bash
    npm install
    ```

3.  **Konfigurasi Lingkungan (`.env`)**
    Buat file `.env` di direktori utama proyek dan masukkan API Key Gemini Anda.
    ```env
    GEMINI_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXX"
    ```
    *File `config.js` akan otomatis membaca variabel ini.*

4.  **Konfigurasi Utama (`config.js`)**
    Buka file `config.js` dan sesuaikan nilainya:
    -   `owner`: Masukkan nomor WhatsApp Anda sebagai owner utama dengan format `"628xxxxxxxxxx@s.whatsapp.net"`.
    -   `groupIds`: Masukkan ID grup yang akan menerima broadcast reminder. Anda bisa mendapatkan ID ini dengan mengirim perintah `!idgrup` di grup target setelah bot berjalan.
    -   `systemCommands.allowedUsers`: Tambahkan pengguna lain yang diizinkan mengakses perintah sistem.

5.  **Siapkan Data Awal**
    Isi file-file JSON di dalam folder `data/` sesuai kebutuhan:
    -   **`data/jadwal.json`**: Definisikan jadwal kuliah mingguan Anda.
      ```json
      {
        "SENIN": [
          { "jam": "08.00-09.40", "matkul": "MATEMATIKA TEKNIK", "ruang": "RT-01" }
        ],
        "SELASA": []
      }
      ```
    -   **`data/kalender.json`**: Masukkan agenda akademik dan hari libur.
      ```json
      {
        "kalender_akademik": [
          { "period": "18 - 22 Agt 2025", "event": "Ujian Akhir Semester" }
        ],
        "libur_nasional": []
      }
      ```

## ▶️ Menjalankan Bot

1.  **Jalankan dengan Node.js**
    ```bash
    npm start
    ```
2.  **Pindai Kode QR**
    Buka aplikasi WhatsApp di ponsel Anda, lalu pindai Kode QR yang muncul di terminal untuk menghubungkan bot.

3.  **Menjalankan di Latar Belakang (Rekomendasi VPS)**
    Gunakan manajer proses seperti `pm2` agar bot tetap berjalan meskipun terminal ditutup.
    ```bash
    npm install -g pm2
    pm2 start index.js --name "bot-kuliah"
    ```

## 📝 Panduan Perintah (Command)

### Perintah Umum

| Perintah | Deskripsi | Contoh Penggunaan |
| --- | --- | --- |
| `!help` atau `!menu` | Menampilkan semua menu perintah yang tersedia. | `!menu` |
| `!ask <pertanyaan>` | Bertanya apa saja kepada asisten AI (Gemini). | `!ask kapan uas?` |
| `!jadwal` | Menampilkan jadwal kuliah untuk hari ini. | `!jadwal` |
| `!jadwal besok` | Menampilkan jadwal kuliah untuk besok. | `!jadwal besok` |
| `!kalender` | Menampilkan kalender akademik dan hari libur nasional. | `!kalender` |
| `!tugas list` | Melihat semua daftar tugas yang tercatat. | `!tugas list` |
| `!tugas tambah <isi> +H JJ.MM` | Menambah tugas baru dengan format deadline (+Hari Jam.Menit). | `!tugas tambah Laporan RL +3 15.30` |
| `!tugas hapus <id>` | Menghapus tugas berdasarkan ID-nya. | `!tugas hapus 3` |
| `!modul` | Menampilkan daftar semua mata kuliah yang memiliki modul. | `!modul` |
| `!modul <kode>` | Menampilkan daftar modul untuk mata kuliah tertentu. | `!modul pdt` |
| `!modul <kode> <nomor>` | Mengambil file/link modul yang diminta. | `!modul pdt 1` |
| `!liburlist` | Melihat daftar matkul yang telah ditandai libur. | `!liburlist` |
| `!yt <link>`, `!tt <link>`, `!ig <link>` | Mengunduh video dari platform yang dipilih. | `!yt https://youtube.com/watch?v=...` |
| `!idgrup` | Menampilkan ID dari grup tempat perintah dikirim. | `!idgrup` |

### Perintah Khusus Admin/Owner

| Perintah | Deskripsi | Akses |
| --- | --- | --- |
| `!status` | Menampilkan status lengkap VPS (CPU, RAM, Disk, Uptime). | Admin/Owner |
| `!cpu`, `!memory`, `!disk` | Menampilkan info spesifik dari komponen VPS. | Admin/Owner |
| `!reboot` | Merestart server/VPS. | Admin/Owner |
| `!update` | Menjalankan `apt update && apt upgrade` pada server. | Admin/Owner |
| `!upload <kode>` | (Sebagai caption dokumen) Mengunggah file modul ke folder matkul. | Admin/Owner |
| `!modul hapus <kode> <nomor>` | Menghapus file modul dari server. | Admin/Owner |
| `!liburkan <matkul> <YYYY-MM-DD>`| Menandai matkul sebagai libur pada tanggal tertentu. | Admin/Owner |

## 🔧 Panduan Kustomisasi & Modifikasi

Ingin menyesuaikan bot? Berikut panduan untuk setiap file penting.

-   #### `config.js`
    -   **Peran**: Pusat konfigurasi. Semua pengaturan global ada di sini.
    -   **Kustomisasi**: Ubah `owner`, `groupIds`, dan jadwal cron di `reminderSettings` sesuai kebutuhan Anda.

-   #### `index.js`
    -   **Peran**: File utama yang menjalankan bot, menangani koneksi, dan mengarahkan perintah ke *handler* yang tepat.
    -   **Kustomisasi**: Untuk menambah perintah baru, tambahkan blok `if (cmd === 'perintahbaru') { ... }` di dalam listener `messages.upsert`.

-   #### `commands/akademik.js`
    -   **Peran**: Mengelola semua logika terkait jadwal dan kalender.
    -   **Kustomisasi**: Ubah fungsi `formatJadwal` dan `formatKalender` untuk menyesuaikan tampilan pesan balasan. Pastikan struktur `jadwal.json` dan `kalender.json` cocok.

-   #### `commands/tugas.js`
    -   **Peran**: Mengelola logika CRUD (Create, Read, Update, Delete) untuk tugas.
    -   **Kustomisasi**: Jika ingin format input `!tugas tambah` yang berbeda, sesuaikan ekspresi reguler (regex) di dalam fungsi `addTugas`.

-   #### `commands/reminder.js`
    -   **Peran**: Berisi template pesan dan logika untuk semua jenis reminder otomatis.
    -   **Kustomisasi**: Modifikasi teks pengingat pagi, tugas, atau jadwal sebelum kelas di file ini. Anda juga bisa mengubah kondisi pengiriman reminder (misalnya dari 15 menit menjadi 30 menit).

-   #### `commands/modul.js`
    -   **Peran**: Mengatur sistem manajemen modul perkuliahan.
    -   **Kustomisasi**: **Bagian terpenting** adalah objek `matkulMap`. Sesuaikan `kode` mata kuliah dengan `nama folder` yang sesuai di direktori `data/modul/`.

-   #### `commands/gemini.js`
    -   **Peran**: Menghubungkan bot dengan Google Gemini API dan membangun prompt.
    -   **Kustomisasi**: Untuk membuat AI lebih pintar, tambahkan lebih banyak konteks ke dalam `contextPrompt`. Anda juga bisa mengatur panjang memori percakapan dengan mengubah nilai di `resetChatHistoryIfNeeded`.

-   #### `utils/cron.js`
    -   **Peran**: Menginisialisasi semua *cron job* dari `config.js`.
    -   **Kustomisasi**: Jika Anda menambah tugas otomatis baru, daftarkan di sini dengan `cron.schedule()`.

## 📄 Lisensi

Proyek ini dilisensikan di bawah [Lisensi ISC](https://opensource.org/licenses/ISC).
