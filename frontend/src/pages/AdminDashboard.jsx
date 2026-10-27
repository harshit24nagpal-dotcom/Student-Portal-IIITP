import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  Shield, AlertTriangle, ShieldCheck, MapPin, Phone, 
  Users, Activity, Check, Plus, Trash2, Clock, 
  Award, TrendingUp, Settings, Radio, UserPlus, CheckCircle2,
  ExternalLink, Building, CheckCircle, Smartphone, PhoneCall,
  BellRing, History, ShieldAlert, Zap
} from 'lucide-react';
import AnalyticsDashboard from './AnalyticsDashboard';
import HostelTicketingTab from '../components/HostelTicketingTab';
import ComplaintsTab from '../components/ComplaintsTab';
import LostAndFoundTab from '../components/LostAndFoundTab';
import AdminPlacementTab from '../components/AdminPlacementTab';
import AdminAnnouncementsTab from '../components/AdminAnnouncementsTab';
import AdminTimetableTab from '../components/AdminTimetableTab';
import { Wrench, MessageSquare, Tag, Briefcase, Megaphone, Calendar } from 'lucide-react';
import { API_URL } from '../config/api';

const CATEGORIES_COLOR = {
  MEDICAL: '#dc2626',
  FIRE: '#ea580c',
  SECURITY: '#7c3aed',
  ACCIDENT: '#d97706',
  HARASSMENT: '#db2777',
  OTHER: '#475569',
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

  // User management state
  const [usersList, setUsersList] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('STUDENT');
  const [newUserContact, setNewUserContact] = useState('');
  const [newUserMIS, setNewUserMIS] = useState('');
  const [userSuccessMsg, setUserSuccessMsg] = useState('');
  const [userErrorMsg, setUserErrorMsg] = useState('');

  // Fetch initial data
  useEffect(() => {
    if (token) {
      fetchEmergencies();
      fetchResponders();
      fetchLocations();
      fetchContacts();
      fetchUsers();
    }
  }, [token]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setUsersList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserSuccessMsg('');
    setUserErrorMsg('');

    try {
      const res = await fetch(`${API_URL}/auth/admin-create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
          contactNumber: newUserContact,
          userId: newUserMIS,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setUserSuccessMsg(`User '${data.user.name}' (${data.user.role}) created successfully!`);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserContact('');
        setNewUserMIS('');
        fetchUsers();
      } else {
        setUserErrorMsg(data.error || 'Failed to create user');
      }
    } catch (err) {
      setUserErrorMsg('Network error while creating user');
    }
  };

  const fetchEmergencies = async () => {
    try {
      const res = await fetch(`${API_URL}/emergencies/active`, {
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
        setSelectedEmergency(list[0]);
        fetchEmergencyRecommendations(list[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmergencyRecommendations = async (id) => {
    try {
      const res = await fetch(`${API_URL}/emergencies/${id}`, {
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
      const res = await fetch(`${API_URL}/responders`, {
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
      const res = await fetch(`${API_URL}/locations`, {
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
      const res = await fetch(`${API_URL}/contacts`, {
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
      setResponders(prev => prev.map(r => 
        r.id === data.responderId 
          ? { ...r, latitude: data.latitude, longitude: data.longitude }
          : r
      ));
    };

    const handleUserCreated = () => {
      fetchUsers();
    };

    socket.on('new_emergency', handleNewEmergency);
    socket.on('emergency_updated', handleEmergencyUpdated);
    socket.on('emergency_escalated', handleEmergencyUpdated);
    socket.on('emergency_reassigned', handleEmergencyUpdated);
    socket.on('emergency_all_call', handleEmergencyUpdated);
    socket.on('responder_location_updated', handleResponderLocation);
    socket.on('user_created', handleUserCreated);

    return () => {
      socket.off('new_emergency', handleNewEmergency);
      socket.off('emergency_updated', handleEmergencyUpdated);
      socket.off('emergency_escalated', handleEmergencyUpdated);
      socket.off('emergency_reassigned', handleEmergencyUpdated);
      socket.off('emergency_all_call', handleEmergencyUpdated);
      socket.off('responder_location_updated', handleResponderLocation);
      socket.off('user_created', handleUserCreated);
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
      const res = await fetch(`${API_URL}/emergencies/${selectedEmergency.id}/assign`, {
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
      const res = await fetch(`${API_URL}/locations`, {
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
      const res = await fetch(`${API_URL}/contacts`, {
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
      const res = await fetch(`${API_URL}/contacts/${id}`, {
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
    if (notes === null) return;
    try {
      const res = await fetch(`${API_URL}/emergencies/${id}/resolve`, {
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
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-65px)] font-sans text-slate-800 bg-slate-50">
      {/* Sidebar Navigation */}
      <nav className="w-full lg:w-60 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between py-3 lg:py-6 shrink-0 shadow-xs">
        <div className="space-y-3 lg:space-y-6">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-3 lg:px-6">
            COMMAND PORTALS
          </p>

          <div className="flex flex-row lg:flex-col px-3 gap-1 overflow-x-auto whitespace-nowrap lg:whitespace-normal pb-1 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('live')}
              className={`w-auto lg:w-full shrink-0 lg:shrink text-left px-3.5 py-2 lg:py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'live' 
                  ? 'bg-red-50 text-red-700 border border-red-200 shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Activity className="w-4 h-4 text-red-600" />
              <span>Live Emergency</span>
              {emergencies.length > 0 && (
                <span className="ml-auto bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded animate-pulse">
                  {emergencies.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('responders')}
              className={`w-auto lg:w-full shrink-0 lg:shrink text-left px-3.5 py-2 lg:py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'responders' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Responder Crew</span>
            </button>

            <button
              onClick={() => setActiveTab('locations')}
              className={`w-auto lg:w-full shrink-0 lg:shrink text-left px-3.5 py-2 lg:py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'locations' 
                  ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>Campus Locations</span>
            </button>

            <button
              onClick={() => setActiveTab('contacts')}
              className={`w-auto lg:w-full shrink-0 lg:shrink text-left px-3.5 py-2 lg:py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'contacts' 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Phone className="w-4 h-4 text-[#0c2340]" />
              <span>Hotline Numbers</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-auto lg:w-full shrink-0 lg:shrink text-left px-3.5 py-2 lg:py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'users' 
                  ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <UserPlus className="w-4 h-4 text-purple-600" />
              <span>User Directory</span>
              <span className="ml-auto bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">
                {usersList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-auto lg:w-full shrink-0 lg:shrink text-left px-3.5 py-2 lg:py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'analytics' 
                  ? 'bg-[#0c2340] text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Analytics</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider px-3 lg:px-6 mb-1">
              HOSTEL & CAMPUS LIFE
            </p>

            <div className="flex flex-row lg:flex-col px-3 gap-1 overflow-x-auto whitespace-nowrap lg:whitespace-normal scrollbar-none">
              <button
                onClick={() => setActiveTab('hostel_tickets')}
                className={`w-auto lg:w-full shrink-0 lg:shrink text-left px-3.5 py-1.5 lg:py-2 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer ${
                  activeTab === 'hostel_tickets' 
                    ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>Hostel Tickets</span>
              </button>

              <button
                onClick={() => setActiveTab('complaints')}
                className={`w-auto lg:w-full shrink-0 lg:shrink text-left px-3.5 py-1.5 lg:py-2 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer ${
                  activeTab === 'complaints' 
                    ? 'bg-red-50 text-red-700 border border-red-200 shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-red-600" />
                <span>Grievances</span>
              </button>

              <button
                onClick={() => setActiveTab('lostfound')}
                className={`w-auto lg:w-full shrink-0 lg:shrink text-left px-3.5 py-1.5 lg:py-2 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer ${
                  activeTab === 'lostfound' 
                    ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <Tag className="w-4 h-4 text-purple-600" />
                <span>Lost & Found</span>
              </button>
            </div>
          </div>

          {/* Academic & Career Command Section */}
          <div className="space-y-1">
            <p className="hidden lg:block px-6 text-xxs font-extrabold uppercase tracking-wider text-slate-400">
              ACADEMIC & CAREER COMMAND
            </p>

            <div className="flex flex-row lg:flex-col px-3 gap-1 overflow-x-auto whitespace-nowrap lg:whitespace-normal scrollbar-none">
              <button
                onClick={() => setActiveTab('placements')}
                className={`w-auto lg:w-full shrink-0 lg:shrink text-left px-3.5 py-1.5 lg:py-2 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer ${
                  activeTab === 'placements' 
                    ? 'bg-blue-50 text-blue-900 border border-blue-200 shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>T&P Placements</span>
              </button>

              <button
                onClick={() => setActiveTab('announcements')}
                className={`w-auto lg:w-full shrink-0 lg:shrink text-left px-3.5 py-1.5 lg:py-2 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer ${
                  activeTab === 'announcements' 
                    ? 'bg-indigo-50 text-indigo-900 border border-indigo-200 shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <Megaphone className="w-4 h-4 text-indigo-600" />
                <span>Announcements</span>
              </button>

              <button
                onClick={() => setActiveTab('timetable')}
                className={`w-auto lg:w-full shrink-0 lg:shrink text-left px-3.5 py-1.5 lg:py-2 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer ${
                  activeTab === 'timetable' 
                    ? 'bg-cyan-50 text-cyan-900 border border-cyan-200 shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <Calendar className="w-4 h-4 text-cyan-600" />
                <span>Timetable Engine</span>
              </button>
            </div>
          </div>
        </div>

        <div className="hidden lg:block px-6 text-xxs text-slate-400 font-medium space-y-0.5">
          <p>Portal: v1.0.4 - Localhost</p>
          <p>Engine: Express • SQLite</p>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-grow p-3 sm:p-6 overflow-y-auto overflow-x-hidden">
        
        {/* Tab 1: Live Incident Command Center */}
        {activeTab === 'live' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-600 animate-pulse" />
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
                    const elapsed = getElapsedText(req.createdAt);

                    return (
                      <div
                        key={req.id}
                        onClick={() => selectIncident(req)}
                        className={`p-4 rounded-md border cursor-pointer transition-all duration-200 relative overflow-hidden ${
                          isSelected 
                            ? 'bg-white border-red-500 shadow-md ring-2 ring-red-500/20' 
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        {/* Escalated warning banner */}
                        {req.escalationLevel > 0 && (
                          <div className="absolute top-0 left-0 right-0 bg-amber-50 border-b border-amber-200 py-0.5 text-[8px] font-black text-amber-800 text-center uppercase tracking-widest">
                            ESCALATED (LEVEL {req.escalationLevel})
                          </div>
                        )}

                        <div className={`flex items-start justify-between ${req.escalationLevel > 0 ? 'mt-2.5' : ''}`}>
                          <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-400 tracking-wider">
                              {req.id}
                            </span>
                            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-xs inline-block" style={{ backgroundColor: CATEGORIES_COLOR[req.type] || '#dc2626' }}></span>
                              <span className="uppercase text-slate-900">{req.type}</span>
                            </h4>
                          </div>
                          <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            {elapsed}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-600 font-semibold mt-2.5">
                          Reporter: <span className="text-slate-900">{req.reporterName}</span> • Loc: <span className="text-[#0c2340] font-bold">{req.manualLocation}</span>
                        </p>

                        <div className="flex items-center justify-between mt-3.5 pt-3.5 border-t border-slate-100">
                          <span className="text-[9px] font-black uppercase text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                            {req.severity}
                          </span>
                          <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-600">
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
                      <div className="p-5 rounded-md border border-slate-200 bg-white shadow-sm space-y-4">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">INCIDENT FILE</span>
                            <h3 className="text-lg font-black text-slate-900">{selectedEmergency.id}</h3>
                          </div>
                          <button
                            onClick={() => handleAdminResolve(selectedEmergency.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold uppercase rounded-md tracking-wider transition-colors shadow-xs cursor-pointer"
                          >
                            Resolve Alert
                          </button>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-500">
                            <span>Incident Status:</span>
                            <span className="font-black text-slate-900 uppercase">{selectedEmergency.status.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-500">
                            <span>Reporter:</span>
                            <span className="font-semibold text-slate-900">{selectedEmergency.reporterName} ({selectedEmergency.reporter?.email})</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-500">
                            <span>Reporter Contact:</span>
                            <a href={`tel:${selectedEmergency.reporterContact}`} className="font-bold text-[#0c2340] hover:underline flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" /> {selectedEmergency.reporterContact}
                            </a>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1.5 text-slate-500">
                            <span>Campus Block:</span>
                            <span className="font-bold text-[#0c2340]">{selectedEmergency.manualLocation}</span>
                          </div>
                          {selectedEmergency.description && (
                            <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200 mt-2">
                              <p className="text-[10px] text-slate-500 font-bold uppercase">Incident Notes</p>
                              <p className="text-[11px] text-slate-700 italic mt-0.5">"{selectedEmergency.description}"</p>
                            </div>
                          )}
                        </div>

                        {/* Automated Escalation Watcher */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1.5">
                          <div className="flex justify-between text-xxs font-bold text-slate-600">
                            <span>Auto Escalation Watcher</span>
                            <span className="text-amber-700">Threshold: {escalationLimit}s</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                getElapsedSeconds(selectedEmergency.createdAt) > escalationLimit
                                  ? 'bg-red-600'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min((getElapsedSeconds(selectedEmergency.createdAt) / escalationLimit) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Auto-Cascade SLA & Multi-Channel Dispatch Telemetry */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                              Responder SLA & Cascade Guard
                            </span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                              selectedEmergency.assignments?.some(a => a.status === 'PENDING')
                                ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}>
                              {selectedEmergency.assignments?.some(a => a.status === 'PENDING')
                                ? '25s SLA Running'
                                : 'Officer Acknowledged'}
                            </span>
                          </div>

                          {/* Multi-Channel Telemetry Indicators */}
                          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                            <div className="p-1.5 bg-white border border-slate-200 rounded-md shadow-2xs">
                              <span className="text-slate-400 font-bold block text-[8px] uppercase">SMS GATEWAY</span>
                              <span className="text-emerald-700 font-black flex items-center justify-center gap-0.5 mt-0.5">
                                <Smartphone className="w-2.5 h-2.5" /> Dispatched
                              </span>
                            </div>
                            <div className="p-1.5 bg-white border border-slate-200 rounded-md shadow-2xs">
                              <span className="text-slate-400 font-bold block text-[8px] uppercase">IVR AUTO-DIAL</span>
                              <span className="text-emerald-700 font-black flex items-center justify-center gap-0.5 mt-0.5">
                                <PhoneCall className="w-2.5 h-2.5" /> Connected
                              </span>
                            </div>
                            <div className="p-1.5 bg-white border border-slate-200 rounded-md shadow-2xs">
                              <span className="text-slate-400 font-bold block text-[8px] uppercase">DESKTOP SIREN</span>
                              <span className="text-emerald-700 font-black flex items-center justify-center gap-0.5 mt-0.5">
                                <BellRing className="w-2.5 h-2.5" /> Broadcast
                              </span>
                            </div>
                          </div>

                          <p className="text-[10px] text-slate-500 italic">
                            * Unacknowledged dispatches auto-cascade to next ranked officer within 25 seconds.
                          </p>
                        </div>
                      </div>

                      {/* AI Distance & ERT Recommender List */}
                      <div className="p-5 rounded-md border border-slate-200 bg-white shadow-sm space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                            Dispatch Recommendation Engine
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold">Closest ERT Scored</span>
                        </div>
                        
                        <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                          {recommendations.map((rec) => {
                            const isCurrentlyAssigned = selectedEmergency.assignments?.some(
                              a => a.responderId === rec.id && a.status !== 'DECLINED'
                            );
                            
                            return (
                              <div 
                                key={rec.id} 
                                className={`p-3 border rounded-md flex items-center justify-between text-xs transition-colors ${
                                  isCurrentlyAssigned 
                                    ? 'border-emerald-500/40 bg-emerald-50/50' 
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="font-extrabold text-slate-900">{rec.user?.name}</h4>
                                    <span className="text-[9px] text-slate-500 uppercase">{rec.role.split(' ')[0]}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 mt-0.5">
                                    Score: <span className="font-black text-[#0c2340]">{rec.score}</span> • Dist: {Math.round(rec.distance)}m • ERT: {rec.ERT}m
                                  </p>
                                </div>

                                <button
                                  onClick={() => handleAssignResponder(rec.id)}
                                  disabled={isCurrentlyAssigned || rec.availabilityStatus === 'OFFLINE'}
                                  className={`px-2 py-1 rounded text-[10px] font-black uppercase transition-colors cursor-pointer ${
                                    isCurrentlyAssigned 
                                      ? 'bg-emerald-100 text-emerald-800' 
                                      : rec.availabilityStatus === 'OFFLINE'
                                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                      : 'bg-[#0c2340] hover:bg-[#1a365d] text-white'
                                  }`}
                                >
                                  {isCurrentlyAssigned ? 'Assigned' : 'Assign'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Emergency Cascade & Escalation Trail */}
                      {selectedEmergency.statusHistory && selectedEmergency.statusHistory.length > 0 && (
                        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-sm space-y-2.5">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                              <History className="w-3.5 h-3.5 text-slate-600" />
                              Cascade & Escalation Trail
                            </span>
                            <span className="text-[9px] text-slate-500 font-bold">
                              {selectedEmergency.statusHistory.length} Events
                            </span>
                          </div>

                          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 text-xs">
                            {selectedEmergency.statusHistory.map((hist, idx) => (
                              <div key={idx} className="p-2 bg-slate-50 border border-slate-150 rounded-md space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className={`font-black uppercase px-1.5 py-0.2 rounded text-[8.5px] ${
                                    hist.note?.includes('auto-cascaded') || hist.note?.includes('expired')
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : hist.note?.includes('escalated')
                                      ? 'bg-red-100 text-red-800 border border-red-200'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}>
                                    {hist.status.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-slate-400 font-mono text-[9px]">
                                    {new Date(hist.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-[10.5px] text-slate-700 leading-snug">
                                  {hist.note}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Spot Location & Direct Response Console */}
                    <div className="p-5 rounded-md border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-red-600" />
                            Incident On-Spot Location
                          </span>
                          <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold rounded-md uppercase">
                            DIRECT DISPATCH
                          </span>
                        </div>

                        {/* Large Spot Landmark Display */}
                        <div className="p-5 mt-4 bg-slate-50 border border-slate-200 rounded-md space-y-2 text-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                            REPORTED CAMPUS SPOT / ROOM
                          </span>
                          <h4 className="text-xl font-black text-[#0c2340]">
                            {selectedEmergency.manualLocation || 'Main Academic Block - Floor 1'}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Exact location tagged by student at trigger time
                          </p>
                        </div>

                        {/* Assigned Unit Status */}
                        <div className="mt-4 p-4 border border-slate-200 rounded-md space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">Assigned Response Officer</span>
                            <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                              {activeAssignedResponder ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>ASSIGNED</span>
                                </>
                              ) : (
                                <span>STANDBY</span>
                              )}
                            </span>
                          </div>

                          {activeAssignedResponder ? (
                            <div className="flex items-center gap-3 pt-1">
                              <div className="w-10 h-10 rounded-md bg-[#0c2340] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                                <Shield className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h5 className="text-xs font-black text-slate-900">{activeAssignedResponder.user?.name}</h5>
                                <p className="text-[10px] text-slate-500 font-semibold">{activeAssignedResponder.role}</p>
                              </div>
                              <a
                                href={`tel:${activeAssignedResponder.user?.contactNumber || '9876543210'}`}
                                className="ml-auto px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5" /> Call Officer
                              </a>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic">
                              No responder dispatched yet. Select an available officer from the recommendation engine.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quick Hospital & Ambulance Direct Links */}
                      <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-md flex items-center justify-between text-xs">
                        <div>
                          <h6 className="font-bold text-[#0c2340]">Tie-up Hospital Support</h6>
                          <p className="text-[10px] text-slate-500">Harneshwar Multispeciality Hospital (+91 9826381867)</p>
                        </div>
                        <a 
                          href="https://www.harneshwarhospital.com/" 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-[#0c2340] text-white rounded-md text-xs font-bold flex items-center gap-1 hover:bg-[#1a365d] transition-colors"
                        >
                          Hospital Portal <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="xl:col-span-2 p-12 rounded-md border border-slate-200 bg-white shadow-sm text-center flex flex-col justify-center items-center">
                    <ShieldCheck className="w-16 h-16 text-emerald-600 mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">No active incidents.</h3>
                    <p className="text-slate-500 text-xs mt-2 max-w-sm">
                      All campus emergencies resolved successfully. The dispatch system is on standby.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 rounded-md border border-slate-200 bg-white shadow-sm text-center flex flex-col justify-center items-center">
                <ShieldCheck className="w-16 h-16 text-emerald-600 mb-4" />
                <h3 className="text-lg font-black text-slate-900">System Clear</h3>
                <p className="text-slate-500 text-xs mt-2 max-w-sm leading-relaxed">
                  There are no active emergency alerts reported across IIIT Pune campus. The system is scanning for incoming signals.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Responders Crew Management */}
        {activeTab === 'responders' && (
          <div className="space-y-6">
            <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Responder Crew Directory
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {responders.map((resp) => {
                const avgResponseTimeSec = resp.resolvedCount > 0 
                  ? Math.round(resp.responseTimeSum / resp.resolvedCount) 
                  : 0;
                
                return (
                  <div key={resp.id} className="p-5 rounded-md border border-slate-200 bg-white shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shadow-xs">
                        <Shield className="w-5 h-5 text-slate-700" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">{resp.user?.name}</h4>
                        <span className="inline-block text-[9px] text-slate-500 font-semibold">{resp.role}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 grid grid-cols-3 gap-2 text-center text-xxs font-semibold text-slate-500">
                      <div>
                        <p>Availability</p>
                        <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          resp.availabilityStatus === 'AVAILABLE' 
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                            : resp.availabilityStatus === 'BUSY'
                            ? 'bg-amber-50 border border-amber-200 text-amber-700'
                            : 'bg-slate-100 border border-slate-200 text-slate-500'
                        }`}>
                          {resp.availabilityStatus}
                        </span>
                      </div>
                      <div>
                        <p>Resolved</p>
                        <p className="text-slate-900 font-bold mt-1.5">{resp.resolvedCount}</p>
                      </div>
                      <div>
                        <p>Avg Time</p>
                        <p className="text-slate-900 font-bold mt-1.5">
                          {Math.round(avgResponseTimeSec / 60)}m
                        </p>
                      </div>
                    </div>

                    {/* Skill Badges */}
                    <div className="border-t border-slate-100 pt-3">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Registered Specializations</p>
                      <div className="flex flex-wrap gap-1">
                        {resp.skills?.map((sk) => (
                          <span key={sk.id} className="text-[8.5px] font-bold uppercase bg-slate-50 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
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
            <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-600" />
              Campus Landmarks Coordinator Manager
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Landmark Add Form */}
              <div className="lg:col-span-1 p-5 rounded-md border border-slate-200 bg-white shadow-sm space-y-4 h-fit">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Add Predefined Landmark</h3>
                
                <form onSubmit={handleAddLocation} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Landmark Block Name</label>
                    <input
                      type="text"
                      required
                      value={newLocName}
                      onChange={(e) => setNewLocName(e.target.value)}
                      placeholder="e.g. Sports Playground Complex"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Latitude</label>
                      <input
                        type="text"
                        required
                        value={newLocLat}
                        onChange={(e) => setNewLocLat(e.target.value)}
                        placeholder="18.487700"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Longitude</label>
                      <input
                        type="text"
                        required
                        value={newLocLng}
                        onChange={(e) => setNewLocLng(e.target.value)}
                        placeholder="73.815600"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Location Type</label>
                    <select
                      value={newLocType}
                      onChange={(e) => setNewLocType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none text-xs"
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
                    className="w-full py-2 bg-[#0c2340] hover:bg-[#1a365d] text-white font-extrabold rounded-md text-xs uppercase tracking-wider shadow flex items-center justify-center gap-1 mt-4 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Save Coordinates
                  </button>
                </form>
              </div>

              {/* Landmark Table */}
              <div className="lg:col-span-2 p-5 rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col max-h-[480px]">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4">Active Campus Landmark Indexes</h3>
                <div className="flex-1 overflow-y-auto pr-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="pb-2.5">Landmark Block</th>
                        <th className="pb-2.5">Category</th>
                        <th className="pb-2.5">Latitude</th>
                        <th className="pb-2.5">Longitude</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {campusLocations.map((loc) => (
                        <tr key={loc.id} className="text-slate-700 hover:bg-slate-50">
                          <td className="py-2.5 font-semibold text-slate-900">{loc.name}</td>
                          <td className="py-2.5">
                            <span className="text-[9px] font-black uppercase bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded">
                              {loc.type}
                            </span>
                          </td>
                          <td className="py-2.5 font-mono text-slate-500">{loc.latitude.toFixed(6)}</td>
                          <td className="py-2.5 font-mono text-slate-500">{loc.longitude.toFixed(6)}</td>
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
            <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600" />
              Emergency Hotline Numbers Manager
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form to add */}
              <div className="lg:col-span-1 p-5 rounded-md border border-slate-200 bg-white shadow-sm space-y-4 h-fit">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Add Hotline Line</h3>
                <form onSubmit={handleAddContact} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Contact / Line Name</label>
                    <input
                      type="text"
                      required
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      placeholder="e.g. Anti-Ragging Cell"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Hotline Number</label>
                    <input
                      type="text"
                      required
                      value={newContactNum}
                      onChange={(e) => setNewContactNum(e.target.value)}
                      placeholder="e.g. +91 98888 77777 / 100"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Department / Section</label>
                    <input
                      type="text"
                      required
                      value={newContactDept}
                      onChange={(e) => setNewContactDept(e.target.value)}
                      placeholder="e.g. Security Center"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-[#0c2340] hover:bg-[#1a365d] text-white font-extrabold rounded-md text-xs uppercase tracking-wider shadow flex items-center justify-center gap-1 mt-4 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Save Contact
                  </button>
                </form>
              </div>

              {/* Table list */}
              <div className="lg:col-span-2 p-5 rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col max-h-[480px]">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4 flex justify-between items-center">
                  <span>Emergency Line Index</span>
                  <span className="text-xxs text-slate-500 font-bold uppercase">Contacts display on student dashboard</span>
                </h3>
                <div className="flex-1 overflow-y-auto pr-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="pb-2.5">Name</th>
                        <th className="pb-2.5">Line Number</th>
                        <th className="pb-2.5">Department</th>
                        <th className="pb-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {contacts.map((contact) => (
                        <tr key={contact.id} className="text-slate-700 hover:bg-slate-50">
                          <td className="py-2.5 font-semibold text-slate-900">{contact.name}</td>
                          <td className="py-2.5 font-bold text-[#0c2340]">{contact.number}</td>
                          <td className="py-2.5 text-slate-600">{contact.department}</td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => handleDeleteContact(contact.id)}
                              className="p-1.5 hover:bg-red-50 rounded-md text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
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

        {/* Tab 5: User Directory & Accounts */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              IIIT Pune User Account Manager & Database Directory
            </h2>

            {userSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center gap-2 font-bold animate-pulse">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {userSuccessMsg}
              </div>
            )}

            {userErrorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                {userErrorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form to create user */}
              <div className="lg:col-span-1 p-5 rounded-md border border-slate-200 bg-white shadow-sm space-y-4 h-fit">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Create New Institutional Account</h3>
                <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="e.g. Prof. Ramesh Sharma"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Institutional Email</label>
                    <input
                      type="email"
                      required
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="e.g. ramesh@iiitp.ac.in"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Account Password</label>
                    <input
                      type="password"
                      required
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">System Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none text-xs font-bold"
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="FACULTY">FACULTY / ADVISOR</option>
                      <option value="HOSTEL_WARDEN">HOSTEL WARDEN</option>
                      <option value="CLEARANCE_OFFICER">CLEARANCE OFFICER</option>
                      <option value="RESPONDER">RESPONDER / SECURITY</option>
                      <option value="ADMIN">ADMINISTRATOR</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">MIS / Roll No / ID</label>
                    <input
                      type="text"
                      value={newUserMIS}
                      onChange={(e) => setNewUserMIS(e.target.value)}
                      placeholder="Optional (e.g. 112415099)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Contact Number</label>
                    <input
                      type="text"
                      value={newUserContact}
                      onChange={(e) => setNewUserContact(e.target.value)}
                      placeholder="+91 9988776655"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#0c2340] hover:bg-[#1a365d] text-white font-black rounded-md text-xs uppercase tracking-wider shadow flex items-center justify-center gap-1 mt-4 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Create & Persist User
                  </button>
                </form>
              </div>

              {/* Table list of database users */}
              <div className="lg:col-span-2 p-5 rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col max-h-[550px]">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4 flex justify-between items-center">
                  <span>Backend Database User Directory ({usersList.length} Accounts)</span>
                  <span className="text-xxs text-emerald-700 font-bold uppercase flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Real-Time Sync Active</span>
                  </span>
                </h3>
                <div className="flex-1 overflow-y-auto pr-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="pb-2.5">User Name</th>
                        <th className="pb-2.5">Email</th>
                        <th className="pb-2.5">Role</th>
                        <th className="pb-2.5">MIS / ID</th>
                        <th className="pb-2.5">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usersList.map((u) => (
                        <tr key={u.id} className="text-slate-700 hover:bg-slate-50">
                          <td className="py-2.5 font-bold text-slate-900">{u.name}</td>
                          <td className="py-2.5 font-mono text-slate-600">{u.email}</td>
                          <td className="py-2.5">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                              u.role === 'ADMIN' ? 'bg-red-50 text-red-700 border-red-200' :
                              u.role === 'STUDENT' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              u.role === 'FACULTY' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                              u.role === 'HOSTEL_WARDEN' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                              'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2.5 font-mono text-[#0c2340] font-bold">{u.userId}</td>
                          <td className="py-2.5 font-mono text-[10px] text-slate-400">
                            {new Date(u.createdAt).toLocaleDateString()}
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

        {/* Tab 6: Analytics Sub-panel */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                IIIT Pune Campus Incident Safety Analytics
              </h2>
              <button 
                onClick={fetchEmergencies}
                className="px-2.5 py-1 bg-white border border-slate-200 text-[10px] font-extrabold uppercase rounded-md tracking-wider text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
              >
                Refresh Board
              </button>
            </div>
            <AnalyticsDashboard />
          </div>
        )}

        {/* Tab 7: Hostel Maintenance Tickets */}
        {activeTab === 'hostel_tickets' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <HostelTicketingTab />
          </div>
        )}

        {/* Tab 8: Institutional Grievances & Complaints */}
        {activeTab === 'complaints' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <ComplaintsTab />
          </div>
        )}

        {/* Tab 9: Campus Lost & Found Registry */}
        {activeTab === 'lostfound' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <LostAndFoundTab />
          </div>
        )}

        {/* Tab 10: Training & Placement (T&P) Master Command */}
        {activeTab === 'placements' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <AdminPlacementTab />
          </div>
        )}

        {/* Tab 11: Official Announcements & Circulars Governance */}
        {activeTab === 'announcements' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <AdminAnnouncementsTab />
          </div>
        )}

        {/* Tab 12: Lecture Timetable & Schedule Engine */}
        {activeTab === 'timetable' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <AdminTimetableTab />
          </div>
        )}

      </div>
    </div>
  );
}
