# 🗺️ IRONPIXELS — Project Roadmap & Feature Status

> **Dokumen Tracking Pengembang & Milestones Fitur IronPixels**  
> Dokumen ini mencatat seluruh item pekerjaan, arsitektur sistem gamifikasi gym, status persistensi Supabase DB, mekanik RPG retro, dan peningkatan pengalaman pengguna (*User Experience*).

---

## 📊 Status Ringkasan Roadmap

- [x] **Phase 1: Keamanan & Integritas Data Server (COMPLETED)**
- [x] **Phase 2: Persistensi Database & Akurasi Workout Log (COMPLETED)**
- [x] **Phase 3: Peningkatan UX Gym Tracking Industri (COMPLETED)**
- [x] **Phase 4: Mekanik Game RPG & Realtime Multiplayer Co-Op (COMPLETED)**
- [x] **Phase 5: Maintenance, Dokumentasi & Verifikasi Kode (COMPLETED)**

---

## 🏛️ Arsitektur & Pencapaian Fitur per Fase

### 🛡️ Phase 1: Keamanan & Integritas Data Server
* **1.1. Auth Verification & Anti-Exploit**:
  - Validasi sesi Supabase Auth wajib di seluruh route API (`/api/combat/attack`, `/api/combat/boss`, `/api/inventory/equip`, `/api/shop/gacha`, dll.).
  - Mengeliminasi fallback dummy UUID agar tidak ada manipulasi data antar user.
* **1.2. Server-Authoritative RVS & Volume Calculations**:
  - Modul autoritatif `src/lib/workoutCalculations.ts` untuk menghitung **Repetition Volume Score (RVS)** dan **Total Volume (kg)** langsung di server.
  - Mencegah manipulasi client-side RVS damage saat pelaporan sesi gym.
* **1.3. Atomic Gacha Transaction (CAS & Supabase RPC)**:
  - Eksekusi transaksi peti void gacha dengan atomic Compare-And-Swap di database Supabase untuk mencegah duplikasi item atau saldo gold negatif akibat double-clicking.

---

### 💾 Phase 2: Persistensi Database & Akurasi Workout
* **2.1. CAS Profile Stat Allocation**:
  - Endpoint `PATCH /api/user/profile` dengan optimistic UI updates dan server-side CAS validation untuk alokasi AP ke `STR`, `AGI`, `VIT`, `LUK`.
* **2.2. Filter Completed Sets Only**:
  - Form tracker workout hanya menghitung set latihan yang memiliki status `completed: true`.
  - Peringatan dialog retro visual jika ada set yang belum dicentang selesai sebelum submit.
* **2.3. Background-Resilient Timestamp Rest Timer**:
  - Model rest timer berbasis `targetEndTime = Date.now() + durationMs`.
  - Timer tetap berjalan akurat di latar belakang saat layar ponsel terkunci atau pengguna berpindah aplikasi gym lain via event listener `visibilitychange`.
  - Pelacakan durasi riil sesi latihan dari awal hingga akhir.

---

### 🏋️ Phase 3: Peningkatan UX Gym Tracking (Standar Hevy / Strong)
* **3.1. Previous Session Ghost Values & ⚡ AUTOFILL**:
  - Placeholder input beban & reps otomatis menampilkan nilai dari sesi latihan terakhir (`LAST: 60kg × 10`).
  - Tombol aksi `⚡ AUTOFILL` satu klik untuk menyalin beban dan reps sesi sebelumnya secara instan dengan efek suara retro.
* **3.2. Manajemen Riwayat Latihan (Delete Session)**:
  - Endpoint autoritatif `DELETE /api/workout/history` dengan RLS policy database `workout_sessions_delete_own`.
  - Modal konfirmasi retro dengan rincian sesi (tanggal, volume, RVS damage) dan proteksi aksi ireversibel.
* **3.3. Toggle Satuan Beban Dinamis (KG / LBS)**:
  - Helper matematis presisi di `src/lib/unitConversion.ts` (`1 kg = 2.20462 lbs`).
  - Switch selector neon `[ KG | LBS ]` pada form latihan dan daftar riwayat workout.
  - Penyimpanan preferensi satuan di kolom `weight_unit` tabel `profiles` Supabase.
  - Perhitungan authoritative RVS tetap mengacu pada basis canonical KG untuk menjaga keseimbangan game balance.

---

### ⚔️ Phase 4: Mekanik Game RPG & Realtime Multiplayer
* **4.1. Hukuman Kematian (Death Penalty & Dual Revive System)**:
  - Layar nisan retro pixel `TombstoneModal` jika HP hero menyentuh `0 HP` akibat penalti harian bolos gym (*Demon Lord Ignis*) atau pertarungan dungeon.
  - **Opsi 1 (Free & Core Loop Gamifikasi)**: Menyelesaikan 1 sesi gym mengangkat beban membangkitkan hero secara gratis dengan **100% Max HP**.
  - **Opsi 2 (Instant Buy via 500 Gold)**: Endpoint `POST /api/user/revive` untuk membeli Revive Potion seketika.
  - Kunci serangan dungeon dan slot skill saat hero dalam status defeated, disertai banner indikator peringatan.
* **4.2. Supabase Realtime Co-Op Party Raid**:
  - Channel Supabase Realtime WebSocket `party_raid:[party_id]` untuk pertarungan Guild Raid.
  - Zero-latency broadcast serangan antar rekan party (`party_attack`).
  - Floating damage particle dengan nama rekan penyerang di atas kanvas monster (`[USERNAME] SLASH -1,450`).
  - Hit flash monster, efek suara serempak, live raid log, dan sinkronisasi health bar boss tanpa lag database.
  - Indikator koneksi visual neon `🟢 REALTIME CO-OP SYNC ACTIVE`.

---

## 🛠️ Checklist Fitur Utama

```markdown
- [x] 1. Sync Profile Stat Allocation (STR/AGI/VIT/LUK) ke Supabase DB
- [x] 2. Hukuman Kematian (Death State HP=0, Dual Revive: Gym Sweat vs 500 Gold)
- [x] 3. Preset Routine Saver & 1-Click Workout Loader (/api/workout/routines)
- [x] 4. Sell & Dismantle Duplicate Items di Inventory (/api/inventory/sell)
- [x] 5. Supabase Realtime WebSockets untuk Party Raid Live Co-Op (party_raid:[party_id])
- [x] 6. Kalender Latihan Bulanan & Heatmap GitHub-Style Analitik (AnalyticsView.tsx)
- [x] 7. Audio Engine (Chiptune BGM, 8-bit SFX & Haptics di soundEffects.ts)
- [x] 8. Server-Authoritative RVS & Volume Calculation (workoutCalculations.ts)
- [x] 9. Background-Resilient Rest Timer (targetEndTime & visibilitychange)
- [x] 10. Previous Session Ghost Values & ⚡ AUTOFILL (WorkoutTrackerForm.tsx)
- [x] 11. Delete Workout Session dengan Retro Confirmation Modal & RLS Supabase
- [x] 12. Toggle Satuan Beban KG / LBS dengan Persistensi Server (unitConversion.ts)
```

---

*Dokumen ROADMAP.md ini diperbarui secara berkala sesuai dengan siklus rilis dan arsitektur kode aktif IronPixels.*
