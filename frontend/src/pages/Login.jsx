import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, GraduationCap, Building, Shield, Lock, Mail, 
  Eye, EyeOff, AlertTriangle, ArrowRight 
} from 'lucide-react';

export default function Login() {
  const { login, register, quickLogin } = useAuth();
  const [selectedRole, setSelectedRole] = useState('STUDENT'); // STUDENT, FACULTY, STAFF, ADMIN
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

  const roles = [
    { id: 'STUDENT', label: 'Student', icon: GraduationCap, defaultEmail: 'harshit@students.iiitp.ac.in' },
    { id: 'FACULTY', label: 'Faculty', icon: User, defaultEmail: 'anagha@iiitp.ac.in' },
    { id: 'STAFF', label: 'Warden', icon: Building, defaultEmail: 'warden@iiitp.ac.in' },
    { id: 'ADMIN', label: 'Admin', icon: Shield, defaultEmail: 'admin@iiitp.ac.in' },
  ];

  const handleRoleSelect = (roleObj) => {
    setSelectedRole(roleObj.id);
    setError('');
    if (!email) {
      setEmail(roleObj.defaultEmail);
    }
  };

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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden font-sans text-slate-900">
      
      {/* 1. Fullscreen IIIT Pune Campus Background Image */}
      <img
        src="/iiitp_campus.jpg"
        alt="IIIT Pune Terracotta Campus Building"
        className="absolute inset-0 w-full h-full object-cover object-center filter brightness-95 contrast-105"
      />

      {/* 2. Soft Light Overlay */}
      <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]"></div>

      {/* 3. Centered Elevated Institutional Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/80 p-8 sm:p-10 space-y-6 text-slate-900 my-8">
        
        {/* Official Circular IIIT Pune Emblem Logo Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <img 
              src="/iiitp_logo.png" 
              alt="Indian Institute of Information Technology Pune Logo" 
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-md hover:scale-105 transition-transform"
            />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#0B1D48]">
              INDIAN INSTITUTE OF INFORMATION TECHNOLOGY PUNE
            </p>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              IIIT Pune Campus Connect
            </h1>
          </div>
        </div>

        {/* Role Selector Segmented Controls in Official Website Blue */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 text-center">
            Select Portal Role
          </label>
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 border border-slate-200 rounded-xl">
            {roles.map((r) => {
              const IconComponent = r.icon;
              const isSelected = selectedRole === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRoleSelect(r)}
                  className={`py-2 px-1 rounded-lg text-xs font-black flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-[#0B1D48] text-white shadow-md ring-2 ring-[#0B1D48]/30' 
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className="text-[10px]">{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Controls */}
        {!isRegistering ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Email Input */}
            <div className="space-y-1">
              <label className="block text-xs font-extrabold uppercase text-slate-700 tracking-wider">
                Institutional Username / Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    selectedRole === 'STUDENT' ? 'e.g. 112415079@cse.iiitp.ac.in' :
                    selectedRole === 'FACULTY' ? 'e.g. anagha@iiitp.ac.in' :
                    selectedRole === 'STAFF' ? 'e.g. warden@iiitp.ac.in' : 'admin@iiitp.ac.in'
                  }
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0B1D48] focus:ring-1 focus:ring-[#0B1D48] transition-all font-semibold"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold uppercase text-slate-700 tracking-wider">
                  Password
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Contact IT Support at support@iiitp.ac.in for password reset."); }} className="text-xxs font-bold text-[#D9232D] hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter account password"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0B1D48] focus:ring-1 focus:ring-[#0B1D48] transition-all font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer font-bold">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 bg-slate-50 text-[#D9232D] focus:ring-[#D9232D]"
                />
                <span>Remember me</span>
              </label>
            </div>

            {/* Primary Action Button in Official Website Red */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#D9232D] hover:bg-[#b81b24] text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>SIGN IN</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Student Registration Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-extrabold text-slate-700 mb-1">Full Student Name</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Harshit Nagpal"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 mb-1">IIIT Pune Email</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="e.g. 112415079@cse.iiitp.ac.in"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 mb-1">Contact Number</label>
              <input
                type="text"
                value={regContact}
                onChange={(e) => setRegContact(e.target.value)}
                placeholder="+91 9988776655"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-700 mb-1">Create Password</label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#D9232D] hover:bg-[#b81b24] text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {loading ? 'Registering...' : 'REGISTER ACCOUNT'}
            </button>
          </form>
        )}

        {/* Bottom Options & Quick Demo Shortcuts */}
        <div className="pt-2 space-y-3 border-t border-slate-200 text-center">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-xs text-slate-600 hover:text-[#D9232D] font-extrabold transition-colors cursor-pointer"
          >
            {isRegistering 
              ? 'Already registered? Sign in here' 
              : 'New Student? Register account here'}
          </button>

          {/* Quick Demo Access Pills */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
              Quick Demo Login
            </span>
            <div className="flex flex-wrap items-center justify-center gap-1">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('STUDENT')}
                className="px-2 py-1 bg-slate-100 hover:bg-[#0B1D48] hover:text-white text-slate-800 rounded-md text-[10px] font-extrabold transition-all cursor-pointer"
              >
                🎓 Student
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('FACULTY')}
                className="px-2 py-1 bg-slate-100 hover:bg-[#0B1D48] hover:text-white text-slate-800 rounded-md text-[10px] font-extrabold transition-all cursor-pointer"
              >
                👨‍🏫 Advisor
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('HOSTEL_WARDEN')}
                className="px-2 py-1 bg-slate-100 hover:bg-[#0B1D48] hover:text-white text-slate-800 rounded-md text-[10px] font-extrabold transition-all cursor-pointer"
              >
                🏢 Warden
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('CLEARANCE_OFFICER')}
                className="px-2 py-1 bg-slate-100 hover:bg-[#0B1D48] hover:text-white text-slate-800 rounded-md text-[10px] font-extrabold transition-all cursor-pointer"
              >
                ⚖️ Officer
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('ADMIN')}
                className="px-2 py-1 bg-slate-100 hover:bg-[#0B1D48] hover:text-white text-slate-800 rounded-md text-[10px] font-extrabold transition-all cursor-pointer"
              >
                ⚡ Admin
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
