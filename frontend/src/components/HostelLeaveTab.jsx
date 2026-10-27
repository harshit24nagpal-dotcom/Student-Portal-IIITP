import React, { useState, useEffect } from 'react';
import { 
  Calendar, CheckCircle2, Clock, AlertCircle, FileText, 
  Send, Phone, ShieldCheck, UserCheck, Utensils, Sparkles, RefreshCw
} from 'lucide-react';

export default function HostelLeaveTab({ token, user }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form State
  const [leaveType, setLeaveType] = useState('HOME_LEAVE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startMeal, setStartMeal] = useState('DINNER');
  const [endMeal, setEndMeal] = useState('LUNCH');
  const [destination, setDestination] = useState('');
  const [reason, setReason] = useState('');
  const [parentContact, setParentContact] = useState('+91 98220 54321');
  const [parentConsent, setParentConsent] = useState(true);

  const fetchMyLeaves = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/hostel/leaves/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setLeaves(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchMyLeaves();
  }, [token]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !destination || !reason) {
      setError('Please fill in all required leave application fields.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot precede start date.');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/hostel/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          leaveType,
          startDate,
          endDate,
          startMeal,
          endMeal,
          destination,
          reason,
          parentContact,
          parentConsent
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Digital Leave Application submitted! Forwarded to Warden for approval & Mess Hall notified.');
        setDestination('');
        setReason('');
        setStartDate('');
        setEndDate('');
        fetchMyLeaves();
      } else {
        setError(data.error || 'Failed to submit application');
      }
    } catch (err) {
      setError('Network connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'REJECTED':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Informative Banner */}
      <div className="p-5 rounded-md border border-blue-200 bg-blue-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-[#1c398e] rounded-md">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0c2340]">
              Automated Hostel & Mess Synchronization System
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Approved leaves automatically update the central Mess Headcount in real-time, preventing food wastage and dynamically calculating meal preparation.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-white border border-blue-200 rounded-md text-[11px] font-bold text-[#1c398e] shadow-2xs">
            Zero Food Waste Goal
          </span>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-md flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form: Apply for Digital Leave */}
        <div className="lg:col-span-1 p-5 rounded-md border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-[#1c398e]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Apply for Hostel Outpass / Leave
            </h4>
          </div>

          <form onSubmit={handleApply} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Leave Category *
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1c398e]"
              >
                <option value="HOME_LEAVE">Home Leave / Family Visit</option>
                <option value="ACADEMIC_LEAVE">Academic / Hackathon / Conference</option>
                <option value="MEDICAL_LEAVE">Medical / Hospital Leave</option>
                <option value="EMERGENCY_LEAVE">Emergency Outpass</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Meal absent details */}
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-md space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                Mess Meal Absence Range
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Absent From:</label>
                  <select
                    value={startMeal}
                    onChange={(e) => setStartMeal(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-amber-200 rounded-md"
                  >
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="SNACKS">Snacks</option>
                    <option value="DINNER">Dinner</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Absent Till:</label>
                  <select
                    value={endMeal}
                    onChange={(e) => setEndMeal(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-amber-200 rounded-md"
                  >
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="SNACKS">Snacks</option>
                    <option value="DINNER">Dinner</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Travel Destination *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mumbai, Home Town, New Delhi"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1c398e]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Reason *
              </label>
              <textarea
                rows="2"
                required
                placeholder="Brief reason for leaving campus..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1c398e]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Parent / Guardian Contact *
              </label>
              <input
                type="tel"
                required
                placeholder="+91 98000 00000"
                value={parentContact}
                onChange={(e) => setParentContact(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1c398e]"
              />
            </div>

            <label className="flex items-start gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={parentConsent}
                onChange={(e) => setParentConsent(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-[#1c398e] focus:ring-[#1c398e]"
              />
              <span className="text-[11px] text-slate-600 leading-tight">
                I declare that my parents/guardians are informed and have consented to this leave.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-[#0c2340] hover:bg-[#1c398e] text-white text-xs font-bold uppercase rounded-md tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Submit Leave Application</span>
            </button>
          </form>
        </div>

        {/* List: Leave Applications & Approvals */}
        <div className="lg:col-span-2 p-5 rounded-md border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1c398e]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Your Leave & Outpass Records
              </h4>
            </div>
            <button
              onClick={fetchMyLeaves}
              className="text-xs text-[#5367c8] hover:text-[#1c398e] flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#5367c8]" />
              Loading leave records...
            </div>
          ) : leaves.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No leave records found. Submit your first leave request on the left.
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {leaves.map((lv) => (
                <div
                  key={lv.id}
                  className="p-4 rounded-md border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded border ${getStatusBadge(lv.status)}`}>
                          {lv.status}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {lv.leaveType.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: #{lv.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-semibold mt-1">
                        Destination: {lv.destination}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Reason: {lv.reason}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-[#0c2340] block">
                        {lv.startDate} → {lv.endDate}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Applied: {new Date(lv.appliedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                    <div className="flex items-center gap-3">
                      <span>Meals Absent: <strong>{lv.startMeal}</strong> to <strong>{lv.endMeal}</strong></span>
                      <span>Parent Contact: {lv.parentContact}</span>
                    </div>

                    {lv.wardenRemarks && (
                      <div className="w-full mt-1 p-2 rounded-md bg-blue-50/60 border border-blue-100 text-blue-900 text-[11px]">
                        <strong>Warden Remarks:</strong> {lv.wardenRemarks}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
