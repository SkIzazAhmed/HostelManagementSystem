import { useState } from 'react';
import { Header } from './components/Header';
import { Home } from './components/Home';
import { Rooms } from './components/Rooms';
import { BookingForm } from './components/BookingForm';
import { About } from './components/About';
import { Services } from './components/Services';
import { Complaints } from './components/Complaints';
import { Admin } from './components/Admin';
import { ServicesDashboard } from './components/ServicesDashboard';
import { Auth } from './components/Auth';
import { useEffect } from 'react';
import { supabase, getProfile, syncLocalData, addComplaint } from '../supabase';
import { ManagerDashboard } from './components/ManagerDashboard';
import { motion } from 'motion/react';
import { Bed, AlertCircle, MapPin, Phone, Mail } from 'lucide-react';
import { LogoMark } from './components/brand/Logo';
import { ScrollProgress } from './components/site/ScrollProgress';
import { BackToTop } from './components/site/BackToTop';
import { CookieBanner } from './components/site/CookieBanner';
import { FloatingContact } from './components/site/FloatingContact';
import { SiteSearch } from './components/site/SiteSearch';
import { CopyButton } from './components/site/CopyButton';
import { CONTACT, LAST_UPDATED } from './siteInfo';
import { GlassCard } from './components/GlassCard';
import { Toaster, toast } from 'sonner';

