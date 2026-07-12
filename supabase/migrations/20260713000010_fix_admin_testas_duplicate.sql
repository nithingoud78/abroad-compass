-- Remove duplicate active rows, keeping only the most recently updated one
DELETE FROM admin_exam_schedule
WHERE id NOT IN (
    SELECT id
    FROM admin_exam_schedule
    WHERE is_active = true
    ORDER BY updated_at DESC
    LIMIT 1
);

-- Add a unique constraint to ensure only one active schedule can exist
CREATE UNIQUE INDEX IF NOT EXISTS admin_exam_schedule_active_idx 
ON admin_exam_schedule (is_active) 
WHERE is_active = true;
