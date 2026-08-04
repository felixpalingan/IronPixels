# 🗺️ IRONPIXELS — Project Roadmap & Feature Checklist

> **Dokumen Tracking Pengembang & Milestones Fitur IronPixels**  
> Dokumen ini mencatat seluruh item pekerjaan, fitur sementara (mock/in-memory) yang perlu dipindahkan ke Supabase DB, mekanik game yang perlu ditambahkan, serta peningkatan pengalaman pengguna (*User Experience*).

---

## 📊 Status Ringkasan Roadmap

- [x] **Phase 1: Core Engine & Retro Pixel Visuals (COMPLETED)**
- [x] **Phase 2: Infinite Dungeon Floor System & Dual Lobbies (COMPLETED)**
- [x] **Phase 3.1: Persistensi Data Party, Friends & Leaderboard DB (COMPLETED)**
- [ ] **Phase 3.2: Persistensi Profile Stat Allocation & Realtime Co-Op (IN PROGRESS)**
- [ ] **Phase 4: Mekanik Game Lanjutan (Death Penalty, Routine Saver, Item Sell/Dismantle)**
- [ ] **Phase 5: Analitik Latihan, Audio SFX Retro & Polish**

---

## 🔍 Hasil Audit End-to-End Alur Kode (Current Incomplete / Missing Features)

Berikut adalah daftar **fitur yang masih bolong / butuh disempurnakan** berdasarkan analisis alur kode dari awal ke akhir (*End-to-End Audit*):

---

### 🎯 1. Profile Stat Allocation DB Persistence (Stat Point Sync)
* **Masalah / Alur Kode**: Saat pemain menaikkan stat `STR`, `AGI`, `VIT`, atau `LUK` di `DashboardLayout.tsx` (`handleUpgradeStat`), poin AP berkurang dan stat bertambah di `localStorage`, namun **belum ada API `POST/PATCH /api/user/profile`** untuk menyimpan perubahan `str`, `agi`, `vit`, `luk`, dan `available_ap` secara permanen ke tabel `profiles` Supabase.
* **Solusi**: Tambahkan endpoint API update stat profil & sync otomatis ke Supabase.

---

### 💀 2. Hukuman Kematian (Death Penalty & Revive System)
* **Masalah / Alur Kode**: Ketika HP Hero berada di bawah 20% muncul indikator merah berkedip. Namun jika HP benar-benar menyentuh **0 HP** (akibat *daily boss penalty* saat bolos gym atau serangan boss), Hero belum memasuki status khusus **DEFEATED / UNCONSCIOUS**.
* **Fitur Yang Diperlukan**:
  - **Death Screen Modal**: Tampilan layar kematian dengan animasi retro tombstone.
  - **50% Gold Penalty**: Pemotongan saldo Gold sebesar 50% saat karakter mati.
  - **Streak Wipeout**: Pengurangan *workout streak* jika bolos latihan fisik secara beruntun.
  - **Revive System**: Pilihan kebangkitan dengan meminum *Elixir of Life* dari Shop atau menyelesaikan 1 sesi latihan fisik (*Gym Workout Revive*).

---

### 📋 3. Preset Routine Saver & 1-Click Workout Loader
* **Masalah / Alur Kode**: Di `WorkoutTrackerForm.tsx`, pengguna harus memasukkan nama latihan, set, reps, dan beban satu per satu dari awal setiap kali gym.
* **Fitur Yang Diperlukan**:
  - **Tombol "Save as Preset Routine"**: Menyimpan kombinasi latihan favorit (contoh: *Push Day*, *Pull Day*, *Leg Day*).
  - **Dropdown 1-Click Routine Loader**: Memuat otomatis daftar gerakan, target set, dan beban standar tanpa perlu input manual ulang.

---

### 💰 4. Sistem Jual & Dismantle Item (Inventory Management)
* **Masalah / Alur Kode**: Di `BlacksmithShop.tsx` dan `InventoryGrid.tsx`, pengguna bisa membuka gacha peti dan memasang gear, namun item duplikat berlebih tidak bisa diapa-apakan.
* **Fitur Yang Diperlukan**:
  - **Sell Item for Gold**: Menjual perlengkapan duplikat / Common / Rare yang tidak dipakai menjadi Gold.
  - **Dismantle Item System**: Melebur item duplikat menjadi *Mana Shards / Crafting Dust* untuk material upgrade perlengkapan utama.

---

### 📡 5. Supabase Realtime WebSockets (Party Raid Live Co-Op)
* **Masalah / Alur Kode**: Di `CombatArena.tsx`, mode Party Raid menampilkan anggota party pada panggung, namun kalkulasi damage masih dipicu secara lokal di layar masing-masing.
* **Fitur Yang Diperlukan**:
  - **Realtime Damage Broadcast**: Integrasi `supabase.channel("party_raid")` agar saat Anggota A menembakkan skill, angka *damage* & efek visual langsung muncul secara *live real-time* di HP/layar Anggota B.
  - **Live Boss HP Bar**: HP Bar monster Party Raid ter-update serentak secara instan di layar seluruh anggota party yang sedang online.

---

### 📅 6. Kalender Latihan Bulanan & Grafik Tren RVS/Volume
* **Masalah / Alur Kode**: `WorkoutHistoryList.tsx` menampilkan riwayat latihan dalam bentuk daftar kartu sederhana.
* **Fitur Yang Diperlukan**:
  - **Workout Calendar View**: Tampilan kalender bulanan dengan tanda warna/badge pada tanggal-tanggal di mana pengguna mencatatkan sesi gym.
  - **RVS & Volume Progress Chart**: Visualisasi grafik garis (*Recharts*) untuk melihat pertumbuhan Total Volume Angkatan (kg) dan akumulasi RVS harian/mingguan.

---

### 🔊 7. Audio Engine & Sound Effects (SFX) Retro 8-Bit
* **Masalah / Alur Kode**: Seluruh interaksi tombol, serangan skill, dan gacha masih hening (*silent*).
* **Fitur Yang Diperlukan**:
  - **Chiptune BGM**: Musik latar RPG retro 8-bit untuk Dungeon & Hub dengan toggle mute/unmute.
  - **8-Bit SFX**: Suara tebasan pedang, critical hit, terompet kemenangan floor boss, dan efek denting gacha.

---

## 🛠️ Summary Checklist Fitur (Urutan Prioritas Pengerjaan)

```markdown
- [ ] 1. Sync Profile Stat Allocation (STR/AGI/VIT/LUK) ke Supabase DB
- [ ] 2. Hukuman Kematian (Death State HP=0, -50% Gold penalty, Revive)
- [ ] 3. Preset Routine Saver & 1-Click Workout Loader
- [ ] 4. Sell & Dismantle Duplicate Items di Inventory
- [ ] 5. Supabase Realtime WebSockets untuk Party Raid Live Co-Op
- [ ] 6. Kalender Latihan Bulanan & Grafik Tren Analitik
- [ ] 7. Audio Engine (Chiptune BGM & 8-bit SFX)
```

---

*Dokumen ROADMAP.md ini diperbarui berdasarkan hasil audit alur kode end-to-end IronPixels.*
