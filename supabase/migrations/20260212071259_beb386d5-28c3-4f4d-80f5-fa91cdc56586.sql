
-- Create admin permissions table for granular access control
CREATE TABLE public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  permission_key text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  granted_by uuid,
  UNIQUE(user_id, permission_key)
);

-- Enable RLS
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all permissions
CREATE POLICY "Super admins can manage permissions"
ON public.admin_permissions
FOR ALL
USING (is_super_admin());

-- Admins can view their own permissions
CREATE POLICY "Admins can view own permissions"
ON public.admin_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- Insert default permissions for existing admins (give them all permissions)
-- Permission keys follow format: tab_name.action (e.g., bookings.view, staff.create)
