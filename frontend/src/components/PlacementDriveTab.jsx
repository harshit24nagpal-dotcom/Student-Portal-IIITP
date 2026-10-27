import React, { useState, useEffect } from 'react';
import { 
  Briefcase, CheckCircle2, XCircle, AlertTriangle, Clock, 
  MapPin, DollarSign, Award, ExternalLink, Filter, 
  ChevronRight, Building, UserCheck, ShieldCheck, Sparkles, RefreshCw, Send, Video,
  Plus, FileText, Check, Printer, X
} from 'lucide-react';
import { API_URL } from '../config/api';

export default function PlacementDriveTab({ token, user }) {
  const [data, setData] = useState({ studentStats: {}, drives: [] });
  const [applications, setApplications] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('drives'); // 'drives' | 'applications' | 'requests'
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'FULL_TIME' | 'INTERNSHIP' | 'ELIGIBLE_ONLY'
  const [applyingId, setApplyingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Student request modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [selectedNocModal, setSelectedNocModal] = useState(null);
  const [newRequest, setNewRequest] = useState({
    type: 'INTERNSHIP_NOC',
    companyName: '',
    role: '',
    duration: '6 Months (Jan - Jun 2027)',
    stipend: '₹80,000 / month',
    location: 'Bengaluru / Pune',
    details: ''
  });

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [drivesRes, appsRes, reqsRes] = await Promise.all([
        fetch(`${API_URL}/placement/drives`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/placement/my-applications`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/placement/requests`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const [drivesJson, appsJson, reqsJson] = await Promise.all([
        drivesRes.json(),
        appsRes.json(),
        reqsRes.json()
      ]);

      if (drivesRes.ok) setData(drivesJson);
      if (appsRes.ok) setApplications(appsJson || []);
      if (reqsRes.ok) setRequests(reqsJson || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAllData();
  }, [token]);

  const handleApply = async (driveId) => {
    setApplyingId(driveId);
    setError('');
    setMessage('');

    try {
      const res = await fetch(`${API_URL}/placement/apply/${driveId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const resData = await res.json();
      if (res.ok) {
        setMessage('Application submitted successfully! Your verified academic profile has been sent to the recruiter.');
        fetchAllData();
      } else {
        setError(resData.error || 'Failed to submit application.');
      }
    } catch (err) {
      setError('Network connection error.');
    } finally {
      setApplyingId(null);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setSubmittingRequest(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch(`${API_URL}/placement/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newRequest)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Placement request for ${newRequest.companyName} submitted to TPO Desk successfully!`);
        setShowRequestModal(false);
        setNewRequest({
          type: 'INTERNSHIP_NOC',
          companyName: '',
          role: '',
          duration: '6 Months (Jan - Jun 2027)',
          stipend: '₹80,000 / month',
          location: 'Bengaluru / Pune',
          details: ''
        });
        fetchAllData();
      } else {
        setError(data.error || 'Failed to submit request.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const { studentStats, drives = [] } = data;

  const filteredDrives = drives.filter(d => {
    if (filterType === 'ELIGIBLE_ONLY') return d.isEligible;
    if (filterType === 'FULL_TIME') return d.type === 'FULL_TIME';
    if (filterType === 'INTERNSHIP') return d.type === 'INTERNSHIP';
    return true;
  });

  const getStageBadge = (status) => {
    switch (status) {
      case 'OFFERED':
      case 'SELECTED':
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'INTERVIEW_SCHEDULED':
      case 'SHORTLISTED':
      case 'OA_CLEARED':
        return 'bg-purple-50 text-purple-800 border-purple-300';
      case 'REJECTED':
        return 'bg-red-50 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-md border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-100 text-[#1c398e] rounded-md">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-50 text-[#1c398e] text-[10px] font-black uppercase rounded tracking-wider border border-blue-200">
                CAMPUS PLACEMENT CRM
              </span>
              <span className="text-xs text-slate-400 font-mono">
                TRAINING & PLACEMENT CELL (TPO)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Targeted Placement & Internship Drive Manager
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated eligibility matching engine, digital interview passes, and institutional NOC clearance desk.
            </p>
          </div>
        </div>

        {/* Student Credential Capsule */}
        <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md shrink-0">
          <div className="px-3 py-1 bg-white rounded-md border border-slate-200 text-center">
            <span className="text-[9px] font-bold uppercase text-slate-400 block">Verified CGPA</span>
            <span className="text-sm font-black text-[#1c398e] font-mono">{studentStats?.cgpa || '8.75'}</span>
          </div>
          <div className="px-3 py-1 bg-white rounded-md border border-slate-200 text-center">
            <span className="text-[9px] font-bold uppercase text-slate-400 block">Active Backlogs</span>
            <span className="text-sm font-black text-emerald-600 font-mono">{studentStats?.activeBacklogs || 0}</span>
          </div>
          <div className="px-3 py-1 bg-white rounded-md border border-slate-200 text-center">
            <span className="text-[9px] font-bold uppercase text-slate-400 block">Branch</span>
            <span className="text-sm font-black text-slate-800 font-mono">{studentStats?.branch || 'CSE'}</span>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center justify-between gap-2 font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-md flex items-center justify-between gap-2 font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-Tabs Selector */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('drives')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'drives'
                ? 'bg-[#0c2340] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Campus Drives ({drives.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('applications')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'applications'
                ? 'bg-[#0c2340] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            My Applications ({applications.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('requests')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'requests'
                ? 'bg-[#0c2340] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Placement Requests & NOC Desk ({requests.length})</span>
          </button>
        </div>

        {activeSubTab === 'requests' && (
          <button
            type="button"
            onClick={() => setShowRequestModal(true)}
            className="px-3.5 py-1.5 bg-[#0c2340] hover:bg-[#1a365d] text-white rounded-md text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit Placement Request</span>
          </button>
        )}
      </div>

      {/* VIEW 1: Campus Recruitment Drives */}
      {activeSubTab === 'drives' && (
        <div className="space-y-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'ALL', label: 'All Opportunities' },
              { id: 'ELIGIBLE_ONLY', label: 'Eligible Only' },
              { id: 'FULL_TIME', label: 'Full-Time (FTE)' },
              { id: 'INTERNSHIP', label: 'Summer Internships' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-blue-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Drives Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDrives.map((drive) => {
              const isEligible = drive.isEligible;
              const hasApplied = drive.hasApplied;

              return (
                <div 
                  key={drive.id}
                  className={`rounded-md border p-5 flex flex-col justify-between transition-all bg-white ${
                    isEligible ? 'border-slate-200 hover:border-blue-400 hover:shadow-md' : 'border-slate-200 opacity-85'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-200 bg-blue-50 text-blue-900">
                        {drive.type}
                      </span>
                      {hasApplied ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300">
                          Applied
                        </span>
                      ) : isEligible ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300">
                          Eligible
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300">
                          Criteria Unmet
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900 leading-snug">{drive.companyName}</h3>
                      <p className="text-xs font-semibold text-slate-600">{drive.role}</p>
                    </div>

                    <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-md border border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Package:</span>
                        <span className="font-mono font-bold text-emerald-700">{drive.ctc}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Min CGPA:</span>
                        <span className="font-mono font-bold text-slate-800">{drive.minCgpa}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Allowed Branches:</span>
                        <span className="font-semibold text-slate-700">{drive.allowedBranches}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Deadline:</span>
                        <span className="font-mono text-slate-700">{drive.deadline}</span>
                      </div>
                    </div>

                    {!isEligible && drive.ineligibilityReasons?.length > 0 && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 space-y-0.5">
                        <span className="font-bold block uppercase text-[10px]">Eligibility Notice:</span>
                        {drive.ineligibilityReasons.map((r, i) => (
                          <p key={i}>• {r}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4">
                    {hasApplied ? (
                      <div className="text-center p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                        Application Active ({drive.applicationStatus || 'APPLIED'})
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApply(drive.id)}
                        disabled={!isEligible || applyingId === drive.id}
                        className={`w-full py-2.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isEligible 
                            ? 'bg-[#0c2340] hover:bg-[#1a365d] text-white shadow-sm' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {applyingId === drive.id ? 'Submitting...' : 'Apply via Verified Profile'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: My Applications */}
      {activeSubTab === 'applications' && (
        <div className="rounded-md border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Recruitment Drive</th>
                  <th className="py-3 px-4">Applied Date</th>
                  <th className="py-3 px-4">Stage / Status</th>
                  <th className="py-3 px-4">Interview Schedule</th>
                  <th className="py-3 px-4">Remarks from TPO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      You haven't submitted any campus drive applications yet.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {app.drive?.companyName}
                        <span className="text-[11px] text-slate-500 font-normal block">{app.drive?.role} ({app.drive?.ctc})</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {new Date(app.appliedAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border inline-block ${getStageBadge(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {app.interviewSlot ? (
                          <div>
                            <span className="font-bold text-slate-900">{app.interviewSlot}</span>
                            {app.interviewLink && (
                              <a href={app.interviewLink} target="_blank" rel="noreferrer" className="text-blue-700 block hover:underline text-[10px]">
                                Join Meeting ↗
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">TBD</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {app.remarks || 'Application under review with corporate team.'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: Student Placement Requests & NOC Desk */}
      {activeSubTab === 'requests' && (
        <div className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Req ID</th>
                    <th className="py-3 px-4">Request Type</th>
                    <th className="py-3 px-4">Company & Position</th>
                    <th className="py-3 px-4">Duration & Terms</th>
                    <th className="py-3 px-4">Status & Official Stamp</th>
                    <th className="py-3 px-4">T&P Officer Remarks</th>
                    <th className="py-3 px-4 text-right">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No placement or NOC requests submitted yet. Click "+ Submit Placement Request" to request an institutional NOC or duty leave.
                      </td>
                    </tr>
                  ) : (
                    requests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                          {req.id}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-slate-200 bg-slate-100 text-slate-800">
                            {req.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{req.companyName}</div>
                          <div className="text-[11px] text-slate-500">{req.role}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-800 font-medium">{req.duration}</div>
                          <div className="font-mono text-emerald-700 text-[11px] font-bold">{req.stipend}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border inline-block ${getStageBadge(req.status)}`}>
                            {req.status}
                          </span>
                          {req.nocCertificateNumber && (
                            <p className="text-[10px] font-mono font-bold text-[#1c398e] mt-1">
                              {req.nocCertificateNumber}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-[11px]">
                          {req.officerRemarks || 'Pending review by TPO Desk.'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {req.nocCertificateNumber ? (
                            <button
                              type="button"
                              onClick={() => setSelectedNocModal(req)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[11px] font-bold uppercase transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View NOC</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Pending Approval</span>
                          )}
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

      {/* MODAL: Submit Student Placement Request */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 p-6 relative">
            <button
              type="button"
              onClick={() => setShowRequestModal(false)}
              className="absolute right-4 top-4 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-900 mb-1">
              Submit Placement / NOC Request
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Forwarded directly to the Training & Placement Officer for official endorsement.
            </p>

            <form onSubmit={handleSubmitRequest} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Request Type</label>
                <select
                  value={newRequest.type}
                  onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md font-bold text-slate-800 focus:outline-none"
                >
                  <option value="INTERNSHIP_NOC">No Objection Certificate (6-Month / Summer Internship)</option>
                  <option value="DUTY_LEAVE">Attendance Duty Leave Waiver (For Interview/OA)</option>
                  <option value="RESUME_VERIFICATION">Official Resume & CGPA Verification</option>
                  <option value="PPO_INTIMATION">Pre-Placement Offer (PPO) Intimation</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    required
                    value={newRequest.companyName}
                    onChange={(e) => setNewRequest({ ...newRequest, companyName: e.target.value })}
                    placeholder="e.g. Google India / NVIDIA"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Role / Position</label>
                  <input
                    type="text"
                    required
                    value={newRequest.role}
                    onChange={(e) => setNewRequest({ ...newRequest, role: e.target.value })}
                    placeholder="e.g. Software Engineering Intern"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Duration / Dates</label>
                  <input
                    type="text"
                    required
                    value={newRequest.duration}
                    onChange={(e) => setNewRequest({ ...newRequest, duration: e.target.value })}
                    placeholder="e.g. 6 Months (Jan - Jun 2027)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Stipend / Package</label>
                  <input
                    type="text"
                    value={newRequest.stipend}
                    onChange={(e) => setNewRequest({ ...newRequest, stipend: e.target.value })}
                    placeholder="e.g. ₹1,00,000 / month"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Location / Mode</label>
                <input
                  type="text"
                  value={newRequest.location}
                  onChange={(e) => setNewRequest({ ...newRequest, location: e.target.value })}
                  placeholder="e.g. Bengaluru / Hybrid"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Justification & Details</label>
                <textarea
                  rows={3}
                  required
                  value={newRequest.details}
                  onChange={(e) => setNewRequest({ ...newRequest, details: e.target.value })}
                  placeholder="Enter details about your selection, offer letter link, or test schedule..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md uppercase tracking-wider text-[11px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="flex-1 py-2 bg-[#0c2340] hover:bg-[#1a365d] text-white font-bold rounded-md uppercase tracking-wider text-[11px] shadow cursor-pointer disabled:opacity-60"
                >
                  {submittingRequest ? 'Submitting...' : 'Send to TPO Desk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: View Digital NOC Certificate */}
      {selectedNocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-300 p-8 relative print:p-0">
            <button
              type="button"
              onClick={() => setSelectedNocModal(null)}
              className="absolute right-4 top-4 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
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
                    Training & Placement Cell • Email: support@iiitp.ac.in
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-start text-xs mb-6">
              <div>
                <p className="text-slate-500 font-mono">Ref No: <span className="font-bold text-slate-900">{selectedNocModal.nocCertificateNumber}</span></p>
                <p className="text-slate-500 font-mono">Dispatch Date: <span className="font-bold text-slate-900">{new Date(selectedNocModal.reviewedAt || Date.now()).toLocaleDateString('en-IN')}</span></p>
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
                This is to officially certify that <span className="font-bold text-slate-900">{selectedNocModal.studentName}</span>, Roll / MIS Number: <span className="font-mono font-bold text-slate-900">{selectedNocModal.studentMis}</span>, is a bonafide student of the Indian Institute of Information Technology Pune, currently pursuing his/her undergraduate degree in the Department of <span className="font-bold text-slate-900">{selectedNocModal.department}</span>.
              </p>
              <p>
                The Institute has <span className="font-bold text-slate-900">NO OBJECTION</span> to the student undertaking practical industry training / internship with <span className="font-bold text-slate-900">{selectedNocModal.companyName}</span> for the position of <span className="font-bold text-slate-900">{selectedNocModal.role}</span> for a duration of <span className="font-bold text-slate-900">{selectedNocModal.duration}</span>.
              </p>
              <p>
                During this period, the student is permitted to fulfill project evaluation criteria through institutional mentoring guidelines as sanctioned by the Academic Council.
              </p>
            </div>

            <div className="pt-8 mt-6 border-t border-slate-200 flex justify-between items-end text-xs">
              <div>
                <div className="w-24 h-12 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400 font-mono">
                  [INSTITUTIONAL SEAL]
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">IIIT Pune T&P Cell Stamp</p>
              </div>
              <div className="text-right">
                <div className="font-black text-slate-900">{selectedNocModal.reviewedBy || 'Dr. Bhupendra Singh'}</div>
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
                onClick={() => setSelectedNocModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md text-xs uppercase cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
