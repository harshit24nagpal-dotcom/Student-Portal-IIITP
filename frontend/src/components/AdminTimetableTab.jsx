import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { 
  Calendar, Clock, Plus, Trash2, Edit2, CheckCircle2, 
  AlertCircle, RefreshCw, BookOpen, MapPin, User, Layers
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function AdminTimetableTab() {
  const { token } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState('Section A (CSE)');
  const [selectedDay, setSelectedDay] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    day: 'Monday',
    timeSlot: '09:30 AM - 10:30 AM',
    subjectCode: 'LNO',
    subjectName: 'Linear and Non-Linear Optimization',
    facultyName: 'Ms. Anagha Khiste',
    room: 'LH-102',
    section: 'Section A (CSE)'
  });

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const url = `${API_URL}/academics/timetable?section=${encodeURIComponent(selectedSection)}${selectedDay !== 'ALL' ? `&day=${selectedDay}` : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSchedule(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError('Failed to fetch timetable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchTimetable();
  }, [token, selectedSection, selectedDay]);

  const handleOpenCreate = () => {
    setEditingSlot(null);
    setForm({
      day: selectedDay !== 'ALL' ? selectedDay : 'Monday',
      timeSlot: '09:30 AM - 10:30 AM',
      subjectCode: 'LNO',
      subjectName: 'Linear and Non-Linear Optimization',
      facultyName: 'Ms. Anagha Khiste',
      room: 'LH-102',
      section: selectedSection
    });
    setShowModal(true);
  };

  const handleOpenEdit = (slot) => {
    setEditingSlot(slot);
    setForm({
      day: slot.day,
      timeSlot: slot.timeSlot,
      subjectCode: slot.subjectCode,
      subjectName: slot.subjectName,
      facultyName: slot.facultyName,
      room: slot.room,
      section: slot.section
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const url = editingSlot 
        ? `${API_URL}/academics/timetable/${editingSlot.id}` 
        : `${API_URL}/academics/timetable`;
      const method = editingSlot ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(editingSlot ? 'Lecture slot updated!' : 'New lecture slot added to timetable!');
        setShowModal(false);
        fetchTimetable();
      } else {
        setError(data.error || 'Failed to save timetable slot.');
      }
    } catch (err) {
      setError('Network error saving timetable slot.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lecture slot?')) return;
    try {
      const res = await fetch(`${API_URL}/academics/timetable/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage('Lecture slot removed from timetable.');
        fetchTimetable();
      } else {
        setError('Failed to delete timetable slot.');
      }
    } catch (err) {
      setError('Network error deleting timetable slot.');
    }
  };

  // Group slots by Day
  const slotsByDay = DAYS.reduce((acc, day) => {
    acc[day] = schedule.filter(s => s.day.toLowerCase() === day.toLowerCase());
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-900 text-[10px] font-black uppercase rounded tracking-wider border border-blue-200">
              ACADEMIC TIMETABLE ENGINE
            </span>
            <span className="text-xxs text-slate-500 font-mono">
              CURRICULUM SCHEDULING
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Institutional Lecture Timetable & Classroom Allocation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Weekly Lecture Periods, Assigned Instructors & Lecture Hall Logistics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTimetable}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-[#0c2340] hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Lecture Slot
          </button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between gap-2 font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center justify-between gap-2 font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-700 hover:text-red-900 text-xs font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* Section & Day Selector */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600 uppercase">Section:</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="p-2 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-800"
          >
            <option value="Section A (CSE)">Section A (CSE - MIS 001 to 082)</option>
            <option value="Section B (CSE)">Section B (CSE - MIS 083 to 164)</option>
            <option value="Section C (ECE)">Section C (ECE - MIS 001 to 076)</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedDay('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              selectedDay === 'ALL'
                ? 'bg-[#0c2340] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            All Week ({schedule.length} Slots)
          </button>
          {DAYS.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                selectedDay === d
                  ? 'bg-[#0c2340] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {d.slice(0, 3)} ({slotsByDay[d]?.length || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Timetable Schedule Grid */}
      <div className="space-y-6">
        {(selectedDay === 'ALL' ? DAYS : [selectedDay]).map(day => {
          const daySlots = slotsByDay[day] || [];

          return (
            <div key={day} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#0c2340]" />
                  {day} Schedule ({daySlots.length} Lectures)
                </h3>
                <span className="text-xxs font-mono text-slate-500 font-bold">{selectedSection}</span>
              </div>

              {daySlots.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs italic">
                  No lectures scheduled for {day} yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {daySlots.map(slot => (
                    <div key={slot.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs font-bold font-mono shrink-0 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-700" />
                          <span>{slot.timeSlot}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{slot.subjectName}</h4>
                            <span className="px-1.5 py-0.2 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono font-bold text-slate-700">
                              {slot.subjectCode}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xxs text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <User className="w-3 h-3 text-slate-400" /> {slot.facultyName}
                            </span>
                            <span className="flex items-center gap-1 font-mono font-bold text-slate-700">
                              <MapPin className="w-3 h-3 text-red-500" /> {slot.room}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          onClick={() => handleOpenEdit(slot)}
                          className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
                          title="Edit Slot"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(slot.id)}
                          className="p-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-xs transition-colors cursor-pointer"
                          title="Delete Slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          ADD / EDIT LECTURE SLOT MODAL
         ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingSlot ? 'Edit Lecture Slot' : 'Add New Lecture Slot'}
                </h3>
                <p className="text-xxs text-slate-500">Configure lecture period for {form.section}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Day of Week</label>
                  <select
                    value={form.day}
                    onChange={(e) => setForm({...form, day: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Time Slot</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09:30 AM - 10:30 AM"
                    value={form.timeSlot}
                    onChange={(e) => setForm({...form, timeSlot: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Subject Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LNO"
                    value={form.subjectCode}
                    onChange={(e) => setForm({...form, subjectCode: e.target.value.toUpperCase()})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono uppercase"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Classroom / Lab</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LH-102 or Computer Lab 3"
                    value={form.room}
                    onChange={(e) => setForm({...form, room: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Linear and Non-Linear Optimization"
                  value={form.subjectName}
                  onChange={(e) => setForm({...form, subjectName: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Faculty Instructor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ms. Anagha Khiste"
                  value={form.facultyName}
                  onChange={(e) => setForm({...form, facultyName: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs uppercase rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#0c2340] hover:bg-slate-900 text-white font-bold text-xs uppercase rounded-lg shadow-xs cursor-pointer"
                >
                  {saving ? 'Saving...' : editingSlot ? 'Save Changes' : 'Add Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}