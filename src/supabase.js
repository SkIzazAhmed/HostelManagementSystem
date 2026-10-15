import { createClient } from '@supabase/supabase-js';

// ─── Supabase Client ─────────────────────────────────────────────────────────
// Get these values from: Supabase Dashboard → Project Settings → API
const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     || 'https://rxgbkvdiyjtgnoyhdfdd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ElIe7b-_7wsEJdZyrP7aUA_6U_HB1Kd';

console.log('🔌 [DormDesk] Supabase URL:', supabaseUrl);
console.log('🔑 [DormDesk] Supabase Key prefix:', supabaseAnonKey ? supabaseAnonKey.substring(0, 15) + '...' : 'none');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const handleDbError = (operation, error) => {
  const msg = error?.message || error || 'Unknown database error';
  console.error(`❌ [DormDesk] DB Error (${operation}):`, msg);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dormdesk-db-error', { 
      detail: `${operation} failed: ${msg}` 
    }));
  }
};

// Debug: log connection errors to console so you can see them
supabase.from('rooms').select('count', { count: 'exact', head: true }).then(({ error }) => {
  if (error) {
    console.error('⚠️ Supabase connection issue:', error.message);
    console.error('   Check your URL and anon key in supabase.js or .env file');
    console.error('   Tables might not exist — run supabase_setup.sql in your SQL editor');
    handleDbError('Database Connection Test', error);
  } else {
    console.log('✅ Supabase connected successfully');
  }
});

// ─── Generic localStorage helpers ────────────────────────────────────────────
const ls = {
  get: (key, fallback = []) => {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
    catch { return fallback; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  update: (key, id, updates, fallback = []) => {
    const items = ls.get(key, fallback);
    const idx = items.findIndex(i => i.id === id);
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...updates };
      ls.set(key, items);
      return items[idx];
    }
    return null;
  },
  upsert: (key, item, matchField = 'email', fallback = []) => {
    const items = ls.get(key, fallback);
    const idx = items.findIndex(i => i[matchField] === item[matchField]);
    if (idx >= 0) items[idx] = { ...items[idx], ...item };
    else items.push(item);
    ls.set(key, items);
    return item;
  },
};

// ─── COMPLAINTS ──────────────────────────────────────────────────────────────

// Returns { data, error } so forms can show a success or error state.
export async function addComplaint(complaint) {
  const { data, error } = await supabase
    .from('complaints')
    .insert([{
      date: complaint.date,
      type: complaint.type,
      room_no: complaint.roomNo,
      usn: complaint.usn,
      category: complaint.category,
      context: complaint.context,
      email: complaint.email
    }])
    .select();
  return { data, error };
}

// ─── PROFILES ────────────────────────────────────────────────────────────────
export async function getProfile(email) {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    if (data) {
      const dbProfile = { ...data, synced: true };
      ls.upsert('dormdesk_profiles', dbProfile);
      return dbProfile;
    }
  } catch (e) {
    handleDbError('Get Profile', e);
  }
  return ls.get('dormdesk_profiles', []).find(p => p.email === email) || null;
}

export async function saveProfile(email, role, status = 'approved') {
  const profile = { email, role, status };
  // Always write to localStorage immediately
  ls.upsert('dormdesk_profiles', profile);
  try {
    const { data, error } = await supabase.from('profiles').upsert(profile, { onConflict: 'email' }).select();
    if (error) throw error;
    if (data?.[0]) {
      const dbProfile = { ...data[0], synced: true };
      ls.upsert('dormdesk_profiles', dbProfile);
      return dbProfile;
    }
  } catch (e) {
    handleDbError('Save Profile', e);
  }
  return profile;
}

export async function getProfiles() {
  try {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    if (data) {
      const syncedData = data.map(p => ({ ...p, synced: true }));
      ls.set('dormdesk_profiles', syncedData);
      return syncedData;
    }
  } catch (e) {
    handleDbError('Get Profiles', e);
  }
  return ls.get('dormdesk_profiles', []);
}

