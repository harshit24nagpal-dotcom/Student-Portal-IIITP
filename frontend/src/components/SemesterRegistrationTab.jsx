import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, Upload, CheckCircle2, Clock, XCircle, AlertTriangle, 
  Building, UserCheck, ShieldCheck, Download, RefreshCw, FileCheck
} from 'lucide-react';

export default function SemesterRegistrationTab() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // File upload state
  const [erpFile, setErpFile] = useState(null);
  const [feeFile, setFeeFile] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/registration/my-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resData = await res.json();
      if (res.ok) {
        setData(resData);
      } else {
        setError(resData.error || 'Failed to fetch registration status.');
      }
    } catch (err) {
      setError('Network error while loading registration status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchStatus();
  }, [token]);

  const handleFileUpload = async (file, category) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const res = await fetch('http://localhost:5000/api/files/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const fileRes = await res.json();
    if (!res.ok) throw new Error(fileRes.error || 'File upload failed');
    return fileRes.file;
  };

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    if (!erpFile && !feeFile && !data?.registration) {
      setError('Please select both ERP Registration Proof and Fee Receipt documents.');
      return;
    }

    setUploading(true);
    setMessage('');
    setError('');

    try {
      const uploadedDocs = [];

      if (erpFile) {
        const fileObj = await handleFileUpload(erpFile, 'ERP_PROOF');
        uploadedDocs.push({
          documentType: 'ERP_PROOF',
          documentName: fileObj.originalName,
          filePath: fileObj.filePath,
          fileType: fileObj.fileType,
          fileSize: fileObj.fileSize
        });
      }

      if (feeFile) {
        const fileObj = await handleFileUpload(feeFile, 'FEE_RECEIPT');
        uploadedDocs.push({
          documentType: 'FEE_RECEIPT',
          documentName: fileObj.originalName,
          filePath: fileObj.filePath,
          fileType: fileObj.fileType,
          fileSize: fileObj.fileSize
        });
      }

      // Submit registration API call
      const res = await fetch('http://localhost:5000/api/registration/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ documents: uploadedDocs })
      });

      const resData = await res.json();
      if (res.ok) {
        setMessage('Registration documents submitted successfully! Transferred to Hostel Warden verification.');
        setErpFile(null);
        setFeeFile(null);
        fetchStatus();
      } else {
        setError(resData.error || 'Failed to submit registration.');
      }
    } catch (err) {
      setError(err.message || 'Error uploading files.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 text-iiitp-gold animate-spin mx-auto" />
        <p className="text-xs font-bold uppercase tracking-wider">Loading Semester Registration Verification System...</p>
      </div>
    );
  }

  const registration = data?.registration;
  const activeSemester = data?.activeSemester;

  // Timeline steps
  const steps = [
    { key: 'SUBMITTED', title: '1. Document Submission', desc: 'ERP Proof & Fee Receipt Uploaded' },
    { key: 'WARDEN_REVIEW', title: '2. Hostel Warden Verification', desc: 'Hostel No-Dues & Residency Verification' },
    { key: 'WARDEN_APPROVED', title: '3. Faculty Advisor Verification', desc: 'Academic Advisor Final Sign-Off' },
    { key: 'APPROVED', title: '4. Semester Registration Approved', desc: 'Verified & Fully Registered' },
  ];

  const getStepStatus = (stepKey) => {
    if (!registration) return 'upcoming';
    const status = registration.status;

    if (status === 'APPROVED') return 'completed';
    if (status === 'REJECTED') return 'rejected';

    if (stepKey === 'SUBMITTED') return 'completed';
    if (stepKey === 'WARDEN_REVIEW') return status === 'WARDEN_REVIEW' ? 'current' : 'completed';
    if (stepKey === 'WARDEN_APPROVED') return status === 'WARDEN_APPROVED' ? 'current' : (status === 'APPROVED' ? 'completed' : 'upcoming');
    if (stepKey === 'APPROVED') return status === 'APPROVED' ? 'completed' : 'upcoming';

    return 'upcoming';
  };

  return (
    <div className="space-y-6">
      {/* Top Semester Info Card */}
      <div className="glass-card p-6 rounded-2xl border border-iiitp-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-iiitp-gold/20 text-iiitp-gold text-[10px] font-black uppercase rounded tracking-wider border border-iiitp-gold/30">
              {activeSemester?.name || 'Odd Semester 2026-27'}
            </span>
            <span className="text-xxs text-slate-400 font-mono">
              Academic Year {activeSemester?.year || 2026}
            </span>
          </div>
          <h3 className="text-xl font-black text-white mt-1">Semester Registration Verification System</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Two-tier institutional clearance workflow: Hostel Warden → Faculty Advisor Verification
          </p>
        </div>

        {registration && (
          <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Verification Status</span>
            <span className={`text-xs font-black uppercase px-2 py-0.5 rounded border mt-0.5 inline-block ${
              registration.status === 'APPROVED' 
                ? 'bg-iiitp-success/20 text-green-400 border-green-500/30' 
                : registration.status === 'REJECTED'
                ? 'bg-red-950 text-red-400 border-red-500/40'
                : 'bg-iiitp-gold/20 text-iiitp-gold border-iiitp-gold/30'
            }`}>
              {registration.status.replace(/_/g, ' ')}
            </span>
          </div>
        )}
      </div>

      {/* Workflow Progress Timeline */}
      <div className="glass-card p-6 rounded-2xl border border-iiitp-border space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-iiitp-gold" />
          Verification Workflow Timeline
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {steps.map((step, idx) => {
            const state = getStepStatus(step.key);
            return (
              <div 
                key={step.key}
                className={`p-4 rounded-xl border relative transition-all ${
                  state === 'completed'
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : state === 'current'
                    ? 'bg-amber-950/20 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/30'
                    : state === 'rejected'
                    ? 'bg-red-950/20 border-red-500/40 text-red-300'
                    : 'bg-slate-900/40 border-slate-850 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">Step 0{idx + 1}</span>
                  {state === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {state === 'current' && <Clock className="w-4 h-4 text-amber-400 animate-spin" />}
                  {state === 'rejected' && <XCircle className="w-4 h-4 text-red-400" />}
                  {state === 'upcoming' && <div className="w-3 h-3 rounded-full border border-slate-700"></div>}
                </div>
                <h5 className="text-xs font-extrabold text-white">{step.title}</h5>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
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

      {/* Main Form & Status Display Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Upload Form */}
        <div className="glass-card p-6 rounded-2xl border border-iiitp-border space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Upload className="w-4 h-4 text-iiitp-info" />
            {registration ? 'Update / Resubmit Registration Documents' : 'Submit Mandatory Registration Proofs'}
          </h4>

          <form onSubmit={handleSubmitRegistration} className="space-y-4 text-xs">
            {/* Document 1: ERP Registration Proof */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-200 block text-xs">
                  1. ERP Semester Registration Proof <span className="text-red-400">*</span>
                </label>
                <span className="text-[9px] text-slate-500 font-mono">PDF, PNG, JPG (Max 10MB)</span>
              </div>
              <input 
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setErpFile(e.target.files[0])}
                className="w-full text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-iiitp-burgundy file:text-white hover:file:bg-red-700 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Official screenshot or PDF receipt generated from the IIIT Pune ERP Portal.
              </p>
            </div>

            {/* Document 2: Semester Fee Payment Receipt */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-200 block text-xs">
                  2. Semester Tuition & Hostel Fee Receipt <span className="text-red-400">*</span>
                </label>
                <span className="text-[9px] text-slate-500 font-mono">PDF, PNG, JPG (Max 10MB)</span>
              </div>
              <input 
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setFeeFile(e.target.files[0])}
                className="w-full text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-iiitp-burgundy file:text-white hover:file:bg-red-700 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Official bank payment counterfoil or online SBI Collect fee transaction receipt.
              </p>
            </div>

            <button
              type="submit"
              disabled={uploading || (registration?.status === 'APPROVED')}
              className="w-full py-3 bg-gradient-to-r from-iiitp-gold to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-glow-gold flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading & Transmitting Documents...' : registration ? 'Resubmit Updated Documents' : 'Submit For Warden & Advisor Verification'}
            </button>
          </form>
        </div>

        {/* Existing Submitted Documents & Verification Remarks Card */}
        <div className="glass-card p-6 rounded-2xl border border-iiitp-border space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-iiitp-success" />
            Uploaded Documents & Official Reviewer Remarks
          </h4>

          {registration?.documents && registration.documents.length > 0 ? (
            <div className="space-y-3">
              {registration.documents.map((doc) => (
                <div key={doc.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-iiitp-gold" />
                      <span className="font-bold text-white">{doc.documentName}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Type: <span className="text-slate-200 font-bold">{doc.documentType}</span> • Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <a 
                    href={`http://localhost:5000${doc.filePath}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    View Doc
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
              No registration documents uploaded yet. Please use the form on the left to submit your ERP proof and fee receipt.
            </div>
          )}

          {/* Verification Logs & Remarks */}
          {registration?.verifications && registration.verifications.length > 0 && (
            <div className="border-t border-slate-850 pt-4 space-y-3">
              <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Official Verifier Feedbacks</h5>
              {registration.verifications.map((v) => (
                <div key={v.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-iiitp-gold uppercase">{v.verifierRole.replace(/_/g, ' ')}</span>
                    <span className="text-slate-500 font-mono">{new Date(v.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-200 font-semibold">{v.verifier?.name}: <span className="text-white font-black uppercase">{v.action}</span></p>
                  {v.remarks && <p className="text-[11px] text-slate-400 italic bg-slate-950 p-2 rounded border border-slate-900">"{v.remarks}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
