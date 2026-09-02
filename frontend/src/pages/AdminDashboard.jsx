import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { 
  Shield, AlertTriangle, ShieldCheck, MapPin, Phone, 
  Users, Activity, Check, Plus, Trash2, Clock, 
  Award, TrendingUp, Settings, Radio 
} from 'lucide-react';
import AnalyticsDashboard from './AnalyticsDashboard';

const createMarkerIcon = (color, emoji) => {
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-size: 15px; cursor: pointer;">${emoji}</div>`,
    className: 'custom-marker-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const CATEGORIES_COLOR = {
  MEDICAL: '#dc2626',
  FIRE: '#f97316',
  SECURITY: '#a855f7',
  ACCIDENT: '#f59e0b',
  HARASSMENT: '#ec4899',
  OTHER: '#64748b',
};

const CATEGORIES_EMOJI = {
  MEDICAL: '❤️',
  FIRE: '🔥',
  SECURITY: '🛡️',
  ACCIDENT: '🩹',
  HARASSMENT: '⚠️',
  OTHER: '❓',
};

export default function AdminDashboard({ defaultTab = 'live' }) {
  const { token, user } = useAuth();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // State variables
  const [emergencies, setEmergencies] = useState([]);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [responders, setResponders] = useState([]);
  const [campusLocations, setCampusLocations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [escalationLimit, setEscalationLimit] = useState(20);

  // New location form state
  const [newLocName, setNewLocName] = useState('');
  const [newLocLat, setNewLocLat] = useState('18.487700');
  const [newLocLng, setNewLocLng] = useState('73.815600');
  const [newLocType, setNewLocType] = useState('ACADEMIC');

  // New contact form state
  const [newContactName, setNewContactName] = useState('');
  const [newContactNum, setNewContactNum] = useState('');
  const [newContactDept, setNewContactDept] = useState('');

  // Fetch initial data
  useEffect(() => {
    if (token) {
      fetchEmergencies();
      fetchResponders();
      fetchLocations();
      fetchContacts();
    }
  }, [token]);

  const fetchEmergencies = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/emergencies/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setEmergencies(list);
      
      // Keep selected emergency synced
      if (selectedEmergency) {
        const updated = list.find(req => req.id === selectedEmergency.id);
        if (updated) {
          setSelectedEmergency(updated);
          fetchEmergencyRecommendations(updated.id);
        } else {
          setSelectedEmergency(null);
          setRecommendations([]);
        }
      } else if (list.length > 0) {
        // Auto-select first active emergency if none selected
        setSelectedEmergency(list[0]);
        fetchEmergencyRecommendations(list[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmergencyRecommendations = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/emergencies/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRecommendations(Array.isArray(data.recommendations) ? data.recommendations : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchResponders = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/responders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setResponders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/locations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCampusLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/contacts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  // Socket triggers
  useEffect(() => {
    if (!socket) return;

    const handleNewEmergency = () => {
      fetchEmergencies();
      fetchResponders();
    };

    const handleEmergencyUpdated = (data) => {
      fetchEmergencies();
      fetchResponders();
    };

    const handleResponderLocation = (data) => {
      // Update local responder pin in state
      setResponders(prev => prev.map(r => 
        r.id === data.responderId 
          ? { ...r, latitude: data.latitude, longitude: data.longitude }
          : r
      ));
    };

    socket.on('new_emergency', handleNewEmergency);
    socket.on('emergency_updated', handleEmergencyUpdated);
    socket.on('emergency_escalated', handleEmergencyUpdated);
    socket.on('responder_location_updated', handleResponderLocation);

    return () => {
      socket.off('new_emergency', handleNewEmergency);
      socket.off('emergency_updated', handleEmergencyUpdated);
      socket.off('emergency_escalated', handleEmergencyUpdated);
      socket.off('responder_location_updated', handleResponderLocation);
    };
  }, [socket, selectedEmergency]);

  const selectIncident = (req) => {
    setSelectedEmergency(req);
    fetchEmergencyRecommendations(req.id);
  };

  // Manual Assign/Override Responder
  const handleAssignResponder = async (responderId) => {
    if (!selectedEmergency) return;
    try {
      const res = await fetch(`http://localhost:5000/api/emergencies/${selectedEmergency.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ responderId }),
      });
      if (res.ok) {
        fetchEmergencies();
        fetchResponders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Campus Location
  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!newLocName) return;

    try {
      const res = await fetch('http://localhost:5000/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newLocName,
          latitude: parseFloat(newLocLat),
          longitude: parseFloat(newLocLng),
          type: newLocType,
        }),
      });

      if (res.ok) {
        setNewLocName('');
        fetchLocations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Emergency Contact
  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContactName || !newContactNum || !newContactDept) return;

    try {
      const res = await fetch('http://localhost:5000/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newContactName,
          number: newContactNum,
          department: newContactDept,
        }),
      });

      if (res.ok) {
        setNewContactName('');
        setNewContactNum('');
        setNewContactDept('');
        fetchContacts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Contact
  const handleDeleteContact = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/contacts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchContacts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Resolve Incident directly from admin console
  const handleAdminResolve = async (id) => {
    const notes = prompt('Enter resolution notes:');
    if (notes === null) return; // cancelled
    try {
      const res = await fetch(`http://localhost:5000/api/emergencies/${id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: notes || 'Resolved from Administration command console.' }),
      });
      if (res.ok) {
        setSelectedEmergency(null);
        setRecommendations([]);
        fetchEmergencies();
        fetchResponders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getAssignedResponder = (emergency) => {
    const accepted = emergency?.assignments?.find(a => a.status === 'ACCEPTED' || a.status === 'PENDING');
    return accepted ? responders.find(r => r.id === accepted.responderId) : null;
  };

  const activeAssignedResponder = getAssignedResponder(selectedEmergency);

  // Time elapsed helper
  const getElapsedSeconds = (createdAt) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(diff / 1000));
  };

  const getElapsedText = (createdAt) => {
    const sec = getElapsedSeconds(createdAt);
    if (sec < 60) return `${sec}s ago`;
    return `${Math.floor(sec / 60)}m ${sec % 60}s ago`;
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-73px)] font-sans text-slate-100 bg-iiitp-dark">
      {/* Sidebar Navigation */}
      <nav className="w-full lg:w-60 bg-slate-950 border-r border-slate-900 flex flex-col justify-between py-6 shrink-0">
        <div className="space-y-6">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-6">
            COMMAND PORTALS
          </p>

          <div className="flex flex-col px-3 gap-1">
            <button
              onClick={() => setActiveTab('live')}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors ${
                activeTab === 'live' 
                  ? 'bg-iiitp-burgundy text-white border-l-4 border-red-500' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Activity className="w-4 h-4 text-iiitp-danger" />
              <span>Live Emergency Console</span>
              {emergencies.length > 0 && (
                <span className="ml-auto bg-iiitp-danger text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                  {emergencies.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('responders')}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors ${
                activeTab === 'responders' 
                  ? 'bg-iiitp-burgundy text-white border-l-4 border-red-500' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4 text-iiitp-success" />
              <span>Responder Crew</span>
            </button>

            <button
              onClick={() => setActiveTab('locations')}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors ${
                activeTab === 'locations' 
                  ? 'bg-iiitp-burgundy text-white border-l-4 border-red-500' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-4 h-4 text-iiitp-gold" />
              <span>Landmarks Coordinators</span>
            </button>

            <button
              onClick={() => setActiveTab('contacts')}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors ${
                activeTab === 'contacts' 
                  ? 'bg-iiitp-burgundy text-white border-l-4 border-red-500' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Phone className="w-4 h-4 text-iiitp-info" />
              <span>Hotline Numbers</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors ${
                activeTab === 'analytics' 
                  ? 'bg-iiitp-burgundy text-white border-l-4 border-red-500' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span>Analytics & Metrics</span>
            </button>
          </div>
        </div>

        <div className="px-6 text-xxs text-slate-600 font-semibold space-y-1">
          <p>Portal: v1.0.4 - Seeding Active</p>
          <p>DB Host: SQLite Local Fallback</p>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-grow p-6 overflow-y-auto">
        
        {/* Tab 1: Live Incident Command Center */}
        {activeTab === 'live' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
                <Radio className="w-5 h-5 text-iiitp-danger animate-pulse" />
                Live Incident Dispatch Panel
              </h2>
              <span className="text-xxs text-slate-500 font-bold uppercase">
                Active alerts updates in real-time
              </span>
            </div>

            {emergencies.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Active Emergency Incidents List */}
                <div className="xl:col-span-1 flex flex-col gap-3 max-h-[580px] overflow-y-auto pr-1">
                  {emergencies.map((req) => {
                    const isSelected = selectedEmergency?.id === req.id;
                    const rTypeEmoji = CATEGORIES_EMOJI[req.type] || '🚨';
                    const elapsed = getElapsedText(req.createdAt);

                    return (
                      <div
                        key={req.id}
                        onClick={() => selectIncident(req)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 relative overflow-hidden ${
                          isSelected 
                            ? 'bg-slate-900 border-red-500/40 shadow-md ring-1 ring-red-500/20' 
                            : 'bg-slate-900/40 border-slate-850 hover:bg-slate-900/60 hover:border-slate-800'
                        }`}
                      >
                        {/* Escalated warning banner */}
                        {req.escalationLevel > 0 && (
                          <div className="absolute top-0 left-0 right-0 bg-amber-500/20 border-b border-amber-500/30 py-0.5 text-[8px] font-black text-amber-400 text-center uppercase tracking-widest">
                            ESCALATED (LEVEL {req.escalationLevel})
                          </div>
                        )}

                        <div className={`flex items-start justify-between ${req.escalationLevel > 0 ? 'mt-2.5' : ''}`}>
                          <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-400 tracking-wider">
                              {req.id}
                            </span>
                            <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                              <span>{rTypeEmoji}</span>
                              <span className="uppercase text-slate-100">{req.type}</span>
                            </h4>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-iiitp-gold shrink-0" />
                            {elapsed}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-400 font-semibold mt-2.5">
                          Reporter: <span className="text-white">{req.reporterName}</span> • Loc: <span className="text-iiitp-gold font-bold">{req.manualLocation}</span>
                        </p>

                        <div className="flex items-center justify-between mt-3.5 pt-3.5 border-t border-slate-900">
                          <span className="text-[9px] font-black uppercase text-iiitp-danger bg-iiitp-danger/10 border border-iiitp-danger/35 px-1.5 py-0.5 rounded">
                            {req.severity}
                          </span>
                          <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-300">
                            {req.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Emergency Command Interface */}
                {selectedEmergency ? (
                  <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Metadata, Escalations & Scoring Override */}
                    <div className="space-y-4">
                      {/* Incident Details Card */}
                      <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
                        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">INCIDENT FILE</span>
                            <h3 className="text-lg font-black text-white">{selectedEmergency.id}</h3>
                          </div>
                          <button
                            onClick={() => handleAdminResolve(selectedEmergency.id)}
                            className="px-2.5 py-1 bg-iiitp-success hover:bg-green-700 text-white text-[10px] font-extrabold uppercase rounded-lg tracking-wider transition-colors shadow"
                          >
                            Resolve Alert
                          </button>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between border-b border-slate-900 pb-1.5 text-slate-400">
                            <span>Incident Status:</span>
                            <span className="font-black text-slate-200 uppercase">{selectedEmergency.status.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-900 pb-1.5 text-slate-400">
                            <span>Reporter:</span>
                            <span className="font-semibold text-slate-200">{selectedEmergency.reporterName} ({selectedEmergency.reporter?.email})</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-900 pb-1.5 text-slate-400">
                            <span>Reporter Contact:</span>
                            <a href={`tel:${selectedEmergency.reporterContact}`} className="font-bold text-iiitp-gold hover:underline flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" /> {selectedEmergency.reporterContact}
                            </a>
                          </div>
                          <div className="flex justify-between border-b border-slate-900 pb-1.5 text-slate-400">
                            <span>Seeded Campus Block:</span>
                            <span className="font-bold text-iiitp-gold">{selectedEmergency.manualLocation}</span>
                          </div>
                          {selectedEmergency.description && (
                            <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 mt-2">
                              <p className="text-[10px] text-slate-500 font-bold uppercase">Incident Notes</p>
                              <p className="text-[11px] text-slate-300 italic mt-0.5">"{selectedEmergency.description}"</p>
                            </div>
                          )}
                        </div>

                        {/* Automated Escalation Watcher */}
                        {selectedEmergency.status !== 'RESOLVED' && (
                          <div className={`p-3 rounded-lg border text-xxs flex items-center gap-2.5 ${
                            selectedEmergency.escalationLevel > 0 
                              ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}>
                            <AlertTriangle className={`w-4 h-4 shrink-0 ${selectedEmergency.escalationLevel > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-500'}`} />
                            <div>
                              <p className="font-bold uppercase tracking-wider">
                                {selectedEmergency.escalationLevel > 0 
                                  ? `System Escalated (Level ${selectedEmergency.escalationLevel})`
                                  : 'Escalation Watcher Standing By'}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                {selectedEmergency.escalationLevel === 0 && 'Escalating to Security in 20s if unresolved.'}
                                {selectedEmergency.escalationLevel === 1 && 'Escalated to Head Security. Next tier: Faculty Coordinator.'}
                                {selectedEmergency.escalationLevel === 2 && 'Escalated to Coordinator. Next tier: System Admin.'}
                                {selectedEmergency.escalationLevel >= 3 && 'Critical Escalation. System administrator notified.'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Responder Scoring override list */}
                      <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                          RESPONDER SCORING & RECOMMENDATION ENGINE
                        </span>
                        
                        <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                          {recommendations.map((rec) => {
                            const isCurrentlyAssigned = selectedEmergency.assignments?.some(
                              a => a.responderId === rec.id && a.status !== 'DECLINED'
                            );
                            
                            return (
                              <div 
                                key={rec.id} 
                                className={`p-3 bg-slate-900/60 border rounded-xl flex items-center justify-between text-xs transition-colors ${
                                  isCurrentlyAssigned 
                                    ? 'border-iiitp-success/40 bg-iiitp-success/5' 
                                    : 'border-slate-850'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="font-extrabold text-white">{rec.user?.name}</h4>
                                    <span className="text-[9px] text-slate-500 uppercase">{rec.role.split(' ')[0]}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    Score: <span className="font-black text-iiitp-gold">{rec.score}</span> • Dist: {Math.round(rec.distance)}m • ERT: {rec.ERT}m
                                  </p>
                                </div>

                                <button
                                  onClick={() => handleAssignResponder(rec.id)}
                                  disabled={isCurrentlyAssigned || rec.availabilityStatus === 'OFFLINE'}
                                  className={`px-2 py-1 rounded text-[10px] font-black uppercase transition-colors ${
                                    isCurrentlyAssigned 
                                      ? 'bg-iiitp-success/20 text-iiitp-success' 
                                      : rec.availabilityStatus === 'OFFLINE'
                                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                      : 'bg-iiitp-burgundy hover:bg-red-700 text-white'
                                  }`}
                                >
                                  {isCurrentlyAssigned ? 'Assigned' : 'Assign'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right: Dispatch map panel */}
                    <div className="glass-card p-4 rounded-2xl border border-slate-800 h-[450px] md:h-auto flex flex-col">
                      <div className="flex items-center justify-between text-xxs pb-2 border-b border-slate-900 mb-3 text-slate-400 uppercase font-semibold">
                        <span>Incident Dispatch Grid Map</span>
                        <span>Seeded landmarks</span>
                      </div>

                      <div className="flex-1 rounded-xl overflow-hidden">
                        <MapContainer 
                          center={[selectedEmergency.latitude, selectedEmergency.longitude]} 
                          zoom={17} 
                          scrollWheelZoom={false}
                          style={{ height: '100%', width: '100%' }}
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          />

                          {/* Selected Emergency Marker */}
                          <Marker 
                            position={[selectedEmergency.latitude, selectedEmergency.longitude]} 
                            icon={createMarkerIcon(CATEGORIES_COLOR[selectedEmergency.type] || '#dc2626', CATEGORIES_EMOJI[selectedEmergency.type] || '🚨')}
                          >
                            <Popup>
                              <div className="text-slate-100 text-xs font-semibold">
                                <p className="font-black text-red-500 uppercase">{selectedEmergency.type} ALERTS</p>
                                <p className="mt-1">Block: {selectedEmergency.manualLocation}</p>
                              </div>
                            </Popup>
                          </Marker>

                          {/* Render all responders on the map with coordinate availability checks */}
                          {responders.map((resp) => {
                            const isAssignedToThis = activeAssignedResponder?.id === resp.id;
                            const isOffline = resp.availabilityStatus === 'OFFLINE';
                            const isBusy = resp.availabilityStatus === 'BUSY';
                            
                            const pinColor = isAssignedToThis 
                              ? '#10b981' // Green
                              : isBusy 
                              ? '#f59e0b' // Yellow
                              : isOffline 
                              ? '#64748b' // Slate/Grey
                              : '#3b82f6'; // Available Blue

                            return (
                              <Marker 
                                key={resp.id}
                                position={[resp.latitude, resp.longitude]} 
                                icon={createMarkerIcon(pinColor, '💂')}
                              >
                                <Popup>
                                  <div className="text-slate-100 text-xs font-semibold">
                                    <p className="font-bold text-white">{resp.user?.name}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{resp.role}</p>
                                    <p className="text-[9px] text-slate-500 mt-1 uppercase">Status: {resp.availabilityStatus}</p>
                                  </div>
                                </Popup>
                              </Marker>
                            );
                          })}

                          {/* Draw polyline route if responder assigned */}
                          {activeAssignedResponder && (
                            <Polyline 
                              positions={[
                                [activeAssignedResponder.latitude, activeAssignedResponder.longitude],
                                [selectedEmergency.latitude, selectedEmergency.longitude]
                              ]} 
                              color="#f59e0b"
                              weight={4.5}
                              opacity={0.8}
                              dashArray="8, 6"
                              className="map-route-line"
                            />
                          )}
                        </MapContainer>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="xl:col-span-2 glass-card p-12 rounded-2xl border border-slate-800 text-center flex flex-col justify-center items-center">
                    <ShieldCheck className="w-16 h-16 text-slate-600 mb-4" />
                    <h3 className="text-lg font-bold text-white">No active incidents.</h3>
                    <p className="text-slate-400 text-xs mt-2 max-w-sm">
                      All campus emergencies resolved successfully. The dispatch system is on standby.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card p-12 rounded-2xl border border-slate-800 text-center flex flex-col justify-center items-center">
                <ShieldCheck className="w-16 h-16 text-iiitp-success mb-4" />
                <h3 className="text-lg font-black text-white">System Clear</h3>
                <p className="text-slate-400 text-xs mt-2 max-w-sm leading-relaxed">
                  There are no active emergency alerts reported across IIIT Pune campus. The system is scanning for incoming signals.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Responders Crew Management */}
        {activeTab === 'responders' && (
          <div className="space-y-6">
            <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-iiitp-success" />
              Responder Crew Directory
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {responders.map((resp) => {
                const avgResponseTimeSec = resp.resolvedCount > 0 
                  ? Math.round(resp.responseTimeSum / resp.resolvedCount) 
                  : 0;
                
                return (
                  <div key={resp.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-lg">
                        💂
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white">{resp.user?.name}</h4>
                        <span className="inline-block text-[9px] text-slate-400 font-semibold">{resp.role}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-850 pt-3 grid grid-cols-3 gap-2 text-center text-xxs font-semibold text-slate-400">
                      <div>
                        <p>Availability</p>
                        <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          resp.availabilityStatus === 'AVAILABLE' 
                            ? 'bg-iiitp-success/15 border border-iiitp-success/40 text-iiitp-success'
                            : resp.availabilityStatus === 'BUSY'
                            ? 'bg-iiitp-warning/15 border border-iiitp-warning/40 text-iiitp-warning'
                            : 'bg-slate-800 border border-slate-700 text-slate-500'
                        }`}>
                          {resp.availabilityStatus}
                        </span>
                      </div>
                      <div>
                        <p>Resolved</p>
                        <p className="text-slate-100 font-bold mt-1.5">{resp.resolvedCount}</p>
                      </div>
                      <div>
                        <p>Avg Time</p>
                        <p className="text-slate-100 font-bold mt-1.5">
                          {Math.round(avgResponseTimeSec / 60)}m
                        </p>
                      </div>
                    </div>

                    {/* Skill Badges */}
                    <div className="border-t border-slate-850 pt-3">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Registered Specializations</p>
                      <div className="flex flex-wrap gap-1">
                        {resp.skills?.map((sk) => (
                          <span key={sk.id} className="text-[8.5px] font-bold uppercase bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                            {sk.skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Campus Landmark Coordinates Manager */}
        {activeTab === 'locations' && (
          <div className="space-y-6">
            <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-iiitp-gold" />
              Campus Landmarks Coordinator Manager
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Landmark Add Form */}
              <div className="lg:col-span-1 glass-card p-5 rounded-2xl border border-slate-800 space-y-4 h-fit">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">Add Predefined Landmark</h3>
                
                <form onSubmit={handleAddLocation} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Landmark Block Name</label>
                    <input
                      type="text"
                      required
                      value={newLocName}
                      onChange={(e) => setNewLocName(e.target.value)}
                      placeholder="e.g. Sports Playground Complex"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-iiitp-gold text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Latitude</label>
                      <input
                        type="text"
                        required
                        value={newLocLat}
                        onChange={(e) => setNewLocLat(e.target.value)}
                        placeholder="18.487700"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Longitude</label>
                      <input
                        type="text"
                        required
                        value={newLocLng}
                        onChange={(e) => setNewLocLng(e.target.value)}
                        placeholder="73.815600"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Location Type</label>
                    <select
                      value={newLocType}
                      onChange={(e) => setNewLocType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none text-xs"
                    >
                      <option value="ACADEMIC">ACADEMIC</option>
                      <option value="HOSTEL">HOSTEL</option>
                      <option value="MEDICAL">MEDICAL</option>
                      <option value="SECURITY">SECURITY</option>
                      <option value="EXIT">EMERGENCY EXIT</option>
                      <option value="ASSEMBLY">ASSEMBLY POINT</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-iiitp-burgundy hover:bg-red-700 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider shadow flex items-center justify-center gap-1 mt-4"
                  >
                    <Plus className="w-4 h-4" /> Save Coordinates
                  </button>
                </form>
              </div>

              {/* Landmark Table */}
              <div className="lg:col-span-2 glass-card p-5 rounded-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[480px]">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-4">Active Campus Landmark Indexes</h3>
                <div className="flex-1 overflow-y-auto pr-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="pb-2.5">Landmark Block</th>
                        <th className="pb-2.5">Category</th>
                        <th className="pb-2.5">Latitude</th>
                        <th className="pb-2.5">Longitude</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {campusLocations.map((loc) => (
                        <tr key={loc.id} className="text-slate-300 hover:text-white">
                          <td className="py-2.5 font-semibold text-slate-100">{loc.name}</td>
                          <td className="py-2.5">
                            <span className="text-[9px] font-black uppercase bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                              {loc.type}
                            </span>
                          </td>
                          <td className="py-2.5 font-mono text-slate-400">{loc.latitude.toFixed(6)}</td>
                          <td className="py-2.5 font-mono text-slate-400">{loc.longitude.toFixed(6)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Hotline Numbers Manager */}
        {activeTab === 'contacts' && (
          <div className="space-y-6">
            <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
              <Phone className="w-5 h-5 text-iiitp-info" />
              Emergency Hotline Numbers Manager
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form to add */}
              <div className="lg:col-span-1 glass-card p-5 rounded-2xl border border-slate-800 space-y-4 h-fit">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">Add Hotline Line</h3>
                <form onSubmit={handleAddContact} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Contact / Line Name</label>
                    <input
                      type="text"
                      required
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      placeholder="e.g. Anti-Ragging Cell"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-iiitp-gold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Hotline Number</label>
                    <input
                      type="text"
                      required
                      value={newContactNum}
                      onChange={(e) => setNewContactNum(e.target.value)}
                      placeholder="e.g. +91 98888 77777 / 100"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-iiitp-gold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Department / Section</label>
                    <input
                      type="text"
                      required
                      value={newContactDept}
                      onChange={(e) => setNewContactDept(e.target.value)}
                      placeholder="e.g. Security Center"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-iiitp-gold text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-iiitp-burgundy hover:bg-red-700 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider shadow flex items-center justify-center gap-1 mt-4"
                  >
                    <Plus className="w-4 h-4" /> Save Contact
                  </button>
                </form>
              </div>

              {/* Table list */}
              <div className="lg:col-span-2 glass-card p-5 rounded-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[480px]">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-4 flex justify-between items-center">
                  <span>Emergency Line Index</span>
                  <span className="text-xxs text-slate-500 font-bold uppercase">Contacts display on student dashboard</span>
                </h3>
                <div className="flex-1 overflow-y-auto pr-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="pb-2.5">Name</th>
                        <th className="pb-2.5">Line Number</th>
                        <th className="pb-2.5">Department</th>
                        <th className="pb-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {contacts.map((contact) => (
                        <tr key={contact.id} className="text-slate-300 hover:text-white">
                          <td className="py-2.5 font-semibold text-slate-100">{contact.name}</td>
                          <td className="py-2.5 font-bold text-iiitp-gold">{contact.number}</td>
                          <td className="py-2.5">{contact.department}</td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => handleDeleteContact(contact.id)}
                              className="p-1 hover:bg-slate-900 rounded text-slate-500 hover:text-red-500 transition-colors"
                              title="Delete Contact"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Analytics Sub-panel */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                IIIT Pune Campus Incident Safety Analytics
              </h2>
              <button 
                onClick={fetchEmergencies} // Triggers full data refresh indirectly
                className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-[10px] font-extrabold uppercase rounded-lg tracking-wider text-slate-300 hover:border-slate-700 transition-colors"
              >
                Refresh Board
              </button>
            </div>
            <AnalyticsDashboard />
          </div>
        )}

      </div>
    </div>
  );
}
