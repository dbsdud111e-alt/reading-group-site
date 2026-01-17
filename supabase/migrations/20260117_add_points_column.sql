-- Migration to add 'points' column to 'users' table

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'points'
    ) THEN
        ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0;
    END IF;
END $$;
