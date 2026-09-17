-- Turns Longest Drive and Closest to Pin into proper per-round competitions
-- (every player gets one result per round, not just a single winner), and
-- adds a fixed-scale (10/8/6/4/2) points competition across rounds + both
-- extra competitions. Replaces the old admin-editable scoring_rules system.
-- Run this once in the Supabase SQL editor.

-- Any old rows without a distance can't satisfy the new NOT NULL constraint —
-- there shouldn't be any left after a reset, but clear them defensively.
delete from longest_drive where distance_m is null;
delete from closest_to_pin where distance_m is null;

alter table longest_drive alter column distance_m set not null;
alter table closest_to_pin alter column distance_m set not null;
alter table longest_drive add constraint longest_drive_distance_positive check (distance_m > 0);
alter table closest_to_pin add constraint closest_to_pin_distance_positive check (distance_m > 0);
alter table longest_drive add constraint longest_drive_round_player_unique unique (round_id, player_id);
alter table closest_to_pin add constraint closest_to_pin_round_player_unique unique (round_id, player_id);

create or replace function fixed_points(pos int)
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

create or replace view longest_drive_ranked as
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

create or replace view closest_to_pin_ranked as
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

create or replace view tour_points as
select tour_id, round_id, player_id, 'round'::text as source, fixed_points(position) as points
from round_scores_ranked
union all
select tour_id, round_id, player_id, 'longest_drive'::text as source, fixed_points(position) as points
from longest_drive_ranked
union all
select tour_id, round_id, player_id, 'closest_to_pin'::text as source, fixed_points(position) as points
from closest_to_pin_ranked;

create or replace view points_leaderboard as
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

create or replace view player_tour_stats as
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

-- Superseded by the fixed points competition above.
drop view if exists round_points;
drop table if exists scoring_rules cascade;
