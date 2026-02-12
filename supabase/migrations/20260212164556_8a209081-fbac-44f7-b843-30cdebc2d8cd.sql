
-- Fix infinite recursion: Create SECURITY DEFINER functions to break RLS circular dependency

-- Function to check if a booking belongs to staff's panchayath (bypasses RLS)
CREATE OR REPLACE FUNCTION public.booking_in_staff_panchayath(p_booking_id uuid, p_staff_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM bookings b
    JOIN staff_panchayath_assignments spa ON spa.panchayath_id = b.panchayath_id
    WHERE b.id = p_booking_id
    AND spa.staff_user_id = p_staff_user_id
  )
$$;

-- Function to check if staff is assigned to a booking (bypasses RLS)
CREATE OR REPLACE FUNCTION public.staff_assigned_to_booking(p_booking_id uuid, p_staff_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM booking_staff_assignments
    WHERE booking_id = p_booking_id
    AND staff_user_id = p_staff_user_id
  )
$$;

-- Drop and recreate the problematic policies on bookings
DROP POLICY IF EXISTS "Staff can update assigned bookings" ON public.bookings;
CREATE POLICY "Staff can update assigned bookings"
ON public.bookings
FOR UPDATE
USING (is_staff() AND public.staff_assigned_to_booking(id, auth.uid()));

DROP POLICY IF EXISTS "Staff can view panchayath bookings" ON public.bookings;
CREATE POLICY "Staff can view panchayath bookings"
ON public.bookings
FOR SELECT
USING (is_staff() AND panchayath_id IN (
  SELECT panchayath_id FROM staff_panchayath_assignments WHERE staff_user_id = auth.uid()
));

-- Drop and recreate the problematic policy on booking_staff_assignments
DROP POLICY IF EXISTS "Staff can view panchayath assignments" ON public.booking_staff_assignments;
CREATE POLICY "Staff can view panchayath assignments"
ON public.booking_staff_assignments
FOR SELECT
USING (is_staff() AND public.booking_in_staff_panchayath(booking_id, auth.uid()));
