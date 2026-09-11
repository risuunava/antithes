# PRD — Thought Challenger (working title)

## 1. Ringkasan Produk
Aplikasi web chat-based yang menantang cara berpikir user secara logis melalui percakapan iteratif ala Socratic questioning — bukan chatbot curhat yang selalu setuju, dan bukan pula AI yang menyerang tanpa empati.

**One-liner:** "AI yang membantu kamu menguji pikiranmu sendiri, bukan yang selalu membenarkan."

**Kategori hackathon:** AI productivity / mental clarity tool (bukan mental health app — lihat batasan di §8).

## 2. Masalah & Justifikasi
- Orang sering terjebak pada pikiran negatif/overgeneralisasi ("saya tidak cukup pintar", "saya selalu gagal") tanpa ada yang menguji validitas logisnya.
- Kebanyakan AI companion saat ini bersifat validating ("iya-iya aja") sehingga tidak melatih critical thinking.
- Terapi CBT (Cognitive Behavioral Therapy) menggunakan teknik "Socratic questioning" dan "cognitive restructuring" untuk membongkar distorsi pikiran — produk ini mengadaptasi teknik itu ke bentuk percakapan ringan, bukan sebagai pengganti terapi.

## 3. Target User & Persona
**Persona utama — "Mahasiswa Reflektif"**
- Usia 18–28, mahasiswa/fresh graduate/profesional muda.
- Sering overthinking soal kemampuan diri, keputusan karier/akademik.
- Terbiasa pakai AI chat (ChatGPT/Gemini) untuk brainstorming, tapi merasa AI selalu "terlalu baik" dan tidak membantu menguji pikirannya.
- Tidak sedang dalam krisis kesehatan mental akut — pakai app ini untuk refleksi harian ringan, bukan penanganan darurat.

**Bukan target:** orang dalam krisis mental aktif (ada guardrail redirect, lihat §8).

## 4. Tujuan Produk (Goals)
1. User menyelesaikan minimal satu sesi challenge dan mendapatkan insight (belief/bias/reframe) yang terasa relevan dan personal, bukan generik.
2. Interaksi terasa "menantang tapi aman" — juri/user tidak merasa AI toxic atau annoying.
3. Demo end-to-end berjalan mulus dalam waktu < 3 menit.

## 5. Non-Goals (Eksplisit di Luar Cakupan)
- Bukan pengganti terapi/konseling profesional.
- Tidak menyimpan riwayat jangka panjang lintas banyak sesi dengan analytics mendalam (cukup per-session).
- Tidak ada sistem autentikasi kompleks (OAuth, dsb) — cukup anonymous session ID.
- Tidak ada monetisasi/paywall di MVP.
- Tidak ada multi-bahasa (fokus Bahasa Indonesia dulu, tapi prompt tetap bisa jawab sesuai bahasa input user).

## 6. User Stories & Acceptance Criteria

### US-1: Memulai sesi
**Sebagai** user, **saya ingin** menulis satu pikiran/keyakinan yang mengganggu saya, **agar** saya bisa mulai proses menguji pikiran tersebut.
- AC1: User bisa mengetik teks bebas di input awal (min 5 karakter, max ~500 karakter).
- AC2: Setelah submit, sistem membuat `session` baru di DB dan menyimpan pesan pertama sebagai `role: user`.
- AC3: Jika input kosong atau < 5 karakter, tampilkan validasi ringan tanpa reload halaman.

### US-2: Menerima tantangan dari AI
**Sebagai** user, **saya ingin** AI merespons dengan pertanyaan yang menantang asumsi saya, **agar** saya berpikir lebih dalam.
- AC1: Respons AI selalu diawali validasi singkat (1 kalimat) lalu 1 pertanyaan tajam.
- AC2: Respons maksimal 2–3 kalimat (tidak boleh ceramah panjang).
- AC3: Respons muncul dalam < 5 detik (loading indicator jika lebih lama).
- AC4: Jika API AI gagal/timeout, tampilkan pesan error yang jelas + tombol retry (bukan crash/blank).

### US-3: Loop percakapan dinamis
**Sebagai** user, **saya ingin** melanjutkan dialog dengan AI beberapa kali, **agar** pikiran saya terkuliti lebih dalam.
- AC1: Tidak ada batas step hardcoded; AI menentukan kapan sudah cukup dalam (heuristik: minimal 3 pertukaran sebelum AI boleh menawarkan closing).
- AC2: User tetap bisa mengakhiri sesi kapan saja lewat tombol "Get Insight", walau baru 1 pertukaran.
- AC3: Histori percakapan tersimpan dan ditampilkan sebagai chat bubble (user kanan, AI kiri — atau sesuai style referensi desain).

