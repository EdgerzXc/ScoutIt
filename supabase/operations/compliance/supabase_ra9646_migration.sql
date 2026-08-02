-- Add DHSUD Registration Number for RA 9646 Compliance
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS dhsud_number text;

-- (PRC License Number already exists as prc_license text)