export async function updateProfileStatus(email, status) {
  // Optimistic local update first
  const local = ls.update('dormdesk_profiles', undefined, { status }, []);
  const localProfiles = ls.get('dormdesk_profiles', []);
  const idx = localProfiles.findIndex(p => p.email === email);
  if (idx >= 0) { localProfiles[idx].status = status; ls.set('dormdesk_profiles', localProfiles); }
  
  try {
    const { data, error } = await supabase.from('profiles').update({ status }).eq('email', email).select();
    if (error) throw error;
    if (data?.[0]) {
      const dbProfile = { ...data[0], synced: true };
      const lp = ls.get('dormdesk_profiles', []);
      const i = lp.findIndex(p => p.email === email);
      if (i >= 0) { lp[i] = dbProfile; ls.set('dormdesk_profiles', lp); }
      return dbProfile;
    }
  } catch (e) {
    handleDbError('Update Profile Status', e);
  }
  return localProfiles[idx] || null;
}

// ─── LAUNDRY REQUESTS ────────────────────────────────────────────────────────
export async function getLaundryRequests() {
  try {
    const { data, error } = await supabase.from('laundry_requests').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    if (data) {
      const syncedData = data.map(item => ({ ...item, synced: true }));
      ls.set('dormdesk_laundries', syncedData);
      return syncedData;
    }
  } catch (e) {
    handleDbError('Get Laundry Requests', e);
  }
  return ls.get('dormdesk_laundries', []);
}

