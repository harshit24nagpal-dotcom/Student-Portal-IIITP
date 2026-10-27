import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { 
  Briefcase, Users, Plus, CheckCircle2, Clock, Calendar, 
  ExternalLink, Search, Filter, RefreshCw, AlertCircle, Award, 
  ChevronRight, Building2, UserCheck, ShieldCheck, Mail, Phone
} from 'lucide-react';

export default function AdminPlacementTab() {
  const { token } = useAuth();
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDriveFilter, setSelectedDriveFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAppForStatus, setSelectedAppForStatus] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: 'SHORTLISTED',
    interviewSlot: '',
    interviewLink: '',
    remarks: ''
  });

  // Create drive form state
  const [newDrive, setNewDrive] = useState({
    companyName: '',
    role: '',
    type: 'FULL_TIME',
    ctc: '',
    location: 'Pune / Bengaluru',
    minCgpa: 7.5,
    allowedBranches: 'CSE,ECE',
    maxBacklogs: 0,
    deadline: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    description: 'Premier campus recruitment drive.',
    selectionRounds: 'Online Assessment -> Technical Round -> System Design -> HR Round'
  });
  const [creatingDrive, setCreatingDrive] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [drivesRes, appsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/placement/drives`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/placement/admin/all-applications`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/placement/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const [drivesData, appsData, statsData] = await Promise.all([
        drivesRes.json(),
        appsRes.json(),
        statsRes.json()
      ]);

      if (drivesRes.ok) setDrives(drivesData.drives || drivesData || []);
      if (appsRes.ok) setApplications(appsData || []);
      if (statsRes.ok) setStats(statsData || null);
    } catch (err) {
      setError('Failed to load placement management data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  // Create New Drive Handler
  const handleCreateDrive = async (e) => {
    e.preventDefault();
    setCreatingDrive(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch(`${API_URL}/placement/drives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newDrive)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Placement drive for ${newDrive.companyName} created successfully! Broadcast to eligible students.`);
        setShowCreateModal(false);
        setNewDrive({
          companyName: '',
          role: '',
          type: 'FULL_TIME',
          ctc: '',
          location: 'Pune / Bengaluru',
          minCgpa: 7.5,
          allowedBranches: 'CSE,ECE',
          maxBacklogs: 0,
          deadline: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
          description: 'Premier campus recruitment drive.',
          selectionRounds: 'Online Assessment -> Technical Round -> System Design -> HR Round'
        });
        fetchData();
      } else {
        setError(data.error || 'Failed to create placement drive.');
      }
    } catch (err) {
      setError('Network error while creating placement drive.');
    } finally {
      setCreatingDrive(false);
    }
  };

  // Update Student Application Status Handler
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedAppForStatus) return;
    setUpdatingStatus(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch(`${API_URL}/placement/applications/${selectedAppForStatus.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(statusForm)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Updated application status for ${selectedAppForStatus.student?.name} (${selectedAppForStatus.drive?.companyName}) to ${statusForm.status}! Notification dispatched.`);
        setSelectedAppForStatus(null);
        fetchData();
      } else {
        setError(data.error || 'Failed to update application status.');
      }
    } catch (err) {
      setError('Network error updating application status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Filtered applications
  const filteredApps = applications.filter(app => {
    const matchesDrive = selectedDriveFilter === 'ALL' || app.driveId === parseInt(selectedDriveFilter);
    const matchesStatus = selectedStatusFilter === 'ALL' || app.status === selectedStatusFilter;
    const matchesQuery = 
      (app.student?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.student?.userId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.drive?.companyName || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDrive && matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-900 text-[10px] font-black uppercase rounded tracking-wider border border-blue-200">
              INSTITUTIONAL PLACEMENT CRM
            </span>
            <span className="text-xxs text-slate-500 font-mono">
              OFFICIAL T&P PORTAL OVERVIEW
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Training & Placement (T&P) Master Command Center
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Drive Schedules, Candidate Eligibility Verification, Interview Scheduling & Job Offer Dispatch
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-[#0c2340] hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Post New Placement Drive
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

      {/* 5 Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Drives</span>
          <p className="text-2xl font-black text-slate-900">{stats?.activeDrives ?? drives.length}</p>
          <span className="text-xxs text-slate-500">Corporate partners</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student Applications</span>
          <p className="text-2xl font-black text-blue-700">{stats?.totalApplications ?? applications.length}</p>
          <span className="text-xxs text-slate-500">Candidates registered</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shortlisted for OA</span>
          <p className="text-2xl font-black text-amber-600">{stats?.shortlistedCount ?? applications.filter(a => a.status === 'SHORTLISTED').length}</p>
          <span className="text-xxs text-slate-500">Passed CGPA screening</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interviews Active</span>
          <p className="text-2xl font-black text-purple-600">{stats?.interviewCount ?? applications.filter(a => a.status === 'INTERVIEW_SCHEDULED').length}</p>
          <span className="text-xxs text-slate-500">Slots confirmed</span>
        </div>

        <div className="p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50/40 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Offers Extended</span>
          <p className="text-2xl font-black text-emerald-800">{stats?.offeredCount ?? applications.filter(a => ['OFFERED', 'SELECTED'].includes(a.status)).length}</p>
          <span className="text-xxs text-emerald-900 font-semibold">Job parchments</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-grow max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search candidate by name, MIS or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#0c2340]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Company filter */}
          <select
            value={selectedDriveFilter}
            onChange={(e) => setSelectedDriveFilter(e.target.value)}
            className="p-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white text-slate-700"
          >
            <option value="ALL">All Companies ({drives.length})</option>
            {drives.map(d => (
              <option key={d.id} value={d.id}>{d.companyName} - {d.role}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="p-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPLIED">Applied (Pending)</option>
            <option value="SHORTLISTED">Shortlisted (OA)</option>
            <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
            <option value="OFFERED">Offered / Selected</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Student Applications Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0c2340]" />
            Student Placement Applications ({filteredApps.length})
          </h3>
          <span className="text-xxs text-slate-500 font-medium">Click candidate row to schedule interview or update status</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/70 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Candidate Particulars</th>
                <th className="py-2.5 px-4">Branch & Standing</th>
                <th className="py-2.5 px-4">Company & Package</th>
                <th className="py-2.5 px-4">Application Status</th>
                <th className="py-2.5 px-4">Interview Schedule / Notes</th>
                <th className="py-2.5 px-4 text-right">T&P Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No candidate applications match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredApps.map(app => {
                  const isOffered = ['OFFERED', 'SELECTED'].includes(app.status);
                  const isInterview = app.status === 'INTERVIEW_SCHEDULED';
                  const isShortlisted = app.status === 'SHORTLISTED';
                  const isRejected = app.status === 'REJECTED';

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{app.student?.name}</div>
                        <div className="text-xxs font-mono text-slate-500">MIS: {app.student?.userId}</div>
                        <div className="text-xxs text-slate-400">{app.student?.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{app.student?.department || 'CSE'}</div>
                        <div className="text-xxs text-slate-500">CGPA: <strong className="text-slate-900 font-mono">{app.student?.cgpa ?? 8.45}</strong> • Backlogs: <strong className="text-slate-900 font-mono">{app.student?.activeBacklogs ?? 0}</strong></div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{app.drive?.companyName}</div>
                        <div className="text-xxs text-slate-500">{app.drive?.role}</div>
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          {app.drive?.ctc}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                          isOffered 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : isInterview 
                            ? 'bg-purple-50 text-purple-800 border-purple-200' 
                            : isShortlisted 
                            ? 'bg-amber-50 text-amber-800 border-amber-200' 
                            : isRejected 
                            ? 'bg-red-50 text-red-700 border-red-200' 
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}>
                          {app.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {app.interviewSlot ? (
                          <div className="text-xxs space-y-0.5">
                            <span className="font-bold text-purple-900 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-purple-600" /> {app.interviewSlot}
                            </span>
                            {app.interviewLink && (
                              <a href={app.interviewLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[180px]">
                                <ExternalLink className="w-2.5 h-2.5" /> Meeting Link
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xxs text-slate-400 italic">{app.remarks || 'No interview scheduled'}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedAppForStatus(app);
                            setStatusForm({
                              status: app.status || 'SHORTLISTED',
                              interviewSlot: app.interviewSlot || '2026-10-30 at 14:00 IST',
                              interviewLink: app.interviewLink || 'https://meet.google.com/iiitp-tech-interview',
                              remarks: app.remarks || ''
                            });
                          }}
                          className="px-3 py-1.5 bg-[#0c2340] hover:bg-slate-900 text-white rounded-lg text-xxs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          UPDATE APPLICATION STATUS MODAL
         ========================================================================= */}
      {selectedAppForStatus && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Update Candidate Placement Status</h3>
                <p className="text-xxs text-slate-500">
                  {selectedAppForStatus.student?.name} • {selectedAppForStatus.drive?.companyName} ({selectedAppForStatus.drive?.role})
                </p>
              </div>
              <button onClick={() => setSelectedAppForStatus(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-3 text-xs">
              <div>
                <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Application Stage / Status</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({...statusForm, status: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="APPLIED">APPLIED (Initial Submission)</option>
                  <option value="SHORTLISTED">SHORTLISTED (OA Cleared)</option>
                  <option value="INTERVIEW_SCHEDULED">INTERVIEW SCHEDULED (Technical/HR)</option>
                  <option value="OFFERED">OFFERED (Official Job Offer Extended)</option>
                  <option value="REJECTED">REJECTED (Candidate Not Selected)</option>
                </select>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Interview Slot / Date & Time</label>
                <input
                  type="text"
                  placeholder="e.g. 2026-10-30 at 14:00 IST (Technical Round)"
                  value={statusForm.interviewSlot}
                  onChange={(e) => setStatusForm({...statusForm, interviewSlot: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Meeting / Interview Link</label>
                <input
                  type="url"
                  placeholder="e.g. https://meet.google.com/abc-defg-hij"
                  value={statusForm.interviewLink}
                  onChange={(e) => setStatusForm({...statusForm, interviewLink: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Officer Remarks / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Instructions for the candidate regarding system design portfolio or dress code..."
                  value={statusForm.remarks}
                  onChange={(e) => setStatusForm({...statusForm, remarks: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedAppForStatus(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs uppercase rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="px-5 py-2 bg-[#0c2340] hover:bg-slate-900 text-white font-bold text-xs uppercase rounded-lg shadow-xs cursor-pointer"
                >
                  {updatingStatus ? 'Updating & Notifying...' : 'Save & Dispatch Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          CREATE PLACEMENT DRIVE MODAL
         ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Post New Campus Placement Drive</h3>
                <p className="text-xxs text-slate-500">Initiate institutional recruitment drive for eligible B.Tech batches</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateDrive} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google, Microsoft, NVIDIA, Amazon"
                    value={newDrive.companyName}
                    onChange={(e) => setNewDrive({...newDrive, companyName: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Designation / Role Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Development Engineer (SDE-1)"
                    value={newDrive.role}
                    onChange={(e) => setNewDrive({...newDrive, role: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Job Type</label>
                  <select
                    value={newDrive.type}
                    onChange={(e) => setNewDrive({...newDrive, type: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="FULL_TIME">FULL TIME</option>
                    <option value="INTERNSHIP">INTERNSHIP (Summer)</option>
                    <option value="6_MONTH">6-MONTH INTERNSHIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Compensation / CTC</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₹28.5 LPA or ₹1.2 Lakh/mo"
                    value={newDrive.ctc}
                    onChange={(e) => setNewDrive({...newDrive, ctc: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Pune / Bengaluru"
                    value={newDrive.location}
                    onChange={(e) => setNewDrive({...newDrive, location: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Minimum CGPA</label>
                  <input
                    type="number"
                    step="0.1"
                    min="5.0"
                    max="10.0"
                    value={newDrive.minCgpa}
                    onChange={(e) => setNewDrive({...newDrive, minCgpa: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Allowed Branches</label>
                  <input
                    type="text"
                    value={newDrive.allowedBranches}
                    onChange={(e) => setNewDrive({...newDrive, allowedBranches: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Application Deadline</label>
                  <input
                    type="date"
                    value={newDrive.deadline}
                    onChange={(e) => setNewDrive({...newDrive, deadline: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Selection Rounds</label>
                <input
                  type="text"
                  value={newDrive.selectionRounds}
                  onChange={(e) => setNewDrive({...newDrive, selectionRounds: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs uppercase rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingDrive}
                  className="px-5 py-2 bg-[#0c2340] hover:bg-slate-900 text-white font-bold text-xs uppercase rounded-lg shadow-xs cursor-pointer"
                >
                  {creatingDrive ? 'Publishing Drive...' : 'Publish Corporate Drive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}