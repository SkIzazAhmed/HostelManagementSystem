import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Headset, X, Phone, Mail, MapPin } from 'lucide-react';
import { CONTACT } from '../../siteInfo';

export function FloatingContact() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onPointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  const telHref = `tel:${CONTACT.phone.replace(/\s/g, '')}`;

  return (
    <div ref={rootRef} className="fixed bottom-6 right-6 z-40 print:hidden">
      <AnimatePresence>
        {open && (
          <motion.div
            id="floating-contact-panel"
            role="dialog"
            aria-label="Contact DormDesk"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-72 rounded-2xl border border-border bg-card text-card-foreground shadow-2xl p-5 space-y-4"
          >
            <div>
              <p className="font-semibold">Need help?</p>
              <p className="text-sm text-muted-foreground">Reach the DormDesk hostel office.</p>
            </div>
            <div className="space-y-2">
              <a href={telHref} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <Phone className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">{CONTACT.phone}</span>
              </a>
              <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <Mail className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-medium break-all">{CONTACT.email}</span>
              </a>
              <p className="flex items-start gap-3 p-3 text-sm text-muted-foreground">
                <MapPin className="w-5 h-5 mt-0.5" />
                {CONTACT.address}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close contact options' : 'Contact us'}
        aria-expanded={open}
        aria-controls="floating-contact-panel"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xl flex items-center justify-center"
      >
        {open ? <X className="w-6 h-6" /> : <Headset className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