### US-4: Mendapatkan insight akhir
**Sebagai** user, **saya ingin** melihat ringkasan belief, bias, dan reframe di akhir sesi, **agar** saya punya kesimpulan yang actionable.
- AC1: Klik "Get Insight" memicu API `/analyze` yang mengirim seluruh histori sesi.
- AC2: Output ditampilkan dalam card terpisah dengan 3 bagian jelas: Core Belief, Bias Terindikasi, Reframe.
- AC3: Jika AI gagal menghasilkan JSON valid, sistem retry sekali otomatis; jika tetap gagal, tampilkan pesan error yang sopan (bukan JSON mentah/error teknis ke user).
- AC4: Session status berubah jadi `ended` setelah insight dihasilkan.

### US-5: Memilih level tantangan (P1)
**Sebagai** user, **saya ingin** memilih intensitas tantangan (Friendly/Logical/Aggressive), **agar** pengalaman sesuai kenyamanan saya.
- AC1: Pilihan tersedia sebelum sesi dimulai (default: Logical).
- AC2: Level tersimpan di `sessions.challenge_level` dan memengaruhi system prompt.
- AC3: Level tidak bisa diubah di tengah sesi berjalan (untuk konsistensi nada).

### US-6: Guardrail keamanan (P0 — kritikal)
**Sebagai** user, **jika** saya menunjukkan tanda distress berat/self-harm, **saya ingin** AI berhenti menantang dan beralih suportif, **agar** saya tidak merasa diserang saat rentan.
- AC1: Sistem melakukan keyword/pattern check pada setiap input user sebelum dikirim ke AI sebagai konteks tambahan (basic list kata kunci risiko).
- AC2: Jika terdeteksi, system prompt otomatis switch ke mode suportif (validasi + saran bicara ke orang terpercaya/profesional), tidak lagi mengajukan pertanyaan menantang.
- AC3: Tidak ada diagnosis, tidak ada nasihat medis spesifik — hanya dorongan mencari bantuan.
- AC4: Behavior ini diuji manual dengan minimal 5 skenario kalimat sebelum demo (lihat PLAN.md §Testing).

## 7. Spesifikasi Fungsional Detail

### 7.1 Alur Sistem
```
[Landing/Onboarding] → [Pilih Challenge Level] → [Input pikiran awal]
        ↓
[Chat loop: AI challenge ⇄ User jawab] (dinamis, guardrail aktif tiap giliran)
        ↓
[User klik "Get Insight"] → [API /analyze] → [Card hasil: Belief/Bias/Reframe]
        ↓
[Opsi: Mulai sesi baru]
```

### 7.2 Data Model (Supabase/Postgres)
```sql
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text,                         -- anonymous id (localStorage-generated)
  challenge_level text default 'logical' check (challenge_level in ('friendly','logical','aggressive')),
  status text default 'active' check (status in ('active','ended')),
  guardrail_triggered boolean default false,
  belief text,
  bias text,
  reframe text,
  created_at timestamp default now(),
  ended_at timestamp
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  role text check (role in ('user','ai')),
  content text,
  created_at timestamp default now()
);
```

### 7.3 API Contract

**POST `/api/start`**
Request: `{ "user_id": "anon-xxxx", "challenge_level": "logical" }`
Response: `{ "session_id": "uuid" }`

**POST `/api/message`**
Request: `{ "session_id": "uuid", "message": "Saya tidak cukup pintar" }`
Proses: guardrail check → ambil histori dari DB → susun prompt sesuai `challenge_level` & status guardrail → panggil Gemini → simpan pesan user & AI ke DB.
Response: `{ "reply": "...", "guardrail_active": false }`

**POST `/api/analyze`**
Request: `{ "session_id": "uuid" }`
Proses: ambil seluruh histori → panggil Gemini dengan prompt analyze (output JSON strict) → parse & validasi → simpan ke kolom `sessions.belief/bias/reframe` → update `status = 'ended'`.
Response:
```json
{
  "belief": "string",
  "bias": "string",
  "reframe": "string"
}
```
Error handling: jika parse JSON gagal, retry 1x dengan instruksi lebih tegas ("respond ONLY valid JSON"); jika tetap gagal, response `{ "error": "insight_generation_failed" }` dan frontend tampilkan pesan ramah.

