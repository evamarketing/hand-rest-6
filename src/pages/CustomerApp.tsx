import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Search, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SplashScreen } from '@/components/customer/SplashScreen';
import { ServiceCard } from '@/components/customer/ServiceCard';
import { FeaturedBanners } from '@/components/customer/FeaturedBanners';
import { BuildServiceForm } from '@/components/customer/BuildServiceForm';
import { BookingForm, BookingFormData } from '@/components/customer/BookingForm';
import { CustomerProfile } from '@/components/customer/CustomerProfile';
import { useServiceCategories } from '@/hooks/useServices';
import { useCreateBooking } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/handrest-logo.jpeg';
import type { ServiceCategory } from '@/types/database';
import { Navigate } from 'react-router-dom';

type Screen = 'splash' | 'home' | 'build_service' | 'booking' | 'confirmation' | 'profile';

export default function CustomerApp() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [bookingNumber, setBookingNumber] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  const { data: categories, isLoading: categoriesLoading } = useServiceCategories();
  const createBooking = useCreateBooking();
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/" replace />;
  }

  const handleSplashComplete = () => setScreen('home');

  const handleCategorySelect = (category: ServiceCategory) => {
    setSelectedCategory(category);
    setScreen('build_service');
  };

  const handleBuildServiceSubmit = (featureIds: string[], addonIds: string[], total: number) => {
    setSelectedFeatureIds(featureIds);
    setSelectedAddonIds(addonIds);
    setTotalPrice(total);
    setScreen('booking');
  };

  const handleFeaturedPackageSelect = (packageId: string) => {
    // Go to build service - no category filter for featured
    setSelectedCategory(null);
    setScreen('build_service');
  };

  const handleBookingSubmit = async (data: BookingFormData) => {
    try {
      const booking = await createBooking.mutateAsync({
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        panchayath_id: data.panchayath_id || undefined,
        landmark: data.landmark,
        property_sqft: data.property_sqft,
        scheduled_date: data.scheduled_date,
        scheduled_time: data.scheduled_time,
        special_instructions: data.special_instructions,
        base_price: totalPrice,
        addon_price: 0,
        total_price: totalPrice,
      });

      setBookingNumber(booking.booking_number);
      setScreen('confirmation');

      toast({
        title: 'Booking Confirmed!',
        description: `Your booking number is ${booking.booking_number}`,
      });
    } catch (error) {
      toast({
        title: 'Booking Failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleBack = () => {
    if (screen === 'build_service') {
      setSelectedCategory(null);
      setScreen('home');
    } else if (screen === 'booking') {
      setScreen('build_service');
    } else if (screen === 'confirmation') {
      setSelectedCategory(null);
      setTotalPrice(0);
      setSelectedFeatureIds([]);
      setSelectedAddonIds([]);
      setBookingNumber('');
      setScreen('home');
    } else if (screen === 'profile') {
      setScreen('home');
    }
  };

  const screenTitle = () => {
    switch (screen) {
      case 'home': return 'HandRest';
      case 'build_service': return selectedCategory?.name || 'Build Your Service';
      case 'booking': return 'Book Service';
      case 'confirmation': return 'Booking Confirmed';
      case 'profile': return 'My Account';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence>
        {screen === 'splash' && (
          <SplashScreen onComplete={handleSplashComplete} />
        )}
      </AnimatePresence>

      {screen !== 'splash' && (
        <>
          {/* Header */}
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              {screen !== 'home' ? (
                <Button variant="ghost" size="icon" onClick={handleBack}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              ) : (
                <img src={logo} alt="HandRest" className="h-10 object-contain" />
              )}

              <h1 className="text-lg font-semibold text-brand-navy">
                {screenTitle()}
              </h1>

              <div className="flex items-center gap-1">
                {screen === 'home' && (
                  <Button variant="ghost" size="icon" onClick={() => setScreen('profile')}>
                    <User className="w-5 h-5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => signOut()} className="text-muted-foreground">
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-4 py-6 pb-24">
            {/* Home Screen */}
            {screen === 'home' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="text-center py-4">
                  <p className="text-brand-teal font-medium italic">
                    "You Relax. We Restore."
                  </p>
                </div>

                {/* Featured Package Banners */}
                <FeaturedBanners onSelectPackage={handleFeaturedPackageSelect} />

                <div className="bg-card rounded-xl p-4 shadow-soft">
                  <h3 className="font-semibold text-foreground mb-3">Track Your Booking</h3>
                  <div className="flex gap-2">
                    <Input
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter booking number"
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon">
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">Our Services</h2>
                  {categoriesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {categories?.map((category, index) => (
                        <ServiceCard
                          key={category.id}
                          category={category}
                          onClick={() => handleCategorySelect(category)}
                          index={index}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Build Service Screen */}
            {screen === 'build_service' && (
              <BuildServiceForm
                categoryName={selectedCategory?.name}
                categoryId={selectedCategory?.id}
                onSubmit={handleBuildServiceSubmit}
              />
            )}

            {/* Booking Form Screen */}
            {screen === 'booking' && (
              <BookingForm
                totalPrice={totalPrice}
                onSubmit={handleBookingSubmit}
                isLoading={createBooking.isPending}
              />
            )}

            {/* Confirmation Screen */}
            {screen === 'confirmation' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 gradient-brand rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>

                <h2 className="text-2xl font-bold text-brand-navy mb-2">
                  Booking Confirmed!
                </h2>

                <p className="text-muted-foreground mb-6">
                  Thank you for choosing HandRest Cleaning Solutions
                </p>

                <div className="bg-brand-light-blue rounded-xl p-6 mb-8">
                  <p className="text-sm text-muted-foreground mb-2">Booking Number</p>
                  <p className="text-3xl font-bold text-brand-navy">{bookingNumber}</p>
                </div>

                <p className="text-sm text-muted-foreground mb-8">
                  We'll send a confirmation to your email with all the details.
                  Our team will contact you before the scheduled time.
                </p>

                <Button variant="hero" size="xl" onClick={handleBack}>
                  Book Another Service
                </Button>
              </motion.div>
            )}

            {/* Profile Screen */}
            {screen === 'profile' && <CustomerProfile />}
          </main>

          {screen === 'home' && (
            <nav className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-elevated">
              <div className="container mx-auto px-4 h-20 flex items-center justify-center">
                <Button variant="hero" size="xl" onClick={() => setScreen('home')}>
                  Book Now
                </Button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
