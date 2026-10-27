import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL, getFileUrl } from '../config/api';
import AnnouncementsTab from '../components/AnnouncementsTab';
import RoommateAllotmentTab from '../components/RoommateAllotmentTab';
import { Megaphone, Bed } from 'lucide-react';
import { 
  Building, CheckCircle2, XCircle, Clock, AlertTriangle, 
  FileText, Download, User, RefreshCw, CheckSquare, XSquare,
  LogOut, LogIn, Calendar, Utensils, Wrench, ShieldCheck, 
  MessageSquare, Users, Leaf, ArrowRight, Eye, ShieldAlert, Check,
  Camera, Upload, Image as ImageIcon
} from 'lucide-react';

export default function WardenDashboard() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' | 'leaves' | 'inout' | 'mess' | 'registration' | 'complaints'

  // Notification banners
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 1. Semester Registration state
  const [pendingRegs, setPendingRegs] = useState([]);
  const [selectedReg, setSelectedReg] = useState(null);
  const [regRemarks, setRegRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // 2. In / Out Gate Monitor state
  const [gateData, setGateData] = useState({ allLogs: [], currentlyOut: [], outCount: 0 });
  const [loadingGate, setLoadingGate] = useState(false);

  // 3. Leaves / Outpass state
  const [leaves, setLeaves] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveRemarks, setLeaveRemarks] = useState('');

  // 4. Mess state
  const [messData, setMessData] = useState(null);
  const [loadingMess, setLoadingMess] = useState(false);

  // 5. Hostel Tickets & Proof of Resolution state
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [resolvingTicket, setResolvingTicket] = useState(null);
  const [proofText, setProofText] = useState('');
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [technicianName, setTechnicianName] = useState('Technician Ramesh (Hostel Services)');
  const [beforePhoto, setBeforePhoto] = useState('');
  const [afterPhoto, setAfterPhoto] = useState('');
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);

  const handleUploadPhoto = async (file, type) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    if (type === 'before') setUploadingBefore(true);
    else setUploadingAfter(true);

    try {
      const res = await fetch(`${API_URL}/files/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.file?.filePath) {
        if (type === 'before') setBeforePhoto(data.file.filePath);
        else setAfterPhoto(data.file.filePath);
      } else {
        setError(data.error || 'Failed to upload photo');
      }
    } catch (err) {
      setError('Network error during photo upload');
    } finally {
      if (type === 'before') setUploadingBefore(false);
      else setUploadingAfter(false);
    }
  };

  // 6. Complaints state
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [resolvingComplaint, setResolvingComplaint] = useState(null);
  const [complaintRemarks, setComplaintRemarks] = useState('');

  // Fetch pending registrations
  const fetchPendingRegs = async () => {
    try {
      const res = await fetch(`${API_URL}/registration/warden/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPendingRegs(Array.isArray(data) ? data : []);
        if (data.length > 0 && !selectedReg) setSelectedReg(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Gate In/Out
  const fetchGateLogs = async () => {
    setLoadingGate(true);
    try {
      const res = await fetch('http://localhost:5000/api/hostel/in-out/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setGateData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGate(false);
    }
  };

  // Fetch Leaves
  const fetchLeaves = async () => {
    setLoadingLeaves(true);
    try {
      const res = await fetch('http://localhost:5000/api/hostel/leaves/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setLeaves(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLeaves(false);
    }
  };

  // Fetch Mess Headcount
  const fetchMessData = async () => {
    setLoadingMess(true);
    try {
      const res = await fetch('http://localhost:5000/api/hostel/mess/headcount', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setMessData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMess(false);
    }
  };

  // Fetch Tickets
  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await fetch('http://localhost:5000/api/hostel/tickets/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Fetch Complaints
  const fetchComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const res = await fetch('http://localhost:5000/api/complaints/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTickets();
      fetchLeaves();
      fetchGateLogs();
      fetchMessData();
      fetchPendingRegs();
      fetchComplaints();
    }
  }, [token]);

  // Actions
  const handleWardenRegAction = async (action) => {
    if (!selectedReg) return;
    setActionLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch(`${API_URL}/registration/warden/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          registrationId: selectedReg.id,
          action,
          remarks: regRemarks
        })
      });

      const resData = await res.json();
      if (res.ok) {
        setMessage(`Registration marked ${action}! Transferred to Faculty Advisor.`);
        setRegRemarks('');
        fetchPendingRegs();
      } else {
        setError(resData.error || 'Failed to record verification.');
      }
    } catch (err) {
      setError('Network error processing verification.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveDecision = async (leaveId, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/hostel/leaves/${leaveId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          wardenRemarks: leaveRemarks || `Leave ${status.toLowerCase()} by Warden ${user?.name}`
        })
      });

      if (res.ok) {
        setMessage(`Leave application #${leaveId} marked ${status}! Mess count recalculated.`);
        setLeaveRemarks('');
        setSelectedLeave(null);
        fetchLeaves();
        fetchMessData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveTicket = async (e) => {
    e.preventDefault();
    if (!resolvingTicket) return;
    if (!proofText.trim()) {
      setError('Proof of Resolution is mandatory.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/hostel/tickets/${resolvingTicket.id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'RESOLVED',
          proofOfResolution: proofText,
          resolutionRemarks,
          resolvedBy: technicianName,
          beforePhoto,
          afterPhoto
        })
      });

      if (res.ok) {
        setMessage(`Ticket #${resolvingTicket.id} marked RESOLVED with verified Proof of Resolution!`);
        setResolvingTicket(null);
        setProofText('');
        setResolutionRemarks('');
        setBeforePhoto('');
        setAfterPhoto('');
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkReturned = async (logId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/hostel/in-out/${logId}/return`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage(`Student marked returned to campus!`);
        fetchGateLogs();
        fetchMessData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveComplaint = async (e) => {
    e.preventDefault();
    if (!resolvingComplaint) return;

    try {
      const res = await fetch(`http://localhost:5000/api/complaints/${resolvingComplaint.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'RESOLVED',
          adminRemarks: complaintRemarks || 'Grievance reviewed and resolved by hostel warden authority.'
        })
      });

      if (res.ok) {
        setMessage(`Complaint #${resolvingComplaint.id} marked resolved!`);
        setResolvingComplaint(null);
        setComplaintRemarks('');
        fetchComplaints();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openTicketsCount = tickets.filter(t => t.status === 'OPEN').length;
  const pendingLeavesCount = leaves.filter(l => l.status === 'PENDING').length;

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans text-slate-800 overflow-x-hidden">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-black uppercase rounded tracking-wider border border-amber-200">
              CHIEF HOSTEL WARDEN ADMINISTRATION
            </span>
            <span className="text-xxs text-slate-400 font-mono">
              ROLE: HOSTEL_WARDEN • {user?.name}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Hostel Command & Residential Portal</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Digital Gate Passes, Leave Outpasses, Dining Hall Headcount, Room Maintenance & Proof of Resolution
          </p>
        </div>

        {/* Quick Indicators */}
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Open Tickets</span>
            <span className="text-base font-black text-amber-600 font-mono">{openTicketsCount}</span>
          </div>
          <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Pending Leaves</span>
            <span className="text-base font-black text-blue-600 font-mono">{pendingLeavesCount}</span>
          </div>
          <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Outside Campus</span>
            <span className="text-base font-black text-red-600 font-mono">{gateData.outCount}</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2 font-semibold">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      {/* Warden Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'tickets'
              ? 'bg-[#0c2340] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Hostel Problem Tickets ({openTicketsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'leaves'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Leave & Outpass Approvals ({pendingLeavesCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('mess')}
          className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'mess'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Mess Headcount & Diners</span>
        </button>

        <button
          onClick={() => setActiveTab('registration')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'registration'
              ? 'bg-[#0c2340] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Semester Registration ({pendingRegs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('complaints')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'complaints'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Hostel Complaints ({complaints.length})</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* 1. HOSTEL TICKETS WITH PROOF OF RESOLUTION                          */}
      {/* =================================================================== */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Hostel Room & Maintenance Problem Queue ({tickets.length})
            </h3>
            <button
              onClick={fetchTickets}
              className="text-xs text-[#5367c8] hover:text-[#1c398e] flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tickets.map((t) => {
              const isResolved = t.status === 'RESOLVED' || t.status === 'CLOSED';

              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-2xl border bg-white shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-3 ${
                    isResolved ? 'border-emerald-200/80 bg-emerald-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        #{t.id} • {t.priority}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">
                      {t.title}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {t.description}
                    </p>

                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <p><strong>Location:</strong> {t.hostelBlock} • {t.roomNumber}</p>
                      <p><strong>Student:</strong> {t.student?.name} ({t.student?.userId})</p>
                      <p><strong>Category:</strong> {t.category}</p>
                    </div>

                    {/* Proof of Resolution section if resolved */}
                    {isResolved && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2">
                        <span className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Proof of Resolution Verified
                        </span>

                        {/* Before & After Photos Side-by-Side */}
                        {(t.beforePhoto || t.afterPhoto) && (
                          <div className="grid grid-cols-2 gap-2 pt-1 pb-1">
                            {t.beforePhoto ? (
                              <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 block text-center">
                                  Before Fix
                                </span>
                                <a href={getFileUrl(t.beforePhoto)} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-slate-200 hover:opacity-90">
                                  <img src={getFileUrl(t.beforePhoto)} alt="Before Fix" className="w-full h-24 object-cover" />
                                </a>
                              </div>
                            ) : (
                              <div className="h-24 rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400 text-center p-2">
                                No before photo attached
                              </div>
                            )}

                            {t.afterPhoto ? (
                              <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 block text-center">
                                  After Completion ✓
                                </span>
                                <a href={getFileUrl(t.afterPhoto)} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-emerald-300 hover:opacity-90">
                                  <img src={getFileUrl(t.afterPhoto)} alt="After Completion" className="w-full h-24 object-cover" />
                                </a>
                              </div>
                            ) : (
                              <div className="h-24 rounded-lg border border-dashed border-emerald-200 bg-emerald-50/50 flex items-center justify-center text-[10px] text-emerald-600 text-center p-2">
                                Verified on-site
                              </div>
                            )}
                          </div>
                        )}

                        <p className="text-slate-700 text-[11px] font-medium">
                          {t.proofOfResolution}
                        </p>
                        {t.resolutionRemarks && (
                          <p className="text-[10px] text-slate-500 italic">
                            &quot;{t.resolutionRemarks}&quot;
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 pt-0.5">
                          Technician: <strong>{t.resolvedBy || 'Hostel Maintenance'}</strong> • {t.resolvedAt ? new Date(t.resolvedAt).toLocaleDateString() : 'Completed'}
                        </p>
                      </div>
                    )}
                  </div>

                  {!isResolved && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setResolvingTicket(t);
                          setProofText(t.proofOfResolution || `Repaired ${t.category.toLowerCase()} issue in ${t.roomNumber}. Replaced parts tested on-site.`);
                          setResolutionRemarks(t.resolutionRemarks || '');
                          setTechnicianName(t.resolvedBy || 'Technician Ramesh (Hostel Services)');
                          setBeforePhoto(t.beforePhoto || '');
                          setAfterPhoto(t.afterPhoto || '');
                        }}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded-xl tracking-wider shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <CheckSquare className="w-4 h-4" />
                        <span>Resolve with Proof</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Proof of Resolution Modal */}
      {resolvingTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                  Submit Proof of Resolution (Ticket #{resolvingTicket.id})
                </h3>
              </div>
              <button
                onClick={() => setResolvingTicket(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-0.5">
              <p><strong>Title:</strong> {resolvingTicket.title}</p>
              <p><strong>Room:</strong> {resolvingTicket.hostelBlock} • {resolvingTicket.roomNumber}</p>
              <p><strong>Student:</strong> {resolvingTicket.student?.name}</p>
            </div>

            <form onSubmit={handleResolveTicket} className="space-y-3.5">
              {/* BEFORE & AFTER PHOTO UPLOAD SECTION */}
              <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#1c398e]" />
                  Resolution Proof: Before & After Photos
                </span>
                
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* 1. Before Fix Photo */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-600 block">
                      1. Before Fix Photo
                    </span>
                    {beforePhoto ? (
                      <div className="relative group rounded-lg overflow-hidden border border-slate-300">
                        <img src={getFileUrl(beforePhoto)} alt="Before Fix" className="w-full h-24 object-cover" />
                        <button
                          type="button"
                          onClick={() => setBeforePhoto('')}
                          className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-[10px] shadow cursor-pointer"
                          title="Remove before photo"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-300 rounded-lg hover:border-[#1c398e] bg-white cursor-pointer transition-all p-2 text-center">
                        <Upload className="w-4 h-4 text-slate-400 mb-1" />
                        <span className="text-[10px] font-bold text-slate-600">
                          {uploadingBefore ? 'Uploading...' : 'Upload Before Photo'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleUploadPhoto(e.target.files[0], 'before')}
                        />
                      </label>
                    )}
                  </div>

                  {/* 2. After Fix Photo */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                      2. After Completion Photo *
                    </span>
                    {afterPhoto ? (
                      <div className="relative group rounded-lg overflow-hidden border border-emerald-400">
                        <img src={getFileUrl(afterPhoto)} alt="After Fix" className="w-full h-24 object-cover" />
                        <button
                          type="button"
                          onClick={() => setAfterPhoto('')}
                          className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-[10px] shadow cursor-pointer"
                          title="Remove after photo"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-emerald-300 rounded-lg hover:border-emerald-600 bg-emerald-50/30 cursor-pointer transition-all p-2 text-center">
                        <Camera className="w-4 h-4 text-emerald-600 mb-1" />
                        <span className="text-[10px] font-bold text-emerald-700">
                          {uploadingAfter ? 'Uploading...' : 'Upload After Photo'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleUploadPhoto(e.target.files[0], 'after')}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Proof of Resolution (Mandatory) *
                </label>
                <textarea
                  rows="2"
                  required
                  placeholder="Describe technical work done, replacement parts installed, meter tests, or physical inspection confirmation..."
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Warden / Technician Remarks
                </label>
                <input
                  type="text"
                  placeholder="Work inspected and found satisfactory..."
                  value={resolutionRemarks}
                  onChange={(e) => setResolutionRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Assigned Technician Name *
                </label>
                <input
                  type="text"
                  required
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingTicket(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded-xl cursor-pointer"
                >
                  Verify & Mark Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. DIGITAL LEAVE & OUTPASS APPROVALS                                */}
      {/* =================================================================== */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-900">
            <span>
              ℹ️ <strong>Mess Synchronization:</strong> Sanctioning leaves automatically updates the dining headcount for tomorrow's and today's meal prep.
            </span>
            <span className="font-bold uppercase tracking-wider text-[10px] bg-white px-2 py-0.5 rounded border border-blue-200">
              Live Synced
            </span>
          </div>

          <div className="space-y-3">
            {leaves.map((lv) => (
              <div
                key={lv.id}
                className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:shadow-sm transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase rounded-full border ${
                        lv.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        lv.status === 'REJECTED' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {lv.status}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">
                        {lv.student?.name} (MIS: {lv.student?.userId})
                      </h4>
                      <span className="text-xs text-slate-500 font-medium">
                        • {lv.student?.hostelBlock}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">
                      <strong>Category:</strong> {lv.leaveType.replace('_', ' ')} • <strong>Destination:</strong> {lv.destination}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Reason: "{lv.reason}"
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-[#0c2340] block">
                      {lv.startDate} → {lv.endDate}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Parent: {lv.parentContact} {lv.parentConsent ? '✓ Confirmed' : ''}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600">
                    🍽️ Absent Meals: <strong>{lv.startMeal}</strong> through <strong>{lv.endMeal}</strong>
                  </span>

                  {lv.status === 'PENDING' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLeaveDecision(lv.id, 'APPROVED')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded-xl cursor-pointer"
                      >
                        Approve Leave
                      </button>
                      <button
                        onClick={() => handleLeaveDecision(lv.id, 'REJECTED')}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase rounded-xl cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">
                      Remarks: {lv.wardenRemarks || 'Action recorded'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. MESS HEADCOUNT INTELLIGENCE                                      */}
      {/* =================================================================== */}
      {activeTab === 'mess' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <span className="text-[10px] font-bold uppercase text-slate-500">Boarders</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{messData?.totalRegisteredBoarders || 120}</p>
            </div>
            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50">
              <span className="text-[10px] font-bold uppercase text-amber-800">On Leave Today</span>
              <p className="text-2xl font-black text-amber-700 mt-1">{messData?.studentsOnLeave || 0}</p>
            </div>
            <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50">
              <span className="text-[10px] font-bold uppercase text-blue-800">Outside on Pass</span>
              <p className="text-2xl font-black text-blue-700 mt-1">{messData?.studentsOutsideCampus || 0}</p>
            </div>
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50">
              <span className="text-[10px] font-bold uppercase text-emerald-800">Food Waste Prevented</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">~{messData?.savingsAnalytics?.foodKgSaved || 42} kg</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Mess Kitchen Production Forecast
            </h4>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-500">Breakfast</span>
                <p className="text-xl font-black text-slate-800 mt-1">{messData?.mealProjections?.breakfast || 110}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-500">Lunch</span>
                <p className="text-xl font-black text-slate-800 mt-1">{messData?.mealProjections?.lunch || 115}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-500">Snacks</span>
                <p className="text-xl font-black text-slate-800 mt-1">{messData?.mealProjections?.snacks || 98}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-500">Dinner</span>
                <p className="text-xl font-black text-slate-800 mt-1">{messData?.mealProjections?.dinner || 112}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. SEMESTER REGISTRATION VERIFICATIONS                             */}
      {/* =================================================================== */}
      {activeTab === 'registration' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Queue ({pendingRegs.length})
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {pendingRegs.map((reg) => (
                <div
                  key={reg.id}
                  onClick={() => setSelectedReg(reg)}
                  className={`p-3.5 rounded-xl border cursor-pointer ${
                    selectedReg?.id === reg.id ? 'bg-blue-50 border-[#1c398e]' : 'bg-white border-slate-200'
                  }`}
                >
                  <h4 className="text-xs font-bold text-slate-900">{reg.student?.name}</h4>
                  <p className="text-[10px] text-slate-500 font-mono">MIS: {reg.student?.userId}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
            {selectedReg ? (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedReg.student?.name} • Room Dues & Occupancy Check
                </h3>
                <textarea
                  value={regRemarks}
                  onChange={(e) => setRegRemarks(e.target.value)}
                  placeholder="Enter hostel remarks..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs h-20"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleWardenRegAction('APPROVED')}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase"
                  >
                    Approve Clearance
                  </button>
                  <button
                    onClick={() => handleWardenRegAction('REJECTED')}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">Select a registration to verify</div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 6. HOSTEL COMPLAINTS & GRIEVANCE REDRESSAL                         */}
      {/* =================================================================== */}
      {activeTab === 'roommate' && (
        <RoommateAllotmentTab token={token} user={user} />
      )}

      {activeTab === 'announcements' && (
        <AnnouncementsTab token={token} portalType="HOSTEL" />
      )}

      {activeTab === 'complaints' && (
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
            Grievances & Complaints Filed ({complaints.length})
          </h3>

          <div className="space-y-3">
            {complaints.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-slate-100 text-slate-700">
                        {c.status}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{c.category.replace(/_/g, ' ')}</span>
                      {c.isAnonymous && <span className="text-[9px] bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded font-bold">Anonymous</span>}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{c.subject}</h4>
                    <p className="text-xs text-slate-600">{c.description}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Student: {c.student?.name || 'Anonymous'}</p>
                  </div>

                  {c.status !== 'RESOLVED' && (
                    <button
                      onClick={() => setResolvingComplaint(c)}
                      className="px-3 py-1.5 bg-[#0c2340] hover:bg-[#1c398e] text-white text-xs font-bold uppercase rounded-xl cursor-pointer"
                    >
                      Resolve Grievance
                    </button>
                  )}
                </div>

                {c.adminRemarks && (
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-900 text-xs">
                    <strong>Response:</strong> {c.adminRemarks}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolve Complaint Modal */}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-900">
              Resolve Grievance #{resolvingComplaint.id}
            </h3>
            <form onSubmit={handleResolveComplaint} className="space-y-3">
              <textarea
                rows="3"
                required
                placeholder="Official committee response / resolution notes..."
                value={complaintRemarks}
                onChange={(e) => setComplaintRemarks(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingComplaint(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded-xl cursor-pointer"
                >
                  Apply Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