### 7.4 Edge Cases yang Harus Ditangani
| Kasus | Penanganan |
|---|---|
| User spam klik "Get Insight" tanpa ada percakapan | Disable tombol jika belum ada minimal 1 pertukaran AI |
| Input user sangat panjang (>500 char) | Truncate dengan indikator visual, atau tolak dengan pesan validasi |
| Gemini API rate limit tercapai | Tampilkan pesan "AI sedang sibuk, coba lagi sebentar" + tombol retry, jangan expose error teknis |
| Session id tidak valid/expired di reload | Redirect ke landing, mulai sesi baru |
| User kirim pesan kosong/hanya spasi | Blok di frontend sebelum request terkirim |
| Guardrail keyword false positive (kata "capek" dsb, bukan krisis) | Gunakan daftar kata kunci spesifik risiko tinggi, bukan kata umum, untuk kurangi false positive |

## 8. Batasan Keamanan & Etika (WAJIB, tidak bisa dikompromikan saat build)
- AI tidak boleh menantang secara agresif tanpa validasi terlebih dahulu — bahkan di mode "Aggressive", nada tetap tajam pada logika, bukan merendahkan pribadi user.
- Guardrail krisis (US-6) adalah fitur P0, bukan nice-to-have.
- Tidak ada penyimpanan data yang mengarah ke diagnosis kesehatan mental.
- Disclaimer singkat di landing page: "Aplikasi ini untuk latihan berpikir kritis, bukan pengganti konsultasi profesional."

## 9. Desain & UI Style (Referensi Foto)
Gaya visual mengikuti referensi aplikasi nutrisi yang dilampirkan:
- **Warna:** background netral hangat (cream/off-white #F5F1EA-ish), aksen primary oranye (#F5813C-ish) untuk tombol, progress, highlight aktif.
- **Card:** rounded corner besar (16–24px), shadow lembut, padding lega.
- **Tipografi:** angka/insight utama ditampilkan besar & bold (mirip tampilan "1250 kcal" di referensi) — dipakai untuk elemen "Depth of Thinking %" atau ringkasan insight.
- **Navigasi responsif (WAJIB):**
  - **Mobile (< 768px):** bottom navigation ikon minimal (Home, History, Chat/aktif, Favorit, Settings), ikon aktif diberi background bulat oranye — sesuai referensi foto.
  - **Desktop/web (≥ 768px):** sidebar vertikal di kiri layar menggantikan bottom nav, berisi item navigasi yang sama (ikon + label teks), item aktif diberi background bulat/pill oranye konsisten dengan versi mobile. Konten utama (chat) digeser ke kanan sidebar, max-width dibatasi (mis. ~480–600px) agar tidak melebar penuh di layar besar — layout tetap terasa seperti "card app", bukan web app generik.
  - Breakpoint & switching ditangani lewat Tailwind responsive classes (`hidden md:flex` untuk sidebar, `flex md:hidden` untuk bottom nav) — satu komponen navigasi dengan dua varian tampilan, bukan dua komponen terpisah dengan logic berbeda.
- **Header:** judul halaman rata tengah/kiri + maksimal 2 ikon aksi (notifikasi, dsb) — disederhanakan karena app ini tidak butuh search/notification kompleks di MVP. Di desktop, header cukup di area konten utama (sidebar tidak perlu header sendiri).
- **Onboarding/landing:** layout full-image atau gradient lembut + headline besar (mis. "Uji Pikiranmu, Dibedah AI") + CTA pill button gelap solid ("Mulai Sesi") + progress dots jika multi-slide.
- **Chat screen:** bubble AI di kiri (warna netral/putih), bubble user di kanan (aksen oranye lembut), input bar bawah dengan tombol kirim bulat.
- **Insight card:** 3 sub-card kecil (Core Belief / Bias / Reframe) dengan ikon berbeda, disusun vertikal, warna aksen konsisten.

## 10. Metrik Sukses (Demo Hackathon)
- Sesi chat berjalan mulus (loop 3–6 pertukaran) tanpa terasa robotic/template.
- Insight akhir relevan dengan isi percakapan aktual (bukan generik/template kosong).
- Guardrail teruji dan tidak gagal saat demo skenario sensitif.
- UI konsisten dengan referensi desain, terlihat polished untuk juri.
- Layout beradaptasi mulus antara mobile (bottom nav) dan desktop (sidebar) tanpa elemen patah/terpotong.
- Zero error/crash selama demo run-through.

## 11. Stack (Zero-Cost, Tanpa Signup Billing)
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS, deploy ke Vercel (Hobby plan, tanpa kartu kredit).
- **Backend:** Next.js API routes (serverless, tidak perlu server terpisah).
- **AI:** Gemini API free tier (Google AI Studio, tanpa kartu kredit) — hindari OpenRouter karena umumnya minta topup di awal.
- **DB:** Supabase free tier (tanpa kartu kredit; perhatikan auto-pause project jika idle > 7 hari, perlu di-unpause manual sebelum demo).
- **State management ringan:** React state/local storage untuk `user_id` anonim, tidak perlu library tambahan.
