import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, Mail, Eye, EyeOff, AlertTriangle, ArrowRight, ShieldCheck, 
  UserCheck, Building, GraduationCap, ShieldAlert, Sparkles, Phone, ExternalLink, HelpCircle
} from 'lucide-react';

export default function Login() {
  const { login, register, quickLogin } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

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
  const [autoFilledRole, setAutoFilledRole] = useState(null);

  // Pre-configured official demo accounts
  const demoAccounts = [
    {
      role: 'STUDENT',
      title: 'Continuing Student',
      name: 'Harshit Nagpal',
      mis: '112415079',
      dept: 'B.Tech CSE (3rd Sem)',
      identifier: '112415079',
      password: '112415079',
      badge: 'CONTINUING (SEM 3)',
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
      badge: 'FINAL YEAR (SEM 8)',
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
      badge: 'INSTRUCTOR',
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
      badge: 'ADVISOR',
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
      badge: 'WARDEN',
      color: 'indigo'
    },
    {
      role: 'ADMIN',
      title: 'Institutional Control',
      name: 'Chief Security Admin',
      mis: 'EMP202',
      dept: 'Super Administration & Dispatch',
      identifier: 'admin@iiitp.ac.in',
      password: 'admin123',
      badge: 'ADMIN',
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
      setError(err.message || 'Registration failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutofill = (acc) => {
    setIdentifier(acc.identifier);
    setPassword(acc.password);
    setAutoFilledRole(acc.role);
    setError('');
  };

  const handleQuickDemoLogin = async (roleToUse) => {
    setError('');
    setLoading(true);
    try {
      await quickLogin(roleToUse);
    } catch (err) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-3 sm:p-6 overflow-x-hidden font-sans bg-slate-900 text-slate-800">
      
      {/* 1. High-Resolution Campus Backdrop */}
      <img
        src="/iiitp_campus.jpg"
        alt="IIIT Pune Campus"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-40 filter brightness-90 saturate-105 pointer-events-none"
      />

      {/* 2. Soft Gradient Tint Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-900/60 to-slate-950/80 backdrop-blur-[2px] pointer-events-none"></div>

      {/* 3. Centered Elevated Institutional Login Card */}
      <div className="relative z-10 w-full max-w-[500px] bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-white/90 p-6 sm:p-8 my-4 transition-all">
        
        {/* Official IIIT Pune Emblem & Header */}
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <img 
              src="/iiitp_logo.png" 
              alt="Indian Institute of Information Technology Pune Emblem" 
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-md transition-transform hover:scale-105 duration-300"
            />
          </div>
          <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-[#0c2340] text-[10px] font-black uppercase rounded-full tracking-wider inline-block mb-1">
            Official Institutional Campus Connect
          </span>
          <h1 className="text-lg sm:text-xl font-black text-[#0c2340] tracking-tight leading-tight">
            INDIAN INSTITUTE OF INFORMATION TECHNOLOGY PUNE
          </h1>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5 tracking-wide">
            Autonomous Institute under Ministry of Education, Govt. of India
          </p>
        </div>

        {/* Subtle Divider Line */}
        <div className="w-full h-px bg-slate-200/80 my-3.5"></div>

        {/* Welcome Section */}
        <div className="mb-3.5">
          <h2 className="text-xl font-black text-slate-900 leading-snug">
            {isRegistering ? 'New Student Registration' : 'Welcome'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {isRegistering 
              ? 'Register with your institute email (<MIS>@cse.iiitp.ac.in).' 
              : 'Sign in using your Roll / MIS Number or Institute Email.'}
          </p>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="mb-3.5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 font-medium animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Controls */}
        {!isRegistering ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            
            {/* Roll / MIS Number or Email Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wider uppercase mb-1">
                ROLL / MIS NUMBER OR EMAIL
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setAutoFilledRole(null); }}
                  placeholder="e.g. 112415079 or 112415079@cse.iiitp.ac.in"
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0c2340] focus:ring-2 focus:ring-[#0c2340]/10 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-600 tracking-wider uppercase">
                  PASSWORD (DEFAULT: MIS NUMBER)
                </label>
                <span className="text-[10px] text-blue-700 font-bold">
                  Students: Use MIS No.
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setAutoFilledRole(null); }}
                  placeholder="Enter your password (e.g. 112415079)"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0c2340] focus:ring-2 focus:ring-[#0c2340]/10 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Default Password Reminder Hint */}
            <div className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center gap-2 text-xxs sm:text-[11px] text-blue-900">
              <span className="font-black text-blue-700 uppercase shrink-0">STUDENT AUTH:</span>
              <p className="font-semibold text-slate-700">
                Default password for students is your 9-digit MIS Number (e.g., <span className="font-mono font-bold text-[#0c2340]">112415079</span>).
              </p>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-[#0c2340] focus:ring-[#0c2340] cursor-pointer"
                />
                <span className="font-medium text-slate-600">Remember credentials</span>
              </label>
              <button
                type="button"
                onClick={() => alert("For password reset assistance, contact Campus IT Desk: support@iiitp.ac.in | Landline: 020-23456789")}
                className="font-semibold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 sm:py-3 bg-[#0c2340] hover:bg-[#16355d] active:scale-[0.99] text-white font-extrabold rounded-xl text-xs sm:text-sm tracking-wider uppercase shadow-md shadow-blue-950/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 mt-1"
            >
              <span>{loading ? 'AUTHENTICATING SESSION...' : 'SIGN IN TO PORTAL'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Student Registration Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wider uppercase mb-1">FULL NAME</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Harshit Nagpal"
                className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0c2340] focus:ring-2 focus:ring-[#0c2340]/10"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wider uppercase mb-1">INSTITUTE EMAIL</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="e.g. 112415079@cse.iiitp.ac.in"
                className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0c2340] focus:ring-2 focus:ring-[#0c2340]/10"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wider uppercase mb-1">PRIMARY PHONE NUMBER</label>
              <input
                type="text"
                value={regContact}
                onChange={(e) => setRegContact(e.target.value)}
                placeholder="+91 9988776655"
                className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0c2340] focus:ring-2 focus:ring-[#0c2340]/10"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 tracking-wider uppercase mb-1">PASSWORD</label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Choose password (or use MIS number)"
                className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0c2340] focus:ring-2 focus:ring-[#0c2340]/10"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#0c2340] hover:bg-[#16355d] text-white font-extrabold rounded-xl text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {loading ? 'REGISTERING ACCOUNT...' : 'COMPLETE REGISTRATION'}
            </button>
          </form>
        )}

        {/* Interactive Demo & Quick Login Credentials Panel */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Official Login Credentials Directory
            </span>
            <span className="text-[10px] text-blue-800 font-bold">1-Click Auto-Fill</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left">
            {demoAccounts.map((acc) => {
              const isSelected = autoFilledRole === acc.role;
              return (
                <div
                  key={acc.role}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500/30'
                      : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                  }`}
                  onClick={() => handleAutofill(acc)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[#0c2340]">
                      {acc.badge}
                    </span>
                    <span className="text-[10px] text-blue-700 font-bold hover:underline">
                      Fill →
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">{acc.name}</h4>
                  <p className="text-[10px] font-mono text-slate-500 truncate">ID: {acc.identifier}</p>
                  <p className="text-[10px] font-mono font-semibold text-slate-700">Pass: {acc.password}</p>
                </div>
              );
            })}
          </div>

          {/* Direct Instant Login Pills */}
          <div className="mt-3 flex items-center justify-between gap-1 flex-wrap pt-2 border-t border-slate-100">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Instant Login:</span>
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => handleAutofill(demoAccounts[0])}
                className="px-2 py-0.5 bg-blue-50 hover:bg-[#0c2340] hover:text-white text-blue-900 border border-blue-200 rounded text-[10px] font-bold transition-all cursor-pointer"
              >
                Student (Sem 3)
              </button>
              <button
                type="button"
                onClick={() => handleAutofill(demoAccounts[1])}
                className="px-2 py-0.5 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-900 border border-amber-300 rounded text-[10px] font-bold transition-all cursor-pointer"
              >
                Graduating (Sem 8)
              </button>
              <button
                type="button"
                onClick={() => handleAutofill(demoAccounts[2])}
                className="px-2 py-0.5 bg-cyan-50 hover:bg-cyan-800 hover:text-white text-cyan-900 border border-cyan-300 rounded text-[10px] font-bold transition-all cursor-pointer"
              >
                Instructor
              </button>
              <button
                type="button"
                onClick={() => handleAutofill(demoAccounts[3])}
                className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-900 hover:text-white text-emerald-900 border border-emerald-200 rounded text-[10px] font-bold transition-all cursor-pointer"
              >
                Advisor
              </button>
              <button
                type="button"
                onClick={() => handleAutofill(demoAccounts[4])}
                className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-900 hover:text-white text-indigo-900 border border-indigo-200 rounded text-[10px] font-bold transition-all cursor-pointer"
              >
                Warden
              </button>
              <button
                type="button"
                onClick={() => handleAutofill(demoAccounts[5])}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-900 border border-slate-300 rounded text-[10px] font-bold transition-all cursor-pointer"
              >
                Admin
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Switcher & Emergency Support Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center space-y-2">
          <div className="flex items-center justify-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="font-bold text-[#0c2340] hover:underline transition-colors cursor-pointer"
            >
              {isRegistering ? '← Back to Sign In' : 'New student account registration →'}
            </button>
          </div>

          <div className="pt-2 text-[10px] text-slate-500 font-medium space-y-1">
            <p>
              24x7 Ambulance: <a href="tel:+919826381867" className="font-bold text-red-600 hover:underline">+91 9826381867</a> • 
              Hospital: <a href="https://www.harneshwarhospital.com/" target="_blank" rel="noreferrer" className="font-bold text-blue-700 hover:underline">Harneshwar Hospital</a>
            </p>
            <p>
              Main Campus Security: <a href="tel:02023456789" className="font-mono font-bold text-slate-800 hover:underline">020-23456789</a> • Student Grievance: <a href="tel:02023456711" className="font-mono font-bold text-slate-800 hover:underline">020-23456711</a>
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
