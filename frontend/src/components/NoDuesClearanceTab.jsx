import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { 
  GraduationCap, CheckCircle2, Clock, XCircle, AlertCircle, 
  Download, QrCode, ShieldCheck, Printer, RefreshCw, FileText,
  Cpu, BookOpen, Building2, Landmark, CreditCard, ChevronDown, 
  ChevronUp, Check, ArrowRight, UserCheck, Banknote, AlertTriangle, 
  HelpCircle, Sparkles, School, Layers, IndianRupee, ShieldAlert
} from 'lucide-react';

// Institutional 5 Sectors Definition
const SECTORS = [
  {
    id: 'ACADEMIC_RESEARCH',
    title: 'Academic & Dissertation Sector',
    subtitle: 'Dissertation thesis submission, course credits audit, and departmental verification',
    icon: GraduationCap,
    badgeColor: 'border-blue-200 bg-blue-50 text-blue-800',
    departmentNames: [
      'Thesis Supervisor / Guide',
      'Course Coordinator',
      'Head of Department'
    ]
  },
  {
    id: 'LABS_SYSTEMS',
    title: 'Laboratories & Computing Systems Sector',
    subtitle: 'Hardware kits, dev boards, server quotas, lab tool return & equipment verification',
    icon: Cpu,
    badgeColor: 'border-purple-200 bg-purple-50 text-purple-800',
    departmentNames: [
      'Computers Labs',
      'Electronics Labs',
      'Server Room',
      'Store In-charge'
    ]
  },
  {
    id: 'LIBRARY_INFO',
    title: 'Central Library & Learning Resources',
    subtitle: 'Physical & digital catalog return, overdue fine reconciliation, and thesis deposit',
    icon: BookOpen,
    badgeColor: 'border-amber-200 bg-amber-50 text-amber-800',
    departmentNames: [
      'Library / Information Service'
    ]
  },
  {
    id: 'RESIDENTIAL_CAMPUS',
    title: 'Residential Life & Campus Safety',
    subtitle: 'Hostel room inventory inspection, room key surrender, mess dues & security clearance',
    icon: Building2,
    badgeColor: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    departmentNames: [
      'Hostel Warden / Hostel In-charge',
      'Security In-charge'
    ]
  },
  {
    id: 'ADMIN_FINANCE',
    title: 'Administration & Finance Reconciliation',
    subtitle: 'Placement NOC, sports gear, exam cell grade verification, fee balance & Caution Money refund',
    icon: Landmark,
    badgeColor: 'border-indigo-200 bg-indigo-50 text-indigo-800',
    departmentNames: [
      'Training and Placement Cell',
      'Sports In-charge',
      'Examination Cell',
      'Accounts Section',
      'Academic Section'
    ]
  }
];