// The account that gets the Admin panel.
const ADMIN_EMAIL = 'ayanbabu6651@gmail.com';

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookedStudent, setBookedStudent] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('student');
  const [complaints, setComplaints] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [faqTarget, setFaqTarget] = useState(null);

  // Designate the admin account
  const isAdmin = user?.email === ADMIN_EMAIL;
  const userBookings = bookings.filter(b => b.user_email === user?.email && b.status === 'confirmed');
  const hasExistingBooking = userBookings.length > 0;
  // Only show rooms that are not marked unavailable
  const availableRooms = rooms.filter(r => r.available !== false);

  useEffect(() => {
    const fetchDatabaseData = async () => {
      try {
        const { data: roomsData } = await supabase.from('rooms').select('*');
        if (roomsData) setRooms(roomsData);

        const { data: bookingsData } = await supabase.from('bookings').select('*');
        if (bookingsData) setBookings(bookingsData);

        const { data: complaintsData } = await supabase.from('complaints').select('*');
        if (complaintsData) setComplaints(complaintsData);
      } finally {
        setDataLoading(false);
      }
    };

    fetchDatabaseData();
    // Check active sessions and sets the user
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        // Sync any offline records that were saved in localStorage
        await syncLocalData(u.email);
        
        if (u.email === ADMIN_EMAIL) {
          setUserRole('admin');
        } else if (u.email === 'info.dormdesk@gmail.com') {
          setUserRole('manager');
        } else {
          const prof = await getProfile(u.email);
          const role = prof?.role || 'student';
          setUserRole(role === 'manger' ? 'manager' : role);
        }
      } else {
        setUserRole('student');
      }
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        // Sync any offline records that were saved in localStorage
        await syncLocalData(u.email);
        
        if (u.email === ADMIN_EMAIL) {
          setUserRole('admin');
        } else if (u.email === 'info.dormdesk@gmail.com') {
          setUserRole('manager');
        } else {
          const prof = await getProfile(u.email);
          const role = prof?.role || 'student';
          setUserRole(role === 'manger' ? 'manager' : role);
        }
      } else {
        setUserRole('student');
      }
    });

    // Connect DB error dispatching to UI notifications (sonner toasts)
    const handleDbError = (e) => {
      toast.error(e.detail || 'Database sync issue');
    };
    window.addEventListener('dormdesk-db-error', handleDbError);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('dormdesk-db-error', handleDbError);
    };
  }, []);

  const handleLogout = async () => {
    // Reset state immediately so UI updates before async signOut
    setUser(null);
    setUserRole('student');
    setCurrentView('home');
    await supabase.auth.signOut();
  };

  const handleBookingComplete = async (studentData) => {
    // If studentData doesn't have bookingRef (e.g. back button click), go back to rooms
    if (!studentData || !studentData.bookingRef || typeof studentData.bookingRef !== 'string') {
      setCurrentView('rooms');
      return;
    }

    // ── OPTIMISTIC UPDATE ────────────────────────────────────────────────────
    // Build a synthetic booking object immediately from the form data so the
    // "Your Room" tab and dashboard appear INSTANTLY without waiting for the DB.
    const optimisticBooking = {
      id: studentData.bookingRef,
      guest_name: `${studentData.firstName} ${studentData.lastName}`,
      room_name: studentData.roomName,
      check_in: studentData.checkIn,
      status: 'confirmed',
      user_email: user?.email,
    };

    // Update state and navigate immediately — user sees dashboard right away
    setBookings(prev => [...prev, optimisticBooking]);
    setBookedStudent(studentData);

    // Mark room unavailable locally right away
    const bookedRoom = rooms.find(r => r.name === studentData.roomName);
    if (bookedRoom) {
      setRooms(prev => prev.map(r => r.id === bookedRoom.id ? { ...r, available: false } : r));
    }

    setCurrentView('your_room');

    // ── BACKGROUND DB WRITE ──────────────────────────────────────────────────
    // Attempt to persist to Supabase — silent if it fails (state is already updated)
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          id: studentData.bookingRef,
          guest_name: `${studentData.firstName} ${studentData.lastName}`,
          room_name: studentData.roomName,
          check_in: studentData.checkIn,
          status: 'confirmed',
          user_email: user?.email
        }])
        .select();

      if (data && data.length > 0) {
        // Replace the optimistic entry with the real DB record
        setBookings(prev => prev.map(b => b.id === studentData.bookingRef ? data[0] : b));
      }

      // Persist room unavailability to DB
      if (bookedRoom) {
        await supabase.from('rooms').update({ available: false }).eq('id', bookedRoom.id);
      }

      if (error) {
        console.warn('Background booking save failed (user already in dashboard):', error.message);
      }
    } catch (err) {
      console.warn('Network error during background booking save:', err.message);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const bookingToCancel = bookings.find(b => b.id === bookingId);
    if (!bookingToCancel) return;

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (!error) {
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));

      const roomName = bookingToCancel.room_name || bookingToCancel.room;
      const bookedRoom = rooms.find(r => r.name === roomName);
      if (bookedRoom) {
        await supabase.from('rooms').update({ available: true }).eq('id', bookedRoom.id);
        setRooms(prev => prev.map(r => r.id === bookedRoom.id ? { ...r, available: true } : r));
      }
      toast.success('Booking cancelled');
    } else {
      console.error('Error cancelling booking:', error);
      toast.error(`Could not cancel the booking: ${error.message}`);
    }
  };

  const handleAddComplaint = async (complaint) => {
    const { data, error } = await addComplaint(complaint);

    if (data && data.length > 0) {
      setComplaints([...complaints, data[0]]);
    } else if (error) {
      console.error('Error saving complaint:', error);
    }
    return { error };
  };

  const handleViewChange = (view) => {
    const publicViews = ['home', 'about', 'auth'];

    // Admin restriction
    if (view === 'admin' && !isAdmin) {
      setCurrentView('home');
      return;
    }

    if (!user && !publicViews.includes(view)) {
      setCurrentView('auth');
    } else {
      setCurrentView(view);
    }
    setSelectedRoom(null);
  };

  // Used by site search: open a view, optionally scrolling to a section (e.g. an FAQ answer).
  const handleNavigate = (view, anchor) => {
    handleViewChange(view);
    if (anchor?.startsWith('faq-')) setFaqTarget({ id: anchor, at: Date.now() });
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => {
      if (anchor) {
        document.getElementById(anchor)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0 });
      }
    }, 100);
  };

  const handleBookRoom = (room) => {
    // Prevent booking a second room
    if (hasExistingBooking) {
      setCurrentView('your_room');
      return;
    }
    setSelectedRoom(room);
    setCurrentView('bookings');
  };

  const handleAddRoom = async (room) => {
    const { data, error } = await supabase
      .from('rooms')
      .insert([{
        name: room.name,
        type: room.type,
        capacity: parseInt(room.capacity),
        beds: parseInt(room.beds),
        price: parseFloat(room.price),
        amenities: room.amenities
      }])
      .select();

    if (data && data.length > 0) {
      setRooms([...rooms, data[0]]);
      toast.success(`${room.name} added`);
    } else if (error) {
      console.error('Error adding room:', error);
    }
    return { error };
  };

  const handleDeleteRoom = async (id) => {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id);

    if (!error) {
      setRooms(rooms.filter(room => room.id !== id));
      toast.success('Room deleted');
    } else {
      console.error('Error deleting room:', error);
      toast.error(`Could not delete the room: ${error.message}`);
    }
  };

  const formatBookingData = (booking) => {
    if (!booking) return null;
    return {
      firstName: booking.guest_name.split(' ')[0],
      lastName: booking.guest_name.split(' ').slice(1).join(' '),
      roomName: booking.room_name,
      checkIn: booking.check_in,
      bookingRef: booking.id
    };
  };

  // Conditionally render the active layout component, wrapped in a single layout with Toast notifications
  let activeLayout = null;

  if (user && (userRole === 'manager' || userRole === 'manger' || user.email === 'info.dormdesk@gmail.com')) {
    activeLayout = <ManagerDashboard user={user} onLogout={handleLogout} />;
  } else if (currentView === 'your_room' && userBookings.length > 0) {
    activeLayout = (
      <ServicesDashboard
        user={user}
        bookingsData={userBookings.map(formatBookingData)}
        onLogout={handleLogout}
        onBackToWebsite={() => setCurrentView('home')}
      />
    );
  } else {
    activeLayout = (
      <div className="min-h-screen bg-background">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[90] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-card focus:text-foreground focus:shadow-xl focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </a>
        <ScrollProgress />
        <Header
          currentView={currentView}
          onViewChange={handleViewChange}
          user={user}
          isAdmin={isAdmin}
          hasRoom={userBookings.length > 0}
          onLogout={handleLogout}
          onOpenSearch={() => setSearchOpen(true)}
        />

        <main id="main-content" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 outline-none">
          {!user && currentView === 'home' && (
            <Home onBookNow={() => setCurrentView('auth')} faqOpenId={faqTarget} />
          )}

          {!user && currentView === 'auth' && (
            <Auth onAuthSuccess={() => setCurrentView('home')} />
          )}

          {user && currentView === 'home' && (
            <Home onBookNow={() => setCurrentView('rooms')} faqOpenId={faqTarget} />
          )}

          {user && currentView === 'rooms' && (
            <Rooms
              rooms={availableRooms}
              loading={dataLoading}
              onBookRoom={handleBookRoom}
              onAddRoom={() => setCurrentView('admin')}
              isAdmin={isAdmin}
              hasExistingBooking={hasExistingBooking}
              onGoToRoom={() => setCurrentView('your_room')}
            />
          )}
          {user && currentView === 'bookings' && (
            <BookingForm
              selectedRoom={selectedRoom}
              onBack={handleBookingComplete}
            />
          )}
          {currentView === 'about' && <About />}
          {currentView === 'your_room' && userBookings.length === 0 && (
            bookedStudent ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                <GlassCard className="p-12 max-w-md w-full border border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 relative overflow-hidden shadow-2xl">
                  <div className="relative z-10 space-y-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg animate-pulse">
                      <Bed className="w-8 h-8 text-white animate-bounce" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Setting Up Your Room...</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        We are finalizing your hostel dashboard. This will only take a moment.
                      </p>
                    </div>
                    <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                      <motion.div
                        className="bg-gradient-to-r from-primary to-purple-600 h-full rounded-full"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        style={{ width: '50%' }}
                      />
                    </div>
                  </div>
                </GlassCard>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                <GlassCard className="p-12 max-w-md w-full border border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 relative overflow-hidden shadow-2xl">
                  <div className="relative z-10 space-y-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-destructive/10 to-destructive/20 flex items-center justify-center shadow-sm">
                      <AlertCircle className="w-8 h-8 text-destructive" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-foreground">No Room Booked</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        You don't have an active room booking in our database. Book a room to access your student dashboard.
                      </p>
                    </div>
                    <motion.button
                      onClick={() => setCurrentView('rooms')}
                      className="w-full bg-gradient-to-r from-primary to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Browse Rooms
                    </motion.button>
                  </div>
                </GlassCard>
              </div>
            )
          )}
          {user && currentView === 'services' && !bookedStudent && (
            <Services onBookNow={() => setCurrentView('rooms')} />
          )}
          {currentView === 'complaints' && <Complaints onAddComplaint={handleAddComplaint} />}
          {isAdmin && currentView === 'admin' && (
            <Admin
              rooms={rooms}
              bookings={bookings}
              complaints={complaints}
              onAddRoom={handleAddRoom}
              onDeleteRoom={handleDeleteRoom}
              onCancelBooking={handleCancelBooking}
            />
          )}
        </main>

        <footer className="bg-primary text-primary-foreground mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h4 className="mb-4 flex items-center gap-2">
                  <LogoMark className="w-7 h-7" />
                  DormDesk
                </h4>
                <p className="text-sm opacity-80">
                  Smart hostel management for Newton School of Technology.
                  Efficient, secure, and student-friendly.
                </p>
              </div>
              <div className="print:hidden">
                <h4 className="mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm">
                  <li><button onClick={() => handleViewChange('home')} className="hover:underline opacity-80">Home</button></li>
                  <li><button onClick={() => handleViewChange('about')} className="hover:underline opacity-80">About Us</button></li>
                  {user && (
                    <>
                      <li><button onClick={() => handleViewChange('rooms')} className="hover:underline opacity-80">Rooms</button></li>
                      <li><button onClick={() => handleViewChange('services')} className="hover:underline opacity-80">Services</button></li>
                      <li><button onClick={() => handleViewChange('complaints')} className="hover:underline opacity-80">Complaints</button></li>
                    </>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="mb-4">Contact</h4>
                <ul className="space-y-2 text-sm opacity-80">
                  <li className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <span><span className="sr-only">Address: </span>{CONTACT.address}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`} className="hover:underline"><span className="sr-only">Phone: </span>{CONTACT.phone}</a>
                    <CopyButton value={CONTACT.phone} label="Copy phone number" />
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${CONTACT.email}`} className="hover:underline"><span className="sr-only">Email: </span>{CONTACT.email}</a>
                    <CopyButton value={CONTACT.email} label="Copy email address" />
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm opacity-80">
              <p>© 2026 DormDesk. All rights reserved.</p>
              <p className="mt-1 text-xs">
                Last updated{' '}
                <time dateTime={LAST_UPDATED}>
                  {new Date(LAST_UPDATED).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </time>
              </p>
            </div>
          </div>
        </footer>

        <BackToTop />
        <FloatingContact />
        <SiteSearch
          open={searchOpen}
          onOpenChange={setSearchOpen}
          user={user}
          isAdmin={isAdmin}
          hasRoom={userBookings.length > 0}
          rooms={availableRooms}
          onNavigate={handleNavigate}
        />
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      {activeLayout}
      <CookieBanner />
    </>
  );
}
