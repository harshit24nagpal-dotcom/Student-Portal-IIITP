import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { 
  Briefcase, Users, Plus, CheckCircle2, Clock, Calendar, 
  ExternalLink, Search, Filter, RefreshCw, AlertCircle, Award, 
  ChevronRight, Building2, UserCheck, ShieldCheck, Mail, Phone, 
  X, FileText, Check, XCircle, Download, Printer, ArrowRight, Sparkles
} from 'lucide-react';

export default function PlacementOfficerDashboard() {
  const { token, user } = useAuth();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'drives' | 'applications' | 'analytics'

  // Data states
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [requestFilterType, setRequestFilterType] = useState('ALL');
  const [requestFilterStatus, setRequestFilterStatus] = useState('ALL');
  const [selectedDriveFilter, setSelectedDriveFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showCreateDriveModal, setShowCreateDriveModal] = useState(false);
  const [selectedRequestForReview, setSelectedRequestForReview] = useState(null);
  const [selectedNocForView, setSelectedNocForView] = useState(null);
  const [selectedAppForStatus, setSelectedAppForStatus] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('APPROVED');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Application status update form
  const [statusForm, setStatusForm] = useState({
    status: 'SHORTLISTED',
    interviewSlot: '',
    interviewLink: '',
    remarks: ''
  });
  const [updatingAppStatus, setUpdatingAppStatus] = useState(false);

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

  // Fetch all TPO data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [drivesRes, appsRes, statsRes, reqsRes] = await Promise.all([
        fetch(`${API_URL}/placement/drives`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/placement/admin/all-applications`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/placement/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/placement/requests`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const [drivesData, appsData, statsData, reqsData] = await Promise.all([
        drivesRes.json(),
        appsRes.json(),
        statsRes.json(),
        reqsRes.json()
      ]);

      if (drivesRes.ok) setDrives(drivesData.drives || drivesData || []);
      if (appsRes.ok) setApplications(appsData || []);
      if (statsRes.ok) setStats(statsData || null);
      if (reqsRes.ok) setRequests(reqsData || []);
    } catch (err) {
      setError('Failed to load placement management data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  // Handle Review of Student Request
  const handleReviewRequest = async (e) => {
    e.preventDefault();
    if (!selectedRequestForReview) return;
    setSubmittingReview(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch(`${API_URL}/placement/requests/${selectedRequestForReview.id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: reviewStatus,
          remarks: reviewRemarks
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Request ${selectedRequestForReview.id} from ${selectedRequestForReview.studentName} updated to "${reviewStatus}".`);
        setSelectedRequestForReview(null);
        fetchData();
      } else {
        setError(data.error || 'Failed to review request.');
      }
    } catch (err) {
      setError('Network connection error.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle Create New Drive
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
        setShowCreateDriveModal(false);
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
        setError(data.error || 'Failed to create drive.');
      }
    } catch (err) {
      setError('Network error while creating drive.');
    } finally {
      setCreatingDrive(false);
    }
  };

  // Handle Application Status Update
  const handleUpdateAppStatus = async (e) => {
    e.preventDefault();
    if (!selectedAppForStatus) return;
    setUpdatingAppStatus(true);
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
        setMessage(`Updated candidate ${selectedAppForStatus.student?.name} for ${selectedAppForStatus.drive?.companyName} to "${statusForm.status}".`);
        setSelectedAppForStatus(null);
        fetchData();
      } else {
        setError(data.error || 'Failed to update application status.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setUpdatingAppStatus(false);
    }
  };

  // Filtered requests
  const filteredRequests = requests.filter(r => {
    if (requestFilterType !== 'ALL' && r.type !== requestFilterType) return false;
    if (requestFilterStatus !== 'ALL' && r.status !== requestFilterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (r.studentName || '').toLowerCase().includes(q);
      const matchMis = (r.studentMis || '').toLowerCase().includes(q);
      const matchComp = (r.companyName || '').toLowerCase().includes(q);
      if (!matchName && !matchMis && !matchComp) return false;
    }
    return true;
  });

  // Filtered applications
  const filteredApplications = applications.filter(app => {
    if (selectedDriveFilter !== 'ALL' && String(app.driveId) !== selectedDriveFilter) return false;
    if (selectedStatusFilter !== 'ALL' && app.status !== selectedStatusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (app.student?.name || '').toLowerCase().includes(q);
      const matchMis = (app.student?.userId || '').toLowerCase().includes(q);
      if (!matchName && !matchMis) return false;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
      case 'OFFERED':
      case 'SELECTED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'SHORTLISTED':
      case 'OA_CLEARED':
      case 'INTERVIEW_SCHEDULED':
        return 'bg-purple-50 text-purple-800 border-purple-300';
      case 'REJECTED':
        return 'bg-red-50 text-red-800 border-red-300';
      case 'UNDER_REVIEW':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'PENDING':
      default:
        return 'bg-amber-50 text-amber-800 border-amber-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* 1. Header & Quick Controls */}
      <div className="p-6 rounded-md border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-100 text-[#1c398e] rounded-md">
            <Briefcase className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-50 text-[#1c398e] text-[10px] font-black uppercase rounded tracking-wider border border-blue-200">
                OFFICIAL INSTITUTIONAL T&P DESK
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {user?.name || 'Dr. Bhupendra Singh'} • {user?.department || 'T&P In-Charge'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Training & Placement Officer Console
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Unified governance of campus recruitment drives, student NOC clearance, attendance duty leaves, and interview pipelines.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateDriveModal(true)}
            className="px-4 py-2 bg-[#0c2340] hover:bg-[#1a365d] text-white rounded-md text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Drive</span>
          </button>
        </div>
      </div>

      {/* Notifications Banner */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center justify-between gap-2 font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-md flex items-center justify-between gap-2 font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-700 hover:text-red-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Campus Drives</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats?.activeDrives ?? drives.filter(d => d.status === 'ACTIVE').length}
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-1">
            Total {stats?.totalDrives ?? drives.length} companies registered
          </p>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Student Applications</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats?.totalApplications ?? applications.length}
          </div>
          <p className="text-[10px] text-purple-700 font-medium mt-1">
            {stats?.interviewCount ?? 0} in active interview rounds
          </p>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Student Requests</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {requests.filter(r => r.status === 'PENDING').length}
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-1">
            NOCs & Duty Leave clearances
          </p>
        </div>

        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Confirmed Job Offers</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {stats?.offeredCount ?? 14}
          </div>
          <p className="text-[10px] text-emerald-700 font-medium mt-1">
            Highest: ₹32 LPA • Avg: ₹16.8 LPA
          </p>
        </div>
      </div>

      {/* 3. Section Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'requests'
              ? 'bg-[#0c2340] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Student Placement Requests & NOC Desk</span>
          {requests.filter(r => r.status === 'PENDING').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-mono">
              {requests.filter(r => r.status === 'PENDING').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('drives')}
          className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'drives'
              ? 'bg-[#0c2340] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Campus Recruitment Drives ({drives.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'applications'
              ? 'bg-[#0c2340] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Candidate Pipeline ({applications.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-[#0c2340] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Placement Statistics & Reports</span>
        </button>
      </div>

      {/* 4. Tab 1: Student Placement Requests & NOC Desk */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-md border border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Type:</span>
              <select
                value={requestFilterType}
                onChange={(e) => setRequestFilterType(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Request Types</option>
                <option value="INTERNSHIP_NOC">Internship NOC</option>
                <option value="DUTY_LEAVE">Attendance Duty Leave</option>
                <option value="RESUME_VERIFICATION">Resume Verification</option>
                <option value="PPO_INTIMATION">Pre-Placement Offer (PPO)</option>
              </select>

              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] ml-2">Status:</span>
              <select
                value={requestFilterStatus}
                onChange={(e) => setRequestFilterStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Review</option>
                <option value="APPROVED">Approved / Issued</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="w-full sm:w-72 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student, MIS, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs placeholder-slate-400 focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          {/* Requests Table */}
          <div className="rounded-md border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Req ID</th>
                    <th className="py-3 px-4">Student Particulars</th>
                    <th className="py-3 px-4">Request Type</th>
                    <th className="py-3 px-4">Company & Role</th>
                    <th className="py-3 px-4">Duration & Terms</th>
                    <th className="py-3 px-4">Status & Officer Remarks</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No student placement requests match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                          {req.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{req.studentName}</div>
                          <div className="font-mono text-[10px] text-slate-500">
                            MIS: {req.studentMis} • {req.department}
                          </div>
                          <div className="text-[10px] text-slate-600 mt-0.5">
                            CGPA: <span className="font-bold text-blue-700">{req.cgpa}</span> • Backlogs: <span className="font-bold text-emerald-700">{req.activeBacklogs}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-200 bg-slate-100 text-slate-800">
                            {req.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{req.companyName}</div>
                          <div className="text-slate-500 text-[11px]">{req.role}</div>
                          <div className="text-slate-400 text-[10px] mt-0.5">{req.location}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{req.duration}</div>
                          <div className="font-mono text-emerald-700 font-bold text-[11px]">{req.stipend}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border inline-block ${getStatusBadge(req.status)}`}>
                            {req.status}
                          </span>
                          {req.officerRemarks && (
                            <p className="text-[10px] text-slate-500 mt-1 max-w-xs truncate" title={req.officerRemarks}>
                              Remarks: {req.officerRemarks}
                            </p>
                          )}
                          {req.nocCertificateNumber && (
                            <p className="text-[10px] font-mono font-bold text-[#1c398e] mt-0.5">
                              NOC: {req.nocCertificateNumber}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRequestForReview(req);
                                setReviewStatus(req.status === 'PENDING' ? 'APPROVED' : req.status);
                                setReviewRemarks(req.officerRemarks || '');
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] transition-colors cursor-pointer"
                            >
                              Review
                            </button>

                            {req.nocCertificateNumber && (
                              <button
                                type="button"
                                onClick={() => setSelectedNocForView(req)}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#1c398e] border border-blue-200 font-semibold rounded text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" />
                                <span>View NOC</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Campus Recruitment Drives Management */}
      {activeTab === 'drives' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drives.map((drive) => (
              <div key={drive.id} className="p-5 rounded-md border border-slate-200 bg-white shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#1c398e] border border-blue-200">
                      {drive.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      drive.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {drive.status}
                    </span>
                  </div>

                  <h3 className="font-black text-base text-slate-900">{drive.companyName}</h3>
                  <p className="text-xs font-semibold text-slate-700">{drive.role}</p>

                  <div className="mt-3 space-y-1.5 text-xs bg-slate-50 p-3 rounded-md border border-slate-200/80">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Compensation:</span>
                      <span className="font-mono font-bold text-emerald-700">{drive.ctc}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Min CGPA:</span>
                      <span className="font-mono font-bold text-slate-800">{drive.minCgpa}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Branches:</span>
                      <span className="font-semibold text-slate-800">{drive.allowedBranches}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Deadline:</span>
                      <span className="font-mono text-slate-700">{drive.deadline}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    {applications.filter(a => a.driveId === drive.id).length} Applicants
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDriveFilter(String(drive.id));
                      setActiveTab('applications');
                    }}
                    className="font-bold text-[#1c398e] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    View Applicants →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Tab 3: Student Candidate Pipeline CRM */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="p-4 rounded-md border border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Filter Drive:</span>
              <select
                value={selectedDriveFilter}
                onChange={(e) => setSelectedDriveFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Placement Drives</option>
                {drives.map(d => (
                  <option key={d.id} value={String(d.id)}>{d.companyName} ({d.role})</option>
                ))}
              </select>

              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] ml-2">Stage:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Application Stages</option>
                <option value="APPLIED">Applied</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="OA_CLEARED">OA Cleared</option>
                <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                <option value="OFFERED">Offered / Selected</option>
                <option value="REJECTED">Not Shortlisted</option>
              </select>
            </div>

            <div className="w-full sm:w-64 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate name or MIS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs placeholder-slate-400 focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Candidate Name</th>
                    <th className="py-3 px-4">MIS / Roll No</th>
                    <th className="py-3 px-4">Target Company</th>
                    <th className="py-3 px-4">Academic Metrics</th>
                    <th className="py-3 px-4">Current Stage</th>
                    <th className="py-3 px-4">Interview Schedule</th>
                    <th className="py-3 px-4 text-right">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No candidate applications found for the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {app.student?.name || 'Student Candidate'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {app.student?.userId || '112415079'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800">{app.drive?.companyName}</span>
                          <span className="text-[11px] text-slate-500 block">{app.drive?.role}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-slate-700 font-bold">CGPA: {app.student?.cgpa || '8.45'}</span>
                          <span className="text-[10px] text-slate-500 block">Backlogs: {app.student?.activeBacklogs || 0}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border inline-block ${getStatusBadge(app.status)}`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                          {app.interviewSlot ? (
                            <div>
                              <span className="font-bold text-slate-800">{app.interviewSlot}</span>
                              {app.interviewLink && (
                                <a href={app.interviewLink} target="_blank" rel="noreferrer" className="text-blue-700 block hover:underline text-[10px]">
                                  Google Meet Link ↗
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">Not scheduled yet</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAppForStatus(app);
                              setStatusForm({
                                status: app.status || 'SHORTLISTED',
                                interviewSlot: app.interviewSlot || '',
                                interviewLink: app.interviewLink || '',
                                remarks: app.remarks || ''
                              });
                            }}
                            className="px-2.5 py-1 bg-[#0c2340] hover:bg-[#1a365d] text-white rounded text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Set Stage
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. Tab 4: Placement Statistics & Reports */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-md border border-slate-200 bg-white shadow-xs space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Branch-wise Placement %</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>B.Tech CSE</span>
                    <span className="text-emerald-700">96.4%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: '96.4%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>B.Tech ECE</span>
                    <span className="text-blue-700">91.8%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '91.8%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span>M.Tech CSE / AI</span>
                    <span className="text-purple-700">94.0%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-md border border-slate-200 bg-white shadow-xs space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Salary Package Breakdown</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-200/80">
                  <span className="font-semibold text-slate-700">Highest International Package</span>
                  <span className="font-mono font-bold text-slate-900">₹62.0 LPA</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-200/80">
                  <span className="font-semibold text-slate-700">Highest Domestic Package</span>
                  <span className="font-mono font-bold text-slate-900">₹36.5 LPA</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-200/80">
                  <span className="font-semibold text-slate-700">Average CTC (CSE)</span>
                  <span className="font-mono font-bold text-emerald-700">₹18.4 LPA</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-200/80">
                  <span className="font-semibold text-slate-700">Median CTC</span>
                  <span className="font-mono font-bold text-blue-700">₹15.2 LPA</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-md border border-slate-200 bg-white shadow-xs space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Top Recruiters AY2026-27</h3>
              <div className="flex flex-wrap gap-2 text-xs">
                {['Google', 'Microsoft', 'NVIDIA', 'Amazon', 'Qualcomm', 'Adobe', 'Oracle', 'Goldman Sachs', 'DE Shaw', 'Texas Instruments'].map(c => (
                  <span key={c} className="px-2.5 py-1 bg-slate-100 border border-slate-200 font-semibold text-slate-800 rounded">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: Review Student Request (Approve / Reject / Remarks) */}
      {selectedRequestForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 p-6 relative">
            <button
              type="button"
              onClick={() => setSelectedRequestForReview(null)}
              className="absolute right-4 top-4 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-900 mb-1">
              Review Placement Request: {selectedRequestForReview.id}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Submitted by <span className="font-bold text-slate-800">{selectedRequestForReview.studentName}</span> ({selectedRequestForReview.studentMis})
            </p>

            <div className="p-3 bg-slate-50 rounded-md border border-slate-200 mb-4 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Request Type:</span>
                <span className="font-bold text-slate-900">{selectedRequestForReview.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Target Company:</span>
                <span className="font-bold text-slate-900">{selectedRequestForReview.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Proposed Role:</span>
                <span className="font-bold text-slate-900">{selectedRequestForReview.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Duration:</span>
                <span className="font-bold text-slate-900">{selectedRequestForReview.duration}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 text-slate-700">
                <span className="text-slate-500 font-semibold block mb-0.5">Student Justification:</span>
                <p className="bg-white p-2 rounded border border-slate-200 text-[11px]">
                  {selectedRequestForReview.details}
                </p>
              </div>
            </div>

            <form onSubmit={handleReviewRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Determination Decision
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('APPROVED')}
                    className={`py-2 px-3 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      reviewStatus === 'APPROVED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve & Issue</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus('REJECTED')}
                    className={`py-2 px-3 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      reviewStatus === 'REJECTED'
                        ? 'bg-red-600 text-white border-red-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Request</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Officer Remarks / Academic Endorsement
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="e.g. Academic eligibility verified. Approved for 6-month internship."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequestForReview(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md uppercase tracking-wider text-[11px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 py-2 bg-[#0c2340] hover:bg-[#1a365d] text-white font-bold rounded-md uppercase tracking-wider text-[11px] shadow cursor-pointer disabled:opacity-60"
                >
                  {submittingReview ? 'Submitting...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL: View Official Digital NOC Certificate */}
      {selectedNocForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-300 p-8 relative print:p-0">
            <button
              type="button"
              onClick={() => setSelectedNocForView(null)}
              className="absolute right-4 top-4 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official Institutional Letterhead */}
            <div className="text-center pb-4 border-b-2 border-slate-900 mb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <img src="/iiitp_logo.png" alt="IIIT Pune Logo" className="w-14 h-14 object-contain" />
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight leading-tight">
                    INDIAN INSTITUTE OF INFORMATION TECHNOLOGY PUNE
                  </h2>
                  <p className="text-[10px] text-slate-600 font-semibold tracking-wide">
                    An Institute of National Importance under Act of Parliament • Govt. of India
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Training & Placement Cell • Email: support@iiitp.ac.in • Web: www.iiitp.ac.in
                  </p>
                </div>
              </div>
            </div>

            {/* Certificate Header */}
            <div className="flex justify-between items-start text-xs mb-6">
              <div>
                <p className="text-slate-500 font-mono">Ref No: <span className="font-bold text-slate-900">{selectedNocForView.nocCertificateNumber}</span></p>
                <p className="text-slate-500 font-mono">Dispatch Date: <span className="font-bold text-slate-900">{new Date(selectedNocForView.reviewedAt || Date.now()).toLocaleDateString('en-IN')}</span></p>
              </div>
              <div className="px-3 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold rounded uppercase text-[10px]">
                OFFICIAL NOC SANCTIONED
              </div>
            </div>

            <div className="text-center my-4">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wider underline">
                TO WHOMSOEVER IT MAY CONCERN
              </h3>
              <p className="text-xs font-bold text-slate-600 mt-1">
                Sub: No Objection Certificate (NOC) for Industry Internship / Practical Training
              </p>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-700 my-6 text-justify">
              <p>
                This is to officially certify that <span className="font-bold text-slate-900">{selectedNocForView.studentName}</span>, Roll / MIS Number: <span className="font-mono font-bold text-slate-900">{selectedNocForView.studentMis}</span>, is a bonafide student of the Indian Institute of Information Technology Pune, currently pursuing his/her undergraduate degree in the Department of <span className="font-bold text-slate-900">{selectedNocForView.department}</span>.
              </p>
              <p>
                The Institute has <span className="font-bold text-slate-900">NO OBJECTION</span> to the student undertaking practical industry training / internship with <span className="font-bold text-slate-900">{selectedNocForView.companyName}</span> for the position of <span className="font-bold text-slate-900">{selectedNocForView.role}</span> for a duration of <span className="font-bold text-slate-900">{selectedNocForView.duration}</span>.
              </p>
              <p>
                During this period, the student is permitted to fulfill project evaluation criteria through institutional mentoring guidelines as sanctioned by the Academic Council.
              </p>
            </div>

            {/* Signatures */}
            <div className="pt-8 mt-6 border-t border-slate-200 flex justify-between items-end text-xs">
              <div>
                <div className="w-24 h-12 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400 font-mono">
                  [INSTITUTIONAL SEAL]
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">IIIT Pune T&P Cell Stamp</p>
              </div>
              <div className="text-right">
                <div className="font-black text-slate-900">{selectedNocForView.reviewedBy || 'Dr. Bhupendra Singh'}</div>
                <div className="text-[11px] text-slate-600 font-semibold">Training & Placement Officer</div>
                <div className="text-[10px] text-slate-500">Indian Institute of Information Technology Pune</div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-md text-xs uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Certificate</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedNocForView(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md text-xs uppercase cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. MODAL: Create Placement Drive */}
      {showCreateDriveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowCreateDriveModal(false)}
              className="absolute right-4 top-4 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-900 mb-1">
              Create Campus Recruitment Drive
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter recruiter parameters. The smart engine will match eligible students automatically.
            </p>

            <form onSubmit={handleCreateDrive} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    value={newDrive.companyName}
                    onChange={(e) => setNewDrive({ ...newDrive, companyName: e.target.value })}
                    placeholder="e.g. Google India"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Job Role</label>
                  <input
                    type="text"
                    required
                    value={newDrive.role}
                    onChange={(e) => setNewDrive({ ...newDrive, role: e.target.value })}
                    placeholder="e.g. Software Engineer (SDE-1)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Drive Type</label>
                  <select
                    value={newDrive.type}
                    onChange={(e) => setNewDrive({ ...newDrive, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none"
                  >
                    <option value="FULL_TIME">Full Time (FTE)</option>
                    <option value="INTERNSHIP">Summer Internship</option>
                    <option value="6_MONTH">6-Month Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Compensation (CTC)</label>
                  <input
                    type="text"
                    required
                    value={newDrive.ctc}
                    onChange={(e) => setNewDrive({ ...newDrive, ctc: e.target.value })}
                    placeholder="e.g. ₹28 LPA"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Min CGPA</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newDrive.minCgpa}
                    onChange={(e) => setNewDrive({ ...newDrive, minCgpa: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Eligible Branches</label>
                  <input
                    type="text"
                    value={newDrive.allowedBranches}
                    onChange={(e) => setNewDrive({ ...newDrive, allowedBranches: e.target.value })}
                    placeholder="CSE,ECE or ALL"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Deadline Date</label>
                  <input
                    type="date"
                    required
                    value={newDrive.deadline}
                    onChange={(e) => setNewDrive({ ...newDrive, deadline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Selection Rounds</label>
                <input
                  type="text"
                  value={newDrive.selectionRounds}
                  onChange={(e) => setNewDrive({ ...newDrive, selectionRounds: e.target.value })}
                  placeholder="e.g. OA -> Technical Round -> System Design -> HR Round"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateDriveModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md uppercase tracking-wider text-[11px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingDrive}
                  className="flex-1 py-2 bg-[#0c2340] hover:bg-[#1a365d] text-white font-bold rounded-md uppercase tracking-wider text-[11px] shadow cursor-pointer disabled:opacity-60"
                >
                  {creatingDrive ? 'Posting Drive...' : 'Publish Campus Drive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. MODAL: Update Candidate Status & Interview Slot */}
      {selectedAppForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6 relative">
            <button
              type="button"
              onClick={() => setSelectedAppForStatus(null)}
              className="absolute right-4 top-4 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-900 mb-1">
              Update Candidate Pipeline Stage
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Candidate: <span className="font-bold text-slate-800">{selectedAppForStatus.student?.name}</span> • {selectedAppForStatus.drive?.companyName}
            </p>

            <form onSubmit={handleUpdateAppStatus} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Pipeline Stage</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md font-bold focus:outline-none"
                >
                  <option value="APPLIED">Applied</option>
                  <option value="SHORTLISTED">Shortlisted for OA</option>
                  <option value="OA_CLEARED">Online Assessment Cleared</option>
                  <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                  <option value="OFFERED">Job / Internship Offer Issued</option>
                  <option value="REJECTED">Application Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Interview Time Slot</label>
                <input
                  type="text"
                  placeholder="e.g. 29 Oct 2026, 03:30 PM - 04:30 PM"
                  value={statusForm.interviewSlot}
                  onChange={(e) => setStatusForm({ ...statusForm, interviewSlot: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md font-mono focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Interview Link (Google Meet / Zoom)</label>
                <input
                  type="text"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={statusForm.interviewLink}
                  onChange={(e) => setStatusForm({ ...statusForm, interviewLink: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md font-mono focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Remarks for Candidate</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please be prepared with DSA & System Design fundamentals."
                  value={statusForm.remarks}
                  onChange={(e) => setStatusForm({ ...statusForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAppForStatus(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md uppercase tracking-wider text-[11px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingAppStatus}
                  className="flex-1 py-2 bg-[#0c2340] hover:bg-[#1a365d] text-white font-bold rounded-md uppercase tracking-wider text-[11px] shadow cursor-pointer disabled:opacity-60"
                >
                  {updatingAppStatus ? 'Updating...' : 'Save Stage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
