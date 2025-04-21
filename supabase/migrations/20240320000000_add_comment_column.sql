-- Lägg till comment-kolumn i time_reports-tabellen
ALTER TABLE time_reports
ADD COLUMN IF NOT EXISTS comment TEXT; 