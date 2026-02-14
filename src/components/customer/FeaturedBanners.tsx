import { useState, useEffect, useCallback } from 'react';
import { Sparkles, ArrowRight, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeaturedPackages } from '@/hooks/useServices';
import useEmblaCarousel from 'embla-carousel-react';

interface FeaturedBannersProps {
  onSelectPackage: (packageId: string) => void;
}

export function FeaturedBanners({ onSelectPackage }: FeaturedBannersProps) {
  const { data: featured, isLoading } = useFeaturedPackages();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();

    // Auto-play
    const interval = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    }, 4000);

    return () => {
      clearInterval(interval);
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  if (isLoading || !featured?.length) return null;

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
        <div className="flex">
          {featured.map((pkg) => (
            <div key={pkg.id} className="flex-[0_0_100%] min-w-0 px-1">
              <div className="relative overflow-hidden gradient-brand rounded-2xl p-5 shadow-elevated">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-white" />
                    <span className="text-white/90 text-xs font-medium">Featured Offer</span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1">{pkg.name}</h3>
                  {pkg.description && (
                    <p className="text-white/80 text-sm mb-3">{pkg.description}</p>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    {pkg.discount_amount > 0 ? (
                      <>
                        <span className="text-2xl font-bold text-white">
                          ₹{(pkg.price - pkg.discount_amount).toLocaleString()}
                        </span>
                        <span className="text-white/60 line-through text-sm">
                          ₹{pkg.price.toLocaleString()}
                        </span>
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs text-white font-medium flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Save ₹{pkg.discount_amount.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-white">
                        ₹{pkg.price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={() => onSelectPackage(pkg.id)}
                    className="w-full bg-white text-brand-teal font-semibold hover:bg-white/90 rounded-full group"
                  >
                    Book Now
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      {featured.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {featured.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === selectedIndex ? 'bg-primary w-5' : 'bg-muted-foreground/30'
              }`}
              onClick={() => emblaApi?.scrollTo(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
