-- Adds an "ongoing" round status, for the round currently being played —
-- shown on the dashboard between the live awards table and the next round.
-- Run this once in the Supabase SQL editor.

alter table rounds drop constraint if exists rounds_status_check;
alter table rounds add constraint rounds_status_check
  check (status in ('upcoming', 'ongoing', 'completed'));
