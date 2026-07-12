import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Card from '../components/cards/Card';
import Button from '../components/ui/Button';
import Input from '../components/forms/Input';
import Select from '../components/forms/Select';
import Badge from '../components/ui/Badge';
import Modal from '../components/modal/Modal';
import DatePicker from '../components/forms/DatePicker';
import Table from '../components/tables/Table';
import api from '../services/api';

const Bookings = () => {
  const { user } = useAuth();
  const { showNotification } = useNotifications();

  // Resource lists
  const [resources, setResources] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [bookings, setBookings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [bookModalOpen, setBookModalOpen] = useState(false);

  // Form states
  const [bookDate, setBookDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [purpose, setPurpose] = useState('');

  const fetchResourcesAndEmployees = async () => {
    try {
      const [assetsRes, empsRes] = await Promise.all([
        api.get('/assets?shared=true'),
        api.get('/employees')
      ]);
      const sharedResources = assetsRes.data.data || [];
      setResources(sharedResources);
      setEmployees(empsRes.data.data || []);
      
      if (sharedResources.length > 0) {
        setSelectedResourceId(sharedResources[0]._id);
      }
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const fetchBookings = async () => {
    if (!selectedResourceId) return;
    setLoading(true);
    try {
      const res = await api.get(`/bookings?resourceId=${selectedResourceId}`);
      setBookings(res.data.data || []);
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResourcesAndEmployees();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [selectedResourceId]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookDate || !startTime || !endTime) {
      showNotification('Date, start time and end time are required', 'warning');
      return;
    }

    // Parse into Date ISO strings
    const startISO = `${bookDate}T${startTime}:00`;
    const endISO = `${bookDate}T${endTime}:00`;

    try {
      await api.post('/bookings', {
        resourceId: selectedResourceId,
        startTime: startISO,
        endTime: endISO,
        purpose
      });

      showNotification('Booking confirmed successfully!', 'success');
      setBookModalOpen(false);
      
      // Reset form
      setBookDate('');
      setStartTime('09:00');
      setEndTime('10:00');
      setPurpose('');

      fetchBookings();
    } catch (err) {
      // Overlap conflicts caught here
      showNotification(err.message, 'error');
    }
  };

  const handleCancelBooking = async (id) => {
    try {
      await api.put(`/bookings/${id}/cancel`);
      showNotification('Booking cancelled successfully', 'success');
      fetchBookings();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const getResourceName = (id) => {
    const res = resources.find(r => r._id === id);
    return res ? res.name : 'Shared Resource';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title section */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Resource Booking Scheduler</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Book company vehicles, rooms, and devices by time slots with zero overlap conflicts.
          </p>
        </div>
        <Button size="sm" onClick={() => setBookModalOpen(true)} disabled={resources.length === 0}>
          📅 Reserve Resource Slot
        </Button>
      </div>

      {/* Select Resource Panel */}
      <Card className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Active Resource:</span>
          <Select
            value={selectedResourceId}
            onChange={e => setSelectedResourceId(e.target.value)}
            options={resources.map(r => ({ value: r._id, label: `${r.name} (${r.location})` }))}
            placeholder={resources.length === 0 ? 'No shared resources registered' : null}
            className="flex-1 sm:w-64 py-1.5"
          />
        </div>
        {selectedResourceId && (
          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            🟢 Active Bookable Resource: {getResourceName(selectedResourceId)}
          </div>
        )}
      </Card>

      {/* Schedule Calendar Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Custom Grid Calendar View */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight">
                📅 Booking Calendar Slots
              </h4>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                Weekly View
              </span>
            </div>

            {/* Custom Interactive Weekly grid */}
            <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white/20 dark:bg-slate-900/10">
              <div className="grid grid-cols-7 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-center py-3 text-xs font-bold text-slate-500 select-none">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>
              
              {/* Simply display active events scheduled in list format since grid list is cleaner */}
              <div className="p-4 flex flex-col gap-3 min-h-60 overflow-y-auto max-h-[400px]">
                {loading ? (
                  <div className="h-40 flex items-center justify-center">
                    <div className="h-6 w-6 rounded-full border-2 border-indigo-200/40 border-t-indigo-600 animate-spin" />
                  </div>
                ) : bookings.filter(b => b.status !== 'Cancelled').length === 0 ? (
                  <div className="text-center py-16 text-xs font-semibold text-slate-400">
                    No active bookings for this resource. Be the first to reserve a slot!
                  </div>
                ) : (
                  bookings
                    .filter(b => b.status !== 'Cancelled')
                    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                    .map((booking) => {
                      const start = new Date(booking.startTime);
                      const end = new Date(booking.endTime);
                      const emp = employees.find(e => e._id === booking.bookedBy);
                      const isOwner = booking.bookedBy === user?._id;

                      return (
                        <div
                          key={booking._id}
                          className={`p-4 rounded-xl border flex justify-between items-start flex-wrap gap-2 transition-all ${
                            isOwner
                              ? 'border-indigo-200 bg-indigo-500/5 dark:bg-indigo-950/10'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/20'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 block uppercase tracking-wide">
                              {start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            <h6 className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-1">
                              {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                              {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </h6>
                            <span className="text-[10px] text-slate-400 block mt-1">
                              Booked by: <b>{emp ? emp.name : 'Unknown Employee'}</b> {isOwner ? '(You)' : ''}
                            </span>
                            {booking.purpose && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium italic">
                                "{booking.purpose}"
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <Badge status={booking.status} />
                            {(isOwner || ['Admin', 'Asset Manager'].includes(user?.role)) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelBooking(booking._id)}
                                className="text-xs py-1"
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Reservation Rules / Info */}
        <Card>
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 tracking-tight mb-4 uppercase">
            ⚠️ Reservation Rules
          </h4>
          <ul className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex flex-col gap-4 list-disc pl-4">
            <li>Only assets flagged with <b>Shared</b> status can be reserved.</li>
            <li>Booking slots are validated against clashing times on submission. Any overlaps are automatically blocked by the system.</li>
            <li>Users can cancel or modify bookings they created at any time.</li>
            <li>Managers have authority to cancel any reservation.</li>
          </ul>
        </Card>
      </div>

      {/* ========================================== */}
      {/* BOOKING SCHEDULER MODAL */}
      {/* ========================================== */}
      <Modal isOpen={bookModalOpen} onClose={() => setBookModalOpen(false)} title={`Reserve: ${getResourceName(selectedResourceId)}`}>
        <form onSubmit={handleBookingSubmit} className="flex flex-col gap-4">
          <DatePicker
            label="Booking Date"
            value={bookDate}
            onChange={e => setBookDate(e.target.value)}
            required
            minDate={new Date().toISOString().split('T')[0]} // block past dates
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time"
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              required
            />
            <Input
              label="End Time"
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              required
            />
          </div>

          <Textarea
            label="Purpose of Booking"
            placeholder="e.g. Project sprint review meeting..."
            value={purpose}
            onChange={e => setPurpose(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" className="mt-2">Confirm Reservation</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Bookings;
