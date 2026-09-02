import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  AlertOctagon, Heart, Flame, ShieldAlert, 
  Activity, AlertCircle, HelpCircle, X, 
  MapPin, Phone, User, Calendar, ShieldAlert as AlertIcon
} from 'lucide-react';

const CATEGORIES = [
  { name: 'Medical Emergency', value: 'MEDICAL', icon: Heart, color: 'bg-red-500/20 text-red-500 hover:bg-red-500/30 border-red-500/30' },
  { name: 'Fire Emergency', value: 'FIRE', icon: Flame, color: 'bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 border-orange-500/30' },
  { name: 'Security Threat', value: 'SECURITY', icon: ShieldAlert, color: 'bg-purple-500/20 text-purple-500 hover:bg-purple-500/30 border-purple-500/30' },
  { name: 'Accident / Injury', value: 'ACCIDENT', icon: Activity, color: 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border-amber-500/30' },
  { name: 'Harassment / Safety Concern', value: 'HARASSMENT', icon: AlertCircle, color: 'bg-pink-500/20 text-pink-500 hover:bg-pink-500/30 border-pink-500/30' },
  { name: 'Other Emergency', value: 'OTHER', icon: HelpCircle, color: 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 border-slate-500/30' },
];

export default function SOSModal({ isOpen, onClose, onSOSTriggered }) {
  const { user, token } = useAuth();
  const { socket } = useSocket();
  const [step, setStep] = useState(1); // 1: Category selection, 2: Countdown/Form
  const [selectedCat, setSelectedCat] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [timerRunning, setTimerRunning] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [manualLocation, setManualLocation] = useState('');
  const [description, setDescription] = useState('');
  const [campusLocations, setCampusLocations] = useState([]);
  const [gpsError, setGpsError] = useState('');
  const [loading, setLoading] = useState(false);

  const countdownIntervalRef = useRef(null);

  // Fetch campus locations for manual dropdown
  useEffect(() => {
    if (isOpen && token) {
      fetch('http://localhost:5000/api/locations', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setCampusLocations(data);
          if (data.length > 0) setManualLocation(data[0].name);
        })
        .catch(err => console.error(err));
    }
  }, [isOpen, token]);

  // Capture Geolocation
  const captureLocation = () => {
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError('Browser does not support Geolocation.');
      // Default to center campus coordinates
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
        setGpsError('Could not fetch GPS. Using manual location.');
        // Default to center campus coordinates
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

    // Resolve coordinate from manualLocation lookup if GPS is set to default
    let lat = gpsLocation?.latitude || 18.487700;
    let lng = gpsLocation?.longitude || 73.815600;

    const matchedLoc = campusLocations.find(l => l.name === manualLocation);
    if (matchedLoc) {
      lat = matchedLoc.latitude;
      lng = matchedLoc.longitude;
    }

    try {
      const response = await fetch('http://localhost:5000/api/emergencies', {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-xl bg-slate-900 border border-red-500/30 rounded-2xl overflow-hidden shadow-2xl sos-pulse-effect">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5 text-iiitp-danger">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
            <h4 className="font-extrabold text-lg uppercase tracking-wider text-white">CAMPUS SOS CONSOLE</h4>
          </div>
          <button 
            onClick={() => { onClose(); resetForm(); }}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Category Selection */}
        {step === 1 && (
          <div className="p-6">
            <p className="text-slate-400 text-sm text-center mb-6">
              Select the category that matches your emergency. This immediately alerts campus security responders.
            </p>
            <div className="grid grid-cols-2 gap-3.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    onClick={() => handleSelectCategory(cat)}
                    className={`flex flex-col items-center justify-center p-5 rounded-xl border bg-slate-800/40 hover:scale-[1.02] text-center transition-all duration-200 ${cat.color}`}
                  >
                    <Icon className="w-10 h-10 mb-3" />
                    <span className="text-xs font-extrabold uppercase tracking-wide">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Confirmation / Details Countdown */}
        {step === 2 && (
          <div className="p-6">
            {/* Top timer banner */}
            <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-5 text-center mb-6">
              <span className="text-xxs font-bold text-red-500 uppercase tracking-widest block mb-1">
                TRASH ALARM PREVENTION WINDOW
              </span>
              <h5 className="text-xl font-black text-white">
                SOS triggering in <span className="text-red-500 text-3xl font-extrabold px-1 animate-ping-slow inline-block">{countdown}</span> seconds
              </h5>
              <button
                onClick={cancelSOS}
                className="mt-3.5 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg uppercase tracking-wider transition-colors border border-slate-700"
              >
                CANCEL EMERGENCY REQUEST
              </button>
            </div>

            {/* Reporter metadata pre-filled */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg text-slate-300">
                  <User className="w-4 h-4 text-iiitp-gold" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">REPORTER</p>
                    <p className="font-semibold text-white truncate">{user?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg text-slate-300">
                  <Phone className="w-4 h-4 text-iiitp-gold" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">CONTACT</p>
                    <p className="font-semibold text-white truncate">{user?.contactNumber}</p>
                  </div>
                </div>
              </div>

              {/* Location Selectors */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Manual Location (Fallback)</span>
                  <span className="text-xxs text-iiitp-gold flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {gpsLocation ? 'GPS Calibrated' : 'GPS Fetching...'}
                  </span>
                </label>
                <select
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-red-500 text-sm"
                >
                  {campusLocations.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                {gpsError && (
                  <p className="text-[10px] text-amber-500 mt-1">{gpsError}</p>
                )}
              </div>

              {/* Description field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Describe Emergency Incident (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Broken ankle near sports area / breathing difficulties..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm resize-none"
                />
              </div>

              {/* Trigger Now Button */}
              <button
                onClick={triggerEmergency}
                disabled={loading}
                className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold rounded-xl uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 hover:shadow-red-500/20 text-sm transition-all duration-200"
              >
                <AlertIcon className="w-4 h-4 animate-bounce" />
                {loading ? 'INITIATING EMERGENCY SEQUENCE...' : 'TRIGGER SOS IMMEDIATE'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
