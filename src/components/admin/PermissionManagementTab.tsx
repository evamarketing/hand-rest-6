import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Shield, ShieldCheck, Search, UserCog, KeyRound } from 'lucide-react';
import type { AppRole, Profile } from '@/types/database';
import {
  PERMISSION_TABS,
  PERMISSION_ACTIONS,
  TAB_LABELS,
  buildPermissionKey,
  getAllPermissionKeys,
  useUserPermissions,
  type PermissionTab,
  type PermissionAction,
} from '@/hooks/useAdminPermissions';

interface UserWithRole {
  user_id: string;
  role: AppRole;
  role_id: string;
  profile: Profile | null;
}

const roleBadgeColors: Record<AppRole, string> = {
  super_admin: 'bg-red-100 text-red-800',
  admin: 'bg-purple-100 text-purple-800',
  staff: 'bg-blue-100 text-blue-800',
  customer: 'bg-green-100 text-green-800',
};

export function PermissionManagementTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [changeDialog, setChangeDialog] = useState<{ open: boolean; user: UserWithRole | null }>({ open: false, user: null });
  const [permDialog, setPermDialog] = useState<{ open: boolean; user: UserWithRole | null }>({ open: false, user: null });
  const [newRole, setNewRole] = useState<AppRole>('staff');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const { data: usersWithRoles, isLoading } = useQuery({
    queryKey: ['all-user-roles'],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('id, user_id, role')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);
      return roles.map(r => ({
        user_id: r.user_id,
        role: r.role as AppRole,
        role_id: r.id,
        profile: profiles?.find(p => p.user_id === r.user_id) as Profile | null,
      }));
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ roleId, role }: { roleId: string; role: AppRole }) => {
      const { error } = await supabase.from('user_roles').update({ role }).eq('id', roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-user-roles'] });
      toast({ title: 'Role updated successfully' });
      setChangeDialog({ open: false, user: null });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update role', description: error.message, variant: 'destructive' });
    },
  });

  // Permission management for a specific user
  const { permissions: userPerms, isLoading: permsLoading, setPermissions: setPermsMutation } = useUserPermissions(permDialog.user?.user_id || null);

  const filtered = usersWithRoles?.filter(u => {
    const name = u.profile?.full_name?.toLowerCase() || '';
    const phone = u.profile?.phone || '';
    const email = u.profile?.email?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || phone.includes(q) || email.includes(q);
  }) || [];

  const openChangeDialog = (user: UserWithRole) => {
    setNewRole(user.role);
    setChangeDialog({ open: true, user });
  };

  const openPermDialog = (user: UserWithRole) => {
    setPermDialog({ open: true, user });
    // Will load from useUserPermissions hook
  };

  // Sync selectedPermissions when userPerms loads
  const currentPermDialogUserId = permDialog.user?.user_id;
  const [lastSyncedUserId, setLastSyncedUserId] = useState<string | null>(null);
  if (currentPermDialogUserId && currentPermDialogUserId !== lastSyncedUserId && !permsLoading) {
    setSelectedPermissions(userPerms);
    setLastSyncedUserId(currentPermDialogUserId);
  }

  const togglePermission = (key: string) => {
    setSelectedPermissions(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const selectAllForTab = (tab: PermissionTab) => {
    const tabKeys = PERMISSION_ACTIONS.map(a => buildPermissionKey(tab, a));
    const allSelected = tabKeys.every(k => selectedPermissions.includes(k));
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(k => !tabKeys.includes(k)));
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...tabKeys])]);
    }
  };

  const selectAll = () => {
    const all = getAllPermissionKeys();
    if (selectedPermissions.length === all.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(all);
    }
  };

  const savePermissions = () => {
    if (!permDialog.user) return;
    setPermsMutation.mutate(
      { userId: permDialog.user.user_id, keys: selectedPermissions },
      {
        onSuccess: () => {
          toast({ title: 'Permissions updated successfully' });
          setPermDialog({ open: false, user: null });
          setLastSyncedUserId(null);
        },
        onError: (err: Error) => {
          toast({ title: 'Failed to update permissions', description: err.message, variant: 'destructive' });
        },
      }
    );
  };

  const handleRoleChange = () => {
    if (!changeDialog.user) return;
    updateRoleMutation.mutate({ roleId: changeDialog.user.role_id, role: newRole });
  };

  const renderUserRow = (u: UserWithRole) => (
    <TableRow key={u.role_id}>
      <TableCell className="font-medium">{u.profile?.full_name || 'Unknown'}</TableCell>
      <TableCell>{u.profile?.phone || '—'}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{u.profile?.email || '—'}</TableCell>
      <TableCell>
        <Badge className={roleBadgeColors[u.role]}>{u.role.replace('_', ' ')}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => openChangeDialog(u)}>
            <UserCog className="w-4 h-4 mr-1" /> Role
          </Button>
          {u.role === 'admin' && (
            <Button variant="outline" size="sm" onClick={() => openPermDialog(u)}>
              <KeyRound className="w-4 h-4 mr-1" /> Permissions
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );

  const renderUserCard = (u: UserWithRole) => (
    <Card key={u.role_id}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-medium">{u.profile?.full_name || 'Unknown'}</p>
          <Badge className={roleBadgeColors[u.role]}>{u.role.replace('_', ' ')}</Badge>
        </div>
        {u.profile?.phone && <p className="text-sm text-muted-foreground">📞 {u.profile.phone}</p>}
        {u.profile?.email && <p className="text-sm text-muted-foreground truncate">✉️ {u.profile.email}</p>}
        <div className="flex gap-2 mt-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => openChangeDialog(u)}>
            <UserCog className="w-4 h-4 mr-1" /> Role
          </Button>
          {u.role === 'admin' && (
            <Button variant="outline" size="sm" className="flex-1" onClick={() => openPermDialog(u)}>
              <KeyRound className="w-4 h-4 mr-1" /> Perms
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-brand-teal" />
          <h1 className="text-2xl font-bold text-foreground">Permission Management</h1>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, or email..." className="pl-10" />
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardHeader><CardTitle className="text-lg">All Users & Roles</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
              ) : filtered.map(renderUserRow)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        <h2 className="text-lg font-semibold">All Users & Roles</h2>
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No users found</p>
        ) : filtered.map(renderUserCard)}
      </div>

      {/* Change Role Dialog */}
      <Dialog open={changeDialog.open} onOpenChange={(open) => setChangeDialog({ open, user: open ? changeDialog.user : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Change Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground">User</p>
              <p className="font-medium">{changeDialog.user?.profile?.full_name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Role</p>
              <Badge className={roleBadgeColors[changeDialog.user?.role || 'customer']}>{changeDialog.user?.role?.replace('_', ' ')}</Badge>
            </div>
            <div>
              <label className="text-sm font-medium">New Role</label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeDialog({ open: false, user: null })}>Cancel</Button>
            <Button onClick={handleRoleChange} disabled={updateRoleMutation.isPending}>
              {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={permDialog.open} onOpenChange={(open) => { setPermDialog({ open, user: open ? permDialog.user : null }); if (!open) setLastSyncedUserId(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5" /> Manage Permissions</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 pb-2">
            <p className="font-medium">{permDialog.user?.profile?.full_name || 'Unknown'}</p>
            <p className="text-sm text-muted-foreground">{permDialog.user?.profile?.email}</p>
          </div>

          {permsLoading ? (
            <p className="text-center py-4 text-muted-foreground">Loading permissions...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedPermissions.length === getAllPermissionKeys().length}
                  onCheckedChange={selectAll}
                />
                <span className="text-sm font-medium">Select All</span>
              </div>

              {PERMISSION_TABS.map(tab => {
                const tabKeys = PERMISSION_ACTIONS.map(a => buildPermissionKey(tab, a));
                const allTabSelected = tabKeys.every(k => selectedPermissions.includes(k));
                return (
                  <Card key={tab}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={allTabSelected} onCheckedChange={() => selectAllForTab(tab)} />
                        <span className="font-medium text-sm">{TAB_LABELS[tab]}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pl-6">
                        {PERMISSION_ACTIONS.map(action => {
                          const key = buildPermissionKey(tab, action);
                          return (
                            <div key={key} className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedPermissions.includes(key)}
                                onCheckedChange={() => togglePermission(key)}
                              />
                              <span className="text-sm capitalize">{action}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setPermDialog({ open: false, user: null }); setLastSyncedUserId(null); }}>Cancel</Button>
            <Button onClick={savePermissions} disabled={setPermsMutation.isPending}>
              {setPermsMutation.isPending ? 'Saving...' : 'Save Permissions'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
