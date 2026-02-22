-- Migration: Remove player rating column
-- This removes the rating field as it's no longer needed

ALTER TABLE players DROP COLUMN IF EXISTS rating;
