# CoDa - Your AI Coding Companion for VS Code

![CoDa Icon](./media/coda-icon.png)

**CoDa** adalah asisten AI yang terintegrasi langsung di dalam Visual Studio Code, ditenagai oleh model AI canggih dari Google. CoDa dirancang untuk menjadi co-pilot Anda, membantu Anda mengobrol tentang ide, memperbaiki kode yang error, dan meningkatkan produktivitas Anda tanpa harus meninggalkan editor.

---

## Fitur Utama

CoDa hadir dengan serangkaian fitur yang dirancang untuk mempercepat alur kerja pengembangan Anda:

### 1. 💬 **AI Chat di Sidebar**
Buka sidebar CoDa untuk memulai percakapan interaktif. Anda bisa:
- **Diskusi Konsep:** Tanyakan tentang arsitektur, pola desain, atau cara kerja sebuah teknologi.
- **Debugging Kode:** Tempelkan potongan kode langsung di chat untuk mendapatkan analisis dan perbaikan.
- **Brainstorming:** Cari ide untuk nama variabel, fungsi, atau bahkan seluruh proyek.

### 2. 💡 **Perbaikan Cepat (Quick Fix)**
Temukan error di kode Anda? Cukup seleksi blok kode yang bermasalah, dan sebuah ikon lampu bohlam akan muncul. Klik dan pilih **"CoDa: Fix this code"** untuk mendapatkan saran perbaikan.

### 3. ✨ **Tampilan Perbandingan (Diff View)**
Alih-alih langsung mengubah kode Anda, CoDa akan menampilkan perbaikan dalam tampilan *diff* (perbandingan) berdampingan. Anda punya kendali penuh untuk menerima atau menolak perubahan, persis seperti pengalaman menggunakan GitHub Copilot.

---

## Setup & Konfigurasi

Hanya butuh dua langkah untuk memulai:

1.  **Instal Ekstensi:** Cari **"CoDa"** di Visual Studio Marketplace dan klik **Install**.
2.  **Atur API Key:**
    * Buka **Settings** di VS Code (`Ctrl/Cmd + ,`).
    * Cari **`CoDa`**.
    * Masukkan **Google Gemini API Key** Anda di kolom yang tersedia. Anda bisa mendapatkan API Key dari [Google AI](https://aistudio.google.com/apikey).

---

## Cara Menggunakan

### Mengobrol dengan CoDa
1.  Klik ikon CoDa di **Activity Bar** (sidebar paling kiri).
2.  Panel chat akan terbuka.
3.  Ketik pesan Anda di bagian bawah dan tekan Enter.

### Memperbaiki Kode
1.  Buka berkas kode Anda.
2.  **Seleksi** bagian kode yang ingin diperbaiki.
3.  Klik **ikon lampu bohlam** yang muncul di samping, atau tekan `Ctrl + .` (`Cmd + .` di Mac).
4.  Pilih **"CoDa: Fix this code"** dari menu popup.
5.  Tinjau perbaikan di tab *diff* yang baru, lalu tutup untuk kembali ke editor Anda.

---

Selamat *ngoding* dengan lebih cerdas bersama CoDa! 🚀