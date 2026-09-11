# Thought Challenger

AI yang membantu kamu menguji pikiranmu sendiri, bukan yang selalu membenarkan.

## Tentang

Thought Challenger adalah aplikasi web chat-based yang menantang cara berpikir user secara logis melalui percakapan iteratif ala Socratic questioning. Aplikasi ini mengadaptasi teknik Cognitive Behavioral Therapy (CBT) ke bentuk percakapan ringan.

## Fitur

| Fitur | Deskripsi |
|-------|-----------|
| Socratic Questioning | AI menantang pikiran user dengan pertanyaan kritis yang tajam tapi tidak menyerang pribadi |
| Challenge Level | Pilih intensitas tantangan: Friendly, Logical, atau Aggressive |
| Guardrail System | Otomatis mendeteksi tanda distress dan beralih ke mode suportif |
| Insight Card | Ringkasan Core Belief, Cognitive Bias, dan Reframe di akhir sesi |
| Anonymous Session | Tidak perlu akun, langsung mulai sesi |

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes (serverless) |
| Database | Supabase (PostgreSQL) |
| AI | Google Gemini API |
| Hosting | Vercel |

## Setup Lokal

### Prasyarat

- Node.js 18+
- Akun Supabase (gratis)
- API key Google Gemini (gratis)

### Instalasi

```bash
git clone https://github.com/risuunava/antithes.git
cd antithes
npm install
```

### Environment Variables

Buat file `.env.local` di root project:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
GEMINI_API_KEY=AIzaSy...
```

### Database

Jalankan SQL berikut di Supabase SQL Editor:

```sql
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  challenge_level text default 'logical'
    check (challenge_level in ('friendly','logical','aggressive')),
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

Disable RLS untuk MVP:

```sql
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
```

### Jalankan

```bash
npm run dev
```

Buka http://localhost:3000

## Struktur Project

```
/app
  page.tsx                  - Landing page
  session/[id]/page.tsx     - Halaman chat
  api/start/route.ts        - Buat sesi baru
  api/message/route.ts      - Kirim pesan, dapat balasan AI
/components
  ChatBubble.tsx            - Bubble chat
  ChatInput.tsx             - Input pesan
  ChallengeLevelSelector.tsx - Pilih level tantangan
/lib
  supabaseClient.ts         - Koneksi Supabase
  geminiClient.ts           - Koneksi Gemini API
  guardrail.ts              - Deteksi kata kunci risiko
  prompts.ts                - System prompt per level
/types
  index.ts                  - Tipe TypeScript
```

## Akun Penting

| Layanan | URL | Kebutuhan |
|---------|-----|-----------|
| Supabase Dashboard | https://supabase.com/dashboard | Kelola database, lihat data |
| Google AI Studio | https://aistudio.google.com | Buat/Ganti API key Gemini |
| Vercel Dashboard | https://vercel.com | Deploy ke production |

## Lisensi

Proyek ini dibuat untuk keperluan hackathon.
