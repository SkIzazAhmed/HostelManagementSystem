// Cookie / storage consent. 'all' allows optional storage (UTM attribution);
// 'essential' keeps only what the app needs to work (login session, offline data).
const CONSENT_KEY = 'dormdesk-consent';
const CONSENT_EVENT = 'dormdesk-consent-change';

export function getConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

export function setConsent(value) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Storage blocked: the choice still applies for this page view.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

export function onConsentChange(callback) {
  const handler = (e) => callback(e.detail);
  window.addEventListener(CONSENT_EVENT, handler);
  return () => window.removeEventListener(CONSENT_EVENT, handler);
}
