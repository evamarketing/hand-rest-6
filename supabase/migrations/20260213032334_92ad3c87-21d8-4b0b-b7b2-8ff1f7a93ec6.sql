
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage addons" ON public.addon_services;
DROP POLICY IF EXISTS "Anyone can view active addons" ON public.addon_services;

-- Recreate as PERMISSIVE policies (default)
CREATE POLICY "Admins can manage addons"
ON public.addon_services
FOR ALL
USING (is_admin() OR is_super_admin());

CREATE POLICY "Anyone can view active addons"
ON public.addon_services
FOR SELECT
USING (is_active = true);
