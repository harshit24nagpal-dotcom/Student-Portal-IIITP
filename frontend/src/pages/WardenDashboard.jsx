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
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-100">
      {/* Top Banner */}
      <div className="glass-card p-6 rounded-2xl border border-iiitp-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-iiitp-gold/20 text-iiitp-gold text-[10px] font-black uppercase rounded tracking-wider border border-iiitp-gold/30">
              HOSTEL WARDEN VERIFICATION PORTAL
            </span>
            <span className="text-xxs text-slate-400 font-mono">
              ROLE: HOSTEL_WARDEN
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Welcome, Warden {user?.name}!</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Semester Registration Verification • Hostel Occupancy & Dues Verification Tier
          </p>
        </div>

        <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-right">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Pending Verifications</span>
          <span className="text-lg font-black text-iiitp-gold font-mono">{pendingList.length}</span>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 font-bold animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/40 text-red-300 text-xs rounded-xl flex items-center gap-2 font-bold">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          {error}
        </div>
      )}

      {/* Main Verification Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pending Student List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
            Pending Student Verification Queue ({pendingList.length})
          </h3>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs font-bold">
              <RefreshCw className="w-6 h-6 text-iiitp-gold animate-spin mx-auto mb-2" />
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
                        ? 'bg-slate-900 border-iiitp-gold/50 ring-1 ring-iiitp-gold/20' 
                        : 'bg-slate-900/40 border-slate-850 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-black text-white">{reg.student?.name}</h4>
                        <p className="text-[10px] text-iiitp-gold font-mono font-bold mt-0.5">
                          MIS: {reg.student?.userId}
                        </p>
                      </div>
                      <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 rounded">
                        {reg.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-900 pt-2">
                      <span>{reg.student?.hostelBlock || 'Hostel Block 1'}</span>
                      <span className="font-mono">{new Date(reg.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
              No pending registrations awaiting Hostel Warden verification.
            </div>
          )}
        </div>

        {/* Right: Detailed Verification Console */}
        {selectedReg ? (
          <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-iiitp-border space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase">VERIFICATION FILE</span>
                <h3 className="text-base font-black text-white">{selectedReg.student?.name} ({selectedReg.student?.userId})</h3>
                <p className="text-xs text-slate-400">{selectedReg.student?.programme} • {selectedReg.student?.section} • Hostel: <span className="text-iiitp-gold font-bold">{selectedReg.student?.hostelBlock || 'Vindhyachal BH-1'}</span></p>
              </div>

              <span className="text-xxs font-mono text-slate-500">
                Submitted: {new Date(selectedReg.submittedAt).toLocaleString()}
              </span>
            </div>

            {/* Submitted Uploaded Documents */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">Submitted Proof Documents</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedReg.documents?.map((doc) => (
                  <div key={doc.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-iiitp-gold uppercase text-[10px]">{doc.documentType}</span>
                      <span className="text-[9px] text-slate-500 font-mono">{(doc.fileSize / 1024).toFixed(0)} KB</span>
                    </div>
                    <p className="text-slate-200 font-extrabold truncate">{doc.documentName}</p>
                    
                    <a
                      href={`http://localhost:5000${doc.filePath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      View Document
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Warden Remarks & Decision Controls */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Warden Verification Remarks / Hostel No-Dues Notes
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter notes regarding hostel fee payment, room clearance, or resubmission instructions..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-iiitp-gold h-20"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleWardenAction('APPROVED')}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4" />
                  Approve Hostel Clearance
                </button>

                <button
                  onClick={() => handleWardenAction('RESUBMISSION_REQUIRED')}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-amber-950/80 hover:bg-amber-900 text-amber-400 border border-amber-500/40 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  Request Resubmission
                </button>

                <button
                  onClick={() => handleWardenAction('REJECTED')}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-red-950/80 hover:bg-red-900 text-red-400 border border-red-500/40 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <XSquare className="w-4 h-4" />
                  Reject Registration
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 glass-card p-12 rounded-2xl border border-slate-800 text-center flex flex-col justify-center items-center">
            <Building className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-lg font-bold text-white">Select a student from the queue</h3>
            <p className="text-slate-400 text-xs mt-2 max-w-sm">
              Choose a pending student registration to examine ERP proof and fee receipts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
