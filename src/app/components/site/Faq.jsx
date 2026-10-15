import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { GlassCard } from '../GlassCard';

export const FAQS = [
  {
    id: 'faq-book',
    question: 'How do I book a room?',
    answer: 'Sign up or log in, open Rooms, pick a room and choose the months you need, then confirm. You get a booking reference on screen and by email.',
  },
  {
    id: 'faq-multiple',
    question: 'Can I book more than one room?',
    answer: 'No. Each student can hold one active booking at a time. Once you have a room, the Your Room dashboard opens instead of a new booking.',
  },
  {
    id: 'faq-price',
    question: 'How is the booking price calculated?',
    answer: "The room's monthly price multiplied by the number of months you select, plus a 10% service fee. The full breakdown is shown before you confirm.",
  },
  {
    id: 'faq-complaint',
    question: 'How do I raise a complaint or give feedback?',
    answer: 'Open Complaints, choose Complaint or Feedback, and fill in your room number, USN and details. Complaints are typically addressed within 24–48 hours.',
  },
  {
    id: 'faq-services',
    question: 'Which hostel services can I use?',
    answer: 'After booking, your dashboard gives you laundry pickups, the mess menu, housekeeping requests, payments, Wi-Fi details with a speed test, and support contacts.',
  },
  {
    id: 'faq-cancel',
    question: 'How do I cancel a booking?',
    answer: 'Contact the hostel office using the details in the footer or the contact button. The administration can cancel a booking and free up the room.',
  },
];

// `openRequest` ({ id, at }) comes from site search and opens that question.
export function Faq({ openRequest }) {
  const [open, setOpen] = useState(openRequest?.id || null);

  useEffect(() => {
    if (openRequest) setOpen(openRequest.id);
  }, [openRequest]);

  return (
    <section id="faq" aria-labelledby="faq-heading" className="max-w-3xl mx-auto scroll-mt-24">
      <h2 id="faq-heading" className="text-center mb-8">Frequently Asked Questions</h2>
      {/* Print shows every answer; the interactive accordion is screen-only. */}
      <dl className="hidden print:block space-y-4">
        {FAQS.map((item) => (
          <div key={item.id}>
            <dt className="font-semibold">{item.question}</dt>
            <dd>{item.answer}</dd>
          </div>
        ))}
      </dl>
      <GlassCard className="divide-y divide-border print:hidden">
        {FAQS.map((item) => {
          const isOpen = open === item.id;
          return (
            <div key={item.id} id={item.id} className="scroll-mt-24">
              <h3 className="text-base">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : item.id)}
                  aria-expanded={isOpen}
                  aria-controls={`${item.id}-panel`}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left font-medium hover:bg-muted/40 transition-colors"
                >
                  {item.question}
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={`${item.id}-panel`}
                    role="region"
                    aria-label={item.question}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-muted-foreground leading-relaxed">{item.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </GlassCard>
    </section>
  );
}
