import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useAllCustomFeatures, useCreateCustomFeature, useUpdateCustomFeature, useDeleteCustomFeature,
  type CustomFeature,
} from '@/hooks/useCustomFeatures';
import { CustomFeatureFormDialog } from './CustomFeatureFormDialog';
import { useToast } from '@/hooks/use-toast';

export function CustomFeaturesTab() {
  const { data: features, isLoading } = useAllCustomFeatures();
  const createFeature = useCreateCustomFeature();
  const updateFeature = useUpdateCustomFeature();
  const deleteFeature = useDeleteCustomFeature();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomFeature | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomFeature | null>(null);

  const handleCreate = () => { setEditing(null); setDialogOpen(true); };
  const handleEdit = (f: CustomFeature) => { setEditing(f); setDialogOpen(true); };

  const handleSubmit = async (data: Omit<CustomFeature, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editing) {
        await updateFeature.mutateAsync({ id: editing.id, ...data });
        toast({ title: 'Custom feature updated' });
      } else {
        await createFeature.mutateAsync(data);
        toast({ title: 'Custom feature created' });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: 'Error saving custom feature', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFeature.mutateAsync(deleteTarget.id);
      toast({ title: 'Custom feature deleted' });
      setDeleteTarget(null);
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Custom Features</h1>
        <Button variant="hero" onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Feature
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Staff Earning/Person</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : !features?.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No custom features yet
                  </TableCell>
                </TableRow>
              ) : (
                features.map(f => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{f.description}</TableCell>
                    <TableCell className="font-semibold">₹{f.price.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">₹{f.staff_earning_per_person.toLocaleString()}</TableCell>
                    <TableCell>{f.icon}</TableCell>
                    <TableCell>{f.display_order}</TableCell>
                    <TableCell>
                      <Badge className={f.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {f.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(f)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(f)}>
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

      <CustomFeatureFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSubmit={handleSubmit}
        isLoading={createFeature.isPending || updateFeature.isPending}
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