export async function addLaundryRequest({ user_email, room_name, type }) {
  const newReq = {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    user_email, room_name, type,
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  // Optimistic local insert
  const local = ls.get('dormdesk_laundries', []);
  local.unshift(newReq);
  ls.set('dormdesk_laundries', local);

  try {
    const { data, error } = await supabase.from('laundry_requests').insert([{
      user_email, room_name, type, status: 'pending'
    }]).select();
    if (error) throw error;
    if (data?.[0]) {
      const dbRecord = { ...data[0], synced: true };
      const l = ls.get('dormdesk_laundries', []);
      const idx = l.findIndex(r => r.id === newReq.id);
      if (idx >= 0) l[idx] = dbRecord; else l.unshift(dbRecord);
      ls.set('dormdesk_laundries', l);
      return dbRecord;
    }
  } catch (e) {
    handleDbError('Add Laundry Request', e);
  }
  return newReq;
}

export async function updateLaundryRequestStatus(id, status) {
  // Optimistic update
  const localResult = ls.update('dormdesk_laundries', id, { status });
  
  try {
    const { data, error } = await supabase.from('laundry_requests').update({ status }).eq('id', id).select();
    if (error) throw error;
    if (data?.[0]) {
      const dbRecord = { ...data[0], synced: true };
      ls.update('dormdesk_laundries', id, dbRecord);
      return dbRecord;
    }
  } catch (e) {
    handleDbError('Update Laundry Request Status', e);
  }
  return localResult;
}

// ─── ROOM SERVICES ───────────────────────────────────────────────────────────
export async function getRoomServices() {
  try {
    const { data, error } = await supabase.from('room_services').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    if (data) {
      const syncedData = data.map(item => ({ ...item, synced: true }));
      ls.set('dormdesk_room_services', syncedData);
      return syncedData;
    }
  } catch (e) {
    handleDbError('Get Room Services', e);
  }
  return ls.get('dormdesk_room_services', []);
}

export async function addRoomService({ user_email, room_name, type }) {
  const newReq = {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    user_email, room_name, type,
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  // Optimistic local insert
  const local = ls.get('dormdesk_room_services', []);
  local.unshift(newReq);
  ls.set('dormdesk_room_services', local);

  try {
    const { data, error } = await supabase.from('room_services').insert([{
      user_email, room_name, type, status: 'pending'
    }]).select();
    if (error) throw error;
    if (data?.[0]) {
      const dbRecord = { ...data[0], synced: true };
      const l = ls.get('dormdesk_room_services', []);
      const idx = l.findIndex(r => r.id === newReq.id);
      if (idx >= 0) l[idx] = dbRecord; else l.unshift(dbRecord);
      ls.set('dormdesk_room_services', l);
      return dbRecord;
    }
  } catch (e) {
    handleDbError('Add Room Service', e);
  }
  return newReq;
}

export async function updateRoomServiceStatus(id, status) {
  // Optimistic update — works even without DB
  const localResult = ls.update('dormdesk_room_services', id, { status });

  try {
    const { data, error } = await supabase.from('room_services').update({ status }).eq('id', id).select();
    if (error) throw error;
    if (data?.[0]) {
      const dbRecord = { ...data[0], synced: true };
      ls.update('dormdesk_room_services', id, dbRecord);
      return dbRecord;
    }
  } catch (e) {
    handleDbError('Update Room Service Status', e);
  }
  return localResult;
}

// ─── MESS MENU ────────────────────────────────────────────────────────────────
const DEFAULT_MENU = [
  { meal: 'Breakfast', time: '7:30 AM – 9:00 AM', items: 'Idli, Dosa, Poha, Bread & Eggs, Tea/Coffee' },
  { meal: 'Lunch',     time: '12:30 PM – 2:00 PM', items: 'Rice, Dal, Sabzi, Roti, Curd, Salad' },
  { meal: 'Snacks',    time: '4:30 PM – 5:30 PM',  items: 'Samosa, Tea, Biscuits' },
  { meal: 'Dinner',    time: '7:30 PM – 9:00 PM',  items: 'Rice, Dal, Paneer/Chicken, Roti, Sweet' },
];

export async function getMessMenu() {
  try {
    const { data, error } = await supabase.from('mess_menu').select('*').order('id');
    if (error) throw error;
    if (data?.length > 0) { ls.set('dormdesk_mess_menu', data); return data; }
  } catch (e) {
    handleDbError('Get Mess Menu', e);
  }
  return ls.get('dormdesk_mess_menu', DEFAULT_MENU);
}

export async function saveMessMenu(schedule) {
  // Save locally first
  ls.set('dormdesk_mess_menu', schedule);

  try {
    const { error } = await supabase.from('mess_menu').upsert(schedule, { onConflict: 'meal' });
    if (error) throw error;
  } catch (e) {
    handleDbError('Save Mess Menu', e);
  }
  return schedule;
}

// ─── SYNC LOCAL OFFLINE DATA TO CENTRAL SUPABASE ─────────────────────────────
export async function syncLocalData(userEmail) {
  if (!userEmail || typeof window === 'undefined') return;
  console.log('🔄 [DormDesk] Starting background sync of offline local data for:', userEmail);

  // 1. Sync Laundry Requests
  const laundries = ls.get('dormdesk_laundries', []);
  let laundryChanged = false;
  for (let i = 0; i < laundries.length; i++) {
    const item = laundries[i];
    if (!item.synced && item.user_email === userEmail) {
      try {
        const { data, error } = await supabase.from('laundry_requests').insert([{
          user_email: item.user_email,
          room_name: item.room_name,
          type: item.type,
          status: item.status || 'pending'
        }]).select();
        
        if (!error && data?.[0]) {
          laundries[i] = { ...data[0], synced: true };
          laundryChanged = true;
          console.log('✅ [DormDesk] Synced laundry request:', item.type);
        }
      } catch (e) {
        console.error('❌ Failed to sync laundry request:', e);
      }
    }
  }
  if (laundryChanged) ls.set('dormdesk_laundries', laundries);

  // 2. Sync Room Services
  const services = ls.get('dormdesk_room_services', []);
  let servicesChanged = false;
  for (let i = 0; i < services.length; i++) {
    const item = services[i];
    if (!item.synced && item.user_email === userEmail) {
      try {
        const { data, error } = await supabase.from('room_services').insert([{
          user_email: item.user_email,
          room_name: item.room_name,
          type: item.type,
          status: item.status || 'pending'
        }]).select();
        
        if (!error && data?.[0]) {
          services[i] = { ...data[0], synced: true };
          servicesChanged = true;
          console.log('✅ [DormDesk] Synced room service request:', item.type);
        }
      } catch (e) {
        console.error('❌ Failed to sync room service request:', e);
      }
    }
  }
  if (servicesChanged) ls.set('dormdesk_room_services', services);

  // 3. Sync Profiles
  const profiles = ls.get('dormdesk_profiles', []);
  let profilesChanged = false;
  for (let i = 0; i < profiles.length; i++) {
    const item = profiles[i];
    if (!item.synced && item.email === userEmail) {
      try {
        const { data, error } = await supabase.from('profiles').upsert({
          email: item.email,
          role: item.role,
          status: item.status
        }, { onConflict: 'email' }).select();
        
        if (!error && data?.[0]) {
          profiles[i] = { ...data[0], synced: true };
          profilesChanged = true;
          console.log('✅ [DormDesk] Synced profile:', item.email);
        }
      } catch (e) {
        console.error('❌ Failed to sync profile:', e);
      }
    }
  }
  if (profilesChanged) ls.set('dormdesk_profiles', profiles);
}
