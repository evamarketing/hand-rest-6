import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAddonServices, useCreateAddon, useUpdateAddon, useDeleteAddon, type AddonService } from '@/hooks/useAddons';
import { AddonFormDialog } from './AddonFormDialog';
import { useToast } from '@/hooks/use-toast';

export function AddonsTab() {
  const { data: addons, isLoading } = useAddonServices();
  const createAddon = useCreateAddon();
  const updateAddon = useUpdateAddon();
  const deleteAddon = useDeleteAddon();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AddonService | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AddonService | null>(null);

  const handleCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (addon: AddonService) => {
    setEditing(addon);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: Omit<AddonService, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editing) {
        await updateAddon.mutateAsync({ id: editing.id, ...data });
        toast({ title: 'Add-on updated' });
      } else {
        await createAddon.mutateAsync(data);
        toast({ title: 'Add-on created' });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: 'Error saving add-on', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAddon.mutateAsync(deleteTarget.id);
      toast({ title: 'Add-on deleted' });
      setDeleteTarget(null);
    } catch {
      toast({ title: 'Failed to delete add-on', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add-on Services</h1>
          <p className="text-sm text-muted-foreground">External services allocated to third-party providers. We help the customer connect with them.</p>
        </div>
        <Button variant="hero" onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Service Charge</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : !addons?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No add-on services yet
                  </TableCell>
                </TableRow>
              ) : (
                addons.map(addon => (
                  <TableRow key={addon.id}>
                    <TableCell className="font-medium">{addon.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{addon.description}</TableCell>
                    <TableCell className="font-semibold">₹{addon.price.toLocaleString()}</TableCell>
                    <TableCell>{addon.icon}</TableCell>
                    <TableCell>{addon.display_order}</TableCell>
                    <TableCell>
                      <Badge className={addon.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {addon.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(addon)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(addon)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddonFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSubmit={handleSubmit}
        isLoading={createAddon.isPending || updateAddon.isPending}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
