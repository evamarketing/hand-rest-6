import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// All available permission keys
export const PERMISSION_TABS = [
  'dashboard',
  'bookings',
  'staff',
  'packages',
  'addons',
  'custom_features',
  'panchayaths',
  'settings',
] as const;

export const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete'] as const;

export type PermissionTab = typeof PERMISSION_TABS[number];
export type PermissionAction = typeof PERMISSION_ACTIONS[number];

export const TAB_LABELS: Record<PermissionTab, string> = {
  dashboard: 'Dashboard',
  bookings: 'Bookings',
  staff: 'Staff',
  packages: 'Packages',
  addons: 'Add-ons',
  custom_features: 'Custom Features',
  panchayaths: 'Panchayaths',
  settings: 'Settings',
};

export function buildPermissionKey(tab: PermissionTab, action: PermissionAction) {
  return `${tab}.${action}`;
}

export function parsePermissionKey(key: string): { tab: PermissionTab; action: PermissionAction } | null {
  const [tab, action] = key.split('.');
  if (PERMISSION_TABS.includes(tab as PermissionTab) && PERMISSION_ACTIONS.includes(action as PermissionAction)) {
    return { tab: tab as PermissionTab, action: action as PermissionAction };
  }
  return null;
}

// Get all permission keys
export function getAllPermissionKeys(): string[] {
  const keys: string[] = [];
  for (const tab of PERMISSION_TABS) {
    for (const action of PERMISSION_ACTIONS) {
      keys.push(buildPermissionKey(tab, action));
    }
  }
  return keys;
}

// Hook for the current user's permissions
export function useMyPermissions() {
  const { user, role } = useAuth();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['my-permissions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('admin_permissions')
        .select('permission_key')
        .eq('user_id', user.id);
      if (error) throw error;
      return data.map(d => d.permission_key);
    },
    enabled: !!user && role === 'admin',
  });

  const hasPermission = (tab: PermissionTab, action: PermissionAction = 'view'): boolean => {
    // Super admins always have all permissions
    if (role === 'super_admin') return true;
    // Non-admins don't use this system
    if (role !== 'admin') return false;
    // If permissions haven't loaded yet, deny
    if (!permissions) return false;
    return permissions.includes(buildPermissionKey(tab, action));
  };

  const canViewTab = (tab: PermissionTab): boolean => hasPermission(tab, 'view');

  return { permissions, isLoading, hasPermission, canViewTab };
}

// Hook for super admin to manage a specific user's permissions
export function useUserPermissions(userId: string | null) {
  const queryClient = useQueryClient();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('admin_permissions')
        .select('id, permission_key')
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const setPermissions = useMutation({
    mutationFn: async ({ userId, keys }: { userId: string; keys: string[] }) => {
      // Delete all existing
      await supabase.from('admin_permissions').delete().eq('user_id', userId);
      // Insert new ones
      if (keys.length > 0) {
        const { error } = await supabase.from('admin_permissions').insert(
          keys.map(k => ({ user_id: userId, permission_key: k }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions', userId] });
    },
  });

  const permissionKeys = permissions?.map(p => p.permission_key) || [];

  return { permissions: permissionKeys, isLoading, setPermissions };
}
