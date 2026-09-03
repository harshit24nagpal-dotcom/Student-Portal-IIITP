import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, CheckCircle2, XCircle, Clock, AlertTriangle, 
  DollarSign, FileText, User, RefreshCw, CheckSquare, XSquare, Filter
} from 'lucide-react';

export default function ClearanceOfficerDashboard() {
  const { user, token } = useAuth();
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [clearances, setClearances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [status, setStatus] = useState('APPROVED');
  const [amountDue, setAmountDue] = useState('0');
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchClearances = async () => {
    setLoading(true);
    try {
      const url = selectedDeptId 
        ? `http://localhost:5000/api/nodues/officer/pending?departmentId=${selectedDeptId}`
        : 'http://localhost:5000/api/nodues/officer/pending';

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setClearances(Array.isArray(data) ? data : []);
        if (data.length > 0 && !selectedItem) {
          setSelectedItem(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchClearances();
  }, [token, selectedDeptId]);

  const handleOfficerAction = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    setActionLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/nodues/officer/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          clearanceId: selectedItem.id,
          status,
          amountDue: parseFloat(amountDue || 0),
          remarks
        })
      });

      const resData = await res.json();
      if (res.ok) {
        setMessage(`Clearance marked ${status}! ${resData.isFullyApproved ? '🎉 Student achieved 100% full 15-department clearance and Certificate was generated!' : ''}`);
        setRemarks('');
        fetchClearances();
      } else {
        setError(resData.error || 'Failed to record clearance action.');
      }
    } catch (err) {
      setError('Network error while saving clearance action.');
    } finally {
      setActionLoading(false);
    }
  };

  const DEPARTMENTS = [
    { id: 1, name: 'Thesis Supervisor / Guide' },
    { id: 2, name: 'Library / Information Service' },
    { id: 3, name: 'Computers Labs' },
    { id: 4, name: 'Electronics Labs' },
    { id: 5, name: 'Head of Department' },
    { id: 6, name: 'Course Coordinator' },
    { id: 7, name: 'Training and Placement Cell' },
    { id: 8, name: 'Sports In-charge' },
    { id: 9, name: 'Store In-charge' },
    { id: 10, name: 'Server Room' },
    { id: 11, name: 'Hostel Warden / Hostel In-charge' },
    { id: 12, name: 'Security In-charge' },
    { id: 13, name: 'Examination Cell' },
    { id: 14, name: 'Accounts Section' },
    { id: 15, name: 'Academic Section' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-100">
      {/* Top Banner */}
      <div className="glass-card p-6 rounded-2xl border border-iiitp-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-iiitp-gold/20 text-iiitp-gold text-[10px] font-black uppercase rounded tracking-wider border border-iiitp-gold/30">
              CLEARANCE OFFICER CONSOLE
            </span>
            <span className="text-xxs text-slate-400 font-mono">
              ROLE: CLEARANCE_OFFICER
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Welcome, Officer {user?.name}!</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Graduating Batch No-Dues Clearance Management across 15 IIIT Pune Departments
          </p>
        </div>

        {/* Department Filter Select */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase font-bold text-slate-400">Department:</label>
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-iiitp-gold"
          >
            <option value="">All 15 IIIT Pune Departments</option>
            {DEPARTMENTS.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
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

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Queue */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
            Graduating Candidate Applications ({clearances.length})
          </h3>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs font-bold">
              <RefreshCw className="w-6 h-6 text-iiitp-gold animate-spin mx-auto mb-2" />
              Loading Applications...
            </div>
          ) : clearances.length > 0 ? (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {clearances.map((item) => {
                const isSel = selectedItem?.id === item.id;
                const student = item.application?.student;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSel 
                        ? 'bg-slate-900 border-iiitp-gold/50 ring-1 ring-iiitp-gold/20' 
                        : 'bg-slate-900/40 border-slate-850 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-black text-white">{student?.name}</h4>
                        <p className="text-[10px] text-iiitp-gold font-mono font-bold mt-0.5">
                          MIS: {student?.userId}
                        </p>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                        item.status === 'APPROVED' ? 'bg-iiitp-success/20 text-green-400 border-green-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-900 pt-2 font-mono">
                      <span>{item.department?.name}</span>
                      <span>Batch {student?.batch || '2020-2024'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
              No pending applications found for the selected department.
            </div>
          )}
        </div>

        {/* Action Panel */}
        {selectedItem ? (
          <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-iiitp-border space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase">GRADUATION CLEARANCE DOSSIER</span>
                <h3 className="text-base font-black text-white">{selectedItem.application?.student?.name}</h3>
                <p className="text-xs text-slate-400 font-mono">MIS: {selectedItem.application?.student?.userId} • {selectedItem.application?.student?.programme}</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">DEPARTMENT</span>
                <span className="text-xs font-black text-iiitp-gold">{selectedItem.department?.name}</span>
              </div>
            </div>

            {/* Officer Action Form */}
            <form onSubmit={handleOfficerAction} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  1. Set Clearance Decision
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-iiitp-gold"
                >
                  <option value="APPROVED">APPROVED (No Dues Outstanding)</option>
                  <option value="REJECTED">REJECTED (Dues Pending / Missing Materials)</option>
                  <option value="CLARIFICATION_REQUIRED">CLARIFICATION REQUIRED (Require Student Visit)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  2. Outstanding Amount to Recover (in INR ₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={amountDue}
                  onChange={(e) => setAmountDue(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-iiitp-gold"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Enter 0 if all dues are clear. If book loss or lab breakage fees are due, enter the exact amount.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  3. Official Officer Remarks / Instructions
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks regarding equipment return, library books clearance, or fee receipts..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-iiitp-gold h-24"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-gradient-to-r from-iiitp-gold to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-glow-gold flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <CheckSquare className="w-4 h-4" />
                {actionLoading ? 'Saving Decision...' : 'Save & Publish Department Clearance Decision'}
              </button>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-2 glass-card p-12 rounded-2xl border border-slate-800 text-center flex flex-col justify-center items-center">
            <GraduationCap className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-lg font-bold text-white">Select a graduating candidate</h3>
            <p className="text-slate-400 text-xs mt-2 max-w-sm">
              Choose a candidate from the left list to review and grant department clearance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
