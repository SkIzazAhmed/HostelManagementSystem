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

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookedStudent, setBookedStudent] = useState(null);

  const handleViewChange = (view) => {
    setCurrentView(view);
    setSelectedRoom(null);
  };

  const handleBookRoom = (room) => {
    setSelectedRoom(room);
    setCurrentView('bookings');
  };

  const handleAddRoom = (room) => {
    setRooms([...rooms, room]);
  };

  const handleDeleteRoom = (id) => {
    setRooms(rooms.filter(room => room.id !== id));
  };

  const handleBookingComplete = (studentData) => {
    setBookedStudent(studentData);
    setCurrentView('services');
  };

  // If the student has booked and is on the services page, show the dashboard
  if (currentView === 'services' && bookedStudent) {
    return <ServicesDashboard bookingData={bookedStudent} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header currentView={currentView} onViewChange={handleViewChange} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'home' && <Home onBookNow={() => setCurrentView('rooms')} />}
        {currentView === 'rooms' && (
          <Rooms
            rooms={rooms}
            onBookRoom={handleBookRoom}
            onAddRoom={() => setCurrentView('admin')}
          />
        )}
        {currentView === 'bookings' && (
          <BookingForm
            selectedRoom={selectedRoom}
            onBack={handleBookingComplete}
          />
        )}
        {currentView === 'about' && <About />}
        {currentView === 'services' && !bookedStudent && (
          <Services onBookNow={() => setCurrentView('rooms')} />
        )}
        {currentView === 'complaints' && <Complaints />}
        {currentView === 'admin' && (
          <Admin
            rooms={rooms}
            bookings={bookings}
            onAddRoom={handleAddRoom}
            onDeleteRoom={handleDeleteRoom}
          />
        )}
      </main>

      <footer className="bg-primary text-primary-foreground mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="mb-4">DormDesk</h4>
              <p className="text-sm opacity-80">
                Smart hostel management for Newton School of Technology.
                Efficient, secure, and student-friendly.
              </p>
            </div>
            <div>
              <h4 className="mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => handleViewChange('home')} className="hover:underline opacity-80">Home</button></li>
                <li><button onClick={() => handleViewChange('about')} className="hover:underline opacity-80">About Us</button></li>
                <li><button onClick={() => handleViewChange('rooms')} className="hover:underline opacity-80">Rooms</button></li>
                <li><button onClick={() => handleViewChange('services')} className="hover:underline opacity-80">Services</button></li>
                <li><button onClick={() => handleViewChange('complaints')} className="hover:underline opacity-80">Complaints</button></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4">Contact</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li>📍 123 Main Street, Downtown</li>
                <li>📞 +1 (555) 123-4567</li>
                <li>✉️ info@dormdesk.nst.edu</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm opacity-80">
            <p>© 2026 DormDesk. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
