import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sofa, BedDouble, Shirt, Zap, Wrench, Sparkles, Wind, Layers, Fan, Thermometer, LucideIcon, Check, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAddonServices, type AddonService } from '@/hooks/useAddons';
import { useCustomFeatures, type CustomFeature } from '@/hooks/useCustomFeatures';
import type { Package } from '@/types/database';

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

interface AddOnServicesFormProps {
  pkg: Package;
  onSubmit: (selectedAddOns: string[], totalAddonPrice: number) => void;
}

export function AddOnServicesForm({ pkg, onSubmit }: AddOnServicesFormProps) {
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
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

  const addonTotal = addons?.filter(a => selectedAddons.has(a.id)).reduce((sum, a) => sum + a.price, 0) ?? 0;
  const featureTotal = customFeatures?.filter(f => selectedFeatures.has(f.id)).reduce((sum, f) => sum + f.price, 0) ?? 0;
  const grandTotal = pkg.price + addonTotal + featureTotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allSelected = [...Array.from(selectedAddons), ...Array.from(selectedFeatures)];
    onSubmit(allSelected, addonTotal + featureTotal);
  };

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || Wrench;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <motion.form
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Selected Package Summary */}
      <div className="bg-brand-light-blue rounded-xl p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-brand-navy">{pkg.name}</h3>
            <p className="text-sm text-muted-foreground">{pkg.category?.name}</p>
          </div>
          <p className="text-lg font-bold text-brand-teal">₹{pkg.price.toLocaleString()}</p>
        </div>
      </div>

      {/* Included Features */}
      {pkg.features && pkg.features.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-3">✅ Included in your package</h4>
          <div className="bg-muted/40 rounded-xl p-4 space-y-2">
            {pkg.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-brand-teal shrink-0" />
                <span className="text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customizable Add-on Services */}
      <div>
        <h4 className="font-semibold text-foreground mb-1">⚡ Add-on Services</h4>
        <p className="text-xs text-muted-foreground mb-4">
          External services handled by third-party providers. Service charge applies.
        </p>
        {addonsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {addons?.map((addon, index) => {
              const isSelected = selectedAddons.has(addon.id);
              return (
                <motion.label
                  key={addon.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  htmlFor={`addon-${addon.id}`}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-secondary bg-secondary/5 shadow-soft'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <Checkbox
                    id={`addon-${addon.id}`}
                    checked={isSelected}
                    onCheckedChange={() => toggle(selectedAddons, setSelectedAddons, addon.id)}
                  />
                  <span className="text-muted-foreground">{getIcon(addon.icon)}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-foreground">{addon.name}</span>
                    {addon.description && (
                      <p className="text-xs text-muted-foreground truncate">{addon.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isSelected ? (
                      <Minus className="w-3 h-3 text-destructive" />
                    ) : (
                      <Plus className="w-3 h-3 text-brand-teal" />
                    )}
                    <span className="font-semibold text-brand-teal">₹{addon.price} <span className="text-[10px] font-normal text-muted-foreground">charge</span></span>
                  </div>
                </motion.label>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Features */}
      {customFeatures && customFeatures.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-1">🛠️ Custom Features</h4>
          <p className="text-xs text-muted-foreground mb-4">
            Pick individual features to add to any package.
          </p>
          {featuresLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {customFeatures.map((feature, index) => {
                const isSelected = selectedFeatures.has(feature.id);
                return (
                  <motion.label
                    key={feature.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    htmlFor={`feature-${feature.id}`}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-secondary bg-secondary/5 shadow-soft'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <Checkbox
                      id={`feature-${feature.id}`}
                      checked={isSelected}
                      onCheckedChange={() => toggle(selectedFeatures, setSelectedFeatures, feature.id)}
                    />
                    <span className="text-muted-foreground">{getIcon(feature.icon)}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground">{feature.name}</span>
                      {feature.description && (
                        <p className="text-xs text-muted-foreground truncate">{feature.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isSelected ? (
                        <Minus className="w-3 h-3 text-destructive" />
                      ) : (
                        <Plus className="w-3 h-3 text-brand-teal" />
                      )}
                      <span className="font-semibold text-brand-teal">₹{feature.price}</span>
                    </div>
                  </motion.label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Live Price Breakdown */}
      <motion.div
        layout
        className="bg-card border rounded-xl p-4 space-y-2 shadow-soft"
      >
        <h4 className="font-semibold text-foreground text-sm mb-2">💰 Price Breakdown</h4>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Base Package ({pkg.name})</span>
          <span>₹{pkg.price.toLocaleString()}</span>
        </div>
        <AnimatePresence>
          {addons?.filter(a => selectedAddons.has(a.id)).map(addon => (
            <motion.div
              key={addon.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex justify-between text-sm text-muted-foreground overflow-hidden"
            >
              <span className="flex items-center gap-1">
                <Plus className="w-3 h-3" /> {addon.name}
              </span>
              <span>₹{addon.price.toLocaleString()}</span>
            </motion.div>
          ))}
          {customFeatures?.filter(f => selectedFeatures.has(f.id)).map(feature => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex justify-between text-sm text-muted-foreground overflow-hidden"
            >
              <span className="flex items-center gap-1">
                <Plus className="w-3 h-3" /> {feature.name}
              </span>
              <span>₹{feature.price.toLocaleString()}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-lg font-semibold">Total</span>
          <motion.span
            key={grandTotal}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold text-brand-teal"
          >
            ₹{grandTotal.toLocaleString()}
          </motion.span>
        </div>
      </motion.div>

      <Button type="submit" variant="hero" size="xl" className="w-full">
        Continue to Booking
      </Button>
    </motion.form>
  );
}
