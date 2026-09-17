-- Yatzy: an unlimited number of games, each with one score per player who
-- played it. No round/hole concept like the golf side — just a game
-- number, the same fixed 10/8/6/4/2 points scale, and a totals table.
-- Run this once in the Supabase SQL editor.

create table yatzy_scores (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references tours(id) on delete cascade,
  game_number int not null check (game_number > 0),
  player_id uuid not null references players(id) on delete cascade,
  score int not null check (score >= 0),
  created_at timestamptz not null default now(),
  unique (tour_id, game_number, player_id)
);

-- Per-game placement, ranked by score (higher wins, as in Yatzy).
create view yatzy_scores_ranked as
select
  ys.id,
  ys.tour_id,
  ys.game_number,
  ys.player_id,
  ys.score,
  rank() over (partition by ys.tour_id, ys.game_number order by ys.score desc) as position
from yatzy_scores ys;

-- Yatzy's own totals table — deliberately separate from points_leaderboard.
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

alter table yatzy_scores enable row level security;
create policy "Public read" on yatzy_scores for select using (true);

alter publication supabase_realtime add table yatzy_scores;
