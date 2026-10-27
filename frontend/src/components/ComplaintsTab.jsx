import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, CheckCircle2, Clock, AlertTriangle, Send, 
  EyeOff, Shield, MessageSquare, Filter, RefreshCw
} from 'lucide-react';

export default function ComplaintsTab({ token, user }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form State
  const [category, setCategory] = useState('MESS_FOOD_QUALITY');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const fetchMyComplaints = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/complaints/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setComplaints(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchMyComplaints();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Please provide subject and details of your grievance.');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category,
          subject,
          description,
          isAnonymous
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Grievance / Complaint successfully submitted to the Student Affairs & Grievance Redressal Committee.');
        setSubject('');
        setDescription('');
        setIsAnonymous(false);
        fetchMyComplaints();
      } else {
        setError(data.error || 'Failed to submit complaint');
      }
    } catch (err) {
      setError('Network connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'UNDER_REVIEW':
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-md border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-100 text-red-700 rounded-md">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              Campus Grievance & Student Complaint Portal
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit formal complaints to IIIT Pune Administration, Hostel Committee, or Mess Authority with optional identity concealment.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <EyeOff className="w-3.5 h-3.5 text-slate-500" />
            <span>Anonymous Filing Supported</span>
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
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form: File Complaint */}
        <div className="lg:col-span-1 p-5 rounded-md border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <MessageSquare className="w-4 h-4 text-[#1c398e]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Lodge New Grievance
            </h4>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Grievance Domain *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
              >
                <option value="MESS_FOOD_QUALITY">Mess Food Quality & Hygiene</option>
                <option value="HOSTEL_MAINTENANCE">Hostel Living Conditions & Facilities</option>
                <option value="ACADEMIC">Academic / Course Schedule / Labs</option>
                <option value="CAMPUS_SECURITY">Campus Security & Lighting</option>
                <option value="ANTI_RAGGING">Anti-Ragging / Harassment Concern</option>
                <option value="GENERAL">General Administrative Grievance</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Subject / Title *
              </label>
              <input
                type="text"
                required
                placeholder="Brief summary of the issue..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Detailed Statement *
              </label>
              <textarea
                rows="4"
                required
                placeholder="Provide specific dates, timings, locations, and details so authorities can investigate..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
              />
            </div>

            {/* Anonymous Toggle */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Submit Anonymously
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Your name and MIS will be concealed from reviewing committee.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1c398e] focus:ring-[#1c398e]"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-[#0c2340] hover:bg-[#1c398e] text-white text-xs font-bold uppercase rounded-md tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Submit Formal Grievance</span>
            </button>
          </form>
        </div>

        {/* Complaints List */}
        <div className="lg:col-span-2 p-5 rounded-md border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1c398e]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Your Filed Complaints & Redressal Status ({complaints.length})
              </h4>
            </div>
            <button
              onClick={fetchMyComplaints}
              className="text-xs text-[#5367c8] hover:text-[#1c398e] flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#5367c8]" />
              Loading complaints...
            </div>
          ) : complaints.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              You haven't filed any complaints. Use the form to report concerns.
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {complaints.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-md border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded border ${getStatusBadge(c.status)}`}>
                          {c.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {c.category.replace(/_/g, ' ')}
                        </span>
                        {c.isAnonymous && (
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[9px] font-bold rounded">
                            Anonymous
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        {c.subject}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {c.description}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Case #{c.id}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {c.adminRemarks && (
                    <div className="p-3 rounded-md bg-blue-50/70 border border-blue-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-blue-900 font-bold">
                        <span>Official Committee Response:</span>
                        {c.resolvedAt && (
                          <span className="text-[10px] text-blue-700 font-normal">
                            Resolved on {new Date(c.resolvedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700">
                        {c.adminRemarks}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
