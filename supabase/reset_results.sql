-- Resets the tour before the real thing starts: clears every registered
-- result, Longest Drive, Closest to Pin and Yatzy entry, and puts every
-- round back to "upcoming". Players, rounds (course/date/tee time) and the
-- points scale are left untouched. Run this once in the Supabase SQL
-- editor whenever you want a clean slate (e.g. after testing).
--
-- No tour_id filtering here — this app only ever has one tour, so it's
-- simplest and safest to just clear these tables outright.

delete from round_scores;
delete from longest_drive;
delete from closest_to_pin;
delete from yatzy_scores;

update rounds set status = 'upcoming';