export default function NoDuesClearanceTab() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [settling, setSettling] = useState(false);
  const [togglingDemo, setTogglingDemo] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [settleModalItem, setSettleModalItem] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [showBankDetailsForm, setShowBankDetailsForm] = useState(false);

  // Caution deposit refund bank details form state
  const [bankForm, setBankForm] = useState({
    bankName: 'State Bank of India',
    accountNumber: '',
    ifscCode: 'SBIN0012345',
    accountHolderName: user?.name || '',
    futureAddress: 'Flat 402, Green Valley Apartments, Pune - 411048'
  });

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/nodues/my-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resData = await res.json();
      if (res.ok) {
        setData(resData);
        if (resData.refundBankDetails) {
          setBankForm(prev => ({
            ...prev,
            ...resData.refundBankDetails
          }));
        }
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

  // Apply for No Dues with Caution Deposit Bank Details
  const handleApplyNoDues = async (e) => {
    if (e) e.preventDefault();
    setApplying(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch(`${API_URL}/nodues/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...bankForm,
          simulateFinalYear: true
        })
      });
      const resData = await res.json();
      if (res.ok) {
        setMessage('No-Dues clearance initiated across all 15 IIIT Pune departments! Caution deposit refund details registered.');
        setShowBankDetailsForm(false);
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

  // 1-Click Online Dues Settlement
  const handleSettleDues = async () => {
    if (!settleModalItem) return;
    setSettling(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch(`${API_URL}/nodues/settle-dues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          clearanceId: settleModalItem.id,
          paymentMethod: paymentMethod,
          transactionRef: `IIITP-${paymentMethod}-${Date.now().toString(36).toUpperCase()}`
        })
      });
      const resData = await res.json();
      if (res.ok) {
        setMessage(`Payment of ₹${settleModalItem.amountDue} completed successfully via ${paymentMethod}! Department status updated to APPROVED.`);
        setSettleModalItem(null);
        fetchStatus();
      } else {
        setError(resData.error || 'Failed to settle dues.');
      }
    } catch (err) {
      setError('Network error during online dues settlement.');
    } finally {
      setSettling(false);
    }
  };

  // Toggle demo standing between Continuing Student (Sem 3) and Final Year (Sem 8)
  const handleToggleDemoStanding = async () => {
    setTogglingDemo(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch(`${API_URL}/nodues/toggle-demo-eligibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const resData = await res.json();
      if (res.ok) {
        setMessage(resData.message);
        fetchStatus();
      } else {
        setError(resData.error || 'Failed to toggle demo standing.');
      }
    } catch (err) {
      setError('Error toggling eligibility standing.');
    } finally {
      setTogglingDemo(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 text-[#0c2340] animate-spin mx-auto" />
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Loading IIIT Pune Institutional No-Dues Clearance & Reconciliation Engine...
        </p>
      </div>
    );
  }

  const student = data?.student || user;
  const isFinalYear = Boolean(data?.isFinalYear);
  const application = data?.application;
  const clearances = application?.clearances || [];
  const certificate = application?.certificate;
  const totalDepts = clearances.length || 15;
  const approvedDepts = clearances.filter(c => c.status === 'APPROVED').length;
  const totalAmountDue = clearances.reduce((sum, c) => sum + (c.amountDue || 0), 0);
  const cautionDeposit = data?.cautionDeposit || 10000;
  const netRefundPayable = Math.max(0, cautionDeposit - totalAmountDue);
  const isComplete = application?.status === 'COMPLETED' || (totalDepts > 0 && approvedDepts === totalDepts);

  // Group clearances by the 5 Sectors
  const getClearancesForSector = (sector) => {
    return clearances.filter(c => sector.departmentNames.includes(c.department?.name));
  };

  // =========================================================================
  // VIEW 1: NON-FINAL YEAR CONTINUING STUDENT SCREEN
  // =========================================================================
  if (!isFinalYear) {
    return (
      <div className="space-y-6">
        {/* Institutional Inactivity Notice Card */}
        <div className="glass-card rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-linear-to-r from-slate-900 via-[#0c2340] to-slate-800 p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black uppercase rounded tracking-wider">
                  CLEARANCE PROTOCOL: INACTIVE
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  MIS: {student?.userId || '112415079'}
                </span>
              </div>
              <h2 className="text-xl font-black tracking-wide text-white">
                Institutional No-Dues Clearance Protocol
              </h2>
              <p className="text-xs text-slate-300">
                Reserved Exclusively for Graduating Final-Year Students (Semesters 7 & 8)
              </p>
            </div>

            {/* Quick Demo Switcher for Evaluation / Panel */}
            <div className="shrink-0">
              <button
                onClick={handleToggleDemoStanding}
                disabled={togglingDemo}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-900" />
                {togglingDemo ? 'Switching Profile...' : 'Simulate Final-Year View (Panel Demo)'}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Student Standing Profile Banner */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0c2340] text-amber-400 font-bold flex items-center justify-center text-sm shadow-xs">
                  {student?.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{student?.name || 'Student Candidate'}</h4>
                  <p className="text-slate-500 text-xxs font-mono">
                    {student?.programme || 'B.Tech Computer Science & Engineering'} • Batch {student?.batch || '2024-2028'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-900 font-bold rounded-lg text-xs">
                  Current Standing: {student?.academicYearLabel || 'Semester 3 • 2nd Year'}
                </span>
              </div>
            </div>

            {/* Explanation: Why No-Dues is Inactive for Continuing Students */}
            <div className="border border-amber-200 bg-amber-50/60 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Why is No-Dues Clearance Not Applicable to Your Current Semester?
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                In accordance with <strong>Indian Institute of Information Technology, Pune Academic Regulations (Clause 14.2)</strong>, formal No-Dues clearance is mandatory <em>only</em> at the conclusion of your final degree semester (Semester 8 for 4-Year B.Tech) prior to Convocation and Degree Conferment.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-white rounded-lg border border-amber-200/70 text-xxs text-slate-600 space-y-1">
                  <span className="font-bold text-slate-900 block text-xs">1. Active Campus Entitlements Remain Active</span>
                  Continuing students actively borrow library books, utilize electronics and computing hardware stores, and reside in Institute hostels. These facilities cannot be surrendered while coursework is underway.
                </div>
                <div className="p-3 bg-white rounded-lg border border-amber-200/70 text-xxs text-slate-600 space-y-1">
                  <span className="font-bold text-slate-900 block text-xs">2. Caution Deposit (₹10,000) Held in Escrow</span>
                  The institutional security deposit paid at admission remains safeguarded in the Institute accounts treasury to secure campus equipment until your final graduating exit.
                </div>
              </div>
            </div>

            {/* Academic Progression Roadmap */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0c2340]" />
                Institutional Degree Milestone Roadmap
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
                  <div className="flex items-center justify-between text-xxs font-bold text-emerald-800">
                    <span>YEAR 1 (SEM 1-2)</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h5 className="font-bold text-xs text-slate-900">Foundational Engineering</h5>
                  <p className="text-[10px] text-slate-500">Core courses & campus orientation. (Completed)</p>
                </div>

                <div className="p-3.5 rounded-xl border-2 border-blue-500 bg-blue-50/50 space-y-1 shadow-xs">
                  <div className="flex items-center justify-between text-xxs font-bold text-blue-800">
                    <span>YEAR 2 (SEM 3-4)</span>
                    <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[9px] font-black">CURRENT</span>
                  </div>
                  <h5 className="font-bold text-xs text-slate-900">Core Branch Disciplines</h5>
                  <p className="text-[10px] text-slate-600">Active library & lab privileges in progress.</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1 opacity-75">
                  <div className="flex items-center justify-between text-xxs font-bold text-slate-500">
                    <span>YEAR 3 (SEM 5-6)</span>
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                  <h5 className="font-bold text-xs text-slate-800">Electives & Internships</h5>
                  <p className="text-[10px] text-slate-500">Summer industry projects & pre-placement prep.</p>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/40 space-y-1">
                  <div className="flex items-center justify-between text-xxs font-bold text-amber-800">
                    <span>YEAR 4 (SEM 7-8)</span>
                    <GraduationCap className="w-4 h-4 text-amber-600" />
                  </div>
                  <h5 className="font-bold text-xs text-slate-900">Final Capstone & Graduation</h5>
                  <p className="text-[10px] text-amber-900 font-semibold">15-Department No-Dues & Caution Refund activates here.</p>
                </div>
              </div>
            </div>

            {/* Panel Demonstration Callout */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase text-[#0c2340] tracking-wider block">
                  Evaluation Panel Notice
                </span>
                <p className="text-xs text-slate-600">
                  Want to review the 15-department clearance matrix, caution money refund calculator, and 1-click dues settlement?
                </p>
              </div>
              <button
                onClick={handleToggleDemoStanding}
                disabled={togglingDemo}
                className="px-4 py-2 bg-[#0c2340] hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap"
              >
                {togglingDemo ? 'Activating...' : 'Switch to Graduating Batch (Sem 8)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: FINAL YEAR GRADUATING BATCH CLEARANCE SYSTEM
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Top Banner: Graduating Final Year Protocol */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase rounded tracking-wider border border-emerald-300">
              GRADUATING BATCH CLEARANCE ACTIVE
            </span>
            <span className="text-xs text-slate-500 font-mono font-bold">
              BATCH: {student?.batch || '2020-2024'} • {student?.academicYearLabel || 'Semester 8'}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Graduation No-Dues Clearance & Financial Reconciliation System
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Official 15-Department IIIT Pune Exit Protocol & Caution Money (Security Deposit) Direct Refund Portal
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* Demo toggle back to continuing student */}
          <button
            onClick={handleToggleDemoStanding}
            disabled={togglingDemo}
            title="Switch back to Continuing Student view (Semester 3)"
            className="px-3 py-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 text-[11px] font-bold uppercase rounded-lg transition-colors cursor-pointer"
          >
            {togglingDemo ? '...' : 'Toggle to Sem 3 (Demo)'}
          </button>

          {isComplete && (
            <button
              onClick={() => setShowCertModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase rounded-xl tracking-wider shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <GraduationCap className="w-4 h-4" />
              View & Download Certificate
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between gap-2 font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center justify-between gap-2 font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-700 hover:text-red-900 text-xs font-bold">✕</button>
        </div>
      )}

      {/* 4 Executive Metric Cards (Progress, Caution Deposit, Dues, Net Refund) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Clearance Progress */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Clearance Progress
            </span>
            <ShieldCheck className="w-4 h-4 text-[#0c2340]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{approvedDepts}</span>
            <span className="text-xs text-slate-500 font-bold">/ {totalDepts} Departments</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-[#0c2340]'}`}
              style={{ width: `${Math.round((approvedDepts / (totalDepts || 1)) * 100)}%` }}
            />
          </div>
          <span className="text-xxs font-bold text-slate-500 block text-right">
            {Math.round((approvedDepts / (totalDepts || 1)) * 100)}% Verified
          </span>
        </div>

        {/* Card 2: Initial Caution Deposit */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Caution Money Deposit
            </span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-700 font-mono">₹10,000</span>
          </div>
          <p className="text-xxs text-slate-500">
            Institutional security deposit placed in treasury at admission.
          </p>
        </div>

        {/* Card 3: Outstanding Departmental Dues */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Outstanding Dues
            </span>
            <AlertCircle className={`w-4 h-4 ${totalAmountDue > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-black font-mono ${totalAmountDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              ₹{totalAmountDue}
            </span>
          </div>
          <p className="text-xxs text-slate-500">
            {totalAmountDue > 0 ? 'Pending fines across departments (Clearable online).' : 'All 15 departments clear of financial dues.'}
          </p>
        </div>

        {/* Card 4: Net Refund Disbursable */}
        <div className="p-4 rounded-xl border-2 border-emerald-400 bg-emerald-50/40 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
              Net Refund Disbursable
            </span>
            <IndianRupee className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-800 font-mono">₹{netRefundPayable}</span>
          </div>
          <p className="text-xxs text-emerald-900 font-semibold">
            (Deposit ₹10,000 − Dues ₹{totalAmountDue}) via Direct NEFT.
          </p>
        </div>
      </div>

      {/* NEFT Bank Account Details for Caution Money Refund (Collapsible / Editable) */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#0c2340]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Direct NEFT Caution Money Refund Registration
            </h4>
          </div>
          <p className="text-xxs text-slate-600">
            Beneficiary: <strong className="text-slate-800">{bankForm.accountHolderName || student?.name}</strong> • Bank: <strong className="text-slate-800">{bankForm.bankName}</strong> • IFSC: <strong className="text-slate-800 font-mono">{bankForm.ifscCode}</strong> • Account: <strong className="text-slate-800 font-mono">{bankForm.accountNumber ? `••••${bankForm.accountNumber.slice(-4)}` : '••••3489'}</strong>
          </p>
        </div>

        <button
          onClick={() => setShowBankDetailsForm(!showBankDetailsForm)}
          className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer whitespace-nowrap self-start md:self-center"
        >
          {showBankDetailsForm ? 'Hide Form' : 'Update NEFT Bank Details'}
        </button>
      </div>

      {/* Refund Bank Details Edit Form */}
      {showBankDetailsForm && (
        <form onSubmit={handleApplyNoDues} className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
            Caution Money Refund Direct Bank Details (NEFT / RTGS)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-xxs font-bold text-slate-600 uppercase">Account Holder Name</label>
              <input 
                type="text" 
                value={bankForm.accountHolderName} 
                onChange={e => setBankForm({...bankForm, accountHolderName: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs" 
                required 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xxs font-bold text-slate-600 uppercase">Bank Name</label>
              <input 
                type="text" 
                value={bankForm.bankName} 
                onChange={e => setBankForm({...bankForm, bankName: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs" 
                required 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xxs font-bold text-slate-600 uppercase">Bank Account Number</label>
              <input 
                type="text" 
                value={bankForm.accountNumber} 
                placeholder="e.g. 309812498234"
                onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono" 
                required 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xxs font-bold text-slate-600 uppercase">IFSC Code</label>
              <input 
                type="text" 
                value={bankForm.ifscCode} 
                placeholder="e.g. SBIN0012345"
                onChange={e => setBankForm({...bankForm, ifscCode: e.target.value.toUpperCase()})}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono uppercase" 
                required 
              />
            </div>
          </div>
          <div className="space-y-1 text-xs">
            <label className="text-xxs font-bold text-slate-600 uppercase">Permanent Mailing Address (For Degree Parchment Courier)</label>
            <input 
              type="text" 
              value={bankForm.futureAddress} 
              onChange={e => setBankForm({...bankForm, futureAddress: e.target.value})}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs" 
              required 
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowBankDetailsForm(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs uppercase rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={applying}
              className="px-5 py-2 bg-[#0c2340] hover:bg-slate-900 text-white font-bold text-xs uppercase rounded-lg shadow-xs"
            >
              {applying ? 'Saving Details...' : 'Save & Confirm Refund Details'}
            </button>
          </div>
        </form>
      )}

      {/* Start Application prompt if not applied yet */}
      {!application && (
        <div className="glass-card p-8 rounded-2xl border border-slate-200 bg-white text-center max-w-xl mx-auto space-y-4 shadow-sm">
          <GraduationCap className="w-16 h-16 text-[#0c2340] mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">Graduation Clearance Protocol Ready</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            As a final-year graduating batch candidate ({student?.programme || 'B.Tech CSE'}, Batch {student?.batch || '2020-2024'}), you are authorized to initiate digital No-Dues clearance across all 15 Institute departments and register for your ₹10,000 Caution Money NEFT refund.
          </p>
          <button
            onClick={handleApplyNoDues}
            disabled={applying}
            className="px-6 py-3 bg-[#0c2340] hover:bg-slate-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            {applying ? 'Initiating Application...' : 'Initiate 15-Department Clearance Protocol'}
          </button>
        </div>
      )}

      {/* 5 Sectors Navigation Filter Bar */}
      {application && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-1.5 flex-nowrap">
              <button
                onClick={() => setSelectedSector('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  selectedSector === 'ALL'
                    ? 'bg-[#0c2340] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                All 5 Sectors (15 Departments)
              </button>

              {SECTORS.map(sec => {
                const secClearances = getClearancesForSector(sec);
                const secApproved = secClearances.filter(c => c.status === 'APPROVED').length;
                const isSecComplete = secClearances.length > 0 && secApproved === secClearances.length;

                return (
                  <button
                    key={sec.id}
                    onClick={() => setSelectedSector(sec.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                      selectedSector === sec.id
                        ? 'bg-[#0c2340] text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    <span>{sec.title.split(' ')[0]}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      selectedSector === sec.id 
                        ? 'bg-white/20 text-white' 
                        : isSecComplete 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {secApproved}/{secClearances.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5 Department Clusters (Sectors) Display */}
          <div className="space-y-6">
            {SECTORS.filter(sec => selectedSector === 'ALL' || selectedSector === sec.id).map(sec => {
              const secClearances = getClearancesForSector(sec);
              const secApproved = secClearances.filter(c => c.status === 'APPROVED').length;
              const secDues = secClearances.reduce((sum, c) => sum + (c.amountDue || 0), 0);
              const isSecComplete = secClearances.length > 0 && secApproved === secClearances.length;
              const SectorIcon = sec.icon;

              return (
                <div key={sec.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                  {/* Sector Header Banner */}
                  <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0c2340] shadow-2xs">
                        <SectorIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">{sec.title}</h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${sec.badgeColor}`}>
                            {secClearances.length} Departments
                          </span>
                        </div>
                        <p className="text-xxs text-slate-500 mt-0.5">{sec.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {secDues > 0 && (
                        <span className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg font-mono">
                          Dues: ₹{secDues}
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                        isSecComplete 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {isSecComplete ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {secApproved} / {secClearances.length} Cleared
                      </span>
                    </div>
                  </div>

                  {/* Department Cards Grid in Sector */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {secClearances.map(c => {
                      const isApp = c.status === 'APPROVED';
                      const isRej = c.status === 'REJECTED';
                      const isClar = c.status === 'CLARIFICATION_REQUIRED';
                      const hasDues = (c.amountDue || 0) > 0;

                      return (
                        <div 
                          key={c.id} 
                          className={`p-4 rounded-xl border transition-all bg-white flex flex-col justify-between ${
                            isApp 
                              ? 'border-emerald-200 shadow-2xs' 
                              : isRej 
                              ? 'border-red-200 shadow-2xs' 
                              : isClar
                              ? 'border-amber-200 shadow-2xs' 
                              : 'border-slate-200'
                          }`}
                        >
                          <div>
                            {/* Card Top: Dept Name & Status */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[9px] font-bold text-slate-400 font-mono block">
                                  ORDER #{c.department?.displayOrder || c.departmentId}
                                </span>
                                <h4 className="text-xs font-bold text-slate-900 mt-0.5 leading-snug">
                                  {c.department?.name}
                                </h4>
                              </div>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border shrink-0 ${
                                isApp 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : isRej 
                                  ? 'bg-red-50 text-red-700 border-red-200' 
                                  : isClar
                                  ? 'bg-amber-50 text-amber-800 border-amber-200' 
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                {c.status.replace(/_/g, ' ')}
                              </span>
                            </div>

                            {/* Card Details */}
                            <div className="mt-3 pt-3 border-t border-slate-100 text-xxs space-y-1.5 text-slate-500">
                              <div className="flex justify-between items-center">
                                <span>Verifying Officer:</span>
                                <span className="font-semibold text-slate-800">{c.officer?.name || 'Authorized Signatory'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Outstanding Dues:</span>
                                <span className={`font-mono font-bold ${hasDues ? 'text-red-600' : 'text-emerald-600'}`}>
                                  ₹{c.amountDue}
                                </span>
                              </div>
                              {c.remarks && (
                                <p className="text-[10px] text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-200">
                                  "{c.remarks}"
                                </p>
                              )}
                            </div>
                          </div>

                          {/* 1-Click Pay Action for Departments with Pending Dues */}
                          {hasDues && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                              <button
                                onClick={() => {
                                  setSettleModalItem(c);
                                  setPaymentMethod('UPI');
                                }}
                                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xxs uppercase tracking-wider rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                1-Click Pay ₹{c.amountDue} Online
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          1-CLICK ONLINE DUES SETTLEMENT MODAL
         ========================================================================= */}
      {settleModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Instant Dues Settlement</h3>
                  <p className="text-xxs text-slate-500">IIIT Pune Digital Clearance Payment Gateway</p>
                </div>
              </div>
              <button 
                onClick={() => setSettleModalItem(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Itemized Dues Breakdown */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Department / In-charge:</span>
                <strong className="text-slate-900">{settleModalItem.department?.name}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Fine Reference / Reason:</span>
                <span className="text-slate-700 italic">{settleModalItem.remarks || 'Institutional Recovery / Overdue'}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-2 text-sm">
                <span>Total Amount Due:</span>
                <span className="text-red-600 font-mono">₹{settleModalItem.amountDue}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xxs font-black text-slate-600 uppercase tracking-wider block">
                Select Instant Settlement Method:
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    paymentMethod === 'UPI' 
                      ? 'border-[#0c2340] bg-[#0c2340] text-white shadow-xs' 
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-xs">UPI / QR</span>
                  <span className="text-[9px] font-normal block opacity-80">GPay, PhonePe</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('NETBANKING')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    paymentMethod === 'NETBANKING' 
                      ? 'border-[#0c2340] bg-[#0c2340] text-white shadow-xs' 
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-xs">NetBanking</span>
                  <span className="text-[9px] font-normal block opacity-80">SBI, HDFC, ICICI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CAUTION_OFFSET')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    paymentMethod === 'CAUTION_OFFSET' 
                      ? 'border-[#0c2340] bg-[#0c2340] text-white shadow-xs' 
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-xs">Caution Offset</span>
                  <span className="text-[9px] font-normal block opacity-80">Deduct ₹10K Deposit</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xxs text-emerald-800 space-y-1">
              <span className="font-bold block text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Instant Department Sign-off
              </span>
              <p>
                Upon authorization, outstanding dues are immediately cleared to ₹0.00 and {settleModalItem.department?.name} status updates directly to <strong>APPROVED</strong>.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSettleModalItem(null)}
                className="px-4 py-2 text-xs font-bold uppercase rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSettleDues}
                disabled={settling}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {settling ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Settling Payment...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Authorize & Settle ₹{settleModalItem.amountDue}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VERIFIABLE DIGITAL NO-DUES CERTIFICATE MODAL
         ========================================================================= */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-900 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl text-slate-900">
            {/* IIIT Pune Official Header */}
            <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
              <div className="flex items-center justify-center gap-2 mb-1">
                <School className="w-7 h-7 text-[#0c2340]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-widest text-slate-950 uppercase">
                INDIAN INSTITUTE OF INFORMATION TECHNOLOGY, PUNE
              </h2>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                (An Institute of National Importance under Ministry of Education, Govt. of India)
              </p>
              <h3 className="text-base sm:text-lg font-black text-amber-800 uppercase tracking-widest pt-2">
                OFFICIAL NO-DUES CLEARANCE CERTIFICATE
              </h3>
              <p className="text-xs font-mono font-bold text-slate-600">
                Certificate ID: {certificate?.certificateId || `IIITP-ND-${new Date().getFullYear()}-${String(application?.id || 1).padStart(4, '0')}`}
              </p>
            </div>

            {/* Candidate Identity Particulars */}
            <div className="space-y-3 text-xs leading-relaxed text-slate-800">
              <p>
                This is to officially certify that Student <strong>{student?.name || user?.name}</strong>, bearing Roll No. / MIS <strong>{student?.userId || user?.userId}</strong>, enrolled in <strong>{student?.programme || 'B.Tech Computer Science & Engineering'}</strong> (Graduating Batch: <strong>{student?.batch || '2020-2024'}</strong>), has successfully fulfilled all institutional exit formalities and cleared all departmental accounts.
              </p>
              <p>
                As of <strong>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>, there are <strong>ZERO OUTSTANDING DUES</strong> recorded against the candidate across any of the 15 Institute administrative and academic divisions.
              </p>
            </div>

            {/* 15 Department Clearance Audit Table */}
            <div className="overflow-x-auto rounded border border-slate-400">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-[10px] uppercase font-bold border-b border-slate-400">
                  <tr>
                    <th className="py-2 px-3 border-r border-slate-400">#</th>
                    <th className="py-2 px-3 border-r border-slate-400">Sector & Department</th>
                    <th className="py-2 px-3 border-r border-slate-400">Verifying Authority</th>
                    <th className="py-2 px-3 border-r border-slate-400">Status</th>
                    <th className="py-2 px-3">Dues Recovered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-mono text-[11px]">
                  {clearances.map((c, i) => (
                    <tr key={c.id}>
                      <td className="py-1.5 px-3 border-r border-slate-300 font-bold">{i + 1}</td>
                      <td className="py-1.5 px-3 border-r border-slate-300 font-sans font-bold">{c.department?.name}</td>
                      <td className="py-1.5 px-3 border-r border-slate-300 font-sans text-slate-600">{c.officer?.name || 'Department In-charge'}</td>
                      <td className="py-1.5 px-3 border-r border-slate-300 text-emerald-700 font-bold">APPROVED</td>
                      <td className="py-1.5 px-3">₹{c.amountDue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Caution Money Reconciliation Summary */}
            <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span>Initial Institutional Caution Money Deposit:</span>
                <span className="font-mono font-bold">₹{cautionDeposit.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Less: Total Departmental Recoveries Settled:</span>
                <span className="font-mono">₹{totalAmountDue}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-bold border-t border-slate-300 pt-1 text-sm">
                <span>Net Refund Payable to Student (NEFT):</span>
                <span className="font-mono">₹{netRefundPayable.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Verification Footer & Signatures */}
            <div className="pt-4 flex items-center justify-between border-t-2 border-slate-900 text-xs">
              <div className="space-y-1">
                <div className="w-24 h-24 bg-slate-50 border border-slate-400 rounded flex items-center justify-center p-1">
                  <div className="text-center">
                    <QrCode className="w-16 h-16 text-slate-900 mx-auto" />
                    <span className="text-[8px] font-mono font-bold block text-slate-600">VERIFY ONLINE</span>
                  </div>
                </div>
                <p className="text-[9px] font-mono text-slate-500 mt-1">
                  Issued: {new Date().toLocaleDateString()}
                </p>
              </div>

              <div className="text-right space-y-6">
                <div className="font-mono text-[10px] text-emerald-700 font-bold">
                  ✓ Digitally Signed & Authenticated
                </div>
                <div>
                  <p className="font-black text-slate-900 border-t border-slate-800 pt-1 uppercase">
                    Registrar & Dean of Academics
                  </p>
                  <p className="text-[10px] text-slate-600 font-bold">
                    Indian Institute of Information Technology, Pune
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-950 hover:bg-black text-white font-bold rounded-lg text-xs uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Certificate
              </button>
              <button
                onClick={() => setShowCertModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-xs uppercase cursor-pointer"
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