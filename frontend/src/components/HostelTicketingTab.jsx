import React, { useState, useEffect } from 'react';
import { 
  Wrench, CheckCircle2, Clock, AlertTriangle, ShieldCheck, 
  Send, User, Home, Filter, RefreshCw, FileCheck, Sparkles, Check,
  Camera, Upload, Image as ImageIcon
} from 'lucide-react';
import { API_URL, getFileUrl } from '../config/api';

export default function HostelTicketingTab({ token, user }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form State
  const [hostelBlock, setHostelBlock] = useState(user?.hostelBlock || 'Hostel Block A');
  const [roomNumber, setRoomNumber] = useState('A-204');
  const [category, setCategory] = useState('PLUMBING');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [beforePhoto, setBeforePhoto] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleUploadPhoto = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploadingPhoto(true);
    try {
      const res = await fetch(`${API_URL}/files/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.file?.filePath) {
        setBeforePhoto(data.file.filePath);
      } else {
        setError(data.error || 'Failed to upload photo');
      }
    } catch (err) {
      setError('Network error during photo upload');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Filter State
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/hostel/tickets/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setTickets(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchMyTickets();
  }, [token]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please provide a title and detailed problem description.');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/hostel/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          hostelBlock,
          roomNumber,
          category,
          title,
          description,
          priority,
          beforePhoto
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Ticket registered successfully! Maintenance team has been assigned.');
        setTitle('');
        setDescription('');
        setBeforePhoto('');
        fetchMyTickets();
      } else {
        setError(data.error || 'Failed to submit ticket');
      }
    } catch (err) {
      setError('Network connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'EMERGENCY':
      case 'HIGH':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (statusFilter === 'ALL') return true;
    return t.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              Hostel Problem Ticketing & Resolution System
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit maintenance complaints for electricity, plumbing, Wi-Fi, and room fittings with mandatory <strong>Proof of Resolution</strong> verification.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Proof of Resolution Required</span>
          </span>
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form: Raise New Problem Ticket */}
        <div className="lg:col-span-1 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Wrench className="w-4 h-4 text-[#1c398e]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Raise Maintenance Ticket
            </h4>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Hostel Block *
                </label>
                <input
                  type="text"
                  required
                  value={hostelBlock}
                  onChange={(e) => setHostelBlock(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Room No. *
                </label>
                <input
                  type="text"
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Problem Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                <option value="PLUMBING">Plumbing & Water Supply</option>
                <option value="ELECTRICAL">Electrical, Fan & Lighting</option>
                <option value="CLEANLINESS_HYGIENE">Cleanliness & Washroom Hygiene</option>
                <option value="CARPENTRY_FURNITURE">Carpentry, Bed & Furniture</option>
                <option value="WIFI_NETWORK">Wi-Fi & LAN Network</option>
                <option value="PEST_CONTROL">Pest Control</option>
                <option value="OTHER">Other Issue</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Issue Summary / Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Geyser tripping switch in room 204"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Detailed Description *
              </label>
              <textarea
                rows="3"
                required
                placeholder="Explain the problem clearly so the technician brings correct spare parts..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1 flex items-center justify-between">
                <span>Attach Problem Photo (Before Fix)</span>
                <span className="text-[10px] text-slate-400 font-normal lowercase">(optional)</span>
              </label>

              {beforePhoto ? (
                <div className="relative group rounded-xl overflow-hidden border border-slate-200">
                  <img src={getFileUrl(beforePhoto)} alt="Problem Before Fix" className="w-full h-28 object-cover" />
                  <button
                    type="button"
                    onClick={() => setBeforePhoto('')}
                    className="absolute top-2 right-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold shadow cursor-pointer"
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-200 hover:border-[#1c398e] bg-slate-50 hover:bg-white rounded-xl cursor-pointer transition-all text-center">
                  <Camera className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-slate-700">
                    {uploadingPhoto ? 'Uploading Photo...' : 'Click to Upload Problem Photo'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">JPEG, PNG up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUploadPhoto(e.target.files[0])}
                  />
                </label>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                <option value="LOW">Low (Can take 2-3 days)</option>
                <option value="MEDIUM">Medium (Within 24 hours)</option>
                <option value="HIGH">High (Urgent - within 6 hours)</option>
                <option value="EMERGENCY">Emergency (Immediate danger/leakage)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-[#0c2340] hover:bg-[#1c398e] text-white text-xs font-bold uppercase rounded-xl tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Register Problem Ticket</span>
            </button>
          </form>
        </div>

        {/* Tickets List with Proof of Resolution */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1c398e]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Active & Resolved Maintenance Tickets ({filteredTickets.length})
              </h4>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 text-xs">
              {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    statusFilter === status
                      ? 'bg-[#0c2340] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#5367c8]" />
              Loading maintenance tickets...
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No tickets found for this filter.
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[580px] overflow-y-auto pr-1">
              {filteredTickets.map((t) => {
                const isResolved = t.status === 'RESOLVED' || t.status === 'CLOSED';

                return (
                  <div
                    key={t.id}
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      isResolved
                        ? 'bg-emerald-50/20 border-emerald-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-full border ${getStatusBadge(t.status)}`}>
                            {t.status.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${getPriorityBadge(t.priority)}`}>
                            {t.priority}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Ticket #{t.id} • {t.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">
                          {t.title}
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {t.description}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-700 block">
                          {t.hostelBlock} • {t.roomNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Problem Photo before resolution */}
                    {!isResolved && t.beforePhoto && (
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                        <a href={getFileUrl(t.beforePhoto)} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-slate-200 hover:opacity-90 transition-opacity shrink-0">
                          <img src={getFileUrl(t.beforePhoto)} alt="Problem Before Fix" className="w-24 h-18 object-cover" />
                        </a>
                        <div className="text-xs space-y-0.5">
                          <span className="text-[9px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 inline-block">
                            Attached Photo (Before Fix)
                          </span>
                          <p className="text-[11px] text-slate-500">Student attached visual proof of issue for maintenance team.</p>
                        </div>
                      </div>
                    )}

                    {/* ⭐ PROOF OF RESOLUTION SECTION ⭐ */}
                    {isResolved && (
                      <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-black uppercase tracking-wider">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Official Proof of Resolution</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                            Verified ✓
                          </span>
                        </div>

                        {/* BEFORE & AFTER PHOTO COMPARISON */}
                        {(t.beforePhoto || t.afterPhoto) && (
                          <div className="grid grid-cols-2 gap-2.5 pt-1 pb-1">
                            {t.beforePhoto ? (
                              <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 block text-center">
                                  Before Fix (Problem)
                                </span>
                                <a href={getFileUrl(t.beforePhoto)} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-slate-200 hover:opacity-90 transition-opacity">
                                  <img src={getFileUrl(t.beforePhoto)} alt="Problem Before Fix" className="w-full h-28 object-cover" />
                                </a>
                              </div>
                            ) : (
                              <div className="h-28 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400 text-center p-2">
                                No before photo attached
                              </div>
                            )}

                            {t.afterPhoto ? (
                              <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 block text-center">
                                  After Completion (Resolved ✓)
                                </span>
                                <a href={getFileUrl(t.afterPhoto)} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-emerald-300 hover:opacity-90 transition-opacity shadow-xs">
                                  <img src={getFileUrl(t.afterPhoto)} alt="Resolved After Fix" className="w-full h-28 object-cover" />
                                </a>
                              </div>
                            ) : (
                              <div className="h-28 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 flex items-center justify-center text-[10px] text-emerald-700 text-center p-2">
                                Physical resolution confirmed on-site
                              </div>
                            )}
                          </div>
                        )}

                        <div className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                          <p className="font-semibold text-emerald-950">Work Done / Action Taken:</p>
                          <p className="text-slate-700 mt-0.5">
                            {t.proofOfResolution || 'Standard maintenance completed and tested on-site.'}
                          </p>
                          {t.resolutionRemarks && (
                            <p className="text-[11px] text-slate-500 italic mt-1">
                              &quot;{t.resolutionRemarks}&quot;
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 pt-1">
                          <span>Resolved by: <strong>{t.resolvedBy || 'Hostel Maintenance Staff'}</strong></span>
                          <span>Completed on: {t.resolvedAt ? new Date(t.resolvedAt).toLocaleString() : 'Recently'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
