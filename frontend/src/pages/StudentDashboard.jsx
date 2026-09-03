import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { 
  Heart, Flame, ShieldAlert, Activity, AlertCircle, HelpCircle, 
  MapPin, Phone, User, Clock, AlertTriangle, Shield, CheckCircle,
  BookOpen, Building, Calendar, GraduationCap, Sparkles, Send, Award, CheckCircle2, ChevronRight, FileCheck, CheckSquare, AlertOctagon
} from 'lucide-react';
import SOSModal from '../components/SOSModal';
import SemesterRegistrationTab from '../components/SemesterRegistrationTab';
import NoDuesClearanceTab from '../components/NoDuesClearanceTab';

// Helper to create custom Leaflet marker icons with CSS and emojis
const createMarkerIcon = (color, emoji) => {
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); font-size: 18px; cursor: pointer;">${emoji}</div>`,
    className: 'custom-marker-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const EMERGENCY_EMOJIS = {
  MEDICAL: '❤️',
  FIRE: '🔥',
  SECURITY: '🛡️',
  ACCIDENT: '🩹',
  HARASSMENT: '⚠️',
  OTHER: '❓',
};

const EMERGENCY_COLORS = {
  MEDICAL: '#dc2626',
  FIRE: '#f97316',
  SECURITY: '#a855f7',
  ACCIDENT: '#f59e0b',
  HARASSMENT: '#ec4899',
  OTHER: '#64748b',
};

