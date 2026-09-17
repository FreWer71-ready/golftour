# Mallorca Golf Tour

En enkel, mobilanpassad app för en privat golftour (4–20 deltagare):
leaderboard, ronder, Longest Drive, Closest to Pin och statistik. Ingen
inloggning — vem som helst i gruppen kan registrera resultat, när som helst,
direkt på respektive sida.

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
   - Har du redan kört `0001_init.sql` en gång tidigare (innan
     "Pågående"-status för ronder fanns)? Kör även
     [`supabase/migrations/0003_round_ongoing_status.sql`](supabase/migrations/0003_round_ongoing_status.sql).
     Nya projekt behöver inte det — det ingår redan i `0001_init.sql`.
5. Under **Project Settings → API**, kopiera:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** (äldre flik) eller **Publishable key**, `sb_publishable_...`
     (nya fliken) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (äldre flik) eller **Secret key**, `sb_secret_...`
     (nya fliken, klicka ögat för att visa den) → `SUPABASE_SERVICE_ROLE_KEY`
     (håll hemlig — sätts bara i serverns miljövariabler, aldrig i klientkod)

## 2. Konfigurera appen

```bash
cp .env.example .env.local
```

Fyll i de tre Supabase-värdena ovan.

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

## Registrera resultat

Ingen adminroll, ingen PIN — vem som helst med länken kan när som helst:

- Skapa/redigera ronder (bana, datum, tee time, status: Kommande/Pågående/Spelad) — på **Ronder**
- Registrera resultat: bruttoslag + handikap in, resultatet (brutto − handikap)
  räknas automatiskt och är det som gäller i leaderboard — på respektive rond
- Registrera Longest Drive och Closest to Pin — på respektive sida
- Ändra poängsystemet (poäng per placering) — länk längst ner på **Ronder**

Alla ändringar syns direkt hos alla andra öppna telefoner via Supabase
Realtime — ingen behöver dra ner för att uppdatera.

## Teknik

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS ·
Supabase (Postgres, Row Level Security, Realtime) · Vercel
