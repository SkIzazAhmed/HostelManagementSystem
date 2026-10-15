import { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, FileText, CircleHelp, Wrench, BedDouble, CornerDownLeft } from 'lucide-react';
import { FAQS } from './Faq';

const SERVICES = ['Laundry', 'Mess menu', 'Housekeeping', 'Payments', 'Wi-Fi', 'Support'];

// Everything the visitor is allowed to open, as searchable entries.
function buildIndex({ user, isAdmin, hasRoom, rooms }) {
  const pages = [
    { title: 'Home', view: 'home', keywords: 'welcome start dormdesk' },
    { title: 'About Us', view: 'about', keywords: 'vision newton school nst offers' },
    { title: 'FAQ', view: 'home', anchor: 'faq', keywords: 'questions help frequently asked' },
  ];
  if (!user) pages.push({ title: 'Log In / Sign Up', view: 'auth', keywords: 'login register account password' });
  if (user) {
    pages.push(
      { title: 'Rooms', view: 'rooms', keywords: 'book booking shared private beds' },
      { title: 'Services', view: 'services', keywords: SERVICES.join(' ') },
      { title: 'Complaints & Feedback', view: 'complaints', keywords: 'issue report maintenance feedback' },
    );
  }
  if (hasRoom) pages.push({ title: 'Your Room', view: 'your_room', keywords: 'dashboard booking' });
  if (isAdmin) pages.push({ title: 'Admin', view: 'admin', keywords: 'manage rooms bookings revenue' });

  const entries = pages.map((p) => ({ ...p, id: `page-${p.title}`, group: 'Pages', icon: FileText }));

  FAQS.forEach((f) => entries.push({
    id: f.id, title: f.question, view: 'home', anchor: f.id, keywords: f.answer, group: 'FAQ', icon: CircleHelp,
  }));

  if (user) {
    SERVICES.forEach((s) => entries.push({
      id: `service-${s}`, title: s, view: 'services', keywords: 'service', group: 'Services', icon: Wrench,
    }));
    rooms.forEach((r) => entries.push({
      id: `room-${r.id}`, title: r.name, subtitle: `${r.type} room · ₹${Number(r.price).toLocaleString()}/month`,
      view: 'rooms', keywords: `${r.type} room`, group: 'Rooms', icon: BedDouble,
    }));
  }
  return entries;
}

export function SiteSearch({ open, onOpenChange, user, isAdmin, hasRoom, rooms, onNavigate }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const index = useMemo(() => buildIndex({ user, isAdmin, hasRoom, rooms }), [user, isAdmin, hasRoom, rooms]);

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return index.filter((e) => e.group === 'Pages');
    return index
      .filter((e) => {
        const haystack = `${e.title} ${e.subtitle || ''} ${e.keywords}`.toLowerCase();
        return terms.every((t) => haystack.includes(t));
      })
      .slice(0, 12);
  }, [query, index]);

  // Ctrl+K / ⌘K opens search from anywhere on the main site.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onOpenChange]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const select = (entry) => {
    onOpenChange(false);
    onNavigate(entry.view, entry.anchor);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      select(results[active]);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed z-[81] left-1/2 top-[12vh] -translate-x-1/2 w-[calc(100%-2rem)] max-w-xl rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Search DormDesk</Dialog.Title>
          <div className="flex items-center gap-3 px-4 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search pages, rooms, services, FAQ…"
              role="combobox"
              aria-expanded="true"
              aria-controls="site-search-results"
              aria-activedescendant={results[active] ? `search-${results[active].id}` : undefined}
              aria-label="Search DormDesk"
              className="flex-1 h-14 bg-transparent outline-none text-base [&::-webkit-search-cancel-button]:appearance-none"
            />
            <kbd className="hidden sm:block text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">Esc</kbd>
          </div>
          <ul id="site-search-results" role="listbox" aria-label="Search results" className="max-h-[50vh] overflow-y-auto p-2">
            {results.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">No results for “{query}”.</li>
            )}
            {results.map((entry, i) => (
              <li
                key={entry.id}
                id={`search-${entry.id}`}
                role="option"
                aria-selected={i === active}
                onClick={() => select(entry)}
                onMouseMove={() => setActive(i)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer ${i === active ? 'bg-muted' : ''}`}
              >
                <entry.icon className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{entry.title}</p>
                  {entry.subtitle && <p className="text-xs text-muted-foreground truncate">{entry.subtitle}</p>}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{entry.group}</span>
                {i === active && <CornerDownLeft className="w-3.5 h-3.5 text-muted-foreground" />}
              </li>
            ))}
          </ul>
          {!user && (
            <p className="px-4 py-2.5 border-t border-border text-xs text-muted-foreground">Log in to search rooms and services.</p>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
