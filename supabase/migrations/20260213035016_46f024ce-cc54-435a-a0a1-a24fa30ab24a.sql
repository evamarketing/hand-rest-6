
-- Add staff earning per person column to custom_features
ALTER TABLE public.custom_features
ADD COLUMN staff_earning_per_person numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.custom_features.staff_earning_per_person IS 'Fixed earning amount per staff member for internal calculation';