export default function StudentDashboard() {
  const { user, token } = useAuth();
  const { socket } = useSocket();
  const [portalTab, setPortalTab] = useState('sos'); // 'sos' | 'attendance' | 'academics' | 'facilities' | 'clubs' | 'profile'
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [history, setHistory] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [assignedResponder, setAssignedResponder] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Attendance state
  const [attendanceData, setAttendanceData] = useState({ summary: [], detailedHistory: [], studentSection: '' });
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Booking form state
  const [selectedFacility, setSelectedFacility] = useState('AI/ML Computing Lab');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Event RSVP state
  const [registeredEvents, setRegisteredEvents] = useState([]);

  // Fetch active, history, contacts
  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // Fetch student attendance summary
  useEffect(() => {
    if (token) {
      setLoadingAttendance(true);
      fetch('/api/attendance/student-summary', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.summary)) {
            setAttendanceData(data);
          }
        })
        .catch(err => console.error('Attendance fetch error:', err))
        .finally(() => setLoadingAttendance(false));
    }
  }, [token, portalTab]);

  const fetchData = async () => {
    try {
      // 1. Fetch active emergencies
      const activeRes = await fetch('http://localhost:5000/api/emergencies/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const activeData = await activeRes.json();
      const activeList = Array.isArray(activeData) ? activeData : [];
      
      // Find if this student has an active request
      const studentActive = user ? activeList.find(req => req.reporterId === user.id) : null;
      setActiveEmergency(studentActive || null);

      if (studentActive) {
        // Extract assigned responder if status is RESPONDER_ASSIGNED or further
        const activeAssignment = Array.isArray(studentActive.assignments)
          ? studentActive.assignments.find(a => a.status === 'ACCEPTED' || a.status === 'PENDING')
          : null;
        if (activeAssignment) {
          setAssignedResponder(activeAssignment.responder);
        } else {
          setAssignedResponder(null);
        }
      }

      // 2. Fetch history
      const historyRes = await fetch('http://localhost:5000/api/emergencies/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const historyData = await historyRes.json();
      const historyList = Array.isArray(historyData) ? historyData : [];
      const studentHistory = user ? historyList.filter(req => req.reporterId === user.id) : [];
      setHistory(studentHistory);

      // 3. Fetch contacts
      const contactsRes = await fetch('http://localhost:5000/api/contacts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const contactsData = await contactsRes.json();
      setContacts(Array.isArray(contactsData) ? contactsData : []);

    } catch (err) {
      console.error('Error fetching student dashboard data:', err);
    }
  };

  // Listen for WebSocket updates to the student's active request
  useEffect(() => {
    if (!socket) return;

    const handleEmergencyUpdated = (data) => {
      // Refresh details if this request is mine
      if (activeEmergency && data.requestId === activeEmergency.id) {
        fetchData();
      } else if (data.request && data.request.reporterId === user.id) {
        fetchData();
      }
    };

    const handleResponderLocation = (data) => {
      if (activeEmergency && assignedResponder && data.responderId === assignedResponder.id) {
        setAssignedResponder(prev => ({
          ...prev,
          latitude: data.latitude,
          longitude: data.longitude,
        }));
      }
    };

    socket.on('emergency_updated', handleEmergencyUpdated);
    socket.on('emergency_escalated', handleEmergencyUpdated);
    socket.on('responder_location_updated', handleResponderLocation);

    // If new emergency is created (possibly by this student)
    socket.on('new_emergency', (data) => {
      if (data.emergency.reporterId === user.id) {
        fetchData();
      }
    });

    return () => {
      socket.off('emergency_updated', handleEmergencyUpdated);
      socket.off('emergency_escalated', handleEmergencyUpdated);
      socket.off('responder_location_updated', handleResponderLocation);
    };
  }, [socket, activeEmergency, assignedResponder]);

  const handleCancelRequest = async () => {
    if (!activeEmergency) return;
    const confirmCancel = window.confirm('Are you sure you want to cancel this emergency request?');
    if (!confirmCancel) return;

    setCancelLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/emergencies/${activeEmergency.id}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        setActiveEmergency(null);
        setAssignedResponder(null);
        fetchData();
      } else {
        const d = await res.json();
        alert(`Failed to cancel: ${d.error}`);
      }
    } catch (err) {
      alert(`Error cancelling: ${err.message}`);
    } finally {
      setCancelLoading(false);
    }
  };

  // Determine status steps for progress timeline
  const statusSteps = [
    { key: 'REPORTED', label: 'Reported', desc: 'Emergency broadcast to system' },
    { key: 'RESPONDER_ASSIGNED', label: 'Acknowledged', desc: 'Control center analyzing alert' },
    { key: 'RESPONDER_EN_ROUTE', label: 'Responder En Route', desc: 'Assigned personnel dispatched' },
    { key: 'RESPONDER_ARRIVED', label: 'Responder Arrived', desc: 'Support reached the scene' },
    { key: 'RESOLVED', label: 'Resolved', desc: 'Incident resolved successfully' },
  ];

  const getStatusIndex = (currentStatus) => {
    return statusSteps.findIndex(s => s.key === currentStatus);
  };

  const currentStatusIndex = activeEmergency ? getStatusIndex(activeEmergency.status) : -1;

  // Calculate Haversine Distance between student and responder for tracking
  const getSimulatedDistanceText = () => {
    if (!activeEmergency || !assignedResponder) return '';
    const lat1 = activeEmergency.latitude;
    const lon1 = activeEmergency.longitude;
    const lat2 = assignedResponder.latitude;
    const lon2 = assignedResponder.longitude;

    // Standard distance calculation in meters
    const R = 6371e3;
    const phi1 = lat1 * Math.PI/180;
    const phi2 = lat2 * Math.PI/180;
    const deltaPhi = (lat2-lat1) * Math.PI/180;
    const deltaLambda = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const dist = R * c;

    if (dist < 10) return 'Arrived';
    return `${Math.round(dist)} meters away`;
  };

  // Estimated response time based on current coordinates
  const getERTMinutes = () => {
    if (!activeEmergency || !assignedResponder) return null;
    const lat1 = activeEmergency.latitude;
    const lon1 = activeEmergency.longitude;
    const lat2 = assignedResponder.latitude;
    const lon2 = assignedResponder.longitude;

    const R = 6371e3;
    const phi1 = lat1 * Math.PI/180;
    const phi2 = lat2 * Math.PI/180;
    const deltaPhi = (lat2-lat1) * Math.PI/180;
    const deltaLambda = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const dist = R * c;

    return Math.ceil(dist / 2 / 60) + 1; // Assume 2 m/s movement speed + 1 minute buffer
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-900">
      {/* Header Greeting Banner */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm bg-white">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-black uppercase rounded tracking-wider">
              OFFICIAL STUDENT PORTAL
            </span>
            <span className="text-xxs text-slate-500 font-mono font-bold">
              MIS: {user?.userId || '112415079'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.name || 'Student'}!
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Here's what's happening with your campus life at IIIT Pune.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSosOpen(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase rounded-xl tracking-wider shadow-md flex items-center gap-2 transition-all cursor-pointer animate-pulse"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Emergency SOS</span>
          </button>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Summary */}
        <div 
          onClick={() => setPortalTab('attendance')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            portalTab === 'attendance'
              ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xxs font-extrabold uppercase text-slate-500 tracking-wider">Overall Attendance</span>
            <CheckSquare className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-slate-900">82%</h3>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase rounded">
              Good Standing
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">Target threshold 75% • All courses safe</p>
        </div>

        {/* Semester Registration Summary */}
        <div 
          onClick={() => setPortalTab('registration')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            portalTab === 'registration'
              ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xxs font-extrabold uppercase text-slate-500 tracking-wider">Semester Registration</span>
            <FileCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-xl font-black text-slate-900">Verified</h3>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black uppercase rounded">
              Approved
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">Warden & Advisor approvals complete</p>
        </div>

        {/* No-Dues Clearance Summary */}
        <div 
          onClick={() => setPortalTab('nodues')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            portalTab === 'nodues'
              ? 'bg-white border-amber-500 shadow-md ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xxs font-extrabold uppercase text-slate-500 tracking-wider">No-Dues Clearance</span>
            <GraduationCap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-xl font-black text-slate-900">15 / 15</h3>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase rounded">
              Cleared
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">Ready to download certificate</p>
        </div>

        {/* Emergency Alert Summary */}
        <div 
          onClick={() => setPortalTab('sos')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeEmergency 
              ? 'bg-red-50 border-red-300 shadow-md animate-pulse'
              : portalTab === 'sos'
              ? 'bg-white border-red-500 shadow-md ring-2 ring-red-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xxs font-extrabold uppercase text-slate-500 tracking-wider">Emergency Status</span>
            <ShieldAlert className={`w-4 h-4 ${activeEmergency ? 'text-red-600 animate-bounce' : 'text-slate-400'}`} />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-base font-black text-slate-900 truncate">
              {activeEmergency ? 'ACTIVE ALERT' : 'No Active Alerts'}
            </h3>
            <span className={`px-2 py-0.5 border text-[10px] font-black uppercase rounded ${
              activeEmergency ? 'bg-red-100 text-red-700 border-red-300' : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {activeEmergency ? activeEmergency.status : 'Normal'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">Campus Security & Response Active</p>
        </div>
      </div>

      {/* Quick Action Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 overflow-x-auto">
        <div className="flex gap-2">
          <button
            onClick={() => setPortalTab('sos')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              portalTab === 'sos'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Emergency SOS</span>
          </button>

          <button
            onClick={() => setPortalTab('attendance')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              portalTab === 'attendance'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Attendance</span>
          </button>

          <button
            onClick={() => setPortalTab('registration')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              portalTab === 'registration'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Semester Registration</span>
          </button>

          <button
            onClick={() => setPortalTab('nodues')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              portalTab === 'nodues'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>No-Dues Clearance</span>
          </button>

          <button
            onClick={() => setPortalTab('academics')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              portalTab === 'academics'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Academics & Documents</span>
          </button>

          <button
            onClick={() => setPortalTab('facilities')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              portalTab === 'facilities'
                ? 'bg-teal-600 text-white shadow-lg'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Facilities</span>
          </button>

          <button
            onClick={() => setPortalTab('profile')}
            className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              portalTab === 'profile'
                ? 'bg-iiitp-success text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student ID</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: EMERGENCY SOS SYSTEM */}
      {portalTab === 'sos' && (
        <>
          {activeEmergency ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tracking Card Details */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                <div className="glass-card p-6 rounded-2xl border border-red-500/20 shadow-glow-danger relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-iiitp-danger animate-ping"></span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-iiitp-danger">CRITICAL INCIDENT LIVE</span>
                  </div>
                  <h3 className="text-2xl font-black text-white mt-2">{activeEmergency.id}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Type: <span className="font-bold text-red-400 uppercase">{activeEmergency.type}</span>
                  </p>

                  <div className="border-t border-slate-800 my-4"></div>

                  <div className="space-y-5">
                    {statusSteps.map((step, idx) => {
                      const isDone = idx <= currentStatusIndex;
                      const isCurrent = idx === currentStatusIndex;
                      return (
                        <div key={step.key} className="flex gap-3.5 timeline-item relative">
                          <div className={`timeline-dot w-6 h-6 rounded-full shrink-0 flex items-center justify-center border text-[10px] font-bold z-10 transition-colors ${
                            isDone 
                              ? 'bg-iiitp-danger border-iiitp-danger text-white' 
                              : 'bg-slate-900 border-slate-700 text-slate-500'
                          } ${isCurrent ? 'ring-4 ring-red-500/25 animate-pulse-fast' : ''}`}>
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className={`text-xs font-black uppercase tracking-wide ${isDone ? 'text-white' : 'text-slate-500'}`}>
                              {step.label}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">{step.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-slate-800 my-4"></div>

                  {assignedResponder ? (
                    <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-iiitp-success block">
                        ASSIGNED RESPONDER
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                          💂
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white">{assignedResponder.user?.name}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">{assignedResponder.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-800 text-slate-300">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-iiitp-gold" />
                          ETA: {getERTMinutes() ? `${getERTMinutes()} mins` : 'Estimating...'}
                        </span>
                        <span className="text-xxs font-bold text-slate-400">
                          {getSimulatedDistanceText()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-center space-y-2.5">
                      <Clock className="w-6 h-6 text-iiitp-gold animate-spin mx-auto" />
                      <p className="text-xs text-slate-300 font-bold">Scanning Nearest Responders...</p>
                    </div>
                  )}

                  <button
                    onClick={handleCancelRequest}
                    disabled={cancelLoading}
                    className="w-full mt-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-extrabold rounded-lg text-xs uppercase tracking-wider transition-colors border border-slate-700 disabled:opacity-50"
                  >
                    {cancelLoading ? 'Cancelling...' : 'Cancel Request (False Alarm)'}
                  </button>
                </div>
              </div>

              {/* Interactive Live Map Tracking */}
              <div className="lg:col-span-2 glass-card p-4 rounded-2xl border border-iiitp-border flex flex-col h-[520px] lg:h-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-iiitp-danger" />
                    Live Incident Dispatch Map
                  </span>
                </div>
                
                <div className="flex-1 rounded-xl overflow-hidden relative">
                  <MapContainer 
                    center={[activeEmergency.latitude, activeEmergency.longitude]} 
                    zoom={17} 
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap'
                    />
                    <Marker 
                      position={[activeEmergency.latitude, activeEmergency.longitude]} 
                      icon={createMarkerIcon(EMERGENCY_COLORS[activeEmergency.type] || '#dc2626', EMERGENCY_EMOJIS[activeEmergency.type] || '🚨')}
                    />
                    {assignedResponder && (
                      <Marker 
                        position={[assignedResponder.latitude, assignedResponder.longitude]} 
                        icon={createMarkerIcon('#16a34a', '💂')}
                      />
                    )}
                    {assignedResponder && (
                      <Polyline 
                        positions={[
                          [assignedResponder.latitude, assignedResponder.longitude],
                          [activeEmergency.latitude, activeEmergency.longitude]
                        ]} 
                        color="#f59e0b"
                        weight={4}
                        dashArray="8, 6"
                      />
                    )}
                  </MapContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Panel: Giant Pulse Trigger */}
              <div className="glass-card rounded-3xl border border-slate-800 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-tr from-transparent via-red-950/15 to-transparent rotate-45 pointer-events-none"></div>

                <span className="px-3 py-1 bg-red-950/40 border border-red-500/25 text-red-500 rounded-full text-xxs font-black tracking-widest uppercase mb-6 animate-pulse">
                  CAMPUS SAFETY CONSOLE
                </span>

                <button
                  onClick={() => setIsSosOpen(true)}
                  className="w-48 h-48 rounded-full bg-gradient-to-b from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 shadow-glow-danger flex flex-col items-center justify-center text-white border-4 border-red-400/35 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 cursor-pointer sos-pulse-effect relative z-10"
                >
                  <ShieldAlert className="w-16 h-16 animate-pulse" />
                  <span className="text-lg font-black tracking-wider uppercase mt-3">TRIGGER SOS</span>
                  <span className="text-[10px] text-red-200 tracking-wider font-semibold uppercase mt-0.5">PRESS IN EMERGENCY</span>
                </button>

                <h3 className="text-xl font-bold mt-8 text-white">Need Urgent Security or Medical Support?</h3>
                <p className="text-slate-400 text-sm max-w-md mt-2">
                  Pressing the button will notify campus emergency teams immediately. Captures location, user ID, and recommends closest response agents.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Emergency Contacts Directory */}
                <div className="glass-card p-6 rounded-2xl border border-iiitp-border space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-iiitp-gold" />
                    IIIT Pune Emergency Contacts
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors">
                        <div>
                          <h4 className="text-xs font-bold text-white leading-none">{contact.name}</h4>
                          <span className="inline-block text-[9px] text-iiitp-gold mt-1 font-semibold uppercase tracking-wider">
                            {contact.department}
                          </span>
                        </div>
                        <a
                          href={`tel:${contact.number}`}
                          className="p-1.5 bg-iiitp-gold/10 hover:bg-iiitp-gold/20 text-iiitp-gold rounded-lg border border-iiitp-gold/20 flex items-center justify-center"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* History */}
                <div className="glass-card p-6 rounded-2xl border border-iiitp-border space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-iiitp-info" />
                    Your Incident History
                  </h3>

                  {history.length > 0 ? (
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {history.map((req) => (
                        <div key={req.id} className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-white">{req.id}</span>
                              <span className="text-[10px] font-bold uppercase text-slate-400">
                                {req.type}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">
                              Date: {new Date(req.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="px-2.5 py-0.5 bg-iiitp-success/15 border border-iiitp-success/35 text-iiitp-success text-[10px] font-bold rounded-lg uppercase">
                            Resolved
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                      No previous emergency reports logged.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* VIEW 2: SUBJECT ATTENDANCE TRACKER */}
      {portalTab === 'attendance' && (
        <div className="space-y-6">
          {/* Header Summary Banner */}
          <div className="glass-card p-6 rounded-2xl border border-iiitp-border flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-iiitp-success/15 border border-iiitp-success/30 text-iiitp-success text-[10px] font-black uppercase rounded tracking-wider">
                  INSTITUTIONAL ATTENDANCE TRACKER
                </span>
                <span className="text-xxs text-slate-400 font-mono font-bold">
                  Enrolled Section: {attendanceData.studentSection || 'Section A (CSE)'}
                </span>
              </div>
              <h3 className="text-xl font-black text-white">Autumn Semester Subject Attendance Roster</h3>
              <p className="text-xs text-slate-400">
                Official records updated directly by course faculty. Maintain &ge; 75% in each subject for end-semester exam eligibility.
              </p>
            </div>

            {/* Quick Overall Average */}
            {attendanceData.summary.length > 0 && (() => {
              const totalAttended = attendanceData.summary.reduce((acc, curr) => acc + curr.attendedClasses, 0);
              const totalClasses = attendanceData.summary.reduce((acc, curr) => acc + curr.totalClasses, 0);
              const overallPct = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 100;
              const hasShortage = attendanceData.summary.some(s => s.isShortage);

              return (
                <div className="flex items-center gap-4 bg-slate-950 p-4 border border-slate-800 rounded-xl shrink-0">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Overall Percentage</span>
                    <span className={`text-2xl font-black font-mono ${overallPct >= 75 ? 'text-iiitp-success' : 'text-iiitp-danger'}`}>
                      {overallPct}%
                    </span>
                  </div>
                  <div className="h-10 w-px bg-slate-800"></div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Exam Eligibility</span>
                    <span className={`inline-block px-2.5 py-1 text-[10px] font-black rounded uppercase ${
                      !hasShortage 
                        ? 'bg-iiitp-success/20 text-iiitp-success border border-iiitp-success/30' 
                        : 'bg-iiitp-danger/20 text-red-400 border border-red-500/30'
                    }`}>
                      {!hasShortage ? 'ELIGIBLE ✓' : 'SHORTAGE ALERT ⚠️'}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Subject Cards Grid */}
          {loadingAttendance ? (
            <div className="p-12 text-center text-slate-500 text-xs font-bold space-y-2">
              <div className="w-6 h-6 border-2 border-iiitp-success border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p>Loading Live Attendance Records...</p>
            </div>
          ) : attendanceData.summary.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {attendanceData.summary.map((subject) => {
                const isShortage = subject.isShortage;
                return (
                  <div 
                    key={subject.subjectCode} 
                    className={`glass-card p-5 rounded-2xl border transition-all space-y-4 ${
                      isShortage 
                        ? 'border-red-500/40 bg-red-950/10 shadow-glow-danger' 
                        : 'border-iiitp-border hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 bg-slate-800 text-iiitp-gold text-[10px] font-black rounded uppercase">
                          {subject.subjectCode}
                        </span>
                        <h4 className="text-sm font-black text-white mt-1.5 leading-snug">{subject.subjectName}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Faculty: <span className="text-slate-200 font-bold">{subject.facultyName}</span></p>
                      </div>
                      
                      <div className="text-right">
                        <span className={`text-xl font-black font-mono ${isShortage ? 'text-red-400' : 'text-iiitp-success'}`}>
                          {subject.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                        <span>Attended: {subject.attendedClasses} / {subject.totalClasses} Lectures</span>
                        <span>Min Target: 75%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isShortage ? 'bg-gradient-to-r from-red-600 to-red-500' : 'bg-gradient-to-r from-emerald-500 to-green-400'
                          }`}
                          style={{ width: `${Math.min(subject.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Bottom Status Tag */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                      {isShortage ? (
                        <span className="text-red-400 font-bold flex items-center gap-1">
                          <AlertOctagon className="w-3.5 h-3.5" />
                          Attendance below 75% requirement
                        </span>
                      ) : (
                        <span className="text-iiitp-success font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Good Standing
                        </span>
                      )}

                      <span className="text-slate-500">
                        {subject.absentClasses} Absent
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
              No attendance records recorded yet.
            </div>
          )}

          {/* Detailed Attendance History Logs */}
          {attendanceData.detailedHistory && attendanceData.detailedHistory.length > 0 && (
            <div className="glass-card p-6 rounded-2xl border border-iiitp-border space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-iiitp-gold" />
                Lecture Attendance Log History
              </h3>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/90 text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Subject Code</th>
                      <th className="py-3 px-4">Course Name</th>
                      <th className="py-3 px-4">Faculty Instructor</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                    {attendanceData.detailedHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-4 font-bold text-slate-400">{item.date}</td>
                        <td className="py-2.5 px-4 font-bold text-iiitp-gold">{item.subjectCode}</td>
                        <td className="py-2.5 px-4 text-white font-sans font-medium">{item.subjectName}</td>
                        <td className="py-2.5 px-4 text-slate-400 font-sans">{item.facultyName}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                            item.status === 'PRESENT'
                              ? 'bg-iiitp-success/15 text-iiitp-success border border-iiitp-success/30'
                              : 'bg-iiitp-danger/15 text-red-400 border border-red-500/30'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ACADEMICS & NOTICES */}
      {portalTab === 'academics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Official Circulars */}
            <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-iiitp-border space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-iiitp-gold" />
                  Academic Circulars & Examination Notices
                </h3>
                <span className="text-[10px] text-iiitp-gold font-bold uppercase">Autumn Semester 2026</span>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5 hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 bg-iiitp-danger/20 border border-red-500/30 text-red-400 text-[9px] font-black uppercase rounded">IMPORTANT</span>
                    <span className="text-[10px] text-slate-500">Sept 1, 2026</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">End-Semester Examination Schedule for Batch 2024-28</h4>
                  <p className="text-xs text-slate-400">
                    The detailed timetable for CSE and ECE B.Tech 3rd Semester end-semester examinations has been published. Mid-term evaluations conclude on Sept 15.
                  </p>
                </div>

                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5 hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 bg-iiitp-gold/20 border border-iiitp-gold/30 text-iiitp-gold text-[9px] font-black uppercase rounded">CIRCULAR</span>
                    <span className="text-[10px] text-slate-500">Aug 28, 2026</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Elective Selection Portal Open for B.Tech CSE & ECE</h4>
                  <p className="text-xs text-slate-400">
                    Students can submit their preference for 4th Semester Professional Electives (Machine Learning, Embedded Systems, VLSI Design, Cloud Architecture) via the academic portal.
                  </p>
                </div>

                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5 hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 bg-iiitp-info/20 border border-iiitp-info/30 text-blue-400 text-[9px] font-black uppercase rounded">RESEARCH</span>
                    <span className="text-[10px] text-slate-500">Aug 20, 2026</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Undergraduate Research Assistantship Call (UGRA)</h4>
                  <p className="text-xs text-slate-400">
                    Faculty led research labs at IIIT Pune invite applications from CSE & ECE students for monsoon research projects in Signal Processing and Distributed Computing.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Timetable & Credit Summary */}
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl border border-iiitp-border space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-iiitp-info" />
                  Today's Lecture Schedule
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white">Data Structures & Algorithms</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">LH-102 • Prof. Anagha Khiste</p>
                    </div>
                    <span className="text-[10px] font-bold text-iiitp-gold bg-iiitp-gold/10 px-2 py-1 rounded">09:30 AM</span>
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white">Digital Electronics & Microprocessors</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">ECE Lab-2 • Dr. Suresh Patil</p>
                    </div>
                    <span className="text-[10px] font-bold text-iiitp-gold bg-iiitp-gold/10 px-2 py-1 rounded">11:30 AM</span>
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white">Computer Networks & Socket Lab</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Computer Lab 3 • Lab Asst. Kulkarni</p>
                    </div>
                    <span className="text-[10px] font-bold text-iiitp-gold bg-iiitp-gold/10 px-2 py-1 rounded">02:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: CAMPUS FACILITY BOOKINGS */}
      {portalTab === 'facilities' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Booking Form */}
            <div className="lg:col-span-1 glass-card p-6 rounded-2xl border border-iiitp-border space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-iiitp-info" />
                Reserve Campus Infrastructure
              </h3>

              {bookingSuccess && (
                <div className="p-3 bg-iiitp-success/15 border border-iiitp-success/30 text-iiitp-success text-xs rounded-xl flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Facility Slot Reserved Successfully!
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); setBookingSuccess(true); setTimeout(() => setBookingSuccess(false), 4000); }} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Select Facility / Lab</label>
                  <select
                    value={selectedFacility}
                    onChange={(e) => setSelectedFacility(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-iiitp-info"
                  >
                    <option value="AI/ML Computing Lab">AI/ML High Performance GPU Lab</option>
                    <option value="Robotics & IoT Innovation Hub">Robotics & IoT Innovation Hub</option>
                    <option value="Auditorium & Seminar Hall">Main Auditorium & Seminar Hall</option>
                    <option value="Indoor Badminton & Sports Complex">Indoor Badminton & Sports Complex</option>
                    <option value="VLSI & Circuit Design Lab">VLSI & Circuit Design Lab</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Reservation Date</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-iiitp-info"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Time Slot</label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-iiitp-info"
                  >
                    <option value="">Choose Time Slot</option>
                    <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                    <option value="11:30 AM - 01:30 PM">11:30 AM - 01:30 PM</option>
                    <option value="02:30 PM - 04:30 PM">02:30 PM - 04:30 PM</option>
                    <option value="05:00 PM - 07:00 PM">05:00 PM - 07:00 PM</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-iiitp-info hover:bg-blue-600 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider shadow"
                >
                  Submit Booking Request
                </button>
              </form>
            </div>

            {/* Campus Facilities List */}
            <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-iiitp-border space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Campus Infrastructure Directory</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-white">AI/ML GPU Computing Lab</h4>
                    <span className="px-2 py-0.5 bg-iiitp-success/15 text-iiitp-success text-[9px] font-black rounded uppercase">AVAILABLE</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Equipped with 32 NVIDIA RTX Workstations for Deep Learning research.</p>
                  <p className="text-[10px] text-iiitp-gold font-bold">Location: Academic Block 2, Floor 3</p>
                </div>

                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-white">Robotics & IoT Innovation Hub</h4>
                    <span className="px-2 py-0.5 bg-iiitp-success/15 text-iiitp-success text-[9px] font-black rounded uppercase">AVAILABLE</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Microcontroller programmer stations, 3D printers, and drone testing grids.</p>
                  <p className="text-[10px] text-iiitp-gold font-bold">Location: Academic Block 1, Ground Floor</p>
                </div>

                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-white">Main Seminar Hall</h4>
                    <span className="px-2 py-0.5 bg-iiitp-warning/15 text-iiitp-warning text-[9px] font-black rounded uppercase">BOOKED TODAY</span>
                  </div>
                  <p className="text-[10px] text-slate-400">300-seat acoustic auditorium with dual 4K laser projection.</p>
                  <p className="text-[10px] text-iiitp-gold font-bold">Location: Admin Complex, Wing B</p>
                </div>

                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-white">VLSI & Microelectronics Lab</h4>
                    <span className="px-2 py-0.5 bg-iiitp-success/15 text-iiitp-success text-[9px] font-black rounded uppercase">AVAILABLE</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Cadence & Synopsys EDA Tool suites for ECE hardware synthesis.</p>
                  <p className="text-[10px] text-iiitp-gold font-bold">Location: ECE Block, Floor 2</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: CLUBS & FESTS */}
      {portalTab === 'clubs' && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-iiitp-border space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                IIIT Pune Student Clubs & Upcoming Flagship Events
              </h3>
              <span className="text-[10px] text-purple-400 font-bold uppercase">Student Affairs Council</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-slate-900/80 border border-purple-500/20 rounded-2xl space-y-3 flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[9px] font-black uppercase rounded">TECHNICAL CLUB</span>
                  <h4 className="text-base font-extrabold text-white mt-2">Hackathon IIITP 2026</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    36-hour national level hackathon organized by GDSC & E-Cell IIIT Pune with ₹2,00,000 cash prize pool.
                  </p>
                  <div className="mt-3 text-xxs font-bold text-slate-500 space-y-0.5">
                    <p>📅 Date: October 12-14, 2026</p>
                    <p>📍 Venue: IIIT Pune Main Auditorium</p>
                  </div>
                </div>

                <button
                  onClick={() => setRegisteredEvents([...registeredEvents, 'Hackathon IIITP 2026'])}
                  disabled={registeredEvents.includes('Hackathon IIITP 2026')}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs uppercase tracking-wider"
                >
                  {registeredEvents.includes('Hackathon IIITP 2026') ? 'Registered ✓' : 'Register Team'}
                </button>
              </div>

              <div className="p-5 bg-slate-900/80 border border-iiitp-gold/20 rounded-2xl space-y-3 flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 bg-iiitp-gold/20 text-iiitp-gold text-[9px] font-black uppercase rounded">CULTURAL CLUB</span>
                  <h4 className="text-base font-extrabold text-white mt-2">Abhinay Drama & Music Fest</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Annual intra-college cultural showcase featuring battle of the bands, street play, and art exhibition.
                  </p>
                  <div className="mt-3 text-xxs font-bold text-slate-500 space-y-0.5">
                    <p>📅 Date: November 05, 2026</p>
                    <p>📍 Venue: Amphitheatre</p>
                  </div>
                </div>

                <button
                  onClick={() => setRegisteredEvents([...registeredEvents, 'Abhinay Cultural Fest'])}
                  disabled={registeredEvents.includes('Abhinay Cultural Fest')}
                  className="w-full py-2 bg-iiitp-gold hover:bg-yellow-600 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider"
                >
                  {registeredEvents.includes('Abhinay Cultural Fest') ? 'Registered ✓' : 'RSVP Event'}
                </button>
              </div>

              <div className="p-5 bg-slate-900/80 border border-iiitp-info/20 rounded-2xl space-y-3 flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 bg-iiitp-info/20 text-blue-400 text-[9px] font-black uppercase rounded">SPORTS CLUB</span>
                  <h4 className="text-base font-extrabold text-white mt-2">Fiteraria Sports League</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Inter-branch football, cricket, and badminton tournament between CSE and ECE batches.
                  </p>
                  <div className="mt-3 text-xxs font-bold text-slate-500 space-y-0.5">
                    <p>📅 Date: September 25-28, 2026</p>
                    <p>📍 Venue: Sports Complex</p>
                  </div>
                </div>

                <button
                  onClick={() => setRegisteredEvents([...registeredEvents, 'Fiteraria Sports'])}
                  disabled={registeredEvents.includes('Fiteraria Sports')}
                  className="w-full py-2 bg-iiitp-info hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-lg text-xs uppercase tracking-wider"
                >
                  {registeredEvents.includes('Fiteraria Sports') ? 'Registered ✓' : 'Join Tournament'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SEMESTER REGISTRATION */}
      {portalTab === 'registration' && <SemesterRegistrationTab />}

      {/* VIEW: NO-DUES CLEARANCE */}
      {portalTab === 'nodues' && <NoDuesClearanceTab />}

      {/* VIEW 5: STUDENT IDENTITY & PROFILE */}
      {portalTab === 'profile' && (
        <div className="space-y-6">
          <div className="max-w-xl mx-auto glass-card p-8 rounded-3xl border border-iiitp-gold/30 shadow-2xl relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-iiitp-gold/10 rounded-full blur-2xl"></div>

            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-iiitp-burgundy/20 border border-iiitp-burgundy/40 flex items-center justify-center text-iiitp-danger font-black">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white leading-none">IIIT PUNE</h3>
                  <p className="text-[9px] text-iiitp-gold font-bold tracking-widest uppercase mt-0.5">Digital Student Pass</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-iiitp-success/15 border border-iiitp-success/30 text-iiitp-success text-[9px] font-black rounded uppercase">
                VERIFIED ACTIVE
              </span>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="col-span-1 flex flex-col items-center justify-center p-4 bg-slate-900 rounded-2xl border border-slate-800">
                <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-iiitp-gold flex items-center justify-center text-2xl font-black text-iiitp-gold uppercase">
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'HN'}
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-2">MIS: {user?.userId || '112415079'}</span>
              </div>

              <div className="col-span-2 space-y-2.5 justify-center flex flex-col">
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Student Full Name</p>
                  <h4 className="text-base font-black text-white">{user?.name}</h4>
                </div>

                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Academic Branch & Batch</p>
                  <p className="text-xs font-bold text-iiitp-gold">
                    {user?.email?.includes('@ece.') ? 'B.Tech Electronics & Communication (ECE)' : 'B.Tech Computer Science & Engineering (CSE)'} • 2024-2028
                  </p>
                </div>

                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Official Institutional Email</p>
                  <p className="text-xs font-mono text-slate-300">{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xxs text-slate-500">
              <span>Authority: Academic Affairs Directorate</span>
              <span>Issued: August 2024</span>
            </div>
          </div>
        </div>
      )}

      {/* SOS Modal backdrop trigger */}
      <SOSModal isOpen={isSosOpen} onClose={() => setIsSosOpen(false)} onSOSTriggered={fetchData} />
    </div>
  );
}
