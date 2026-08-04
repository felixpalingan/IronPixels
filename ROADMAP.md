# 🗺️ IRONPIXELS — Project Roadmap & Feature Checklist

> **Dokumen Tracking Pengembang & Milestones Fitur IronPixels**  
> Dokumen ini mencatat seluruh item pekerjaan, fitur sementara (mock/in-memory) yang perlu dipindahkan ke Supabase DB, mekanik game yang perlu ditambahkan, serta peningkatan pengalaman pengguna (*User Experience*).

---

## 📊 Status Ringkasan Roadmap

- [x] **Phase 1: Core Engine & Retro Pixel Visuals (COMPLETED)**
- [x] **Phase 2: Infinite Dungeon Floor System & Dual Lobbies (COMPLETED)**
- [ ] **Phase 3: Persistensi Supabase DB & Realtime Engine (IN PROGRESS)**
- [ ] **Phase 4: Mekanik Game Lanjutan (Death Penalty, Routine Saver, Item Sell/Dismantle)**
- [ ] **Phase 5: Analitik Latihan, Audio SFX Retro & Polish**

---

## 🎯 Phase 3: Persistensi Database Supabase & Realtime Multiplayer

### 3.1. Persistensi Data Party & Leaderboard
- [x] **Supabase Party Table Integration**: Memindahkan state Guild Party dari server in-memory (`let currentPartyState`) ke tabel PostgreSQL `Party` & `Party_Members` Supabase agar pembuatan party, edit nama, role (leader, co_leader, member), & roster 10 anggota tersimpan secara permanen.
- [x] **100% Dynamic Leaderboard**: Menghubungkan 6 tab leaderboard murni dari query tabel `profiles` dan `Party` Supabase (menggunakan cached real data saat offline/disconnected).
- [x] **Persistensi Table Pertemanan (`friends`)**: Menyimpan relasi pertemanan, permintaan terkirim, dan konfirmasi pertemanan ke Supabase DB.
- [x] **Persistensi Highest Floor**: Meng-update kolom `max_floor` pada profil Supabase & `total_party_floor` pada party setiap kali Hero menamatkan floor baru di Solo Dungeon maupun Party Raid.

### 3.2. Supabase Realtime WebSockets (Party Raid Live Co-Op)
- [ ] **Realtime Damage Broadcast**: Mengintegrasikan `Supabase Realtime Subscription` (WebSocket) di arena **Party Raid** sehingga saat Anggota A menembakkan skill, angka *damage* & efek partikel langsung muncul *live real-time* di layar Anggota B.
- [ ] **Live Party Boss HP Bar**: HP Bar monster Party Raid ter-update secara instan dan sinkron di layar seluruh anggota party yang sedang *online*.

---

## 💀 Phase 4: Mekanik Game Lanjutan & Fitur Kenyamanan

### 4.1. Hukuman Kematian (Death Penalty & Revive System)
- [ ] **Mekanisme Death State (HP = 0)**:
  - Ketika HP Hero menyentuh 0 akibat *daily boss penalty* atau kekalahan pertarungan, Hero memasuki status **DEFEATED / UNCONSCIOUS**.
  - **Hukuman Kematian (Gold Penalty)**: Pemotongan saldo Gold sebesar **50%** saat Hero mati.
  - **Daily Streak Wipeout**: Pengurangan/reset *workout streak* jika pemain bolos latihan fisik secara beruntun.
  - **Mekanisme Kebangkitan (Revive)**: Hero dapat dibangkitkan kembali dengan meminum *Elixir of Full Recovery* dari Shop atau dengan menyelesaikan sesi latihan fisik (*Gym Workout Revive*).

### 4.2. Custom Workout Program & Preset Routine Saver
- [ ] **Penyimpan Rutinitis Latihan (Routine Saver)**:
  - Tombol **"Save as Routine"** di `WorkoutTrackerForm` untuk menyimpan kombinasi latihan favorit (misal: *Push Day*, *Pull Day*, *Leg Day*, *Upper Body Power*).
- [ ] **1-Click Routine Loader**:
  - Dropdown preset pada Workout Tracker untuk mengisi otomatis jenis gerakan, jumlah set, repetisi, dan beban standar tanpa perlu memilih dari awal setiap hari.

### 4.3. Sistem Jual & Dismantle Item (Inventory Management)
- [ ] **Jual Item (Sell for Gold)**:
  - Fitur di Equipment Vault untuk menjual perlengkapan duplikat atau perlengkapan *Common/Rare* yang tidak terpakai menjadi koin Gold.
- [ ] **Lebur Item (Dismantle System)**:
  - Fitur peleburan item duplikat hasil gacha peti menjadi *Crafting Dust / Mana Shards* yang dapat digunakan untuk memperkuat (*upgrade/forge*) perlengkapan utama Hero.

---

## 📈 Phase 5: Analitik Latihan, Audio SFX Retro & Polish

### 5.1. Grafik Tren Analitik & Kalender Latihan
- [ ] **Kalender Riwayat Latihan (Workout Calendar View)**:
  - Tampilan visual kalender bulanan yang memberi tanda warna/badge pada tanggal-tanggal di mana pengguna mencatatkan sesi *gym*.
- [ ] **Grafik Tren Progresi Beban & RVS**:
  - Visualisasi grafik garis (*Chart.js / Recharts*) yang menampilkan pertumbuhan Total Volume Angkatan (kg) dan akumulasi RVS mingguan/bulanan.
  - Format penulisan angka dengan pemisah koma ribuan (contoh: `125,400 kg` total volume).

### 5.2. Audio Engine & Sound Effects (SFX) Retro 8-Bit
- [ ] **Chiptune Background Music (BGM)**:
  - Musik latar khas RPG retro 8-bit untuk suasana Dungeon & The Hub dengan tombol kontrol mute/unmute BGM di header.
- [ ] **Sound Effects (SFX)**:
  - *Slash SFX*: Suara tebasan pedang/serangan saat menekan skill.
  - *Hit SFX*: Efek suara saat monster terkena *critical hit*.
  - *Chest Unboxing SFX*: Suara putaran roda gacha & denting emas saat membuka peti.
  - *Victory Chime*: Suara terompet kemenangan saat menamatkan boss floor.

---

## 🛠️ Ringkasan Tugas Mendatang (Checklist Pengembang)

```markdown
- [ ] Implementasi tabel Supabase PostgreSQL `party` & `friends`
- [ ] Realtime WebSocket serangan Party Raid
- [ ] Hukuman kematian (Death State HP=0, -50% Gold penalty, Revive)
- [ ] Custom Workout Program (Routine Saver & Preset Loader)
- [ ] Item Sell & Dismantle System di Equipment Vault
- [ ] Kalender Riwayat Latihan & Grafik Tren Analitik
- [ ] Audio Engine (Chiptune BGM & 8-bit SFX)
```

---

*Dokumen ROADMAP.md ini dibuat sebagai panduan resmi tracking pengembangan aplikasi IronPixels.*
