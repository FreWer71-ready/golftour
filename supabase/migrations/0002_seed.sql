-- Optional starter data for Mallorca Golf Tour 2026 — matches the tour poster
-- (players, courses, tee times) so the app has something real to show on day
-- one. Safe to edit or delete before your own tour: everything here is also
-- editable later from the admin panel. Plain SQL only, so it runs as-is in
-- the Supabase dashboard's SQL editor, not just via psql/CLI.

insert into tours (name, start_date, end_date, location, is_active)
values ('Mallorca Golf Tour 2026', '2026-09-17', '2026-09-21', 'Son Antem, Mallorca', true);

insert into players (name) values
  ('Fredrik Wernqvist'),
  ('Fredrik Wetterling'),
  ('Fredrik von Carlsburg'),
  ('Mathias Axelsson'),
  ('Mats Hagman');

insert into rounds (tour_id, course_name, round_date, tee_time, status, sort_order)
select t.id, v.course_name, v.round_date::date, v.tee_time::time, v.status, v.sort_order
from tours t
join (
  values
    ('Son Antem West', '2026-09-18', '10:10', 'completed', 1),
    ('Golf de Andratx', '2026-09-19', '11:50', 'upcoming', 2),
    ('Son Antem East', '2026-09-21', '07:40', 'upcoming', 3)
) as v(course_name, round_date, tee_time, status, sort_order) on true
where t.name = 'Mallorca Golf Tour 2026';

-- Default tour points by finishing position — edit any time from
-- Admin -> Ändra poängsystem.
insert into scoring_rules (tour_id, position, points)
select t.id, v.position, v.points
from tours t
join (
  values (1, 10), (2, 7), (3, 5), (4, 3), (5, 2), (6, 1), (7, 1), (8, 1)
) as v(position, points) on true
where t.name = 'Mallorca Golf Tour 2026';

-- Round 1 (Son Antem West) results, taken from the tour scorecard.
insert into round_scores (round_id, player_id, gross_score, handicap_strokes)
select r.id, p.id, v.gross, v.hcp
from rounds r
join tours t on t.id = r.tour_id and t.name = 'Mallorca Golf Tour 2026'
join (
  values
    ('Fredrik von Carlsburg', 69, 4),
    ('Fredrik Wernqvist', 72, 5),
    ('Fredrik Wetterling', 73, 4),
    ('Mats Hagman', 74, 4),
    ('Mathias Axelsson', 71, 0)
) as v(player_name, gross, hcp) on true
join players p on p.name = v.player_name
where r.course_name = 'Son Antem West';

insert into longest_drive (round_id, player_id, hole, distance_m)
select r.id, p.id, 14, 268
from rounds r
join tours t on t.id = r.tour_id and t.name = 'Mallorca Golf Tour 2026'
join players p on p.name = 'Mathias Axelsson'
where r.course_name = 'Son Antem West';

insert into closest_to_pin (round_id, player_id, hole, distance_m)
select r.id, p.id, 7, 2.4
from rounds r
join tours t on t.id = r.tour_id and t.name = 'Mallorca Golf Tour 2026'
join players p on p.name = 'Mats Hagman'
where r.course_name = 'Son Antem West';
