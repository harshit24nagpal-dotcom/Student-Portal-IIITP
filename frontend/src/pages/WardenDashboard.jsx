import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building, CheckCircle2, XCircle, Clock, AlertTriangle, 
  FileText, Download, User, RefreshCw, CheckSquare, XSquare
} from 'lucide-react';

export default function WardenDashboard() {
  const { user, token } = useAuth();
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReg, setSelectedReg] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/registration/warden/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPendingList(Array.isArray(data) ? data : []);
        if (data.length > 0 && !selectedReg) {
          setSelectedReg(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPending();
  }, [token]);

  const handleWardenAction = async (action) => {
    if (!selectedReg) return;
    setActionLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/registration/warden/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          registrationId: selectedReg.id,
          action,
          remarks
        })
      });

      const resData = await res.json();
      if (res.ok) {
        setMessage(`Registration marked ${action}! Transferred to Faculty Advisor.`);
        setRemarks('');
        fetchPending();
      } else {
        setError(resData.error || 'Failed to record verification.');
      }
    } catch (err) {
      setError('Network error while processing verification.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-800">
      {/* Top Banner */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold uppercase rounded tracking-wider border border-amber-200">
              HOSTEL WARDEN VERIFICATION PORTAL
            </span>
            <span className="text-xxs text-slate-500 font-mono">
              ROLE: HOSTEL_WARDEN
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Welcome, Warden {user?.name}!</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Semester Registration Verification • Hostel Occupancy & Dues Verification Tier
          </p>
        </div>

        <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Pending Verifications</span>
          <span className="text-lg font-bold text-[#1c398e] font-mono">{pendingList.length}</span>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2 font-semibold">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          {error}
        </div>
      )}

      {/* Main Verification Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pending Student List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Pending Student Verification Queue ({pendingList.length})
          </h3>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs font-semibold">
              <RefreshCw className="w-6 h-6 text-[#5367c8] animate-spin mx-auto mb-2" />
              Loading Queue...
            </div>
          ) : pendingList.length > 0 ? (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {pendingList.map((reg) => {
                const isSel = selectedReg?.id === reg.id;
                return (
                  <div
                    key={reg.id}
                    onClick={() => setSelectedReg(reg)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSel 
                        ? 'bg-blue-50/80 border-[#1c398e] ring-1 ring-[#1c398e]' 
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{reg.student?.name}</h4>
                        <p className="text-[10px] text-[#1c398e] font-mono font-semibold mt-0.5">
                          MIS: {reg.student?.userId}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold uppercase text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        {reg.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
                      <span>{reg.student?.hostelBlock || 'Hostel Block 1'}</span>
                      <span className="font-mono">{new Date(reg.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
              No pending registrations awaiting Hostel Warden verification.
            </div>
          )}
        </div>

        {/* Right: Detailed Verification Console */}
        {selectedReg ? (
          <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200 bg-white space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">VERIFICATION FILE</span>
                <h3 className="text-base font-bold text-slate-900">{selectedReg.student?.name} ({selectedReg.student?.userId})</h3>
                <p className="text-xs text-slate-500">{selectedReg.student?.programme} • {selectedReg.student?.section} • Hostel: <span className="text-[#1c398e] font-bold">{selectedReg.student?.hostelBlock || 'Vindhyachal BH-1'}</span></p>
              </div>

              <span className="text-xxs font-mono text-slate-500">
                Submitted: {new Date(selectedReg.submittedAt).toLocaleString()}
              </span>
            </div>

            {/* Submitted Uploaded Documents */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Submitted Proof Documents</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedReg.documents?.map((doc) => (
                  <div key={doc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1c398e] uppercase text-[10px]">{doc.documentType}</span>
                      <span className="text-[9px] text-slate-500 font-mono">{(doc.fileSize / 1024).toFixed(0)} KB</span>
                    </div>
                    <p className="text-slate-800 font-semibold truncate">{doc.documentName}</p>
                    
                    <a
                      href={`http://localhost:5000${doc.filePath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-semibold uppercase flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      View Document
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Warden Remarks & Decision Controls */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Warden Verification Remarks / Hostel No-Dues Notes
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter notes regarding hostel fee payment, room clearance, or resubmission instructions..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#5367c8] h-20"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleWardenAction('APPROVED')}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4" />
                  Approve Hostel Clearance
                </button>

                <button
                  onClick={() => handleWardenAction('RESUBMISSION_REQUIRED')}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  Request Resubmission
                </button>

                <button
                  onClick={() => handleWardenAction('REJECTED')}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <XSquare className="w-4 h-4" />
                  Reject Registration
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 glass-card p-12 rounded-2xl border border-slate-200 bg-white text-center flex flex-col justify-center items-center shadow-sm">
            <Building className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Select a student from the queue</h3>
            <p className="text-slate-500 text-xs mt-2 max-w-sm">
              Choose a pending student registration to examine ERP proof and fee receipts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
