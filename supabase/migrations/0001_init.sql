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
  status text not null default 'upcoming' check (status in ('upcoming', 'ongoing', 'completed')),
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

-- Longest Drive and Closest to Pin are their own per-round competitions:
-- every player who takes part gets exactly one measured result per round
-- (one shared hole per round, entered once on the form), ranked against
-- each other the same way round_scores is.
create table longest_drive (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  hole int not null check (hole between 1 and 18),
  distance_m numeric(5, 1) not null check (distance_m > 0),
  created_at timestamptz not null default now(),
  unique (round_id, player_id)
);

create table closest_to_pin (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  hole int not null check (hole between 1 and 18),
  distance_m numeric(4, 1) not null check (distance_m > 0),
  created_at timestamptz not null default now(),
  unique (round_id, player_id)
);

-- Yatzy: an unlimited number of games, each with one score per player who
-- played it — no round/hole concept, just a game number and a score.
create table yatzy_scores (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references tours(id) on delete cascade,
  game_number int not null check (game_number > 0),
  player_id uuid not null references players(id) on delete cascade,
  score int not null check (score >= 0),
  created_at timestamptz not null default now(),
  unique (tour_id, game_number, player_id)
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

-- Fixed tour-points scale: every sub-competition (each round, and each
-- round's Longest Drive and Closest to Pin) pays out 10/8/6/4/2 points for
-- 1st through 5th place, 0 beyond. Not admin-editable, by design — one
-- scale, everywhere, so the points competition is never ambiguous.
-- bigint, not int: every position column here comes from rank(), which
-- Postgres returns as bigint — an int argument wouldn't match it.
create or replace function fixed_points(pos bigint)
returns int
language sql
immutable
as $$
  select case pos
    when 1 then 10
    when 2 then 8
    when 3 then 6
    when 4 then 4
    when 5 then 2
    else 0
  end;
$$;

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

-- Per-round placement for Longest Drive (longer distance wins).
create view longest_drive_ranked as
select
  ld.id,
  ld.round_id,
  ld.player_id,
  r.tour_id,
  ld.hole,
  ld.distance_m,
  rank() over (partition by ld.round_id order by ld.distance_m desc) as position
from longest_drive ld
join rounds r on r.id = ld.round_id;

-- Per-round placement for Closest to Pin (shorter distance wins).
create view closest_to_pin_ranked as
select
  ctp.id,
  ctp.round_id,
  ctp.player_id,
  r.tour_id,
  ctp.hole,
  ctp.distance_m,
  rank() over (partition by ctp.round_id order by ctp.distance_m asc) as position
from closest_to_pin ctp
join rounds r on r.id = ctp.round_id;

-- Every point-earning placement across the whole tour: each round is one
-- sub-competition, and each round's Longest Drive / Closest to Pin are two
-- more — all paid out on the same fixed_points scale.
create view tour_points as
select tour_id, round_id, player_id, 'round'::text as source, fixed_points(position) as points
from round_scores_ranked
union all
select tour_id, round_id, player_id, 'longest_drive'::text as source, fixed_points(position) as points
from longest_drive_ranked
union all
select tour_id, round_id, player_id, 'closest_to_pin'::text as source, fixed_points(position) as points
from closest_to_pin_ranked;

-- The points competition leaderboard — the Ryder Cup-style ranking, separate
-- from the stroke-play total leaderboard below.
create view points_leaderboard as
select
  t.id as tour_id,
  p.id as player_id,
  p.name as player_name,
  coalesce(sum(tp.points), 0) as total_points,
  rank() over (
    partition by t.id
    order by coalesce(sum(tp.points), 0) desc
  ) as position
from tours t
cross join players p
left join tour_points tp on tp.tour_id = t.id and tp.player_id = p.id
group by t.id, p.id, p.name;

-- Per-game placement for Yatzy (higher score wins), and its own totals
-- table — deliberately separate from points_leaderboard.
create view yatzy_scores_ranked as
select
  ys.id,
  ys.tour_id,
  ys.game_number,
  ys.player_id,
  ys.score,
  rank() over (partition by ys.tour_id, ys.game_number order by ys.score desc) as position
from yatzy_scores ys;

create view yatzy_leaderboard as
select
  t.id as tour_id,
  p.id as player_id,
  p.name as player_name,
  coalesce(sum(fixed_points(ysr.position)), 0) as total_points,
  count(ysr.game_number) as games_played,
  rank() over (
    partition by t.id
    order by coalesce(sum(fixed_points(ysr.position)), 0) desc
  ) as position
from tours t
cross join players p
left join yatzy_scores_ranked ysr on ysr.tour_id = t.id and ysr.player_id = p.id
group by t.id, p.id, p.name;

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

-- Per-player stats for the Statistik screen. total_points comes from the
-- same fixed points competition as points_leaderboard (rounds + LD + CTP).
create view player_tour_stats as
select
  t.id as tour_id,
  p.id as player_id,
  p.name as player_name,
  coalesce(pts.total_points, 0) as total_points,
  coalesce(rp.rounds_played, 0) as rounds_played,
  coalesce(rp.rounds_won, 0) as rounds_won,
  rp.avg_position,
  coalesce(ld.ld_wins, 0) as longest_drive_wins,
  coalesce(ctp.ctp_wins, 0) as closest_to_pin_wins
from tours t
cross join players p
left join (
  select tour_id, player_id, sum(points) as total_points
  from tour_points
  group by tour_id, player_id
) pts on pts.tour_id = t.id and pts.player_id = p.id
left join (
  select
    tour_id,
    player_id,
    count(*) as rounds_played,
    count(*) filter (where position = 1) as rounds_won,
    round(avg(position), 1) as avg_position
  from round_scores_ranked
  group by tour_id, player_id
) rp on rp.tour_id = t.id and rp.player_id = p.id
left join (
  select tour_id, player_id, count(*) filter (where position = 1) as ld_wins
  from longest_drive_ranked
  group by tour_id, player_id
) ld on ld.tour_id = t.id and ld.player_id = p.id
left join (
  select tour_id, player_id, count(*) filter (where position = 1) as ctp_wins
  from closest_to_pin_ranked
  group by tour_id, player_id
) ctp on ctp.tour_id = t.id and ctp.player_id = p.id;

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Reads are public (no login, per the product spec). Writes have no policy
-- at all here, which means anon/authenticated can never write — the app's
-- Server Actions perform every write with the service role key, which
-- bypasses RLS. There's no admin gate: anyone with the app's link can write,
-- at any time — the service role key exists to keep itself off the client,
-- not to restrict who can call the actions.
-- ---------------------------------------------------------------------------

alter table players enable row level security;
alter table tours enable row level security;
alter table rounds enable row level security;
alter table round_scores enable row level security;
alter table longest_drive enable row level security;
alter table closest_to_pin enable row level security;
alter table yatzy_scores enable row level security;

create policy "Public read" on players for select using (true);
create policy "Public read" on tours for select using (true);
create policy "Public read" on rounds for select using (true);
create policy "Public read" on round_scores for select using (true);
create policy "Public read" on longest_drive for select using (true);
create policy "Public read" on closest_to_pin for select using (true);
create policy "Public read" on yatzy_scores for select using (true);

-- ---------------------------------------------------------------------------
-- Realtime — let clients subscribe to live changes on these tables so the
-- leaderboard and awards update on every screen as soon as someone saves.
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table rounds, round_scores, longest_drive, closest_to_pin, yatzy_scores;
