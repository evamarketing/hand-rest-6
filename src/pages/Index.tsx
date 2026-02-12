import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { CustomerAuthForm } from '@/components/customer/CustomerAuthForm';
import logo from '@/assets/handrest-logo.jpeg';

type View = 'home' | 'customer';

const Index = () => {
  const [view, setView] = useState<View>('customer');
  const { user, role } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect
  if (user && role === 'staff') {
    navigate('/staff');
    return null;
  }
  if (user && (role === 'customer')) {
    navigate('/app');
    return null;
  }
  if (user && (role === 'admin' || role === 'super_admin')) {
    navigate('/admin');
    return null;
  }

  return (
    <div className="min-h-screen gradient-hero flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />

      {/* Staff icon - top right */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-muted-foreground hover:text-secondary"
        onClick={() => navigate('/staff')}
        title="Staff Login"
      >
        <Briefcase className="w-5 h-5" />
      </Button>

      <AnimatePresence mode="wait">
        <motion.div
          key="customer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex flex-col items-center w-full max-w-md"
        >
          {/* Logo */}
          <motion.img
            src={logo}
            alt="HandRest Cleaning Solutions"
            className="h-28 w-28 rounded-2xl shadow-elevated mb-6"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          />

          <h1 className="text-3xl font-bold text-primary mb-2">
            HandRest
          </h1>
          <p className="text-muted-foreground mb-2 text-lg">Cleaning Solutions</p>
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="w-4 h-4 text-secondary" />
            <p className="text-secondary font-medium italic text-sm">
              "You Relax. We Restore."
            </p>
            <Sparkles className="w-4 h-4 text-secondary" />
          </div>

          <CustomerAuthForm
            onBack={() => {}}
            onLoginSuccess={() => navigate('/app')}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Index;
