-- 014: Deactivate languages that have no published lessons.
--
-- The catalogue advertised three languages, but only Gheg Albanian has
-- content. Welsh had 6 skills and 0 processed lessons; Croatian had 2 skills
-- and no lesson content at all. Both rendered as clickable cards that led to
-- an empty level page.
--
-- /api/languages/available already filters on `active = true`, so flipping
-- the flag is enough to remove them from the site. The rows and their skills
-- are retained so they can be switched back on once content exists.

UPDATE languages
SET active = false
WHERE code IN ('cy', 'hr');

-- Verification: this should return only gheg-al.
-- SELECT code, name, active FROM languages WHERE active = true;
