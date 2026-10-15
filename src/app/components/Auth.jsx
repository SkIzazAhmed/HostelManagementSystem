import { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Mail, Lock, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { LogoMark } from './brand/Logo';
import { supabase, getProfile, saveProfile } from '../../supabase';
import { getUtm } from '../../utm';

export function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        onAuthSuccess(data.user);
      } else {
        const utm = getUtm();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          ...(utm && { options: { data: { utm } } }),
        });
        if (error) throw error;

        // Save profile with corresponding role
        await saveProfile(email, role, 'approved');

        setMessage('Registration successful! You can now log in.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-16rem)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md p-8 rounded-2xl bg-card border border-border shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50" />
        
        <div className="flex justify-center mb-6">
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
            className="p-2 bg-primary/10 rounded-2xl"
          >
            <LogoMark className="w-14 h-14 rounded-xl shadow-lg" title="DormDesk" />
          </motion.div>
        </div>

        <h2 className="text-2xl font-bold text-center mb-2 text-foreground">
          {isLogin ? 'Welcome Back!' : 'Create an Account'}
        </h2>
        <p className="text-center text-muted-foreground mb-6">
          {isLogin
            ? 'Enter your credentials to access your portal'
            : 'Sign up to start booking rooms and more'}
        </p>

        {error && (
          <div role="alert" className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 text-center">
            {error}
          </div>
        )}
        
        {message && (
          <div role="status" className="mb-4 p-3 bg-green-500/10 text-green-600 dark:text-green-400 text-sm rounded-lg border border-green-500/20 text-center">
            {message}
          </div>
        )}

         <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="auth-role" className="block text-sm font-medium mb-1.5 text-foreground">Account Type</label>
              <select
                id="auth-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-foreground"
              >
                <option value="student">Student</option>
                <option value="manager">Hostel Manager</option>
              </select>
            </div>
          )}
          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium mb-1.5 text-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(error)}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="student@nst.edu"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-sm font-medium mb-1.5 text-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                aria-invalid={Boolean(error)}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                aria-controls="auth-password"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <LoaderCircle className="w-5 h-5 animate-spin motion-reduce:animate-none" />
                {isLogin ? 'Signing in…' : 'Creating account…'}
              </>
            ) : (
              <>
                {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                {isLogin ? 'Sign In' : 'Sign Up'}
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setMessage(null);
            }}
            className="text-primary font-medium hover:underline focus:outline-none"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
