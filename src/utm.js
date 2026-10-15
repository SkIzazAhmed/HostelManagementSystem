import { getConsent, onConsentChange } from './consent';

// First-touch UTM attribution. Campaign parameters are read from the landing URL,
// kept in memory, and only written to localStorage once the visitor accepts
// optional cookies. They are attached to new sign-ups as Supabase user metadata.
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
const UTM_STORAGE_KEY = 'dormdesk-utm';

let pending = null;

function readStored() {
  try {
    return JSON.parse(localStorage.getItem(UTM_STORAGE_KEY));
  } catch {
    return null;
  }
}

function persist() {
  if (!pending || readStored()) return; // keep the first touch
  try {
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(pending));
  } catch {
    // Storage blocked: attribution stays in memory for this visit.
  }
}

export function captureUtm() {
  const url = new URL(window.location.href);
  const found = {};
  for (const key of UTM_KEYS) {
    const value = url.searchParams.get(key);
    if (value) found[key] = value.slice(0, 200);
    url.searchParams.delete(key);
  }
  if (Object.keys(found).length === 0) return;

  pending = { ...found, landing_page: url.pathname, captured_at: new Date().toISOString() };
  // Remove the parameters so shared or bookmarked links stay clean.
  window.history.replaceState(window.history.state, '', url.toString());

  if (getConsent() === 'all') persist();
  onConsentChange((value) => {
    if (value === 'all') persist();
  });
}

export function getUtm() {
  if (getConsent() !== 'all') return null;
  return readStored() || pending;
}
