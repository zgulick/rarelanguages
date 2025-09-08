-- Seed Initial Data for RareLanguages Platform
-- Phase 1: Gheg Albanian Language and Basic Skills

-- Insert Gheg Albanian language
INSERT INTO languages (code, name, native_name, active) VALUES 
('gheg-al', 'Gheg Albanian', 'Shqip (Gegë)', true);

-- Get the language ID for reference (this will be used in the application)
-- For now, we'll insert skills with a placeholder and update via application

-- Note: The following skills will be inserted via the seed script with proper UUID references
-- This file serves as a template for the structure