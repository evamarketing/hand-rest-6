
-- Fix: split the ALL policy into separate SELECT/UPDATE/DELETE and INSERT policies
DROP POLICY "Admins can manage all earnings" ON public.staff_earnings;

CREATE POLICY "Admins can view/update/delete earnings"
ON public.staff_earnings FOR ALL
TO authenticated
USING (is_admin() OR is_super_admin())
WITH CHECK (is_admin() OR is_super_admin());
