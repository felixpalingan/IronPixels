# **PRODUCT REQUIREMENT DOCUMENT (PRD)**

**Project Name:** \[*IronPixels*\]  
**Document Status:** Final (MVP Scope)  
**Target Platform:** Progressive Web App (PWA) 

## **1\. Project Overview & Background**

Aplikasi *fitness tracker* konvensional seringkali membosankan dan gagal mempertahankan retensi pengguna jangka panjang. Proyek ini bertujuan merevolusi pengalaman *gym* dengan menggabungkan pelacakan angkat beban (*weightlifting*) dengan mekanik game RPG retro. Kami menciptakan ekosistem di mana keringat dan repetisi fisik dikonversi menjadi *progression* karakter di dalam game.  
**Value Proposition:** *"Level up your gains, literally."*  
Mengubah rutinitas *gym* menjadi *dungeon raid* interaktif, di mana konsistensi latihan pengguna menjadi kunci untuk mengalahkan monster, mendapatkan *loot*, dan berkompetisi dengan teman.

## **2\. Target Market**

* **Demografi:** Gen Z dan Milenial.  
* **Psikografi:** Rutin melakukan latihan beban (*weight training*), tidak asing dengan suplemen, memiliki sirkel pertemanan di *gym*, dan menyukai *video game* (terutama RPG/MMORPG).  
* **Behavior:** Sangat termotivasi oleh kompetisi, pamer pencapaian (*Personal Record*), dan *social accountability*.

## **3\. Unique Selling Proposition (USP)**

* **Social-First Dungeon Raids:** Progres *dungeon* diikat pada performa tim (*party*). Teman satu tim harus saling mengingatkan untuk berolahraga agar bos mingguan bisa dikalahkan.  
* **Fair-Play Algorithmic Combat:** Sistem pertempuran tidak murni didasarkan pada beban absolut, melainkan algoritma keadilan yang mempertimbangkan berat badan pengguna dan tingkat kesulitan gerakan.

## **4\. Core Game Mechanics (The "RVS" Engine)**

Untuk memastikan keseimbangan permainan (*game balance*), *damage* dan EXP tidak dihitung mentah, melainkan menggunakan formula **Relative Volume Score (RVS)**:  
**Formula MVP:** Damage \= (Beban / Berat Badan) x Repetisi x Movement Coefficient

| Tier Gerakan | Deskripsi & Contoh | Movement Coefficient |
| :---- | :---- | :---- |
| **Tier A** | Isolation & Small Muscle (Bicep Curl, Lateral Raise) | 2.0 \- 3.0 |
| **Tier B** | Free-Weight Compound (Barbell Squat, Bench Press) | 1.0 \- 1.5 |
| **Tier C** | Machine & Supported (Leg Press, Smith Machine) | 0.5 \- 0.8 |

## **5\. Minimum Viable Product (MVP) Features**

1. **User Authentication & Onboarding:**  
   * Pembuatan akun dasar.  
   * Input data krusial: Berat Badan (wajib untuk kalkulasi RVS).  
   * Pemilihan *Class* awal (Misal: *Warrior*, *Rogue*).  
2. **The Hub (Dashboard Utama):**  
   * Antarmuka 8-bit/16-bit *pixel art*.  
   * Menampilkan Avatar, Status Karakter (Level, EXP, STR, AGI), dan *Equipment* yang sedang dipakai.  
3. **Workout Tracker (Combat Phase 1):**  
   * Sistem *logging* sesi *gym*: Pilih gerakan dari *database*, input Set, Repetisi, dan Beban (Kg).  
   * Tombol *Finish Session* untuk memicu kalkulasi RVS otomatis.  
4. **Semi-Active Battle System (Combat Phase 2):**  
   * Animasi *damage auto-resolve* ke Bos *dungeon* berdasarkan hasil RVS.  
   * *Tactical UI*: Tombol *Skill* manual (dari Senjata/Armor) yang memiliki *cooldown* harian/mingguan (contoh: *skill* pasif tambahan EXP, *skill* aktif *burst damage*).  
5. **Social & Party System:**  
   * Fitur *Add Friend* dan *Leaderboard* sirkel.  
   * Pembuatan *Party* (Maksimal 4-5 orang) untuk berbagi *Health Bar* musuh di bos mingguan.  
6. **Gacha / Blacksmith Shop:**  
   * Sistem *reward*: Gold dari hasil *workout* digunakan untuk membuka *Chest*.  
   * *Loot* berupa Senjata dan Armor yang memberikan *skill* unik.

## **6\. User Flow (End-to-End)**

1. **Download & Login** \-\> User mendaftar, memasukkan berat badan, dan memilih *Class*.  
2. **Join the Party** \-\> User mengundang teman *gym*\-nya untuk masuk ke dalam satu *Party* lewat kode unik.  
3. **Go to Gym** \-\> User membuka aplikasi, menekan *Start Workout*.  
4. **Log Sets** \-\> User melakukan *Bench Press* dan mencatat: 60kg, 10 reps, 3 sets.  
5. **Execute Hit** \-\> Selesai *gym*, user menekan *Finish*. Layar transisi ke gaya *pixel art*, karakter avatar menyerang naga. *Damage* dikalkulasi dari RVS.  
6. **Cast Skill** \-\> Darah bos masih sisa sedikit, user secara manual menekan *skill* "Heavy Cleave" dari pedangnya untuk pukulan penutup. Bos mati.  
7. **Loot & Flex** \-\> User mendapatkan EXP, *Gold*, dan sebuah *Silver Chest*. User membuka kotak, mendapat *Armor* baru, lalu status *damage* MVP-nya otomatis terkirim ke *leaderboard* sirkel teman-temannya.

## **7\. Technical Handoff Notes (For Engineering Team)**

* **Tech Stack & Architecture:** Proyek akan dikembangkan sebagai *Progressive Web App* (PWA) menggunakan **Next.js**. Keputusan ini diambil untuk memangkas waktu *development* MVP dengan satu *codebase* yang bisa didistribusikan secara lintas platform (iOS & Android).  
* **UI/UX & Game Layer:** Mengingat arsitektur berbasis *web*, render elemen *pixel-art*, animasi karakter, dan efek *combat* tidak perlu menggunakan *game engine* terpisah. Tim teknis harus memanfaatkan manipulasi DOM yang efisien, HTML5 Canvas, atau *library* animasi React yang ringan untuk mengeksekusi *sprite sheets* tanpa mengorbankan performa *load time*.  
* **Database & Backend:** Manfaatkan fitur *Server-Side Rendering* (SSR) atau *API routes* bawaan Next.js untuk memastikan sinkronisasi data antar anggota *Party* (*leaderboard*, sisa HP bos) terjadi secara *real-time* atau mendekati *real-time*. Arsitektur tabel harus mendukung relasi antara *User*, *Workout Session*, *Equipment*, dan *Exercise Dictionary* (yang memuat variabel *Movement Coefficient*).  
* **PWA Requirements:** Pastikan konfigurasi *manifest.json* dan *service workers* diset dengan benar agar aplikasi memiliki *icon* yang proper saat diinstal di *Home Screen* pengguna, serta memiliki *caching* dasar untuk *asset* statis (gambar *pixel art* dan UI utama).

