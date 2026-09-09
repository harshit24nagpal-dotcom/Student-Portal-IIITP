import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
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
        ? `${API_URL}/nodues/officer/pending?departmentId=${selectedDeptId}`
        : `${API_URL}/nodues/officer/pending`;

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
      const res = await fetch(`${API_URL}/nodues/officer/action`, {
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
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-800">
      {/* Top Banner */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase rounded tracking-wider border border-emerald-200">
              CLEARANCE OFFICER CONSOLE
            </span>
            <span className="text-xxs text-slate-500 font-mono">
              ROLE: CLEARANCE_OFFICER
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Welcome, Officer {user?.name}!</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Graduating Batch No-Dues Clearance Management across 15 IIIT Pune Departments
          </p>
        </div>

        {/* Department Filter Select */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase font-bold text-slate-500">Department:</label>
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#5367c8]"
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

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Queue */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Graduating Candidate Applications ({clearances.length})
          </h3>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs font-semibold">
              <RefreshCw className="w-6 h-6 text-[#5367c8] animate-spin mx-auto mb-2" />
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
                        ? 'bg-blue-50/80 border-[#1c398e] ring-1 ring-[#1c398e]' 
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{student?.name}</h4>
                        <p className="text-[10px] text-[#1c398e] font-mono font-semibold mt-0.5">
                          MIS: {student?.userId}
                        </p>
                      </div>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                        item.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2 font-mono">
                      <span>{item.department?.name}</span>
                      <span>Batch {student?.batch || '2020-2024'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
              No pending applications found for the selected department.
            </div>
          )}
        </div>

        {/* Action Panel */}
        {selectedItem ? (
          <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200 bg-white space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">GRADUATION CLEARANCE DOSSIER</span>
                <h3 className="text-base font-bold text-slate-900">{selectedItem.application?.student?.name}</h3>
                <p className="text-xs text-slate-500 font-mono">MIS: {selectedItem.application?.student?.userId} • {selectedItem.application?.student?.programme}</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">DEPARTMENT</span>
                <span className="text-xs font-bold text-[#1c398e]">{selectedItem.department?.name}</span>
              </div>
            </div>

            {/* Officer Action Form */}
            <form onSubmit={handleOfficerAction} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  1. Set Clearance Decision
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#5367c8]"
                >
                  <option value="APPROVED">APPROVED (No Dues Outstanding)</option>
                  <option value="REJECTED">REJECTED (Dues Pending / Missing Materials)</option>
                  <option value="CLARIFICATION_REQUIRED">CLARIFICATION REQUIRED (Require Student Visit)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  2. Outstanding Amount to Recover (in INR ₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={amountDue}
                  onChange={(e) => setAmountDue(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-[#5367c8]"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Enter 0 if all dues are clear. If book loss or lab breakage fees are due, enter the exact amount.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  3. Official Officer Remarks / Instructions
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks regarding equipment return, library books clearance, or fee receipts..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#5367c8] h-24"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 sm:py-3 bg-[#5367c8] hover:bg-[#475bc2] text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <CheckSquare className="w-4 h-4" />
                {actionLoading ? 'Saving Decision...' : 'Save & Publish Department Clearance Decision'}
              </button>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-2 glass-card p-12 rounded-2xl border border-slate-200 bg-white text-center flex flex-col justify-center items-center shadow-sm">
            <GraduationCap className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Select a graduating candidate</h3>
            <p className="text-slate-500 text-xs mt-2 max-w-sm">
              Choose a candidate from the left list to review and grant department clearance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
