# Mallorca Golf Tour

En enkel, mobilanpassad app för en privat golftour (4–20 deltagare):
leaderboard, ronder, Longest Drive, Closest to Pin och statistik — utan
inloggning för spelarna, med ett PIN-skyddat adminläge för att registrera
resultat.

Se [ARCHITECTURE.md](ARCHITECTURE.md) för produktarkitektur, databasmodell,
ER-diagram och projektstruktur, [MVP.md](MVP.md) för byggordning, och
[design/wireframes.html](design/wireframes.html) för designsystemet och de
mobila wireframes koden bygger på (öppna filen direkt i en webbläsare).

## 1. Skapa Supabase-projektet

1. Gå till [supabase.com](https://supabase.com) och skapa ett nytt projekt
   (gratisnivån räcker gott för 4–20 spelare).
2. Öppna **SQL Editor** i Supabase-dashboarden.
3. Klistra in och kör innehållet i
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
4. (Valfritt men rekommenderat för att se något direkt) klistra in och kör
   [`supabase/migrations/0002_seed.sql`](supabase/migrations/0002_seed.sql) —
   lägger in de fem spelarna, de tre ronderna och resultatet från
   turneringsaffischen. Redigera gärna filen först om ni redan vet era
   riktiga banor/datum.
5. Under **Project Settings → API**, kopiera:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (håll hemlig — sätts
     bara i serverns miljövariabler, aldrig i klientkod)

## 2. Konfigurera appen

```bash
cp .env.example .env.local
```

Fyll i de tre Supabase-värdena ovan, samt:

- `ADMIN_PIN` — koden ni delar med den/de som ska registrera resultat.
- `ADMIN_SESSION_SECRET` — en lång slumpad sträng. Generera en med:

```bash
openssl rand -hex 32
```

## 3. Kör lokalt

Kräver Node.js 18.18+ (20 LTS rekommenderas).

```bash
npm install
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000) — helst i mobilens
webbläsare (eller webbläsarens mobilläge) eftersom appen är byggd mobile-first.

## 4. Deploya till Vercel

1. Pusha repot till GitHub.
2. Importera det på [vercel.com/new](https://vercel.com/new).
3. Lägg till samma miljövariabler som i `.env.local` under
   **Project Settings → Environment Variables**.
4. Deploya. Dela länken med gruppen.

## Admin-läge

Gå till `/admin`, ange PIN-koden (samma som `ADMIN_PIN`). Sessionen är giltig
i 12 timmar per enhet. Från adminpanelen kan ni:

- Skapa/redigera ronder (bana, datum, tee time, status)
- Registrera resultat (brutto, handicap → netto räknas automatiskt)
- Registrera Longest Drive och Closest to Pin
- Ändra poängsystemet (poäng per placering)

Alla ändringar syns direkt hos alla andra öppna telefoner via Supabase
Realtime — ingen behöver dra ner för att uppdatera.

## Teknik

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS ·
Supabase (Postgres, Row Level Security, Realtime) · Vercel
