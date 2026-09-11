# PLAN.md — Build Plan Detail: Thought Challenger

Referensi: PRD.md. Semua task di bawah mengacu langsung ke fitur/AC yang sudah didefinisikan di PRD — tidak ada penambahan scope baru.

## 0. Struktur Folder (Next.js App Router)
```
/app
  /page.tsx                  → landing/onboarding
  /session/[id]/page.tsx     → halaman chat
  /api/start/route.ts
  /api/message/route.ts
  /api/analyze/route.ts
/components
  ChatBubble.tsx
  ChatInput.tsx
  InsightCard.tsx
  ChallengeLevelSelector.tsx
  ProgressBar.tsx
  AppNav.tsx                → satu komponen, render bottom nav (mobile) atau sidebar (desktop) via Tailwind responsive class
  AppShell.tsx               → wrapper layout: menempatkan AppNav + konten, atur max-width konten di desktop
/lib
  supabaseClient.ts
  geminiClient.ts
  guardrail.ts              → daftar keyword risiko + fungsi check
  prompts.ts                → system prompt & analyze prompt per level
/types
  index.ts                  → tipe Session, Message, InsightResult
```

## 1. Setup Awal (sebelum Hari 1)
- [ ] `npx create-next-app@latest` (TypeScript + Tailwind + App Router)
- [ ] Buat project Supabase baru (free tier, tanpa isi billing) → catat `SUPABASE_URL` & `SUPABASE_ANON_KEY`
- [ ] Jalankan SQL schema dari PRD §7.2 di Supabase SQL editor
- [ ] Ambil Gemini API key dari Google AI Studio (free tier, tanpa kartu kredit) → catat `GEMINI_API_KEY`
- [ ] Buat file `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  GEMINI_API_KEY=
  ```
- [ ] Tambahkan `.env.local` ke `.gitignore` (pastikan tidak ter-commit)
- [ ] Push repo kosong ke GitHub, connect ke Vercel, cek deploy skeleton berhasil (tanpa aktifkan billing apapun)

## 2. Hari 1 — Core Chat Loop (mengacu US-1, US-2, US-3)

### Backend
- [ ] `lib/supabaseClient.ts` — inisialisasi client
- [ ] `lib/geminiClient.ts` — wrapper fetch ke Gemini API (model gratis, mis. `gemini-1.5-flash` atau versi free tier terbaru — cek dokumentasi terkini saat build)
- [ ] `lib/guardrail.ts` — daftar keyword risiko tinggi (spesifik, bukan kata umum) + fungsi `checkGuardrail(text): boolean`
- [ ] `lib/prompts.ts` — export system prompt per `challenge_level` (Friendly/Logical/Aggressive) + versi guardrail-active
- [ ] `POST /api/start` — implement sesuai kontrak PRD §7.3, insert row `sessions`
- [ ] `POST /api/message` — implement sesuai kontrak: guardrail check → ambil histori → build messages array → call Gemini → simpan 2 row (`user`, `ai`) ke `messages` → return reply

### Frontend
- [ ] `app/page.tsx` — landing sederhana (headline + CTA + deskripsi singkat + disclaimer PRD §8)
- [ ] `ChallengeLevelSelector.tsx` — pilih level sebelum mulai (US-5, AC1)
- [ ] `app/session/[id]/page.tsx` — halaman chat: fetch histori awal, render `ChatBubble`, `ChatInput`
- [ ] `ChatBubble.tsx` — style sesuai referensi (AI kiri netral, user kanan oranye lembut, rounded besar)
- [ ] `ChatInput.tsx` — validasi input kosong/terlalu panjang (US-1 AC1, AC3; Edge case §7.4)
- [ ] Loading state saat menunggu respons AI (US-2 AC3) + error state dengan tombol retry (US-2 AC4)

### Definition of Done Hari 1
- User bisa mulai sesi, kirim pesan, dapat balasan AI yang tervalidasi dulu baru menantang, tersimpan di DB, tampil sebagai chat bubble sesuai style.

