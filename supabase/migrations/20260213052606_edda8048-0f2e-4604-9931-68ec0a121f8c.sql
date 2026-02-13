DROP POLICY "Admins can manage custom features" ON public.custom_features;
CREATE POLICY "Admins and super admins can manage custom features"
ON public.custom_features
FOR ALL
USING (is_admin() OR is_super_admin())
WITH CHECK (is_admin() OR is_super_admin());