import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { AddonService } from '@/hooks/useAddons';

type AddonFormData = Omit<AddonService, 'id' | 'created_at' | 'updated_at'>;

interface AddonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: AddonService | null;
  onSubmit: (data: AddonFormData) => void;
  isLoading: boolean;
}

export function AddonFormDialog({ open, onOpenChange, editing, onSubmit, isLoading }: AddonFormDialogProps) {
  const [form, setForm] = useState<AddonFormData>({
    name: '',
    description: '',
    price: 0,
    icon: 'wrench',
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        description: editing.description,
        price: editing.price,
        icon: editing.icon,
        is_active: editing.is_active,
        display_order: editing.display_order,
      });
    } else {
      setForm({ name: '', description: '', price: 0, icon: 'wrench', is_active: true, display_order: 0 });
    }
  }, [editing, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Add-on' : 'Create Add-on'}</DialogTitle>
          <p className="text-sm text-muted-foreground">External service — job allocated to third-party provider</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Service Charge (₹)</Label>
              <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} required min={0} />
            </div>
            <div>
              <Label>Icon name</Label>
              <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="e.g. sofa, zap, wrench" />
            </div>
          </div>
          <div>
            <Label>Display Order</Label>
            <Input type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
            <Label>Active</Label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="hero" disabled={isLoading}>
              {isLoading ? 'Saving...' : editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
