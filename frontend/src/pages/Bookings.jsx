import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Card from '../components/cards/Card';
import Button from '../components/ui/Button';
import Input from '../components/forms/Input';
import Select from '../components/forms/Select';
import Badge from '../components/ui/Badge';
import Modal from '../components/modal/Modal';
import Textarea from '../components/forms/Textarea';
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

  // Selected scheduler date (defaults to today)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Modals
  const [bookModalOpen, setBookModalOpen] = useState(false);

  // Form states (Draft Bookings)
  const [bookDate, setBookDate] = useState(new Date().toISOString().split('T')[0]);
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
      setPurpose('');
      fetchBookings();
    } catch (err) {
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

  // Convert time to standard 12hr format (e.g. 13:00 -> 1:00 PM)
  const formatHourLabel = (hourString) => {
    const hour = parseInt(hourString.split(':')[0]);
    if (hour === 12) return '12:00';
    if (hour > 12) return `${hour - 12}:00`;
    return `${hour}:00`;
  };

  // Generate hourly schedule slots (9:00 AM to 5:00 PM)
  const hoursList = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  // Check if a specific hour slot is booked on selectedDate
  const getBookingForHour = (hour) => {
    return bookings.find(b => {
      if (b.status === 'Cancelled') return false;
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      const bDateStr = bStart.toISOString().split('T')[0];
      
      if (bDateStr !== selectedDate) return false;

      // Extract hours
      const targetHour = parseInt(hour.split(':')[0]);
      const startHour = bStart.getHours();
      const endHour = bEnd.getHours();
      
      return targetHour >= startHour && targetHour < endHour;
    });
  };

  // Check if there is an overlap conflict with the user's active form inputs
  const checkConflict = () => {
    if (bookDate !== selectedDate) return false;
    
    // Parse form draft values
    const draftStart = parseInt(startTime.split(':')[0]);
    const draftEnd = parseInt(endTime.split(':')[0]);
    
    // Find any booking that clashes with these hours on this date
    return bookings.some(b => {
      if (b.status === 'Cancelled') return false;
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      const bDateStr = bStart.toISOString().split('T')[0];
      
      if (bDateStr !== bookDate) return false;
      
      const bStartHour = bStart.getHours();
      const bEndHour = bEnd.getHours();
      
      // Overlap formula
      return draftStart < bEndHour && draftEnd > bStartHour;
    });
  };

  const isConflicting = checkConflict();

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Resource Booking</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Book shared assets, rooms, and vehicles. Overlapping times are strictly validated.
          </p>
        </div>
        <Button size="sm" onClick={() => setBookModalOpen(true)} disabled={resources.length === 0}>
          📅 Book a slot
        </Button>
      </div>

      {/* Select Resource & Date Controls */}
      <Card className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-400">Resource:</span>
            <Select
              value={selectedResourceId}
              onChange={e => setSelectedResourceId(e.target.value)}
              options={resources.map(r => ({ value: r._id, label: `${r.name} (${r.location})` }))}
              placeholder={resources.length === 0 ? 'No shared assets found' : null}
              className="w-56 py-1"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-400">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => {
                setSelectedDate(e.target.value);
                setBookDate(e.target.value); // Sync form date
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>
        </div>

        {selectedResourceId && (
          <div className="text-xs font-extrabold text-indigo-500 bg-indigo-500/5 px-3 py-1.5 rounded-lg border border-indigo-500/10">
            🟢 Active Bookable Resource: {getResourceName(selectedResourceId)}
          </div>
        )}
      </Card>

      {/* TIMELINE SCHEDULER MATRIX (Screen 6 Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start select-none">
        {/* Hourly timeline sheet */}
        <div className="lg:col-span-2">
          <Card className="flex flex-col gap-4">
            <div className="border-b border-slate-100 dark:border-slate-850 pb-2">
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight">
                Schedule Slots Matrix - {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </h4>
            </div>

            {loading ? (
              <div className="h-60 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col mt-2">
                {hoursList.map((hour) => {
                  const activeBooking = getBookingForHour(hour);
                  
                  // Check if the user's active inputs draft overlaps with this specific hour
                  const draftHour = parseInt(hour.split(':')[0]);
                  const draftStart = parseInt(startTime.split(':')[0]);
                  const draftEnd = parseInt(endTime.split(':')[0]);
                  const isDraftOverlappingHour = draftHour >= draftStart && draftHour < draftEnd;

                  return (
                    <div
                      key={hour}
                      className="grid grid-cols-6 border-b border-slate-100 dark:border-slate-850 min-h-[64px] items-center"
                    >
                      {/* Hour Indicator */}
                      <div className="col-span-1 text-xs font-bold text-slate-400">
                        {formatHourLabel(hour)}
                      </div>

                      {/* Timeline Block area */}
                      <div className="col-span-5 relative py-2 pl-4">
                        {activeBooking ? (
                          // Blue glassmorphic booked container
                          <div className="bg-sky-500/10 border border-sky-500/20 text-sky-800 dark:text-sky-300 px-4 py-2.5 rounded-xl text-xs font-bold flex justify-between items-center shadow-sm">
                            <span>
                              Booked - {activeBooking.purpose} ({new Date(activeBooking.startTime).getHours()}-{new Date(activeBooking.endTime).getHours()})
                            </span>
                            
                            {(activeBooking.bookedBy === user?._id || ['Admin', 'Asset Manager'].includes(user?.role)) && (
                              <button
                                onClick={() => handleCancelBooking(activeBooking._id)}
                                className="text-[10px] text-sky-600 hover:text-sky-400 font-extrabold focus:outline-none"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        ) : isDraftOverlappingHour && isConflicting ? (
                          // Red-dotted clashing preview block
                          <div className="bg-rose-500/5 border border-dashed border-rose-500/50 text-rose-500 px-4 py-2.5 rounded-xl text-xs font-bold flex flex-col gap-0.5 animate-pulse">
                            <span>Requested {startTime} to {endTime} - conflict</span>
                            <span className="text-[10px] font-medium opacity-80">slot is unavailable</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right side rules/forms */}
        <Card className="flex flex-col gap-4">
          <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight uppercase">
            ⚠️ Conflict Warning System
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
            To view clashing preview alerts, adjust the **Booking Date** to match the schedule date, and enter booking hours. If they clash with active slots, a red dotted border warning will automatically trigger on the scheduler list.
          </p>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-3">
            <DatePicker
              label="Booking Date"
              value={bookDate}
              onChange={e => {
                setBookDate(e.target.value);
                setSelectedDate(e.target.value); // Sync calendar view date
              }}
              required
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
            {isConflicting && (
              <div className="text-xs font-bold text-rose-500 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-center">
                🚫 Overlap detected! Choose another slot.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* BOOKING SCHEDULER MODAL */}
      <Modal isOpen={bookModalOpen} onClose={() => setBookModalOpen(false)} title={`Reserve: ${getResourceName(selectedResourceId)}`}>
        <form onSubmit={handleBookingSubmit} className="flex flex-col gap-4">
          <Input
            label="Booking Date"
            type="date"
            value={bookDate}
            onChange={e => setBookDate(e.target.value)}
            required
            min={new Date().toISOString().split('T')[0]}
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

          <Button type="submit" variant="primary" className="mt-2" disabled={isConflicting}>
            Confirm Reservation
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default Bookings;
export { Bookings };
