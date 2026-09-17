# MVP-plan

Målet är en app som klarar en verklig tour (4–20 spelare, 3+ ronder) utan
att någon behöver administrera den under resan — vem som helst i gruppen kan
lägga in resultat direkt. Byggordning, inte tidsuppskattning:

## Fas 1 — Grund (klart i detta repo)
- [x] Databasschema + RLS + vyer för leaderboard/statistik (`supabase/migrations`)
- [x] Designsystem: färger, typsnitt, komponenter (Tailwind-tokens från wireframen)
- [x] Namnval + lokal lagring av spelare, ingen inloggning
- [x] Dashboard: total leaderboard, poängtävling, pågående tävling, live-tabell för LD/CTP, nästa tävling
- [x] Ronder: lista + ny-rond-formulär + detaljvy med scorecard, LD/CTP och resultatregistrering
- [x] Longest Drive / Closest to Pin: egen deltävling per rond (ett resultat per
      spelare, delat hål, automatiskt rangordnad) — öppet för alla
- [x] Poängtävling: fast 10/8/6/4/2-skala över varje rond + varje ronds LD/CTP
- [x] Statistik per spelare
- [x] Öppen resultatregistrering: ingen PIN, ingen adminroll — brutto + handikap
      in, nettot (resultatet) räknas fram automatiskt
- [x] Realtidsuppdatering via Supabase Realtime

## Fas 2 — Innan resan (du gör detta)
- [ ] Skapa Supabase-projekt, kör migrationerna, sätt env-variabler (README)
- [ ] Kontrollera/justera deltagarlistan, ronder och tee times för er resa
- [ ] Deploya till Vercel, testa hela flödet på mobil på riktig 4G/5G

## Fas 3 — Under resan
- [ ] Markera dagens rond som "Pågående" på Ronder-sidan när ni börjar spela
- [ ] Vem som helst registrerar resultat efter varje rond, direkt i mobilen
- [ ] Registrera Longest Drive / Closest to Pin löpande under ronden
- [ ] Låt gruppen följa leaderboard och live-tabellen i klubbhuset/på bussen

## Fas 4 — Efter MVP (valfria vidareutvecklingar, inte byggda nu)
Dessa är medvetet **inte** byggda för att hålla appen enkel — lägg bara till
dem om ni faktiskt saknar dem efter en resa:
- Flera tourer/år i samma app med historik mellan år
- Export av resultat (PDF/CSV) som minne efter resan
- Push-notiser vid nytt resultat
- Handicap som beräknas automatiskt istället för att matas in manuellt
- Bildupload till ronder ("bevis" på Longest Drive)
