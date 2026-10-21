import React, { useState, useEffect } from 'react';
import { 
  Users, Home, CheckCircle2, Clock, Sparkles, AlertCircle, 
  Bed, ShieldCheck, Heart, Moon, Sun, BookOpen, Music, Coffee, 
  Dumbbell, RefreshCw, Send, CheckSquare, Award
} from 'lucide-react';
import { API_URL } from '../config/api';

export default function RoommateAllotmentTab({ token, user }) {
  const [activeStep, setActiveStep] = useState('survey'); // 'survey' | 'matches' | 'rooms' | 'slip'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Preference survey state
  const [sleepSchedule, setSleepSchedule] = useState('NIGHT_OWL');
  const [studyHabit, setStudyHabit] = useState('QUIET_STUDY');
  const [cleanlinessLevel, setCleanlinessLevel] = useState('STRICT_NEAT');
  const [dietPreference, setDietPreference] = useState('PURE_VEG');
  const [hobbyInterest, setHobbyInterest] = useState('CODING');
  const [acPreference, setAcPreference] = useState('AC_COOL');
  const [bioNotes, setBioNotes] = useState('');

  // Matches and Room data
  const [matches, setMatches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currentAllotment, setCurrentAllotment] = useState(null);

  // Selected room & bed for booking
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);

  const fetchRoommateData = async () => {
    try {
      setLoading(true);
      // 1. Fetch preferences
      const prefRes = await fetch(`${API_URL}/roommate/preference`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const prefData = await prefRes.json();
      if (prefData.preference) {
        setSleepSchedule(prefData.preference.sleepSchedule);
        setStudyHabit(prefData.preference.studyHabit);
        setCleanlinessLevel(prefData.preference.cleanlinessLevel);
        setDietPreference(prefData.preference.dietPreference);
        setHobbyInterest(prefData.preference.hobbyInterest);
        setAcPreference(prefData.preference.acPreference);
        setBioNotes(prefData.preference.bioNotes || '');
      }
      if (prefData.allotment) {
        setCurrentAllotment(prefData.allotment);
      }

      // 2. Fetch matches
      const matchesRes = await fetch(`${API_URL}/roommate/matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const matchesData = await matchesRes.json();
      if (Array.isArray(matchesData.matches)) {
        setMatches(matchesData.matches);
      }

      // 3. Fetch rooms
      const roomsRes = await fetch(`${API_URL}/roommate/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const roomsData = await roomsRes.json();
      if (Array.isArray(roomsData.rooms)) {
        setRooms(roomsData.rooms);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchRoommateData();
  }, [token]);

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch(`${API_URL}/roommate/preference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sleepSchedule,
          studyHabit,
          cleanlinessLevel,
          dietPreference,
          hobbyInterest,
          acPreference,
          bioNotes
        })
      });

      if (res.ok) {
        setMessage('Preferences saved! Compatibility algorithm updated your top matches.');
        await fetchRoommateData();
        setActiveStep('matches');
      } else {
        setError('Failed to save preferences.');
      }
    } catch (err) {
      setError('Network error while saving survey.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmAllotment = async (roomNumber, bedNumber) => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch(`${API_URL}/roommate/allot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          hostelBlock: 'Hostel Block A',
          roomNumber,
          bedNumber
        })
      });

      const resData = await res.json();
      if (res.ok) {
        setCurrentAllotment(resData);
        setMessage(`Success! Room ${roomNumber} (${bedNumber}) has been officially allocated to you.`);
        fetchRoommateData();
        setActiveStep('slip');
      } else {
        setError(resData.error || 'Failed to complete allotment');
      }
    } catch (err) {
      setError('Network error during room confirmation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-black uppercase rounded tracking-wider border border-purple-200">
                SMART ROOM ALLOTMENT & MATCHING ENGINE
              </span>
              <span className="text-xxs text-slate-400 font-mono">
                HOSTEL ADMISSIONS 2026-27
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Roommate Compatibility & Interactive Bed Allotment
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Eliminates roommate allocation chaos by matching lifestyle habits and letting students pick available rooms.
            </p>
          </div>
        </div>

        {currentAllotment ? (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-right">
            <span className="text-[9px] font-bold uppercase text-emerald-800 block">Allocated Room</span>
            <span className="text-sm font-black text-emerald-900 font-mono">
              {currentAllotment.hostelBlock} • {currentAllotment.roomNumber} ({currentAllotment.bedNumber})
            </span>
          </div>
        ) : (
          <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
            Allotment Pending
          </span>
        )}
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      {/* Stepper Navigation */}
      <div className="grid grid-cols-4 gap-2 bg-slate-100 p-1 rounded-2xl">
        <button
          onClick={() => setActiveStep('survey')}
          className={`py-2 px-3 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer ${
            activeStep === 'survey' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          1. Lifestyle Survey
        </button>
        <button
          onClick={() => setActiveStep('matches')}
          className={`py-2 px-3 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer ${
            activeStep === 'matches' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          2. Compatibility Matches
        </button>
        <button
          onClick={() => setActiveStep('rooms')}
          className={`py-2 px-3 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer ${
            activeStep === 'rooms' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          3. Room & Bed Grid
        </button>
        <button
          onClick={() => setActiveStep('slip')}
          className={`py-2 px-3 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer ${
            activeStep === 'slip' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          4. Allotment Slip
        </button>
      </div>

      {/* STEP 1: LIFESTYLE & HABIT PREFERENCE SURVEY */}
      {activeStep === 'survey' && (
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Roommate Compatibility Questionnaire
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Answer honestly so our algorithm pairs you with compatible living partners and minimizes room friction.
            </p>
          </div>

          <form onSubmit={handleSavePreferences} className="space-y-5">
            {/* 1. Sleep Schedule */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-indigo-600" />
                Sleep Schedule & Daily Cycle *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'NIGHT_OWL', title: 'Night Owl (1 AM - 3 AM)', desc: 'Study and work late nights. Wake up around 8:30 AM.' },
                  { id: 'EARLY_RISER', title: 'Early Riser (5 AM - 6 AM)', desc: 'Sleep by 10:30 PM. Morning jog & early study.' },
                  { id: 'FLEXIBLE', title: 'Flexible / Balanced', desc: 'No fixed bedtime; comfortable adjusting with roommate.' }
                ].map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setSleepSchedule(opt.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      sleepSchedule === opt.id
                        ? 'bg-purple-50/80 border-purple-600 ring-1 ring-purple-600'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 block">{opt.title}</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{opt.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Study Habit */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Study Environment & Ambient Sound *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'QUIET_STUDY', title: 'Pin-drop Silence (Quiet Study)', desc: 'Need undisturbed focus without background noise.' },
                  { id: 'MUSIC_GROUP', title: 'Music & Group Discussions', desc: 'Enjoys background music, discussing problems out loud.' },
                  { id: 'LIBRARY', title: 'Study in Central Library', desc: 'Room is primarily used for resting and sleeping.' }
                ].map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setStudyHabit(opt.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      studyHabit === opt.id
                        ? 'bg-purple-50/80 border-purple-600 ring-1 ring-purple-600'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 block">{opt.title}</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{opt.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Cleanliness & Hygiene */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Room Cleanliness & Orderliness *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'STRICT_NEAT', title: 'Strict Neatness (High Cleanliness)', desc: 'Bed made daily, zero clutter on desk and floor.' },
                  { id: 'MODERATE', title: 'Moderate / Normal', desc: 'Clean desk, weekly laundry, reasonably orderly.' },
                  { id: 'CASUAL', title: 'Casual & Relaxed', desc: 'Comfortable with typical student creative clutter.' }
                ].map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setCleanlinessLevel(opt.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      cleanlinessLevel === opt.id
                        ? 'bg-purple-50/80 border-purple-600 ring-1 ring-purple-600'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 block">{opt.title}</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{opt.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Dietary & Hobbies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Dietary Preference
                </label>
                <select
                  value={dietPreference}
                  onChange={(e) => setDietPreference(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                >
                  <option value="PURE_VEG">Strict Pure Vegetarian (Preferred Veg Roommate)</option>
                  <option value="NON_VEG">Non-Vegetarian</option>
                  <option value="ANY">No Dietary Preference / Any</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Primary Hobby / Interest
                </label>
                <select
                  value={hobbyInterest}
                  onChange={(e) => setHobbyInterest(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                >
                  <option value="CODING">Competitive Programming & Hackathons</option>
                  <option value="GAMING">Esports & Gaming (PC/Mobile)</option>
                  <option value="SPORTS_FITNESS">Gym, Badminton & Outdoor Sports</option>
                  <option value="MUSIC_ARTS">Music, Guitar & Digital Design</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                Roommate Bio / Short Note
              </label>
              <textarea
                rows="2"
                placeholder="Share a brief intro (e.g. 'I am working on Web3 projects, respect quiet hours after midnight')..."
                value={bioNotes}
                onChange={(e) => setBioNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="py-3 px-6 bg-[#0c2340] hover:bg-[#1c398e] text-white text-xs font-bold uppercase rounded-xl tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
              <span>Save Preferences & Run Compatibility Engine</span>
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: COMPATIBILITY MATCHES BOARD */}
      {activeStep === 'matches' && (
        <div className="space-y-4">
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between text-xs text-purple-900">
            <span>
              ⭐ <strong>Algorithm Output:</strong> Weighted matching evaluated across sleep cycles, study noise tolerance, cleanliness, and diet.
            </span>
            <button
              onClick={() => setActiveStep('rooms')}
              className="px-3 py-1 bg-purple-700 text-white font-bold rounded-lg text-xs hover:bg-purple-800"
            >
              Proceed to Room Selection →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((m) => (
              <div
                key={m.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{m.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">MIS: {m.mis} • {m.branch}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-black font-mono text-purple-700 block">
                        {m.matchScore}%
                      </span>
                      <span className="text-[9px] font-bold uppercase text-purple-600 block">
                        Compatibility
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 italic mt-2">
                    "{m.pref?.bioNotes || 'Looking forward to a productive semester!'}"
                  </p>

                  <div className="mt-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Why You Match:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.matchHighlights?.map((h, i) => (
                        <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold rounded">
                          ✓ {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Hostel Location: <strong>{m.allocatedRoom}</strong>
                  </span>

                  <button
                    onClick={() => {
                      setSelectedRoom(m.roomNumber);
                      setSelectedBed('Bed 2 (Window Side)');
                      setActiveStep('rooms');
                    }}
                    className="px-3 py-1.5 bg-[#0c2340] hover:bg-[#1c398e] text-white text-xs font-bold uppercase rounded-xl cursor-pointer"
                  >
                    Select Room {m.roomNumber}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: INTERACTIVE ROOM & BED GRID */}
      {activeStep === 'rooms' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-900">
            <span>
              🏢 <strong>Hostel Block A (2nd Floor Layout):</strong> Pick an available room and bed. Recommended rooms indicate compatible roommates!
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((r) => {
              const isFull = r.status === 'FULLY_OCCUPIED';
              const isMine = currentAllotment?.roomNumber === r.roomNumber;

              return (
                <div
                  key={r.roomNumber}
                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    isMine
                      ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-400'
                      : r.isRecommended
                      ? 'bg-purple-50/50 border-purple-300 ring-1 ring-purple-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-black text-slate-900">Room {r.roomNumber}</span>
                        {r.isRecommended && (
                          <span className="px-2 py-0.2 bg-purple-600 text-white text-[9px] font-bold rounded uppercase">
                            ⭐ TOP MATCH
                          </span>
                        )}
                        {isMine && (
                          <span className="px-2 py-0.2 bg-emerald-600 text-white text-[9px] font-bold rounded uppercase">
                            YOUR ALLOTMENT
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">{r.floor} • {r.acType}</p>
                    </div>

                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                      isFull ? 'bg-red-100 text-red-700' : r.status === 'PARTIALLY_OCCUPIED' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Bed 1 & Bed 2 Details */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    {/* Bed 1 */}
                    <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 block text-[11px]">{r.bed1.number}</span>
                        <span className="text-[10px] text-slate-500">
                          {r.bed1.occupied ? `Occupant: ${r.bed1.occupant}` : '🟢 Available (Free)'}
                        </span>
                      </div>
                      {!r.bed1.occupied && (
                        <button
                          onClick={() => handleConfirmAllotment(r.roomNumber, r.bed1.number)}
                          className="px-2.5 py-1 bg-[#0c2340] text-white text-[10px] font-bold uppercase rounded-lg hover:bg-blue-900 cursor-pointer"
                        >
                          Book Bed 1
                        </button>
                      )}
                    </div>

                    {/* Bed 2 */}
                    <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 block text-[11px]">{r.bed2.number}</span>
                        <span className="text-[10px] text-slate-500">
                          {r.bed2.occupied ? `Occupant: ${r.bed2.occupant}` : '🟢 Available (Free)'}
                        </span>
                      </div>
                      {!r.bed2.occupied && (
                        <button
                          onClick={() => handleConfirmAllotment(r.roomNumber, r.bed2.number)}
                          className="px-2.5 py-1 bg-[#0c2340] text-white text-[10px] font-bold uppercase rounded-lg hover:bg-blue-900 cursor-pointer"
                        >
                          Book Bed 2
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 4: OFFICIAL DIGITAL ROOM ALLOTMENT SLIP */}
      {activeStep === 'slip' && (
        <div className="max-w-2xl mx-auto p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-6">
          <div className="text-center border-b border-slate-100 pb-5 space-y-1">
            <span className="px-3 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase rounded-full tracking-wider">
              OFFICIAL ALLOTMENT CONFIRMED
            </span>
            <h3 className="text-lg font-black text-slate-900">
              IIIT Pune Hostel Residence Allotment Slip
            </h3>
            <p className="text-xs text-slate-500">Academic Year 2026-27 • Semester Residence Card</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Resident Name</span>
              <p className="font-bold text-slate-900 text-sm">{user?.name}</p>
              <p className="text-slate-500 font-mono">MIS: {user?.userId}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Allocated Bed</span>
              <p className="font-bold text-[#1c398e] text-sm">
                {currentAllotment?.roomNumber || 'A-204'} ({currentAllotment?.bedNumber || 'Bed 2'})
              </p>
              <p className="text-slate-500">{currentAllotment?.hostelBlock || 'Hostel Block A'}</p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Matched Roommate Details</span>
            </div>
            <p className="text-slate-700">
              Your roommate in Room {currentAllotment?.roomNumber || 'A-204'} is <strong>Devansh Gupta (MIS: 112415018, CSE)</strong>, matched via compatibility algorithm with a <strong>96% lifestyle score</strong>.
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            <span>Issued by: Chief Hostel Warden Office</span>
            <span className="font-mono">Ref: IIITP-HSTL-2026-0042</span>
          </div>
        </div>
      )}
    </div>
  );
}
