-- Mallorca Golf Tour — initial schema
-- Run this in the Supabase SQL editor, or via `supabase db push` if you use the CLI.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table tours (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  location text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Only one tour should be active at a time (the app always shows the active tour).
create unique index one_active_tour on tours (is_active) where is_active;

create table rounds (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references tours(id) on delete cascade,
  course_name text not null,
  round_date date not null,
  tee_time time,
  status text not null default 'upcoming' check (status in ('upcoming', 'completed')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table round_scores (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  gross_score int not null check (gross_score > 0),
  handicap_strokes int not null default 0 check (handicap_strokes >= 0),
  net_score int generated always as (gross_score - handicap_strokes) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (round_id, player_id)
);

create table longest_drive (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  hole int not null check (hole between 1 and 18),
  distance_m numeric(5, 1),
  created_at timestamptz not null default now()
);

create table closest_to_pin (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  hole int not null check (hole between 1 and 18),
  distance_m numeric(4, 1),
  created_at timestamptz not null default now()
);

-- Tour points per finishing position, e.g. 1st -> 10p, 2nd -> 7p, ...
-- Editable by admin ("Ändra poängsystem"). Any position without a row scores 0.
create table scoring_rules (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references tours(id) on delete cascade,
  position int not null check (position > 0),
  points int not null check (points >= 0),
  unique (tour_id, position)
);

-- Keep round_scores.updated_at current on edits.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger round_scores_set_updated_at
  before update on round_scores
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Views — ranking and stats are computed, never stored, so they can never
-- drift out of sync with the underlying scores.
-- ---------------------------------------------------------------------------

-- Per-round placement, ranked by net score (lower is better).
create view round_scores_ranked as
select
  rs.id,
  rs.round_id,
  rs.player_id,
  r.tour_id,
  rs.gross_score,
  rs.handicap_strokes,
  rs.net_score,
  rank() over (partition by rs.round_id order by rs.net_score asc) as position
from round_scores rs
join rounds r on r.id = rs.round_id;

-- Tour points earned per player per round, from round placement + scoring_rules.
create view round_points as
select
  rsr.tour_id,
  rsr.round_id,
  rsr.player_id,
  rsr.position,
  coalesce(sr.points, 0) as points
from round_scores_ranked rsr
left join scoring_rules sr
  on sr.tour_id = rsr.tour_id and sr.position = rsr.position;

-- Total leaderboard: sum of net scores across completed rounds (classic
-- stroke-play tour total — lower is better, ties share a rank).
create view tour_leaderboard as
select
  r.tour_id,
  rs.player_id,
  p.name as player_name,
  sum(rs.net_score) as total_net,
  sum(rs.gross_score) as total_gross,
  count(*) as rounds_played,
  rank() over (partition by r.tour_id order by sum(rs.net_score) asc) as position
from round_scores rs
join rounds r on r.id = rs.round_id
join players p on p.id = rs.player_id
where r.status = 'completed'
group by r.tour_id, rs.player_id, p.name;

-- Per-player stats for the Statistik screen.
create view player_tour_stats as
select
  t.id as tour_id,
  p.id as player_id,
  p.name as player_name,
  coalesce(rp.total_points, 0) as total_points,
  coalesce(rp.rounds_played, 0) as rounds_played,
  coalesce(rp.rounds_won, 0) as rounds_won,
  rp.avg_position,
  coalesce(ld.ld_wins, 0) as longest_drive_wins,
  coalesce(ctp.ctp_wins, 0) as closest_to_pin_wins
from tours t
cross join players p
left join (
  select
    tour_id,
    player_id,
    sum(points) as total_points,
    count(*) as rounds_played,
    count(*) filter (where position = 1) as rounds_won,
    round(avg(position), 1) as avg_position
  from round_points
  group by tour_id, player_id
) rp on rp.tour_id = t.id and rp.player_id = p.id
left join (
  select ro.tour_id, ld.player_id, count(*) as ld_wins
  from longest_drive ld
  join rounds ro on ro.id = ld.round_id
  group by ro.tour_id, ld.player_id
) ld on ld.tour_id = t.id and ld.player_id = p.id
left join (
  select ro.tour_id, c.player_id, count(*) as ctp_wins
  from closest_to_pin c
  join rounds ro on ro.id = c.round_id
  group by ro.tour_id, c.player_id
) ctp on ctp.tour_id = t.id and ctp.player_id = p.id;

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Reads are public (no login, per the product spec). Writes have no policy
-- at all here, which means anon/authenticated can never write — the app's
-- Server Actions perform every write with the service role key, which
-- bypasses RLS, only after verifying the admin PIN cookie server-side.
-- ---------------------------------------------------------------------------

alter table players enable row level security;
alter table tours enable row level security;
alter table rounds enable row level security;
alter table round_scores enable row level security;
alter table longest_drive enable row level security;
alter table closest_to_pin enable row level security;
alter table scoring_rules enable row level security;

create policy "Public read" on players for select using (true);
create policy "Public read" on tours for select using (true);
create policy "Public read" on rounds for select using (true);
create policy "Public read" on round_scores for select using (true);
create policy "Public read" on longest_drive for select using (true);
create policy "Public read" on closest_to_pin for select using (true);
create policy "Public read" on scoring_rules for select using (true);

-- ---------------------------------------------------------------------------
-- Realtime — let clients subscribe to live changes on these tables so the
-- leaderboard and awards update on every screen as soon as admin saves.
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table rounds, round_scores, longest_drive, closest_to_pin;
