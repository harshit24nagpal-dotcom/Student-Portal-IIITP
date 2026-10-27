import React, { useState, useEffect } from 'react';
import { 
  LogOut, LogIn, Clock, MapPin, CheckCircle2, AlertCircle, 
  Shield, UserCheck, ArrowRight, ShieldCheck, Sparkles, RefreshCw, Lock
} from 'lucide-react';

export default function HostelInOutTab({ token, user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState('OUT');
  const [destination, setDestination] = useState('');
  const [reason, setReason] = useState('');
  const [gateNumber, setGateNumber] = useState('Gate 1 - Main Entrance');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchMyLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/hostel/in-out/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchMyLogs();
  }, [token]);

  // Determine current status
  const latestLog = logs[0];
  const isCurrentlyOut = latestLog && latestLog.direction === 'OUT' && latestLog.status === 'OUT';

  const handleCreatePass = async (e) => {
    e.preventDefault();
    if (!destination.trim()) {
      setError('Please provide a destination.');
      return;
    }
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/hostel/in-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          direction,
          destination,
          reason,
          gateNumber
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Digital ${direction} Pass logged successfully! Gate security notified.`);
        setDestination('');
        setReason('');
        fetchMyLogs();
      } else {
        setError(data.error || 'Failed to record entry');
      }
    } catch (err) {
      setError('Network connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkReturn = async (logId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/hostel/in-out/${logId}/return`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage('Return marked! Welcome back to campus.');
        fetchMyLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Gate Status Card */}
      <div className="p-5 rounded-md border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-md ${isCurrentlyOut ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {isCurrentlyOut ? <LogOut className="w-6 h-6 animate-pulse" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded tracking-wider border ${
                isCurrentlyOut ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {isCurrentlyOut ? 'Status: OUTSIDE CAMPUS' : 'Status: INSIDE CAMPUS'}
              </span>
              <span className="text-xxs text-slate-400 font-mono">
                Hostel: {user?.hostelBlock || 'Block A'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              {isCurrentlyOut 
                ? `You checked OUT to "${latestLog?.destination}"` 
                : 'Campus Gate Status: Normal / On-Premises'}
            </h3>
            {isCurrentlyOut && (
              <p className="text-xs text-slate-500 mt-0.5">
                Logged at: {new Date(latestLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} via {latestLog.gateNumber}
              </p>
            )}
          </div>
        </div>

        {isCurrentlyOut && (
          <button
            onClick={() => handleMarkReturn(latestLog.id)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded-md tracking-wider shadow-sm flex items-center gap-2 cursor-pointer transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Mark Returned to Campus</span>
          </button>
        )}
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
        {/* Form: Generate Digital Gate Pass */}
        <div className="lg:col-span-1 p-5 rounded-md border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Shield className="w-4 h-4 text-[#1c398e]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Generate Digital Gate Pass
            </h4>
          </div>

          <form onSubmit={handleCreatePass} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Direction
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('OUT')}
                  className={`py-2 text-xs font-bold rounded-md border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    direction === 'OUT'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit Campus (OUT)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('IN')}
                  className={`py-2 text-xs font-bold rounded-md border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    direction === 'IN'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Entry Campus (IN)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Destination / Point of Travel *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Hinjawadi Phase 1 Market, Library, Clinic"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1c398e]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Reason / Purpose
              </label>
              <input
                type="text"
                placeholder="e.g. Stationary, Groceries, Meeting family"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1c398e]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Designated Gate
              </label>
              <select
                value={gateNumber}
                onChange={(e) => setGateNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1c398e]"
              >
                <option value="Gate 1 - Main Entrance">Gate 1 - Main Entrance</option>
                <option value="Gate 2 - East Gate (Academic Walkway)">Gate 2 - East Gate</option>
                <option value="Gate 3 - Hostel Block Rear">Gate 3 - Hostel Block Rear</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-[#0c2340] hover:bg-[#1c398e] text-white text-xs font-bold uppercase rounded-md tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>Authorize & Log Pass</span>
            </button>
          </form>

          <div className="p-3 bg-slate-50 rounded-md border border-slate-100 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-slate-600" /> Official IIITP Gate Rules:</p>
            <p>• Normal hostel curfew is 10:00 PM for all campus residents.</p>
            <p>• Entries after 10:00 PM require Warden approval or biometric log.</p>
          </div>
        </div>

        {/* History: Student In / Out Movement Log */}
        <div className="lg:col-span-2 p-5 rounded-md border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1c398e]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Recent Digital In / Out Movement History
              </h4>
            </div>
            <button
              onClick={fetchMyLogs}
              className="text-xs text-[#5367c8] hover:text-[#1c398e] flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#5367c8]" />
              Fetching movement logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No recent movement passes logged. Generate one using the form on the left.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {logs.map((log) => {
                const isOut = log.direction === 'OUT';
                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-md border border-slate-100 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-md mt-0.5 ${isOut ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {isOut ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                            isOut ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {log.direction} PASS
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {log.destination}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {log.reason || 'General errand'} • Via {log.gateNumber}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {new Date(log.timestamp).toLocaleString([], { 
                            dateStyle: 'medium', 
                            timeStyle: 'short' 
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded ${
                        log.status === 'OUT' 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {log.status === 'OUT' ? 'Currently Outside' : 'Returned'}
                      </span>
                      {log.status === 'OUT' && (
                        <button
                          onClick={() => handleMarkReturn(log.id)}
                          className="block mt-1 text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                        >
                          Mark Return
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
