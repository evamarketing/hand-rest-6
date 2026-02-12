import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sofa, BedDouble, Shirt, Zap, Wrench, Sparkles, Wind, Layers, Fan, Thermometer, LucideIcon, Check, Plus, Minus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAddonServices } from '@/hooks/useAddons';
import { useCustomFeatures } from '@/hooks/useCustomFeatures';

const MINIMUM_ORDER = 500;

const iconMap: Record<string, LucideIcon> = {
  sofa: Sofa,
  'bed-double': BedDouble,
  shirt: Shirt,
  zap: Zap,
  wrench: Wrench,
  sparkles: Sparkles,
  wind: Wind,
  layers: Layers,
  fan: Fan,
  thermometer: Thermometer,
};

interface BuildServiceFormProps {
  categoryName?: string;
  onSubmit: (selectedFeatureIds: string[], selectedAddonIds: string[], totalPrice: number) => void;
}

export function BuildServiceForm({ categoryName, onSubmit }: BuildServiceFormProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const { data: addons, isLoading: addonsLoading } = useAddonServices();
  const { data: customFeatures, isLoading: featuresLoading } = useCustomFeatures();

  const toggle = (set: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
    setFn(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const featureTotal = customFeatures?.filter(f => selectedFeatures.has(f.id)).reduce((sum, f) => sum + f.price, 0) ?? 0;
  const addonTotal = addons?.filter(a => selectedAddons.has(a.id)).reduce((sum, a) => sum + a.price, 0) ?? 0;
  const grandTotal = featureTotal + addonTotal;
  const meetsMinimum = grandTotal >= MINIMUM_ORDER;

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || Wrench;
    return <Icon className="w-5 h-5" />;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetsMinimum) return;
    onSubmit(Array.from(selectedFeatures), Array.from(selectedAddons), grandTotal);
  };

  const renderItem = (
    item: { id: string; name: string; description: string | null; icon: string; price: number },
    isSelected: boolean,
    onToggle: () => void,
    prefix: string,
    index: number,
  ) => (
    <motion.label
      key={item.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      htmlFor={`${prefix}-${item.id}`}
      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? 'border-secondary bg-secondary/5 shadow-soft'
          : 'border-border hover:border-muted-foreground/30'
      }`}
    >
      <Checkbox
        id={`${prefix}-${item.id}`}
        checked={isSelected}
        onCheckedChange={onToggle}
      />
      <span className="text-muted-foreground">{getIcon(item.icon)}</span>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-foreground">{item.name}</span>
        {item.description && (
          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {isSelected ? (
          <Minus className="w-3 h-3 text-destructive" />
        ) : (
          <Plus className="w-3 h-3 text-brand-teal" />
        )}
        <span className="font-semibold text-brand-teal">₹{item.price}</span>
      </div>
    </motion.label>
  );

  const isLoading = addonsLoading || featuresLoading;
  const loadingPlaceholder = (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <motion.form
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Intro */}
      <div className="bg-brand-light-blue rounded-xl p-4">
        <h3 className="font-semibold text-brand-navy">Build Your Service</h3>
        {categoryName && <p className="text-sm text-muted-foreground">{categoryName}</p>}
        <p className="text-xs text-muted-foreground mt-1">
          Pick the features and add-ons you need. Minimum order: <span className="font-semibold text-brand-teal">₹{MINIMUM_ORDER}</span>
        </p>
      </div>

      {/* Custom Features */}
      {customFeatures && customFeatures.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-1">🛠️ Features</h4>
          <p className="text-xs text-muted-foreground mb-4">Select the cleaning features you need.</p>
          {featuresLoading ? loadingPlaceholder : (
            <div className="space-y-3">
              {customFeatures.map((feature, index) =>
                renderItem(
                  { ...feature, icon: feature.icon ?? 'sparkles' },
                  selectedFeatures.has(feature.id),
                  () => toggle(selectedFeatures, setSelectedFeatures, feature.id),
                  'feature',
                  index,
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* Add-on Services */}
      <div>
        <h4 className="font-semibold text-foreground mb-1">⚡ Add-on Services</h4>
        <p className="text-xs text-muted-foreground mb-4">Enhance your service with extras.</p>
        {addonsLoading ? loadingPlaceholder : (
          <div className="space-y-3">
            {addons?.map((addon, index) =>
              renderItem(
                { ...addon, icon: addon.icon ?? 'wrench' },
                selectedAddons.has(addon.id),
                () => toggle(selectedAddons, setSelectedAddons, addon.id),
                'addon',
                index,
              )
            )}
          </div>
        )}
      </div>

      {/* Live Price Breakdown */}
      <motion.div layout className="bg-card border rounded-xl p-4 space-y-2 shadow-soft">
        <h4 className="font-semibold text-foreground text-sm mb-2">💰 Price Breakdown</h4>
        <AnimatePresence>
          {customFeatures?.filter(f => selectedFeatures.has(f.id)).map(feature => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex justify-between text-sm text-muted-foreground overflow-hidden"
            >
              <span className="flex items-center gap-1"><Plus className="w-3 h-3" /> {feature.name}</span>
              <span>₹{feature.price.toLocaleString()}</span>
            </motion.div>
          ))}
          {addons?.filter(a => selectedAddons.has(a.id)).map(addon => (
            <motion.div
              key={addon.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex justify-between text-sm text-muted-foreground overflow-hidden"
            >
              <span className="flex items-center gap-1"><Plus className="w-3 h-3" /> {addon.name}</span>
              <span>₹{addon.price.toLocaleString()}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {grandTotal === 0 && (
          <p className="text-sm text-muted-foreground italic">No items selected yet</p>
        )}

        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-lg font-semibold">Total</span>
          <motion.span
            key={grandTotal}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={`text-2xl font-bold ${meetsMinimum ? 'text-brand-teal' : 'text-destructive'}`}
          >
            ₹{grandTotal.toLocaleString()}
          </motion.span>
        </div>

        {!meetsMinimum && grandTotal > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-destructive mt-1"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Add ₹{(MINIMUM_ORDER - grandTotal).toLocaleString()} more to reach the minimum order of ₹{MINIMUM_ORDER}</span>
          </motion.div>
        )}
      </motion.div>

      <Button
        type="submit"
        variant="hero"
        size="xl"
        className="w-full"
        disabled={!meetsMinimum || isLoading}
      >
        {!meetsMinimum
          ? `Minimum ₹${MINIMUM_ORDER} required`
          : 'Continue to Booking'}
      </Button>
    </motion.form>
  );
}
