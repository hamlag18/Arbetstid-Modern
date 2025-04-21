-- Lägg till status-fält i projects-tabellen
ALTER TABLE projects
ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived'));

-- Uppdatera befintliga projekt till aktiv status
UPDATE projects
SET status = 'active'
WHERE status IS NULL; 