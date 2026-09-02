import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { 
  Shield, Check, X, ShieldAlert, Award, Clock, 
  MapPin, Phone, User, Play, Edit, CheckCircle, Navigation as NavIcon 
} from 'lucide-react';

const createMarkerIcon = (color, emoji) => {
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); font-size: 18px; cursor: pointer;">${emoji}</div>`,
    className: 'custom-marker-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

export default function ResponderDashboard() {
  const { user, token, updateProfile } = useAuth();
  const { socket } = useSocket();
  const [activeJob, setActiveJob] = useState(null);
  const [history, setHistory] = useState([]);
  const [availability, setAvailability] = useState(user.responder?.availabilityStatus || 'AVAILABLE');
  const [performance, setPerformance] = useState(null);
  const [resolvingNotes, setResolvingNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Navigation Simulation State
  const [simulating, setSimulating] = useState(false);
  const simulationIntervalRef = useRef(null);

  useEffect(() => {
    if (token && user.responder) {
      fetchDashboardData();
    }
  }, [token, user.responder]);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch active emergencies assigned to me
      const activeRes = await fetch('http://localhost:5000/api/emergencies/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const activeData = await activeRes.json();
      const activeList = Array.isArray(activeData) ? activeData : [];
      
      // Find emergency assigned to this responder
      const myJob = user?.responder ? activeList.find(req => 
        req.assignments?.some(a => a.responderId === user.responder.id && a.status !== 'DECLINED')
      ) : null;
      
      setActiveJob(myJob || null);

      // 2. Fetch Performance
      if (user?.responder) {
        const perfRes = await fetch(`http://localhost:5000/api/responders/${user.responder.id}/performance`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (perfRes.ok) {
          const perfData = await perfRes.json();
          setPerformance(perfData);
          if (perfData.status) setAvailability(perfData.status);
        }
      }

      // 3. Fetch history
      const historyRes = await fetch('http://localhost:5000/api/emergencies/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const historyData = await historyRes.json();
      const historyList = Array.isArray(historyData) ? historyData : [];
      const myHistory = user?.responder ? historyList.filter(req => 
        req.assignments?.some(a => a.responderId === user.responder.id && a.status === 'ACCEPTED')
      ) : [];
      setHistory(myHistory);

    } catch (err) {
      console.error('Error fetching responder dashboard data:', err);
    }
  };

  // Socket updates
  useEffect(() => {
    if (!socket) return;

    const handleEmergencyUpdated = (data) => {
      // Refresh dashboard if relevant to me
      if (activeJob && data.requestId === activeJob.id) {
        fetchDashboardData();
      } else {
        fetchDashboardData();
      }
    };

    socket.on('emergency_updated', handleEmergencyUpdated);
    socket.on('new_emergency', handleEmergencyUpdated);

    return () => {
      socket.off('emergency_updated', handleEmergencyUpdated);
      socket.off('new_emergency', handleEmergencyUpdated);
    };
  }, [socket, activeJob]);

  // Update Duty Status
  const handleAvailabilityChange = async (newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/responders/${user.responder.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setAvailability(newStatus);
        // Update user context
        updateProfile({
          responder: {
            ...user.responder,
            availabilityStatus: newStatus,
          }
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Accept job
  const handleAcceptJob = async () => {
    if (!activeJob) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/emergencies/${activeJob.id}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDashboardData();
      } else {
        const d = await res.json();
        alert(`Accept failed: ${d.error}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Decline job
  const handleDeclineJob = async () => {
    if (!activeJob) return;
    const conf = window.confirm('Are you sure you want to decline this request? It will be re-assigned.');
    if (!conf) return;

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/emergencies/${activeJob.id}/decline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setActiveJob(null);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Arrive at scene
  const handleArriveJob = async () => {
    if (!activeJob) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/emergencies/${activeJob.id}/arrive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Resolve Job
  const handleResolveJob = async () => {
    if (!activeJob) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/emergencies/${activeJob.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: resolvingNotes }),
      });
      if (res.ok) {
        setResolvingNotes('');
        setActiveJob(null);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Simulate movement toward student location
  const handleSimulateMovement = () => {
    if (!activeJob || simulating) return;
    setSimulating(true);

    const startLat = user.responder.latitude;
    const startLng = user.responder.longitude;
    const endLat = activeJob.latitude;
    const endLng = activeJob.longitude;

    const steps = 8;
    let currentStep = 0;

    simulationIntervalRef.current = setInterval(async () => {
      currentStep++;
      const nextLat = startLat + ((endLat - startLat) / steps) * currentStep;
      const nextLng = startLng + ((endLng - startLng) / steps) * currentStep;

      // Update location on backend
      try {
        const res = await fetch(`http://localhost:5000/api/responders/${user.responder.id}/location`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ latitude: nextLat, longitude: nextLng }),
        });

        if (res.ok) {
          // Update local responder lat/lng details
          updateProfile({
            responder: {
              ...user.responder,
              latitude: nextLat,
              longitude: nextLng,
            }
          });
        }
      } catch (err) {
        console.error('Simulation step error:', err);
      }

      if (currentStep >= steps) {
        clearInterval(simulationIntervalRef.current);
        setSimulating(false);
        // Automatically set status to arrived on reaching
        handleArriveJob();
      }
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    };
  }, []);

  const getMyAssignment = () => {
    return activeJob?.assignments?.find(a => a.responderId === user.responder.id);
  };

  const myAssignment = getMyAssignment();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-100">
      
      {/* Top Banner: Availability Duty & Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Availability Toggle */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
            DUTY STATUS CONFIG
          </span>
          <h4 className="text-sm font-bold text-white mb-3">Availability Status</h4>
          
          <div className="flex gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            {['AVAILABLE', 'BUSY', 'OFFLINE'].map((status) => (
              <button
                key={status}
                onClick={() => handleAvailabilityChange(status)}
                className={`flex-1 py-1 rounded text-[10px] font-black uppercase transition-all ${
                  availability === status 
                    ? status === 'AVAILABLE' 
                      ? 'bg-iiitp-success text-white'
                      : status === 'BUSY'
                      ? 'bg-iiitp-warning text-white'
                      : 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {status.slice(0, 4)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats 1: Resolved Incidents */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-iiitp-success/10 border border-iiitp-success/20 flex items-center justify-center text-iiitp-success">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">RESOLVED CASES</p>
            <h4 className="text-2xl font-black text-white mt-1">
              {performance?.resolvedCount || 0}
            </h4>
          </div>
        </div>

        {/* Stats 2: Avg Response Time */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-iiitp-info/10 border border-iiitp-info/20 flex items-center justify-center text-iiitp-info">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AVG RESPONSE TIME</p>
            <h4 className="text-2xl font-black text-white mt-1">
              {performance?.avgResponseTimeMinutes || 0} <span className="text-xs text-slate-400">mins</span>
            </h4>
          </div>
        </div>

        {/* Stats 3: Skills Badge */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">RESPONSIBLE SKILLS</p>
          <div className="flex flex-wrap gap-1">
            {user.responder.skills?.map((sk) => (
              <span key={sk.id} className="text-[9px] font-black uppercase bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                {sk.skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Assignment Section */}
      {activeJob ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Assignment Incident Cards */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Incoming Pending Assignment Alert */}
            {myAssignment?.status === 'PENDING' && (
              <div className="glass-card p-6 rounded-2xl border border-iiitp-warning/30 bg-iiitp-warning/5 shadow-glow-warning animate-pulse relative overflow-hidden">
                <span className="px-2 py-0.5 bg-iiitp-warning/20 border border-iiitp-warning/45 text-iiitp-warning text-[9px] font-black uppercase rounded tracking-widest block w-max">
                  PENDING ASSIGNMENT
                </span>
                
                <h3 className="text-xl font-black text-white mt-3 flex items-center gap-1.5">
                  <ShieldAlert className="w-5 h-5 text-iiitp-warning animate-bounce" />
                  INCIDENT {activeJob.id}
                </h3>
                
                <div className="space-y-2 mt-4 text-xs">
                  <div className="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400">
                    <span>Emergency Category:</span>
                    <span className="font-extrabold text-white uppercase">{activeJob.type}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400">
                    <span>Reporter Name:</span>
                    <span className="font-bold text-slate-200">{activeJob.reporterName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400">
                    <span>Target Location:</span>
                    <span className="font-bold text-iiitp-gold">{activeJob.manualLocation}</span>
                  </div>
                  {activeJob.description && (
                    <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 mt-2">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">REPORTER NOTES</p>
                      <p className="text-[11px] text-slate-300 italic mt-0.5">"{activeJob.description}"</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button
                    onClick={handleAcceptJob}
                    disabled={loading}
                    className="py-2.5 bg-iiitp-success hover:bg-green-700 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider shadow flex items-center justify-center gap-1"
                  >
                    <Check className="w-4 h-4" /> Accept Job
                  </button>
                  <button
                    onClick={handleDeclineJob}
                    disabled={loading}
                    className="py-2.5 bg-iiitp-danger hover:bg-red-700 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider shadow flex items-center justify-center gap-1"
                  >
                    <X className="w-4 h-4" /> Decline Job
                  </button>
                </div>
              </div>
            )}

            {/* Active Accepted Assignment Portal */}
            {myAssignment?.status === 'ACCEPTED' && (
              <div className="glass-card p-6 rounded-2xl border border-iiitp-success/30 bg-iiitp-success/5 shadow-glow-success space-y-4">
                <span className="px-2 py-0.5 bg-iiitp-success/20 border border-iiitp-success/45 text-iiitp-success text-[9px] font-black uppercase rounded tracking-widest block w-max">
                  ACTIVE DEPLOYMENT
                </span>

                <h3 className="text-xl font-black text-white mt-1">INCIDENT {activeJob.id}</h3>
                
                <div className="p-3 bg-slate-900/80 rounded-xl space-y-2 border border-slate-800 text-xs">
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5 text-slate-400">
                    <span>Incident Type:</span>
                    <span className="font-extrabold text-white uppercase">{activeJob.type}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5 text-slate-400">
                    <span>Reporter Name:</span>
                    <span className="font-semibold text-slate-200">{activeJob.reporterName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5 text-slate-400">
                    <span>Contact Line:</span>
                    <a href={`tel:${activeJob.reporterContact}`} className="font-bold text-iiitp-gold hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {activeJob.reporterContact}
                    </a>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Reported Location:</span>
                    <span className="font-bold text-iiitp-gold">{activeJob.manualLocation}</span>
                  </div>
                </div>

                {/* Dispatch Progress State Controls */}
                <div className="border-t border-slate-850 pt-4 space-y-3">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">DEPLOYMENT PROGRESS ACTIONS</p>

                  {/* Navigation simulator triggers */}
                  {activeJob.status === 'RESPONDER_EN_ROUTE' && (
                    <>
                      <button
                        onClick={handleSimulateMovement}
                        disabled={simulating}
                        className="w-full py-2.5 bg-iiitp-gold hover:bg-yellow-600 disabled:opacity-50 text-slate-950 font-black rounded-lg text-xs uppercase tracking-wider shadow flex items-center justify-center gap-1.5 transition-all"
                      >
                        <NavIcon className="w-4 h-4 animate-bounce" />
                        {simulating ? 'ROUTING SIMULATOR ACTIVE...' : 'SIMULATE NAVIGATION JOURNEY'}
                      </button>

                      <button
                        onClick={handleArriveJob}
                        disabled={loading}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold rounded-lg text-xs uppercase tracking-wider transition-colors border border-slate-750"
                      >
                        I HAVE ARRIVED AT SCENE
                      </button>
                    </>
                  )}

                  {activeJob.status === 'RESPONDER_ARRIVED' && (
                    <div className="space-y-3">
                      <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-xxs text-amber-400 font-bold flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-500 animate-pulse" />
                        Support arrived at incident scene. Calibrating resolution.
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                          Emergency Incident Resolution Notes
                        </label>
                        <textarea
                          value={resolvingNotes}
                          onChange={(e) => setResolvingNotes(e.target.value)}
                          placeholder="Detail medical diagnostics, security overrides, or external service deployment..."
                          rows={3}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-iiitp-success text-xs resize-none"
                        />
                      </div>

                      <button
                        onClick={handleResolveJob}
                        disabled={loading}
                        className="w-full py-2.5 bg-iiitp-success hover:bg-green-700 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider shadow flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" /> MARK RESOLVED & UPDATE PORTAL
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Map */}
          <div className="lg:col-span-2 glass-card p-4 rounded-2xl border border-iiitp-border flex flex-col h-[520px] lg:h-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 text-xs font-black uppercase tracking-wider text-slate-300">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-iiitp-success" />
                Live Responder Navigation Map
              </span>
              <span className="text-xxs text-slate-500">
                IIIT Pune Campus Boundary
              </span>
            </div>

            <div className="flex-1 rounded-xl overflow-hidden">
              <MapContainer 
                center={[user.responder.latitude, user.responder.longitude]} 
                zoom={17} 
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Emergency Location Marker */}
                <Marker 
                  position={[activeJob.latitude, activeJob.longitude]} 
                  icon={createMarkerIcon('#dc2626', '🚨')}
                >
                  <Popup>
                    <div className="text-slate-100 text-xs">
                      <p className="font-extrabold text-red-500 uppercase">{activeJob.type} EMERGENCY</p>
                      <p className="mt-1 font-semibold">Location: {activeJob.manualLocation}</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Responder Live Marker */}
                <Marker 
                  position={[user.responder.latitude, user.responder.longitude]} 
                  icon={createMarkerIcon('#16a34a', '💂')}
                >
                  <Popup>
                    <div className="text-slate-100 text-xs">
                      <p className="font-extrabold text-green-500 uppercase">MY LIVE LOCATION</p>
                      <p className="font-semibold mt-1">{user.name}</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Route drawing */}
                <Polyline 
                  positions={[
                    [user.responder.latitude, user.responder.longitude],
                    [activeJob.latitude, activeJob.longitude]
                  ]} 
                  color="#f59e0b"
                  weight={4}
                  opacity={0.85}
                  dashArray="8, 6"
                  className="map-route-line"
                />
              </MapContainer>
            </div>
          </div>
        </div>
      ) : (
        /* Standby state */
        <div className="glass-card rounded-2xl border border-slate-800 p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl mx-auto">
            🛡️
          </div>
          <h3 className="text-lg font-bold text-white">Standby / Monitoring Active</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            You currently have no assigned active emergencies. Keep your duty status set to <span className="text-iiitp-success font-black">AVAILABLE</span> to receive automatic dispatches based on coordinates and skill score matching.
          </p>
        </div>
      )}

      {/* Incident History Log */}
      <div className="glass-card p-6 rounded-2xl border border-iiitp-border space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">Your Deployment Resolution Logs</h3>
        {history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {history.map((req) => (
              <div key={req.id} className="p-3.5 bg-slate-900/40 border border-slate-850 rounded-xl flex items-start justify-between text-xs gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white">{req.id}</span>
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      {req.type}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Reporter: {req.reporterName} • Location: {req.manualLocation}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-[9px] font-bold rounded-lg uppercase">
                    RESOLVED
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1 italic max-w-[200px] truncate" title={req.notes}>
                    "{req.notes}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-900/10 border border-dashed border-slate-850 rounded-xl text-slate-500 text-xs">
            No historical assignments resolved.
          </div>
        )}
      </div>

    </div>
  );
}
