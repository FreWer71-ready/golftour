# MVP-plan

Målet är en app som klarar en verklig tour (4–20 spelare, 3+ ronder) med
minimal admin-insats under själva resan. Byggordning, inte tidsuppskattning:

## Fas 1 — Grund (klart i detta repo)
- [x] Databasschema + RLS + vyer för leaderboard/statistik (`supabase/migrations`)
- [x] Designsystem: färger, typsnitt, komponenter (Tailwind-tokens från wireframen)
- [x] Namnval + lokal lagring av spelare, ingen inloggning
- [x] Dashboard: total leaderboard, nästa rond, senaste resultat, LD/CTP-ledare
- [x] Ronder: lista + detaljvy med scorecard
- [x] Longest Drive / Closest to Pin: aktuell segrare + historik
- [x] Statistik per spelare
- [x] Admin: PIN-lås, skapa/redigera rond, registrera resultat, LD, CTP, poängsystem
- [x] Realtidsuppdatering via Supabase Realtime

## Fas 2 — Innan resan (du gör detta)
- [ ] Skapa Supabase-projekt, kör migrationerna, sätt env-variabler (README)
- [ ] Byt `ADMIN_PIN` till en egen kod, dela den bara med den/de som ska
      registrera resultat
- [ ] Kontrollera/justera deltagarlistan, ronder och tee times för er resa
- [ ] Deploya till Vercel, testa hela flödet på mobil på riktig 4G/5G

## Fas 3 — Under resan
- [ ] Registrera resultat efter varje rond (admin, från klubbhuset eller mobilen)
- [ ] Registrera Longest Drive / Closest to Pin löpande under ronden
- [ ] Låt gruppen följa leaderboard live i klubbhuset/på bussen

## Fas 4 — Efter MVP (valfria vidareutvecklingar, inte byggda nu)
Dessa är medvetet **inte** byggda för att hålla appen enkel — lägg bara till
dem om ni faktiskt saknar dem efter en resa:
- Flera tourer/år i samma app med historik mellan år
- Export av resultat (PDF/CSV) som minne efter resan
- Push-notiser vid nytt resultat
- Handicap som beräknas automatiskt istället för att matas in manuellt
- Bildupload till ronder ("bevis" på Longest Drive)
