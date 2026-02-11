
-- Add workflow columns to bookings
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS report_before timestamp with time zone,
  ADD COLUMN IF NOT EXISTS required_staff_count integer DEFAULT 2,
  ADD COLUMN IF NOT EXISTS panchayath_id uuid REFERENCES public.panchayaths(id);

-- Add status to booking_staff_assignments for accept/reject
ALTER TABLE public.booking_staff_assignments 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Add constraint for assignment status values
ALTER TABLE public.booking_staff_assignments 
  ADD CONSTRAINT booking_staff_assignment_status_check 
  CHECK (status IN ('pending', 'accepted', 'rejected'));

-- Update RLS: staff can view bookings in their panchayath
DROP POLICY IF EXISTS "Staff can view panchayath bookings" ON public.bookings;
CREATE POLICY "Staff can view panchayath bookings"
ON public.bookings FOR SELECT
USING (
  is_staff() AND panchayath_id IN (
    SELECT panchayath_id FROM public.staff_panchayath_assignments 
    WHERE staff_user_id = auth.uid()
  )
);

-- Staff can update their own assignment status (accept/reject)
DROP POLICY IF EXISTS "Staff can update own assignment status" ON public.booking_staff_assignments;
CREATE POLICY "Staff can update own assignment status"
ON public.booking_staff_assignments FOR UPDATE
USING (staff_user_id = auth.uid());

-- Staff can view assignments for bookings in their panchayath
DROP POLICY IF EXISTS "Staff can view panchayath assignments" ON public.booking_staff_assignments;
CREATE POLICY "Staff can view panchayath assignments"
ON public.booking_staff_assignments FOR SELECT
USING (
  is_staff() AND booking_id IN (
    SELECT b.id FROM public.bookings b
    JOIN public.staff_panchayath_assignments spa ON spa.panchayath_id = b.panchayath_id
    WHERE spa.staff_user_id = auth.uid()
  )
);
