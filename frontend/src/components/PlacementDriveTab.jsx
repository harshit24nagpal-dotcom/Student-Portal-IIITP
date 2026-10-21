import React, { useState, useEffect } from 'react';
import { 
  Briefcase, CheckCircle2, XCircle, AlertTriangle, Clock, 
  MapPin, DollarSign, Award, ExternalLink, Filter, 
  ChevronRight, Building, UserCheck, ShieldCheck, Sparkles, RefreshCw, Send, Video
} from 'lucide-react';
import { API_URL } from '../config/api';

export default function PlacementDriveTab({ token, user }) {
  const [data, setData] = useState({ studentStats: {}, drives: [] });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'FULL_TIME' | 'INTERNSHIP' | 'ELIGIBLE_ONLY'
  const [applyingId, setApplyingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/placement/drives`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resJson = await res.json();
      if (res.ok) {
        setData(resJson);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchDrives();
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
        fetchDrives();
      } else {
        setError(resData.error || 'Failed to submit application.');
      }
    } catch (err) {
      setError('Network connection error.');
    } finally {
      setApplyingId(null);
    }
  };

  const { studentStats, drives } = data;

  const filteredDrives = drives.filter(d => {
    if (filterType === 'ELIGIBLE_ONLY') return d.isEligible;
    if (filterType === 'FULL_TIME') return d.type === 'FULL_TIME';
    if (filterType === 'INTERNSHIP') return d.type === 'INTERNSHIP';
    return true;
  });

  const getStageColor = (status) => {
    switch (status) {
      case 'OFFERED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'INTERVIEW_SCHEDULED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'OA_CLEARED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-100 text-[#1c398e] rounded-2xl">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-50 text-[#1c398e] text-[10px] font-black uppercase rounded tracking-wider border border-blue-200">
                CAMPUS PLACEMENT CRM
              </span>
              <span className="text-xxs text-slate-400 font-mono">
                TRAINING & PLACEMENT CELL (TPO)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Targeted Placement & Internship Drive Manager
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated eligibility matching engine prevents accidental backlog invitations & messy WhatsApp sheets.
            </p>
          </div>
        </div>

        {/* Student Credential Capsule */}
        <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-2xl shrink-0">
          <div className="px-3 py-1 bg-white rounded-xl border border-slate-200 text-center">
            <span className="text-[9px] font-bold uppercase text-slate-400 block">Verified CGPA</span>
            <span className="text-sm font-black text-[#1c398e] font-mono">{studentStats?.cgpa || '8.65'}</span>
          </div>
          <div className="px-3 py-1 bg-white rounded-xl border border-slate-200 text-center">
            <span className="text-[9px] font-bold uppercase text-slate-400 block">Active Backlogs</span>
            <span className="text-sm font-black text-emerald-600 font-mono">{studentStats?.activeBacklogs || 0}</span>
          </div>
          <div className="px-3 py-1 bg-white rounded-xl border border-slate-200 text-center">
            <span className="text-[9px] font-bold uppercase text-slate-400 block">Branch</span>
            <span className="text-sm font-black text-slate-800 font-mono">{studentStats?.branch || 'CSE'}</span>
          </div>
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

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Opportunities' },
            { id: 'ELIGIBLE_ONLY', label: '🟢 Eligible Only' },
            { id: 'FULL_TIME', label: 'Full-Time (FTE)' },
            { id: 'INTERNSHIP', label: 'Summer Internships' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filterType === tab.id
                  ? 'bg-[#0c2340] text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={fetchDrives}
          className="text-xs text-[#5367c8] hover:text-[#1c398e] flex items-center gap-1 font-semibold cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Drives</span>
        </button>
      </div>

      {/* Drives Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5367c8]" />
          Filtering student profile and computing drive eligibility...
        </div>
      ) : filteredDrives.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-xs">
          No placement opportunities match the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDrives.map((drive) => {
            const isEligible = drive.isEligible;
            const hasApplied = drive.hasApplied;

            return (
              <div
                key={drive.id}
                className={`p-5 rounded-2xl border bg-white shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4 ${
                  hasApplied 
                    ? 'border-blue-300 ring-1 ring-blue-100 bg-blue-50/20' 
                    : isEligible 
                    ? 'border-emerald-200' 
                    : 'border-slate-200 opacity-90'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Company & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900">
                          {drive.companyName}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded">
                          {drive.type.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-600 mt-0.5">
                        {drive.role}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black font-mono text-[#0c2340] block">
                        {drive.ctc}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 flex items-center justify-end gap-1">
                        <MapPin className="w-3 h-3" />
                        {drive.location}
                      </span>
                    </div>
                  </div>

                  {/* Eligibility Status Pill */}
                  <div className="pt-2 border-t border-slate-100">
                    {isEligible ? (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                        <div className="flex items-center gap-2 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Profile Matches All Criteria</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-700">
                          Min CGPA: {drive.minCgpa} • 0 Backlogs
                        </span>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>Not Eligible For This Drive:</span>
                        </div>
                        <ul className="text-[11px] list-disc pl-5 text-red-800 space-y-0.5">
                          {drive.ineligibilityReasons.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {drive.description}
                  </p>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <p><strong>Selection Rounds:</strong> {drive.selectionRounds}</p>
                    <p><strong>Deadline:</strong> {drive.deadline}</p>
                  </div>

                  {/* Active Application / Interview Schedule */}
                  {hasApplied && (
                    <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          Application Pipeline Status
                        </span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full border ${getStageColor(drive.applicationStatus)}`}>
                          {drive.applicationStatus}
                        </span>
                      </div>

                      {drive.interviewSlot && (
                        <div className="pt-1.5 border-t border-blue-200/60 space-y-1">
                          <p className="text-[11px] text-blue-950 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-700" />
                            Next Interview Slot: <strong>{drive.interviewSlot}</strong>
                          </p>
                          {drive.interviewLink && (
                            <a
                              href={drive.interviewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-white bg-blue-700 hover:bg-blue-800 px-3 py-1.5 rounded-lg font-bold transition-all shadow-2xs mt-1"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Join Live Interview Meeting</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Drive #{drive.id}
                  </span>

                  {hasApplied ? (
                    <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      Applied to Drive
                    </span>
                  ) : isEligible ? (
                    <button
                      onClick={() => handleApply(drive.id)}
                      disabled={applyingId === drive.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded-xl tracking-wider shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {applyingId === drive.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Apply in 1-Click</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-3.5 py-1.5 bg-slate-100 text-slate-400 text-xs font-bold uppercase rounded-xl cursor-not-allowed"
                    >
                      Ineligible
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
