import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { API_URL } from '../config/api';
import { 
  AlertOctagon, Heart, Flame, ShieldAlert, 
  Activity, AlertCircle, HelpCircle, X, 
  MapPin, Phone, User, Calendar, PhoneCall,
  Smartphone, Shield, CheckCircle, ExternalLink,
  Radio, PhoneForwarded
} from 'lucide-react';

const CATEGORIES = [
  { name: 'Medical Emergency', value: 'MEDICAL', icon: Heart, color: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100/70' },
  { name: 'Fire Emergency', value: 'FIRE', icon: Flame, color: 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100/70' },
  { name: 'Security Threat', value: 'SECURITY', icon: ShieldAlert, color: 'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100/70' },
  { name: 'Accident / Injury', value: 'ACCIDENT', icon: Activity, color: 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100/70' },
  { name: 'Harassment / Safety', value: 'HARASSMENT', icon: AlertCircle, color: 'text-pink-600 bg-pink-50 border-pink-200 hover:bg-pink-100/70' },
  { name: 'Other Urgent Issue', value: 'OTHER', icon: HelpCircle, color: 'text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100/70' },
];

const DEFAULT_HELPLINES = [
  {
    id: 'sec',
    name: 'Campus Security Control Room (24x7 QRT)',
    number: '+91 9826381867',
    dialNumber: '9826381867',
    role: 'Main Gate & Campus Patrol',
    color: 'bg-red-600 text-white hover:bg-red-700',
    badge: 'PRIORITY 1',
    badgeColor: 'bg-red-100 text-red-800 border-red-200'
  },
  {
    id: 'amb',
    name: 'Campus Emergency Ambulance & Medical',
    number: '+91 9826381867',
    dialNumber: '9826381867',
    role: '24x7 Medical Health Center',
    color: 'bg-emerald-600 text-white hover:bg-emerald-700',
    badge: 'MEDICAL',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  {
    id: 'hosp',
    name: 'Harneshwar Multispeciality Hospital',
    number: '+91 98220 12345',
    dialNumber: '+919822012345',
    role: 'Empanelled Tie-up Hospital',
    color: 'bg-[#0c2340] text-white hover:bg-[#1a365d]',
    badge: 'ICU / TRAUMA',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    id: 'nat',
    name: 'National Emergency Helpline (Police / Fire / Med)',
    number: '112',
    dialNumber: '112',
    role: 'Govt. Emergency Response Support System',
    color: 'bg-slate-900 text-white hover:bg-black',
    badge: 'TOLL FREE',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200'
  },
  {
    id: 'women',
    name: 'Women Safety & Anti-Ragging Helpline',
    number: '1091',
    dialNumber: '1091',
    role: 'Anti-Harassment Squad',
    color: 'bg-purple-700 text-white hover:bg-purple-800',
    badge: '24x7 CELL',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  {
    id: 'warden',
    name: 'Chief Hostel Warden (Residence)',
    number: '+91 98230 12345',
    dialNumber: '+919823012345',
    role: 'Hostel Affairs & Student Residence',
    color: 'bg-amber-700 text-white hover:bg-amber-800',
    badge: 'HOSTEL',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
  }
];

export default function SOSModal({ isOpen, onClose, onSOSTriggered }) {
  const { user, token } = useAuth();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState('sos'); // 'sos' | 'call'
  const [step, setStep] = useState(1); // 1: Category selection, 2: Countdown/Form
  const [selectedCat, setSelectedCat] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [timerRunning, setTimerRunning] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [manualLocation, setManualLocation] = useState('');
  const [description, setDescription] = useState('');
  const [campusLocations, setCampusLocations] = useState([]);
  const [dynamicContacts, setDynamicContacts] = useState([]);
  const [gpsError, setGpsError] = useState('');
  const [loading, setLoading] = useState(false);

  const countdownIntervalRef = useRef(null);

  // Fetch campus locations and emergency contacts
  useEffect(() => {
    if (isOpen && token) {
      fetch(`${API_URL}/locations`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setCampusLocations(data);
            if (data.length > 0) setManualLocation(data[0].name);
          }
        })
        .catch(err => console.error(err));

      fetch(`${API_URL}/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setDynamicContacts(data);
          }
        })
        .catch(err => console.error(err));
    }
  }, [isOpen, token]);

  // Capture Geolocation
  const captureLocation = () => {
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError('Browser does not support Geolocation.');
      setGpsLocation({ latitude: 18.487700, longitude: 73.815600 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Error fetching GPS coordinates:', error);
        setGpsError('Could not fetch GPS. Using manual campus location.');
        setGpsLocation({ latitude: 18.487700, longitude: 73.815600 });
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleSelectCategory = (cat) => {
    setSelectedCat(cat);
    setStep(2);
    setCountdown(5);
    setTimerRunning(true);
    captureLocation();
  };

  // Timer Effect
  useEffect(() => {
    if (timerRunning && countdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0 && timerRunning) {
      setTimerRunning(false);
      triggerEmergency();
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [countdown, timerRunning]);

  const cancelSOS = () => {
    setTimerRunning(false);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setStep(1);
    setSelectedCat(null);
  };

  const triggerEmergency = async () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setTimerRunning(false);
    setLoading(true);

    let lat = gpsLocation?.latitude || 18.487700;
    let lng = gpsLocation?.longitude || 73.815600;

    const matchedLoc = campusLocations.find(l => l.name === manualLocation);
    if (matchedLoc) {
      lat = matchedLoc.latitude;
      lng = matchedLoc.longitude;
    }

    try {
      const response = await fetch(`${API_URL}/emergencies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: selectedCat.value,
          latitude: lat,
          longitude: lng,
          manualLocation,
          description,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to report emergency');
      }

      if (onSOSTriggered) {
        onSOSTriggered(data.emergency);
      }
      onClose();
      resetForm();
    } catch (err) {
      alert(`SOS Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedCat(null);
    setCountdown(5);
    setTimerRunning(false);
    setGpsLocation(null);
    setDescription('');
    setGpsError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-red-50/80 shrink-0">
          <div className="flex items-center gap-2.5 text-red-600">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-black text-sm sm:text-base uppercase tracking-wider text-slate-900 leading-tight">
                CAMPUS EMERGENCY SOS
              </h4>
              <p className="text-[10px] text-red-700 font-bold uppercase tracking-wider">
                IIIT Pune 24x7 Immediate Victim Assistance
              </p>
            </div>
          </div>
          <button 
            onClick={() => { onClose(); resetForm(); }}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Division Selector: Digital SOS Broadcast vs 1-Click Direct Phone Calling */}
        <div className="p-2 sm:p-3 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('sos')}
            className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'sos'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Digital CAD Alert</span>
          </button>
          <button
            onClick={() => setActiveTab('call')}
            className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'call'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
            <span>1-Click Phone Call</span>
            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[8px] font-bold rounded-full">
              PHONE
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4">

          {/* TAB 1: 1-CLICK IMMEDIATE CALL HELPLINES (Phone Optimized) */}
          {activeTab === 'call' && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                    DIRECT PHONE SPEED-DIAL
                  </h5>
                  <p className="text-[10px] text-emerald-700 leading-tight">
                    Tap any line below to instantly dial from your phone. Zero typing required.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DEFAULT_HELPLINES.map((hl) => (
                  <div
                    key={hl.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between gap-2.5 hover:border-slate-300 transition-colors shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full border ${hl.badgeColor}`}>
                          {hl.badge}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold truncate">
                          {hl.role}
                        </span>
                      </div>
                      <h6 className="text-xs font-black text-slate-900 leading-snug">
                        {hl.name}
                      </h6>
                      <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">
                        {hl.number}
                      </p>
                    </div>

                    <a
                      href={`tel:${hl.dialNumber}`}
                      className={`w-full py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer ${hl.color}`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Tap to Call Now</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: DIGITAL SOS DISPATCH WORKFLOW */}
          {activeTab === 'sos' && (
            <>
              {/* Top Quick Phone Banner even in Digital mode */}
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-red-900 uppercase block">Need to speak immediately?</span>
                    <span className="text-xs font-bold text-slate-900">24x7 Control Room: +91 9826381867</span>
                  </div>
                </div>
                <a
                  href="tel:9826381867"
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-xs flex items-center gap-1 shrink-0 transition-transform active:scale-95"
                >
                  <PhoneCall className="w-3 h-3" /> Call
                </a>
              </div>

              {/* Step 1: Category Selection */}
              {step === 1 && (
                <div className="space-y-3">
                  <p className="text-slate-600 text-xs text-center">
                    Select your emergency category. System instantly calculates closest on-duty responders and transmits GPS.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.value}
                          onClick={() => handleSelectCategory(cat)}
                          className={`flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border text-center transition-all cursor-pointer group active:scale-95 shadow-2xs ${cat.color}`}
                        >
                          <Icon className="w-7 h-7 mb-1.5 group-hover:scale-110 transition-transform shrink-0" />
                          <span className="text-xs font-black uppercase tracking-wide leading-tight">
                            {cat.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Confirmation & 5-Second Safe Countdown */}
              {step === 2 && (
                <div className="space-y-3">
                  {/* Top timer banner */}
                  <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-4 text-center space-y-2">
                    <span className="text-[10px] font-black text-red-700 uppercase tracking-widest block">
                      FALSE ALARM CANCELLATION BUFFER
                    </span>
                    <h5 className="text-base sm:text-lg font-black text-slate-900">
                      Transmitting SOS in <span className="text-red-600 text-3xl font-black px-1.5 inline-block">{countdown}</span> seconds
                    </h5>
                    <div className="flex gap-2 justify-center pt-1">
                      <button
                        onClick={cancelSOS}
                        className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl uppercase tracking-wider transition-colors border border-slate-200 cursor-pointer shadow-xs"
                      >
                        Cancel Transmission
                      </button>
                      <a
                        href="tel:9826381867"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <PhoneCall className="w-3.5 h-3.5" /> Speak on Call Now
                      </a>
                    </div>
                  </div>

                  {/* Incident details form */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                        <User className="w-4 h-4 text-[#1c398e] shrink-0" />
                        <div className="truncate">
                          <p className="text-[9px] text-slate-400 uppercase font-bold">REPORTER</p>
                          <p className="font-bold text-slate-800 truncate">{user?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                        <Phone className="w-4 h-4 text-[#1c398e] shrink-0" />
                        <div className="truncate">
                          <p className="text-[9px] text-slate-400 uppercase font-bold">YOUR PHONE</p>
                          <p className="font-bold text-slate-800 truncate">{user?.contactNumber || '9876543210'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Location Selectors */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
                        <span>Incident Campus Location</span>
                        <span className="text-[10px] text-[#1c398e] font-bold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-500" />
                          {gpsLocation ? 'GPS Calibrated' : 'GPS Calibrating...'}
                        </span>
                      </label>
                      <select
                        value={manualLocation}
                        onChange={(e) => setManualLocation(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#5367c8] text-xs font-bold"
                      >
                        {campusLocations.map((loc) => (
                          <option key={loc.id} value={loc.name}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                      {gpsError && (
                        <p className="text-[10px] text-amber-700 font-medium mt-1">{gpsError}</p>
                      )}
                    </div>

                    {/* Description field */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Emergency Note (Optional)
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Near ground floor elevator / urgent medical assistance..."
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5367c8] text-xs"
                      />
                    </div>

                    {/* Immediate Dispatch Button */}
                    <button
                      onClick={triggerEmergency}
                      disabled={loading}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
                    >
                      <AlertOctagon className="w-4 h-4" />
                      {loading ? 'Transmitting to CAD Officers...' : 'TRIGGER IMMEDIATE SOS BROADCAST'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
