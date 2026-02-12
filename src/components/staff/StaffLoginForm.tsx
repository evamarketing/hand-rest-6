import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import logo from '@/assets/handrest-logo.jpeg';

interface Props {
  onLogin: (mobile: string, password: string) => Promise<void>;
  onSwitchToSignup: () => void;
}

export function StaffLoginForm({ onLogin, onSwitchToSignup }: Props) {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onLogin(mobile, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <img src={logo} alt="HandRest" className="h-20 mx-auto mb-4 rounded-xl" />
            <CardTitle className="text-2xl text-brand-navy">Staff Login</CardTitle>
            <p className="text-muted-foreground">HandRest Cleaning Solutions</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Mobile Number</label>
                <Input
                  type="tel"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  placeholder="9876543210"
                  maxLength={10}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <button type="button" onClick={onSwitchToSignup} className="text-secondary font-medium hover:underline">
                  Sign Up
                </button>
              </p>

              <button
                type="button"
                onClick={() => window.location.href = '/admin'}
                className="w-full mt-2 text-xs text-muted-foreground hover:text-secondary transition-colors"
              >
                Admin Access
              </button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