## 3. Hari 2 — Insight, Guardrail, Level (mengacu US-4, US-5, US-6)

### Backend
- [ ] `POST /api/analyze` — ambil seluruh histori sesi, kirim prompt analyze (PRD §7.3), parse JSON, retry 1x jika gagal, update `sessions` (belief/bias/reframe/status)
- [ ] Perkuat `guardrail.ts`: pastikan keyword list cukup spesifik (hindari false positive kata umum seperti "capek", "lelah" — fokus ke indikasi risiko nyata)
- [ ] Saat guardrail aktif: set `guardrail_triggered = true` di session, switch prompt ke mode suportif untuk sisa sesi (US-6 AC2)

### Frontend
- [ ] `InsightCard.tsx` — 3 sub-card (Core Belief / Bias / Reframe) sesuai style referensi (tipografi besar untuk elemen utama)
- [ ] Tombol "Get Insight" — disabled sampai minimal 1 pertukaran AI selesai (Edge case §7.4)
- [ ] Tangani response error dari `/analyze` dengan pesan ramah, bukan raw error (US-4 AC3)
- [ ] `ProgressBar.tsx` — "Depth of Thinking" (heuristik sederhana: berdasarkan jumlah pertukaran, mis. tiap pertukaran +15–20% sampai cap 90% sebelum insight)

### Testing Guardrail (WAJIB sebelum lanjut Hari 3)
Uji manual minimal 5 skenario kalimat berisiko (tanpa perlu detail eksplisit — cukup pastikan sistem switch ke mode suportif dan tidak melanjutkan tantangan logis). Catat hasil pass/fail di catatan internal tim, bukan di file produk.

### Definition of Done Hari 2
- Insight akhir muncul akurat dari histori aktual, guardrail teruji berfungsi, level tantangan bisa dipilih dan memengaruhi nada AI.

## 4. Hari 3 — Polish UI, BottomNav, Demo Prep

