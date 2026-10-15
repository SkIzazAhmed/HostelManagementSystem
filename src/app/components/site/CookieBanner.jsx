import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie } from 'lucide-react';
import { getConsent, setConsent } from '../../../consent';

// Asks once whether optional storage (campaign attribution) may be used.
// Login sessions and offline data are essential and work either way.
export function CookieBanner() {
  const [open, setOpen] = useState(() => !getConsent());

  const choose = (value) => {
    setConsent(value);
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          role="region"
          aria-label="Cookie preferences"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm z-[70] rounded-2xl border border-border bg-card text-card-foreground shadow-2xl p-5 print:hidden"
        >
          <div className="flex items-start gap-3">
            <Cookie className="w-6 h-6 text-amber-500 mt-0.5" />
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                DormDesk stores your login session on this device. With your OK we also remember
                which campaign link brought you here, to see which outreach works.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => choose('all')}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Accept all
                </button>
                <button
                  type="button"
                  onClick={() => choose('essential')}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  Essential only
                </button>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
