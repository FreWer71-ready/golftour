# Mallorca Golf Tour — arkitektur

## 1. Produktarkitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                        Spelarens telefon                        │
│  Next.js App Router (React Server + Client Components)          │
│  ─ localStorage: valt spelarnamn                                 │
└───────────────┬───────────────────────────────┬─────────────────┘
                │ läsning (anon key)             │ Server Actions
                ▼                                ▼
      ┌───────────────────┐            ┌───────────────────────┐
      │ Supabase Postgres  │◄──────────┤ Next.js Server Actions │
      │ RLS: publikt SELECT│  service   │ (körs på Vercel-servern)│
      │ INSERT/UPDATE: nej │  role key  │ (öppna för alla — ingen│
      └─────────┬──────────┘            │  inloggning krävs)     │
                │                       └───────────────────────┘
                │ postgres_changes (Realtime)
                ▼
      Alla öppna klienter uppdateras automatiskt
```

**Kärnprincip:** ingen inloggning alls — varken för att läsa eller skriva.
Alla `SELECT`-frågor går direkt från webbläsaren till Supabase med den
publika (anon) nyckeln — RLS-policyer tillåter bara läsning. Alla
skrivningar (registrera resultat, skapa rond, osv.) går ändå via Next.js
**Server Actions** som körs på servern och skriver med Supabase
**service role**-nyckeln, som aldrig når klienten — inte för att spärra
vem som får skriva (vem som helst i gruppen får, när som helst), utan för
att hålla service role-nyckeln borta från webbläsaren och validera indata
på ett ställe.

## 2. Databasmodell

| Tabell             | Syfte                                                        |
| ------------------ | ------------------------------------------------------------- |
| `players`          | De 4–20 deltagarna. Bara namn — inget konto, inget lösenord.   |
| `tours`            | En golfresa (t.ex. "Mallorca Golf Tour 2026"). En är `is_active`. |
| `rounds`           | En rond: bana, datum, tee time, status (`upcoming`/`ongoing`/`completed`). |
| `round_scores`     | En spelares brutto/handikap för en rond. `net_score` (resultatet) är en genererad kolumn (`gross - handicap`) — det är den som räknas i leaderboard. |
| `longest_drive`    | En registrering: rond, hål, spelare, längd (valfri).           |
| `closest_to_pin`   | Samma form som ovan, för närmast hål.                          |
| `scoring_rules`    | Poäng per placering för touren (redigerbar av alla på `/scoring`). |

**Beräknade vyer** (aldrig lagrade, kan aldrig hamna i otakt med källdatan):

- `round_scores_ranked` — placering per rond, rankad på nettoscore.
- `round_points` — poäng per spelare/rond, från placering × `scoring_rules`.
- `tour_leaderboard` — totalställning (summa nettoscore över spelade ronder).
- `player_tour_stats` — allt till Statistik-vyn: totalpoäng, vunna ronder,
  LD-/CTP-segrar, snittplacering.

Se [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) för
det körbara schemat och [`0002_seed.sql`](supabase/migrations/0002_seed.sql)
för exempeldata som speglar turneringsaffischen.

## 3. ER-diagram

```mermaid
erDiagram
    TOURS ||--o{ ROUNDS : has
    TOURS ||--o{ SCORING_RULES : defines
    ROUNDS ||--o{ ROUND_SCORES : has
    ROUNDS ||--o{ LONGEST_DRIVE : has
    ROUNDS ||--o{ CLOSEST_TO_PIN : has
    PLAYERS ||--o{ ROUND_SCORES : plays
    PLAYERS ||--o{ LONGEST_DRIVE : wins
    PLAYERS ||--o{ CLOSEST_TO_PIN : wins

    TOURS {
        uuid id PK
        text name
        date start_date
        date end_date
        text location
        boolean is_active
    }
    PLAYERS {
        uuid id PK
        text name UK
    }
    ROUNDS {
        uuid id PK
        uuid tour_id FK
        text course_name
        date round_date
        time tee_time
        text status
        int sort_order
    }
    ROUND_SCORES {
        uuid id PK
        uuid round_id FK
        uuid player_id FK
        int gross_score
        int handicap_strokes
        int net_score "generated"
    }
    LONGEST_DRIVE {
        uuid id PK
        uuid round_id FK
        uuid player_id FK
        int hole
        numeric distance_m "optional"
    }
    CLOSEST_TO_PIN {
        uuid id PK
        uuid round_id FK
        uuid player_id FK
        int hole
        numeric distance_m
    }
    SCORING_RULES {
        uuid id PK
        uuid tour_id FK
        int position
        int points
    }
```

## 4. Resultatregistrering — öppen för alla, inga konton

Det finns ingen adminroll och ingen PIN. Formulären för att skapa/redigera
ronder, registrera resultat, Longest Drive, Closest to Pin och ändra
poängsystemet ligger direkt på de publika sidorna (`/rounds/[roundId]`,
`/longest-drive`, `/closest-to-pin`, `/scoring`) — vem som helst med länken
till appen kan använda dem, när som helst under resan.

Resultatregistreringen är designad kring **brutto in, netto ut**: formuläret
tar emot bruttoslag och handikap per spelare; `net_score` — resultatet som
räknas i leaderboard, placering och statistik — räknas alltid fram av
databasen (`gross_score - handicap_strokes`), aldrig matas in direkt.

Server Actions (`src/app/actions.ts`) körs fortfarande via Supabase
**service role**-nyckeln istället för att låta klienten skriva direkt mot
Postgres. Det handlar inte om åtkomstkontroll (det finns ingen), utan om att
hålla service role-nyckeln borta från webbläsaren och validera indata
(giltiga hål, positiva slag, osv.) på ett ställe innan något sparas.

## 5. Realtidsfunktioner

Varje sida som visar leaderboard, ronder eller awards renderas först som en
**Server Component** (snabb första laddning, fräsch data). En liten client
component, `RealtimeWatcher`, prenumererar sedan på Supabase Realtime
(`postgres_changes`) för `rounds`, `round_scores`, `longest_drive` och
`closest_to_pin`. Så fort någon sparar ett resultat på sin telefon skickar
Postgres en ändringshändelse, `RealtimeWatcher` fångar den och kör
`router.refresh()` — alla andra spelares telefoner uppdateras automatiskt,
utan att någon behöver dra ner för att uppdatera.

## 6. Projektstruktur

```
mallorca-golf-tour/
├── supabase/migrations/       SQL-schema + seed-data
├── src/
│   ├── app/
│   │   ├── layout.tsx         Root layout, typsnitt, PlayerGate
│   │   ├── globals.css        Designtoken (CSS-variabler), Tailwind-lager
│   │   ├── page.tsx           Namnval (om inget namn valt) / redirect
│   │   ├── actions.ts         Alla Server Actions (skapa rond, spara resultat, ...)
│   │   ├── dashboard/         Dashboard: leaderboard, pågående/nästa rond, live-awards
│   │   ├── rounds/            Ronder: lista + ny-rond-formulär, [roundId]-detalj + resultat
│   │   ├── longest-drive/     Longest Drive: ställning + registreringsformulär
│   │   ├── closest-to-pin/    Closest to Pin: ställning + registreringsformulär
│   │   ├── scoring/           Poängsystem (poäng per placering)
│   │   └── stats/             Statistik
│   ├── components/            UI-byggklossar (Leaderboard, LiveAwardsTable, ...)
│   │   └── forms/              RoundForm, ScoreEntryForm, AwardForm, ScoringForm
│   └── lib/
│       ├── supabase/          Browser-, server- och service-role-klienter
│       ├── types/             Handskrivna databastyper
│       ├── round-status.ts    Etikett/färg per rondstatus (upcoming/ongoing/completed)
│       ├── scoring.ts         Ren beräkningslogik (delas av UI och tester)
│       └── player.ts          localStorage-hjälpare för valt namn
└── ARCHITECTURE.md / MVP.md / README.md
```

## 7. Teknikval — motivering

- **Server Components för läsning:** ingen egen API-lada behövs; sidorna
  hämtar direkt från Supabase på servern.
- **Server Actions för skrivning:** slipper egna REST/API-routes för varje
  mutation, och service role-nyckeln kan aldrig läcka till klienten.
- **Vyer istället för lagrad statistik:** totalpoäng, placeringar och
  snittplacering räknas alltid fram från källdatan — omöjligt att de
  hamnar i otakt.
- **Realtime på tabellnivå:** enklast robusta sättet att få "live"-känsla
  utan websockets-kod i appen — Supabase sköter transporten.