### UI Polish (mengacu PRD §9)
- [ ] Terapkan warna: background cream (#F5F1EA-ish), aksen oranye (#F5813C-ish) via Tailwind config custom
- [ ] `AppNav.tsx` — satu komponen dengan dua varian:
  - Mobile (`flex md:hidden`, posisi `fixed bottom-0`): ikon minimal, item aktif background bulat oranye — sesuai referensi foto.
  - Desktop (`hidden md:flex`, posisi `fixed left-0` full height): sidebar vertikal, ikon + label teks, item aktif background pill oranye.
  - Item navigasi sama persis di kedua varian (Home, History, Chat, Favorit, Settings); hanya 1-2 yang berfungsi penuh untuk MVP demo, sisanya dummy/disabled.
- [ ] `AppShell.tsx` — bungkus tiap halaman: render `AppNav`, beri padding-bottom di mobile (space untuk bottom nav) dan padding-left di desktop (space untuk sidebar), batasi max-width konten utama (~480–600px) agar tetap terasa seperti card app di layar lebar
- [ ] Rounded corner konsisten (16–24px) di semua card
- [ ] Cek kontras warna teks vs background (aksesibilitas dasar)
- [ ] Test breakpoint: resize browser dari mobile → tablet → desktop, pastikan transisi bottom nav ⇄ sidebar mulus di sekitar 768px, tidak ada elemen dobel/hilang

### Demo Prep
- [ ] Siapkan 2 contoh input yang aman & menarik untuk didemokan (bukan kalimat sensitif)
- [ ] Uji end-to-end minimal 3x run-through penuh (start → chat 3-4 giliran → get insight)
- [ ] Pastikan Supabase project tidak dalam status idle/paused sebelum demo (unpause manual jika perlu)
- [ ] Siapkan API key cadangan Gemini jika rate limit tercapai saat demo
- [ ] Tulis `README.md`: masalah, solusi, stack, cara run lokal (`npm install`, isi `.env.local`, `npm run dev`)

## 5. Prompt System (Final)

### System Prompt per Level (`lib/prompts.ts`)
```text
Kamu adalah "Thought Challenger": AI yang membantu user menguji pikirannya sendiri lewat pertanyaan kritis.

Aturan wajib:
1. Selalu validasi singkat (1 kalimat) sebelum bertanya.
2. Lanjutkan dengan SATU pertanyaan tajam yang menguji asumsi/bukti di balik pernyataan user.
3. Jangan beri nasihat langsung kecuali user memintanya.
4. Jawaban singkat: maksimal 2-3 kalimat.
5. Jangan ulangi pertanyaan yang sama dua kali dalam satu sesi.

Level saat ini: {challenge_level}
- friendly: nada hangat, pertanyaan lembut tapi tetap kritis.
- logical: nada netral, fokus pada logika dan bukti.
- aggressive: nada tajam & langsung, TAPI tetap menyerang argumen/logika, BUKAN merendahkan pribadi user.
```

### Guardrail-Active Prompt (override saat guardrail_triggered = true)
```text
PENTING: User menunjukkan tanda distress berat. Nonaktifkan mode challenging.

Aturan mode ini:
1. Validasi perasaan user dengan tulus dan hangat.
2. JANGAN ajukan pertanyaan menantang atau menguji logika.
3. JANGAN mendiagnosis atau memberi saran medis.
4. Dorong user untuk bicara dengan orang terpercaya atau profesional jika merasa berat.
5. Jawaban singkat, hangat, tidak menghakimi.
```

### Analyze Prompt (`/api/analyze`)
```text
Berdasarkan seluruh percakapan berikut, hasilkan HANYA JSON valid tanpa teks tambahan apapun (tanpa markdown code fence):
{
  "belief": "keyakinan inti user, dalam satu kalimat singkat",
  "bias": "nama bias kognitif paling relevan, atau 'tidak terindikasi' jika tidak jelas",
  "reframe": "versi pikiran yang lebih seimbang, 1-2 kalimat, dalam nada mendukung"
}
```

## 6. Environment Variables Checklist
| Key | Sumber | Catatan |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard | Public, aman di client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard | Public, aman di client |
| `GEMINI_API_KEY` | Google AI Studio | JANGAN expose ke client, hanya dipakai di API route server-side |

## 7. Risiko & Mitigasi
| Risiko | Dampak | Mitigasi |
|---|---|---|
| Gemini free tier rate limit saat demo | Demo gagal di tengah | Siapkan API key cadangan; test beban ringan sebelum demo |
| Supabase project idle → auto-pause | Data tidak bisa diakses saat demo | Unpause manual H-1 sebelum demo, cek status pagi hari demo |
| AI terasa terlalu agresif/menyerang pribadi | Kesan buruk ke juri | System prompt eksplisit larang merendahkan pribadi (§5), test manual level "aggressive" |
| Guardrail gagal deteksi kalimat krisis | Risiko keamanan produk | Test manual 5+ skenario (Hari 2), jangan andalkan 100% otomatis, expand keyword list bila perlu |
| JSON output analyze tidak valid | Insight gagal muncul | Retry 1x dengan instruksi lebih tegas + fallback pesan error ramah (bukan raw error) |
| Scope creep menambah fitur di luar PRD | Waktu habis, MVP tidak selesai | Cek ulang setiap fitur baru terhadap PRD sebelum dikerjakan; P2 items (highlight bias) di-skip jika waktu mepet |

## 8. Checklist Final Sebelum Submit
- [ ] Semua env key tidak ter-commit ke repo publik (cek `.gitignore`)
- [ ] Demo flow teruji end-to-end minimal 3x tanpa error
- [ ] Guardrail teruji dan berfungsi
- [ ] README lengkap: masalah, solusi, stack, cara run
- [ ] UI konsisten dengan referensi desain (warna, rounded card, bottom nav)
- [ ] Tidak ada fitur di luar cakupan PRD yang setengah jadi ditinggalkan di UI (hapus atau disable elemen yang belum berfungsi)
