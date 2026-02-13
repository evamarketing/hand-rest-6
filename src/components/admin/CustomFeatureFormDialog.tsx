import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import type { CustomFeature } from '@/hooks/useCustomFeatures';

type FormData = Omit<CustomFeature, 'id' | 'created_at' | 'updated_at'>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: CustomFeature | null;
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}

export function CustomFeatureFormDialog({ open, onOpenChange, editing, onSubmit, isLoading }: Props) {
  const [form, setForm] = useState<FormData>({
    name: '', description: '', price: 0, icon: 'sparkles', is_active: true, display_order: 0, staff_earning_per_person: 0,
  });

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name, description: editing.description, price: editing.price,
        icon: editing.icon, is_active: editing.is_active, display_order: editing.display_order,
        staff_earning_per_person: editing.staff_earning_per_person,
      });
    } else {
      setForm({ name: '', description: '', price: 0, icon: 'sparkles', is_active: true, display_order: 0, staff_earning_per_person: 0 });
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
          <DialogTitle>{editing ? 'Edit Custom Feature' : 'Create Custom Feature'}</DialogTitle>
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
              <Label>Price (₹)</Label>
              <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} required min={0} />
            </div>
            <div>
              <Label>Icon name</Label>
              <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="e.g. sparkles, wind" />
            </div>
          </div>
          <div>
            <Label>Staff Earning Per Person (₹)</Label>
            <Input type="number" value={form.staff_earning_per_person} onChange={e => setForm(f => ({ ...f, staff_earning_per_person: Number(e.target.value) }))} min={0} />
            <p className="text-xs text-muted-foreground mt-1">Internal: amount each staff earns when this feature is part of a completed job</p>
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
