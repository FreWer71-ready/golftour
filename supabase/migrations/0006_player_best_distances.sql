-- Adds each player's own best Longest Drive / Closest to Pin result to
-- player_tour_stats, for the Statistik screen — their personal best
-- distance, not how many times they placed 1st. Run once in the Supabase
-- SQL editor.

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
  coalesce(ctp.ctp_wins, 0) as closest_to_pin_wins,
  ld.best_m as longest_drive_best_m,
  ctp.best_m as closest_to_pin_best_m
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
  select tour_id, player_id, count(*) filter (where position = 1) as ld_wins, max(distance_m) as best_m
  from longest_drive_ranked
  group by tour_id, player_id
) ld on ld.tour_id = t.id and ld.player_id = p.id
left join (
  select tour_id, player_id, count(*) filter (where position = 1) as ctp_wins, min(distance_m) as best_m
  from closest_to_pin_ranked
  group by tour_id, player_id
) ctp on ctp.tour_id = t.id and ctp.player_id = p.id;
