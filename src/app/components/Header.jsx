import { Menu, X, House, Bed, Info, Settings, Wrench, MessageSquareWarning, LogIn, LogOut } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogoMark } from './brand/Logo';

export function Header({ currentView, onViewChange, user, isAdmin, onLogout, hasRoom }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If not logged in, restrict nav items.
  const allNavItems = [
    { id: 'home', label: 'Home', icon: House },
    { id: 'about', label: 'About Us', icon: Info },
    { id: 'rooms', label: 'Rooms', icon: Bed },
    { id: 'services', label: 'Services', icon: Wrench },
    { id: 'complaints', label: 'Complaints', icon: MessageSquareWarning },
  ];

  if (isAdmin) {
    allNavItems.push({ id: 'admin', label: 'Admin', icon: Settings });
  }

  if (hasRoom) {
    allNavItems.push({ id: 'your_room', label: 'Your Room', icon: Bed });
  }

  const navItems = user 
    ? allNavItems 
    : allNavItems.filter(item => ['home', 'about'].includes(item.id));

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="backdrop-blur-xl bg-primary/95 text-primary-foreground sticky top-0 z-50 shadow-lg border-b border-primary-foreground/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <motion.button
            type="button"
            className="flex items-center gap-3 cursor-pointer rounded-lg"
            whileHover={{ scale: 1.05 }}
            onClick={() => onViewChange('home')}
            aria-label="DormDesk home"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <LogoMark className="w-9 h-9 shadow-md rounded-lg" />
            </motion.div>
            <span className="font-semibold text-lg">DormDesk</span>
          </motion.button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-2 items-center" aria-label="Main">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  currentView === item.id
                    ? 'bg-primary-foreground/20'
                    : 'hover:bg-primary-foreground/10'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-current={currentView === item.id ? 'page' : undefined}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {currentView === item.id && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-primary-foreground/20 rounded-lg -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            ))}
            
            <div className="w-px h-6 bg-primary-foreground/20 mx-2" />
            
            {user ? (
              <motion.button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg shadow-md hover:bg-destructive/90 transition-all font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </motion.button>
            ) : (
              <motion.button
                onClick={() => onViewChange('auth')}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg shadow-md hover:bg-secondary/90 transition-all font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogIn className="w-4 h-4" />
                Log In / Sign Up
              </motion.button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <motion.button
            className="md:hidden p-2 rounded-lg hover:bg-primary-foreground/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            whileTap={{ scale: 0.9 }}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
              id="mobile-nav"
              aria-label="Main"
            >
              <div className="py-4 space-y-2">
                {navItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => {
                      onViewChange(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      currentView === item.id
                        ? 'bg-primary-foreground/20'
                        : 'hover:bg-primary-foreground/10'
                    }`}
                    whileTap={{ scale: 0.95 }}
                    aria-current={currentView === item.id ? 'page' : undefined}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </motion.button>
                ))}
                
                <div className="h-px w-full bg-primary-foreground/20 my-2" />
                
                {user ? (
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: navItems.length * 0.1 }}
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-destructive text-destructive-foreground rounded-lg transition-all shadow-md font-medium"
                    whileTap={{ scale: 0.95 }}
                  >
                    <LogOut className="w-5 h-5" />
                    Log Out
                  </motion.button>
                ) : (
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: navItems.length * 0.1 }}
                    onClick={() => {
                      onViewChange('auth');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-secondary-foreground rounded-lg transition-all shadow-md font-medium"
                    whileTap={{ scale: 0.95 }}
                  >
                    <LogIn className="w-5 h-5" />
                    Log In / Sign Up
                  </motion.button>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
