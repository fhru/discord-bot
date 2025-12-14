# Product Requirements Document (PRD)

## 1. Ringkasan Produk

**Nama Produk:** Discord Script Sales Bot

**Tujuan Utama:**
Menyediakan sistem terpusat berbasis Discord untuk menjual script secara otomatis, aman, dan terkontrol, mencakup registrasi user, manajemen balance, pembelian script, pengelolaan lisensi (Lucifer Key), serta pencatatan transaksi dan log.

Bot ini ditujukan untuk:

- Mengurangi intervensi manual admin
- Meningkatkan kecepatan dan akurasi transaksi
- Menyediakan pengalaman pembelian yang jelas dan konsisten bagi user

---

## 2. Target User & Stakeholder

### 2.1 Target User

- **Admin**: Pemilik sistem / pengelola server Discord
- **User**: Pembeli script

### 2.2 Stakeholder

- Owner / Developer Bot
- Platform Discord
- Payment provider (Saweria)
- Aplikasi pihak ketiga (Lucifer Executor)

---

## 3. Ruang Lingkup Proyek

### 3.1 In-Scope

- Bot Discord berbasis slash command dan button interaction
- Database SQLite
- Sistem registrasi user
- Sistem balance dan top-up
- Sistem pembelian script
- Integrasi log Saweria (listener channel)
- Panel embed interaktif (auto-update)
- Manajemen role & akses channel

### 3.2 Out-of-Scope

- Web dashboard eksternal
- Multi-currency selain IDR
- Refund otomatis
- Integrasi payment gateway selain Saweria

---

## 4. Arsitektur Tingkat Tinggi

- **Client**: Discord User / Admin
- **Bot**: Discord Bot (Slash Command + Button + Modal)
- **Database**: SQLite
- **External Input**: Channel Saweria Log

---

## 5. Skema Database

### 5.1 users

- id (PK)
- name
- discord_id
- username
- growid
- balance
- created_at

### 5.2 settings

- id (PK)
- key
- value

Digunakan untuk konfigurasi dinamis seperti:

- dl_price
- add_key_price
- log_channel
- balance_log_channel
- transaction_log_channel
- world_name
- world_owner
- saweria_channel

### 5.3 scripts

- id (PK)
- name
- code
- link
- price
- role_id
- is_available
- download_link

### 5.4 lucifer_key

- id (PK)
- discord_id (FK → users.discord_id)
- script_code (FK → scripts.code)
- lucifer_username
- created_at

### 5.5 transactions

- id (PK)
- script_id (FK → scripts.id)
- discord_id (FK → users.discord_id)
- total_amount
- status
- created_at

### 5.6 active_panels

- id (PK)
- guild_id
- channel_id
- message_id
- created_at

Digunakan untuk auto-update embed panel setiap 1 menit.

---

## 6. Functional Requirements

### 6.1 Global Rules

- Semua respon bot menggunakan **Embed Message**
- Warna utama embed: **Hijau Neon**
- Emoji minimal: 🔸 ◽ 🔹
- Tidak ada command yang dapat dijalankan melalui DM
- Slash command hanya tampil sesuai role (admin / user)
- Layout panel script: **3 kolom per baris**

---

### 6.2 Admin Flow & Features

#### User Management

- CRUD users via slash command
- View & modify balance user
- Konversi otomatis DL → IDR

#### Settings Management

- CRUD settings
- Command khusus:

  - /rate set|get
  - /world set

#### Script Management

- CRUD scripts
- Set availability script
- Assign role & download channel

#### Lucifer Key Management

- CRUD lucifer_key

#### Panel Management

- Create embed panel berisi daftar script
- Button: Buy, Register, How To Buy, My Info, Add Key
- Panel otomatis disimpan di active_panels
- Auto-update setiap 1 menit

#### Moderation Tools

- Mass delete channel berdasarkan prefix
- Mass delete message
- Delete message berdasarkan mention tertentu

---

### 6.3 User Flow & Features

#### Registrasi

- User wajib register sebelum akses fitur lain
- Registrasi via button Register

#### Informasi User

- My Info (embed)
- Balance
- GrowID
- Total Lucifer Key
- Tanggal registrasi

#### Balance & Deposit

- Cek balance
- Cek world deposit
- Cek info Saweria
- Balance log

#### Lucifer Key

- Lihat lucifer key yang dimiliki
- Tambah lucifer key mandiri (biaya dari settings)

#### Leaderboard

- Top balance
- Top spending

---

## 7. Flow Pembelian Script

1. User registrasi
2. User top-up (DL / Saweria)
3. Balance bertambah
4. User klik Buy Script
5. Pilih script via dropdown
6. Input lucifer username (modal)
7. Konfirmasi transaksi
8. Balance dikurangi
9. Role diberikan
10. Akses channel download
11. Log transaksi dikirim
12. DM konfirmasi ke user

---

## 8. Flow Auto Add Balance via Saweria

1. Bot listen channel Saweria
2. Mendeteksi format pesan: **<amount> From <GrowID>**
3. Match GrowID ke users.growid
4. Tambah balance
5. Kirim balance log

---

## 9. Logging & Audit

- Balance log channel
- Transaction log channel
- Saweria log channel

Setiap log menggunakan embed dengan format konsisten.

---

## 10. Non-Functional Requirements

- Database: SQLite
- Response time < 2 detik
- Error handling jelas dan informatif
- Tidak ada hardcoded config (gunakan settings)
- Mudah dikembangkan (modular command handler)

---

## 11. Risiko & Mitigasi

| Risiko                | Mitigasi               |
| --------------------- | ---------------------- |
| Salah parsing Saweria | Regex & validasi ketat |
| Balance mismatch      | Logging & audit trail  |
| Abuse command         | Role-based permission  |
| Data corruption       | Backup SQLite berkala  |

---

## 12. Milestone Awal (Estimasi)

1. Setup bot & database – 1 hari
2. Core user & balance – 2 hari
3. Script & purchase flow – 2 hari
4. Saweria listener – 1 hari
5. Panel & auto update – 1 hari
6. Testing & hardening – 1–2 hari

---

## 13. Definition of Done

- Semua flow admin & user berjalan
- Tidak ada command bocor ke role yang salah
- Semua transaksi tercatat
- Panel auto-update stabil
- Error ditangani dengan embed informatif

---

**Dokumen ini menjadi acuan utama implementasi dan pengembangan bot.**
