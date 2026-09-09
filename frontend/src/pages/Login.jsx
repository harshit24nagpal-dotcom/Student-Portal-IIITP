import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, Mail, Eye, EyeOff, AlertTriangle, ArrowRight, ShieldCheck, UserCheck 
} from 'lucide-react';

export default function Login() {
  const { login, register, quickLogin } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  // Form inputs
  const [email, setEmail] = useState('');
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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden font-sans bg-slate-900 text-slate-800">
      
      {/* 1. Visible Campus Background with Balanced Weight */}
      <img
        src="/iiitp_campus.jpg"
        alt="IIIT Pune Campus"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-60 filter brightness-95 saturate-110 pointer-events-none"
      />

      {/* 2. Soft Tint Overlay to enhance contrast for the login card */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-slate-900/20 to-slate-950/40 backdrop-blur-[1px] pointer-events-none"></div>

      {/* 3. Centered Elevated Institutional Login Card */}
      <div className="relative z-10 w-full max-w-[430px] bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-white/80 px-7 py-6 sm:px-9 sm:py-7 my-4 transition-all">
        
        {/* Official Circular IIIT Pune Emblem Logo Header */}
        <div className="text-center">
          <div className="flex justify-center mb-2.5">
            <img 
              src="/iiitp_logo.png" 
              alt="Indian Institute of Information Technology Pune Logo" 
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-md transition-transform hover:scale-105"
            />
          </div>
          <h1 className="text-xl sm:text-[23px] font-black text-[#0c2340] tracking-tight leading-tight">
            IIIT PUNE PORTAL
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-600 font-semibold mt-0.5 tracking-wide">
            Indian Institute of Information Technology Pune
          </p>
        </div>

        {/* Thin Subtle Divider Line */}
        <div className="w-full h-px bg-slate-200/80 my-3.5"></div>

        {/* Welcome Section */}
        <div className="mb-3.5">
          <h2 className="text-xl font-black text-slate-900 leading-snug">
            {isRegistering ? 'Student Registration' : 'Welcome'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {isRegistering 
              ? 'Create your account to access campus services.' 
              : 'Sign in to access your campus portal.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-3.5 p-2.5 bg-red-50/90 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 font-medium animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Controls */}
        {!isRegistering ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            
            {/* Email Input */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 tracking-wider uppercase mb-1">
                EMAIL
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your institute email"
                className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#5367c8] focus:ring-2 focus:ring-[#5367c8]/20 transition-all font-normal"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 tracking-wider uppercase mb-1">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#5367c8] focus:ring-2 focus:ring-[#5367c8]/20 transition-all font-normal"
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-[#5367c8] focus:ring-[#5367c8] cursor-pointer"
                />
                <span className="font-medium text-slate-600">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => alert("For password reset assistance, please contact the IT Helpdesk at support@iiitp.ac.in")}
                className="font-semibold text-[#d94f38] hover:text-[#b83b26] transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 sm:py-3 bg-[#5367c8] hover:bg-[#475bc2] active:scale-[0.99] text-white font-semibold rounded-xl text-xs sm:text-sm tracking-wider uppercase shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 mt-1"
            >
              <span>{loading ? 'SIGNING IN...' : 'SIGN IN'}</span>
            </button>
          </form>
        ) : (
          /* Student Registration Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 tracking-wider uppercase mb-1">FULL NAME</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Harshit Nagpal"
                className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#5367c8] focus:ring-2 focus:ring-[#5367c8]/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 tracking-wider uppercase mb-1">INSTITUTE EMAIL</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="e.g. 112415079@cse.iiitp.ac.in"
                className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#5367c8] focus:ring-2 focus:ring-[#5367c8]/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 tracking-wider uppercase mb-1">CONTACT NUMBER</label>
              <input
                type="text"
                value={regContact}
                onChange={(e) => setRegContact(e.target.value)}
                placeholder="+91 9988776655"
                className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#5367c8] focus:ring-2 focus:ring-[#5367c8]/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 tracking-wider uppercase mb-1">PASSWORD</label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#5367c8] focus:ring-2 focus:ring-[#5367c8]/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#5367c8] hover:bg-[#475bc2] text-white font-semibold rounded-xl text-xs tracking-wider uppercase shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {loading ? 'REGISTERING...' : 'REGISTER ACCOUNT'}
            </button>
          </form>
        )}

        {/* Bottom Help & Switch Section */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center space-y-2.5">
          <p className="text-xs text-slate-500">
            Need help?{' '}
            <button
              type="button"
              onClick={() => alert("Campus IT Support: it_support@iiitp.ac.in | Phone: +91 20 2345 6789")}
              className="font-semibold text-[#1c398e] hover:underline cursor-pointer"
            >
              Contact Campus Support
            </button>
          </p>

          <div className="flex items-center justify-center gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="font-medium text-slate-500 hover:text-[#5367c8] transition-colors cursor-pointer"
            >
              {isRegistering ? 'Back to Sign In' : 'New student registration'}
            </button>
          </div>

          {/* Quick Demo Access Pills */}
          <div className="pt-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
              Quick Demo Access
            </span>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('STUDENT')}
                className="px-2.5 py-1 bg-slate-50 hover:bg-[#5367c8] hover:text-white text-slate-600 border border-slate-200/70 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('FACULTY')}
                className="px-2.5 py-1 bg-slate-50 hover:bg-[#5367c8] hover:text-white text-slate-600 border border-slate-200/70 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
              >
                Faculty
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('HOSTEL_WARDEN')}
                className="px-2.5 py-1 bg-slate-50 hover:bg-[#5367c8] hover:text-white text-slate-600 border border-slate-200/70 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
              >
                Warden
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('CLEARANCE_OFFICER')}
                className="px-2.5 py-1 bg-slate-50 hover:bg-[#5367c8] hover:text-white text-slate-600 border border-slate-200/70 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
              >
                Officer
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('ADMIN')}
                className="px-2.5 py-1 bg-slate-50 hover:bg-[#5367c8] hover:text-white text-slate-600 border border-slate-200/70 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
              >
                Admin
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

