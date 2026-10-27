import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Eye, EyeOff, AlertTriangle, ArrowRight, Sparkles, 
  X, Shield, User, GraduationCap, Briefcase, Building, HelpCircle, Phone, Info
} from 'lucide-react';

export default function Login() {
  const { login, register, quickLogin } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(null); // 'privacy' | 'terms' | 'support' | null

  // Form inputs
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Student Registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regContact, setRegContact] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-configured official demo accounts for institutional testing & presentation
  const demoAccounts = [
    {
      role: 'STUDENT',
      title: 'Continuing Student',
      name: 'Harshit Nagpal',
      mis: '112415079',
      dept: 'B.Tech CSE (3rd Sem)',
      identifier: '112415079',
      password: '112415079',
      badge: 'Student (Sem 3)',
      icon: GraduationCap,
      color: 'blue'
    },
    {
      role: 'STUDENT',
      title: 'Graduating Finalist',
      name: 'Aarav Verma',
      mis: '112001001',
      dept: 'B.Tech CSE (8th Sem / Final)',
      identifier: '112001001',
      password: '112001001',
      badge: 'Final Year (Sem 8)',
      icon: GraduationCap,
      color: 'amber'
    },
    {
      role: 'FACULTY',
      title: 'Course Instructor',
      name: 'Ms. Anagha Khiste',
      mis: 'EMP101',
      dept: 'CSE Course Instructor (LNO)',
      identifier: 'anagha.khiste@iiitp.ac.in',
      password: 'faculty123',
      badge: 'Instructor',
      icon: User,
      color: 'cyan'
    },
    {
      role: 'FACULTY_ADVISOR',
      title: 'Academic Advisor',
      name: 'Dr. Shrikant Salve',
      mis: 'EMP102',
      dept: 'CSE Faculty Advisor',
      identifier: 'advisor.cse@iiitp.ac.in',
      password: 'advisor123',
      badge: 'Advisor',
      icon: Briefcase,
      color: 'emerald'
    },
    {
      role: 'HOSTEL_WARDEN',
      title: 'Hostel Administration',
      name: 'Prof. Ramesh Patil',
      mis: 'EMP103',
      dept: 'Chief Hostel Warden',
      identifier: 'warden@iiitp.ac.in',
      password: 'warden123',
      badge: 'Warden',
      icon: Building,
      color: 'indigo'
    },
    {
      role: 'ADMIN',
      title: 'Super Administrator',
      name: 'Chief Security Admin',
      mis: 'EMP202',
      dept: 'Super Administration & Dispatch',
      identifier: 'admin@iiitp.ac.in',
      password: 'admin123',
      badge: 'Admin',
      icon: Shield,
      color: 'slate'
    }
  ];

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
    } catch (err) {
      setError(err.message || 'Invalid institutional credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(regName, regEmail, regPassword, regContact);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutofill = (acc) => {
    setIdentifier(acc.identifier);
    setPassword(acc.password);
    setError('');
    setShowDemoModal(false);
  };

  const handleQuickLogin = async (acc) => {
    setError('');
    setLoading(true);
    setShowDemoModal(false);
    try {
      await quickLogin(acc.role);
    } catch (err) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden font-sans select-none">
      
      {/* 1. Full-Screen Campus Backdrop (from Figma) */}
      <img
        src="/iiitp_campus.jpg"
        alt="IIIT Pune Campus"
        className="fixed inset-0 w-full h-full object-cover object-center pointer-events-none"
      />

      {/* 2. Soft Vignette / Blur Overlay (from Figma) */}
      <div className="fixed inset-0 bg-slate-950/35 backdrop-blur-[1px] pointer-events-none"></div>

      {/* 3. Floating Quick Demo Accounts Pill Button (Top Right) */}
      <header className="relative z-20 w-full pt-3 sm:pt-4 px-4 sm:px-8 flex justify-end items-center">
        <button
          type="button"
          onClick={() => setShowDemoModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white text-slate-800 text-xs font-semibold shadow-lg shadow-black/20 backdrop-blur-md border border-white/60 transition-all hover:scale-105 cursor-pointer active:scale-95"
          title="Quickly fill institutional test credentials"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Demo Accounts</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-mono font-bold text-slate-600">
            6 Roles
          </span>
        </button>
      </header>

      {/* 4. Centered Floating White Login Card (Figma Node 0-6 Design) */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-3 sm:p-4 my-auto">
        <div className="w-full max-w-[400px] sm:max-w-[415px] bg-white rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.38)] border border-white/90 px-6 py-6 sm:px-8 sm:py-7 transition-all">
          
          {/* Circular IIIT Pune Emblem */}
          <div className="flex justify-center mb-1.5">
            <img 
              src="/iiitp_logo.png" 
              alt="IIIT Pune Emblem" 
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain transition-transform hover:scale-105 duration-300"
            />
          </div>

          {/* Institutional Title & Subtitle */}
          <div className="text-center">
            <h1 className="text-sm sm:text-base font-bold text-[#1e293b] tracking-wider uppercase">
              IIIT PUNE PORTAL
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5">
              Indian Institute of Information Technology Pune
            </p>
          </div>

          {/* Welcome Back & Subtitle */}
          <div className="mt-4 mb-3 text-left">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
              {isRegistering ? 'Create an Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isRegistering 
                ? 'Enter your institutional details to register' 
                : 'Please enter your details to sign in'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 font-medium animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Content */}
          {!isRegistering ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              
              {/* Email / Roll Number Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 text-left">
                  Email
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your email / roll number"
                  className="w-full px-3.5 py-2 sm:py-2.5 bg-[#f8fafc] border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#5c6bc0] focus:ring-2 focus:ring-[#5c6bc0]/25 transition-all font-normal"
                />
              </div>

              {/* Password Field with Eye Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 text-left">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-10 py-2 sm:py-2.5 bg-[#f8fafc] border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#5c6bc0] focus:ring-2 focus:ring-[#5c6bc0]/25 transition-all font-normal"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 sm:top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#5c6bc0] focus:ring-[#5c6bc0]/30 cursor-pointer"
                  />
                  <span className="text-slate-600 text-xs font-medium">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="font-semibold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer text-xs"
                >
                  Forgot password?
                </button>
              </div>

              {/* Primary Action Button - Signature Figma Indigo */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 sm:py-3 bg-[#5c6bc0] hover:bg-[#4d5cb5] active:scale-[0.99] text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md shadow-[#5c6bc0]/30 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            /* Student Registration Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 text-left">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Harshit Nagpal"
                  className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200/90 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#5c6bc0] focus:ring-2 focus:ring-[#5c6bc0]/25"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 text-left">
                  Institute Email
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. 112415079@cse.iiitp.ac.in"
                  className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200/90 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#5c6bc0] focus:ring-2 focus:ring-[#5c6bc0]/25"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 text-left">
                  Primary Contact Number
                </label>
                <input
                  type="text"
                  value={regContact}
                  onChange={(e) => setRegContact(e.target.value)}
                  placeholder="+91 9988776655"
                  className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200/90 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#5c6bc0] focus:ring-2 focus:ring-[#5c6bc0]/25"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 text-left">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Choose a secure password"
                  className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200/90 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#5c6bc0] focus:ring-2 focus:ring-[#5c6bc0]/25"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#5c6bc0] hover:bg-[#4d5cb5] text-white font-semibold rounded-xl text-xs shadow-md shadow-[#5c6bc0]/30 flex items-center justify-center gap-2 transition-all cursor-pointer mt-1"
              >
                {loading ? 'Registering...' : 'Create Student Account'}
              </button>
            </form>
          )}

          {/* Don't have an account? Sign up */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              {isRegistering ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setIsRegistering(false); setError(''); }}
                    className="font-semibold text-[#5c6bc0] hover:text-[#4d5cb5] hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setIsRegistering(true); setError(''); }}
                    className="font-semibold text-[#5c6bc0] hover:text-[#4d5cb5] hover:underline cursor-pointer"
                  >
                    Sign up
                  </button>
                </>
              )}
            </p>
          </div>

        </div>
      </main>

      {/* 5. Translucent Bottom Footer Bar (from Figma) */}
      <footer className="relative z-20 w-full py-2.5 px-4 bg-black/40 backdrop-blur-md text-white/80 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-white/10">
        <div className="text-center sm:text-left">
          © 2026 Indian Institute of Information Technology Pune. All rights reserved.
        </div>
        <div className="flex items-center gap-4 text-white/70">
          <button 
            type="button" 
            onClick={() => setShowPolicyModal('privacy')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <span>·</span>
          <button 
            type="button" 
            onClick={() => setShowPolicyModal('terms')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Terms of Service
          </button>
          <span>·</span>
          <button 
            type="button" 
            onClick={() => setShowPolicyModal('support')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Contact Support
          </button>
        </div>
      </footer>

      {/* 6. Institutional Demo Accounts Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowDemoModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h3 className="text-lg font-bold text-slate-900">
                Institutional Demo Credentials Directory
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Select any role below to 1-click auto-fill credentials or instantly sign in for presentation and testing.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {demoAccounts.map((acc) => {
                const IconComponent = acc.icon;
                return (
                  <div
                    key={acc.identifier}
                    className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-white hover:border-[#5c6bc0]/50 hover:shadow-md transition-all text-left flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[#1e293b]">
                          <IconComponent className="w-3 h-3 text-[#5c6bc0]" />
                          {acc.badge}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500">
                          {acc.title}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 truncate">{acc.name}</h4>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{acc.dept}</p>
                      <div className="mt-2 text-[11px] font-mono bg-white/80 p-1.5 rounded border border-slate-100">
                        <p className="text-slate-600 truncate">ID: <span className="font-semibold text-slate-800">{acc.identifier}</span></p>
                        <p className="text-slate-600 truncate">Pass: <span className="font-semibold text-slate-800">{acc.password}</span></p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAutofill(acc)}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-800 text-[11px] font-semibold transition-all cursor-pointer text-center"
                      >
                        Auto-Fill
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLogin(acc)}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-[#5c6bc0] hover:bg-[#4d5cb5] text-white text-[11px] font-semibold transition-all cursor-pointer text-center"
                      >
                        Sign In →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Student default password is their 9-digit MIS number.</span>
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Forgot Password / IT Helpdesk Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 relative text-left">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Account Recovery & IT Support
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              For institutional security, password resets are processed through the IIIT Pune Computer Center & Registrar.
            </p>

            <div className="space-y-2.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
              <div>
                <span className="font-bold text-slate-700">Official IT Helpdesk:</span>
                <p className="font-mono text-[#5c6bc0] font-semibold mt-0.5">support@iiitp.ac.in</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Campus Telephone Helpdesk:</span>
                <p className="font-mono text-slate-800 font-semibold mt-0.5">020-23456789 (Ext: 204)</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Physical Office:</span>
                <p className="text-slate-600 mt-0.5">Computer Center, Room 204, Academic Block, IIIT Pune Campus</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Students Note:</span>
                <p className="text-slate-600 mt-0.5">Default initial password is set to your 9-digit MIS number (e.g. 112415079).</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 bg-[#5c6bc0] hover:bg-[#4d5cb5] text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer text-center"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* 8. Footer Policies & Support Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 relative text-left">
            <button
              type="button"
              onClick={() => setShowPolicyModal(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {showPolicyModal === 'privacy' && (
              <>
                <h3 className="text-base font-bold text-slate-900 mb-1">Privacy Policy</h3>
                <p className="text-xs text-slate-500 mb-3">Institutional Data Protection & Usage Policy</p>
                <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 max-h-60 overflow-y-auto">
                  <p>All student and faculty records are secured under institutional compliance guidelines. Academic records, attendance entries, and emergency alerts are encrypted and accessible only to authorized departmental personnel.</p>
                  <p>No telemetry or personal data is transmitted to third-party ad networks or commercial intermediaries.</p>
                </div>
              </>
            )}

            {showPolicyModal === 'terms' && (
              <>
                <h3 className="text-base font-bold text-slate-900 mb-1">Terms of Service</h3>
                <p className="text-xs text-slate-500 mb-3">Campus IT Acceptable Use Guidelines</p>
                <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 max-h-60 overflow-y-auto">
                  <p>By logging into the IIIT Pune Campus Portal, users agree to uphold academic integrity and adhere to the Institute IT Code of Conduct.</p>
                  <p>Unauthorized credential sharing, automated scraping, or misuse of the Emergency SOS dispatch system is subject to disciplinary review.</p>
                </div>
              </>
            )}

            {showPolicyModal === 'support' && (
              <>
                <h3 className="text-base font-bold text-slate-900 mb-1">Campus Support Directory</h3>
                <p className="text-xs text-slate-500 mb-3">24x7 Emergency & Administrative Contacts</p>
                <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                  <p><span className="font-bold text-slate-800">Campus IT Helpdesk:</span> support@iiitp.ac.in</p>
                  <p><span className="font-bold text-slate-800">Security Control Room:</span> 020-23456789</p>
                  <p><span className="font-bold text-slate-800">Emergency Ambulance:</span> +91 9826381867</p>
                  <p><span className="font-bold text-slate-800">Nearest Hospital:</span> Harneshwar Hospital (Talegaon Dabhade)</p>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowPolicyModal(null)}
              className="w-full py-2.5 bg-[#5c6bc0] hover:bg-[#4d5cb5] text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer text-center"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
