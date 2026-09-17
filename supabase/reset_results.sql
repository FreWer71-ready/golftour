-- Resets the active tour before the real thing starts: clears every
-- registered result, Longest Drive, Closest to Pin and Yatzy entry, and
-- puts every round back to "upcoming". Players, rounds (course/date/tee
-- time) and the points scale are left untouched. Run this once in the
-- Supabase SQL editor whenever you want a clean slate (e.g. after testing).

delete from round_scores
where round_id in (select id from rounds where tour_id = (select id from tours where is_active));

delete from longest_drive
where round_id in (select id from rounds where tour_id = (select id from tours where is_active));

delete from closest_to_pin
where round_id in (select id from rounds where tour_id = (select id from tours where is_active));

delete from yatzy_scores
where tour_id = (select id from tours where is_active);

update rounds
set status = 'upcoming'
where tour_id = (select id from tours where is_active);
