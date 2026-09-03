import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, CheckCircle2, Clock, XCircle, AlertCircle, 
  Download, QrCode, ShieldCheck, Printer, RefreshCw, FileText
} from 'lucide-react';

export default function NoDuesClearanceTab() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showCertModal, setShowCertModal] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/nodues/my-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resData = await res.json();
      if (res.ok) {
        setData(resData);
      } else {
        setError(resData.error || 'Failed to load No-Dues status.');
      }
    } catch (err) {
      setError('Network error while loading No-Dues clearance status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchStatus();
  }, [token]);

  const handleApplyNoDues = async () => {
    setApplying(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/nodues/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const resData = await res.json();
      if (res.ok) {
        setMessage('No-Dues clearance application submitted! Broadcast to all 15 clearance departments.');
        fetchStatus();
      } else {
        setError(resData.error || 'Failed to submit No-Dues application.');
      }
    } catch (err) {
      setError('Network error while applying for No-Dues.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 text-iiitp-gold animate-spin mx-auto" />
        <p className="text-xs font-bold uppercase tracking-wider">Loading Graduating Batch No-Dues Clearance System...</p>
      </div>
    );
  }

  const application = data?.application;
  const clearances = application?.clearances || [];
  const certificate = application?.certificate;
  const totalDepts = clearances.length || 15;
  const approvedDepts = clearances.filter(c => c.status === 'APPROVED').length;
  const totalAmountDue = clearances.reduce((sum, c) => sum + (c.amountDue || 0), 0);
  const isComplete = application?.status === 'COMPLETED' || (totalDepts > 0 && approvedDepts === totalDepts);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-card p-6 rounded-2xl border border-iiitp-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-iiitp-gold/20 text-iiitp-gold text-[10px] font-black uppercase rounded tracking-wider border border-iiitp-gold/30">
              GRADUATING BATCH CLEARANCE
            </span>
            <span className="text-xxs text-slate-400 font-mono">
              BATCH: {user?.batch || '2020-2024'}
            </span>
          </div>
          <h3 className="text-xl font-black text-white mt-1">Graduating Batch No-Dues Clearance System</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Official 15-Department IIIT Pune No-Dues Certificate Clearance Protocol
          </p>
        </div>

        {application && (
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Clearance Progress</span>
              <span className="text-xs font-black text-iiitp-gold">
                {approvedDepts} / {totalDepts} Approved ({Math.round((approvedDepts / (totalDepts || 1)) * 100)}%)
              </span>
            </div>

            {isComplete && (
              <button
                onClick={() => setShowCertModal(true)}
                className="px-4 py-2 bg-iiitp-success text-white font-black text-xs uppercase rounded-xl tracking-wider shadow-glow-success flex items-center gap-2 hover:bg-green-700 transition-colors"
              >
                <GraduationCap className="w-4 h-4" />
                View & Download Certificate
              </button>
            )}
          </div>
        )}
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
          <AlertCircle className="w-4 h-4 text-red-400" />
          {error}
        </div>
      )}

      {/* Start Application prompt if not applied */}
      {!application && (
        <div className="glass-card p-8 rounded-2xl border border-iiitp-border text-center max-w-xl mx-auto space-y-4">
          <GraduationCap className="w-16 h-16 text-iiitp-gold mx-auto" />
          <h4 className="text-lg font-black text-white">Graduation Clearance Protocol Ready</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            As a graduating batch candidate ({user?.programme || 'B.Tech CSE'}, Batch {user?.batch || '2020-2024'}), you are eligible to initiate digital No-Dues clearance across all 15 Institute departments.
          </p>
          <button
            onClick={handleApplyNoDues}
            disabled={applying}
            className="px-6 py-3 bg-gradient-to-r from-iiitp-gold to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-glow-gold transition-all"
          >
            {applying ? 'Initiating Application...' : 'Initiate 15-Department No-Dues Clearance'}
          </button>
        </div>
      )}

      {/* 15 Department Clearances Status Grid */}
      {application && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-iiitp-gold" />
              15 Department Clearances Approval Matrix
            </h4>
            {totalAmountDue > 0 && (
              <span className="px-3 py-1 bg-red-950/60 border border-red-500/40 text-red-400 text-xs font-black rounded-lg">
                Total Outstanding Dues: ₹{totalAmountDue.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clearances.map((c, idx) => {
              const isApp = c.status === 'APPROVED';
              const isRej = c.status === 'REJECTED';
              const isClar = c.status === 'CLARIFICATION_REQUIRED';

              return (
                <div 
                  key={c.id} 
                  className={`p-4 rounded-xl border transition-all ${
                    isApp 
                      ? 'bg-slate-900/60 border-emerald-500/30' 
                      : isRej 
                      ? 'bg-red-950/20 border-red-500/40' 
                      : isClar
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-slate-900/40 border-slate-850'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-500 font-mono">DEPT {idx + 1}</span>
                      <h5 className="text-xs font-extrabold text-white">{c.department?.name}</h5>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                      isApp 
                        ? 'bg-iiitp-success/20 text-green-400 border-green-500/30' 
                        : isRej 
                        ? 'bg-iiitp-danger/20 text-red-400 border-red-500/30'
                        : isClar
                        ? 'bg-amber-950 text-amber-400 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-850 text-xxs space-y-1 text-slate-400">
                    <div className="flex justify-between">
                      <span>Clearance Officer:</span>
                      <span className="font-bold text-slate-200">{c.officer?.name || 'Assigned Officer'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dues / Recovery:</span>
                      <span className={`font-mono font-bold ${c.amountDue > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        ₹{c.amountDue}
                      </span>
                    </div>
                    {c.remarks && (
                      <p className="text-[10px] text-slate-300 italic bg-slate-950 p-2 rounded border border-slate-900 mt-1">
                        "{c.remarks}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Official Certificate Modal */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-iiitp-gold/50 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 space-y-6 shadow-2xl text-slate-900 bg-white">
            {/* IIIT Pune Official Certificate Header */}
            <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
              <h2 className="text-2xl font-black tracking-widest text-slate-900 uppercase">
                INDIAN INSTITUTE OF INFORMATION TECHNOLOGY, PUNE
              </h2>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                (An Institute of National Importance under Ministry of Education, Govt. of India)
              </p>
              <h3 className="text-lg font-black text-amber-800 uppercase tracking-widest pt-2">
                NO DUES CLEARANCE CERTIFICATE
              </h3>
              <p className="text-xs font-mono font-bold text-slate-600">
                Certificate ID: {certificate?.certificateId || `IIITP-ND-${new Date().getFullYear()}-0001`}
              </p>
            </div>

            {/* Certificate Body Text */}
            <div className="space-y-3 text-xs leading-relaxed text-slate-800">
              <p>
                This is to certify that Student <strong>{user?.name}</strong>, bearing Roll No. / MIS <strong>{user?.userId}</strong> of <strong>{user?.programme || 'B.Tech Computer Science & Engineering'}</strong> (Batch: <strong>{user?.batch || '2020-2024'}</strong>) has completed all institutional clearance protocols.
              </p>
              <p>
                There are <strong>NO OUTSTANDING DUES</strong> against the candidate in any of the 15 Institute departments listed below:
              </p>
            </div>

            {/* Clearance Summary Table */}
            <div className="overflow-x-auto rounded border border-slate-400">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-[10px] uppercase font-bold border-b border-slate-400">
                  <tr>
                    <th className="py-2 px-3 border-r border-slate-400">#</th>
                    <th className="py-2 px-3 border-r border-slate-400">Department / Authority</th>
                    <th className="py-2 px-3 border-r border-slate-400">Clearance Status</th>
                    <th className="py-2 px-3">Recovered Dues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-mono text-[11px]">
                  {clearances.map((c, i) => (
                    <tr key={c.id}>
                      <td className="py-1.5 px-3 border-r border-slate-300 font-bold">{i + 1}</td>
                      <td className="py-1.5 px-3 border-r border-slate-300 font-sans font-bold">{c.department?.name}</td>
                      <td className="py-1.5 px-3 border-r border-slate-300 text-emerald-700 font-bold">APPROVED</td>
                      <td className="py-1.5 px-3">₹{c.amountDue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Verification Footer & Signatures */}
            <div className="pt-6 flex items-center justify-between border-t-2 border-slate-900 text-xs">
              <div className="space-y-1">
                <div className="w-24 h-24 bg-slate-100 border border-slate-400 rounded flex items-center justify-center p-1">
                  {/* QR Verification Placeholder / Display */}
                  <div className="text-center">
                    <QrCode className="w-16 h-16 text-slate-800 mx-auto" />
                    <span className="text-[8px] font-mono font-bold block text-slate-600">VERIFY ONLINE</span>
                  </div>
                </div>
                <p className="text-[9px] font-mono text-slate-500 mt-1">
                  Issued on: {new Date().toLocaleDateString()}
                </p>
              </div>

              <div className="text-right space-y-8">
                <div className="font-mono text-[10px] text-slate-400 italic">Digitally Signed & Verified</div>
                <div>
                  <p className="font-black text-slate-900 border-t border-slate-800 pt-1 uppercase">Academic Section Authority</p>
                  <p className="text-[10px] text-slate-600 font-bold">IIIT Pune Examination & Clearance Cell</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg text-xs uppercase flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Certificate
              </button>
              <button
                onClick={() => setShowCertModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-xs uppercase"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
