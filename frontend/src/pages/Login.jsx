import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, Radio, AlertTriangle, UserPlus, LogIn, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const { login, register, quickLogin } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  // Sign In form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regContact, setRegContact] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Parse email branch & MIS live
  const getBranchDetails = (inputEmail) => {
    const trimmed = inputEmail.trim().toLowerCase();
    const match = trimmed.match(/^(\d+)@(ece|cse)\.iiitp\.ac\.in$/i);
    if (!match) return null;
    return {
      mis: match[1],
      branch: match[2].toUpperCase() === 'CSE' ? 'Computer Science & Engineering (CSE)' : 'Electronics & Communication Engineering (ECE)',
      isCse: match[2].toUpperCase() === 'CSE',
    };
  };

  const detectedBranch = getBranchDetails(regEmail);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Invalid credentials');
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
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    setError('');
    setLoading(true);
    try {
      await quickLogin(role);
    } catch (err) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-iiitp-dark font-sans text-slate-100">
      {/* Left side: Premium Branding Portal */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-16 bg-gradient-to-br from-iiitp-navy via-slate-900 to-black relative overflow-hidden border-b md:border-b-0 md:border-r border-iiitp-border">
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-iiitp-gold opacity-10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-iiitp-burgundy opacity-20 rounded-full blur-[100px]"></div>

        <div className="flex items-center gap-3 z-10">
          <div className="p-2.5 bg-iiitp-burgundy/20 rounded-xl border border-iiitp-burgundy/40 text-iiitp-burgundy">
            <Shield className="w-8 h-8 text-iiitp-danger animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">IIIT PUNE</h1>
            <p className="text-xs text-iiitp-gold tracking-widest uppercase font-semibold">Campus Connect</p>
          </div>
        </div>

        <div className="my-auto py-12 z-10 max-w-lg">
          <span className="px-3 py-1 bg-iiitp-gold/10 border border-iiitp-gold/20 text-iiitp-gold rounded-full text-xs font-semibold uppercase tracking-wider">
            Institutional Digital Platform
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-6 leading-tight text-white">
            One Campus.<br />One Platform.<br />
            <span className="text-iiitp-danger">Instant Support.</span>
          </h2>
          <p className="mt-4 text-slate-400 text-base leading-relaxed">
            IIIT Pune's integrated digital portal for students, faculty, and administrative authorities. Access emergency response, academic notices, facility bookings, and campus updates.
          </p>
        </div>

        <div className="z-10 flex gap-6 text-slate-500 text-xs">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-iiitp-gold" />
            <span>Institutional Authentication</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-iiitp-success" />
            <span>Role-Based Dispatch</span>
          </div>
        </div>
      </div>

      {/* Right side: Auth Form Panel */}
      <div className="w-full md:w-[480px] flex flex-col justify-center p-8 md:p-12 bg-slate-950">
        <div className="w-full max-w-sm mx-auto">
          {/* Auth Tab Switcher */}
          <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl mb-6">
            <button
              onClick={() => { setIsRegistering(false); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                !isRegistering 
                  ? 'bg-iiitp-burgundy text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              onClick={() => { setIsRegistering(true); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                isRegistering 
                  ? 'bg-iiitp-burgundy text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              New Account
            </button>
          </div>

          <h3 className="text-2xl font-bold tracking-tight text-white">
            {isRegistering ? 'Create Student Account' : 'Institutional Sign In'}
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            {isRegistering 
              ? 'Register using your official IIIT Pune CSE or ECE MIS email' 
              : 'Enter your credentials to access the campus portal'}
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-950/40 border border-red-500/30 text-red-300 rounded-lg flex items-start gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!isRegistering ? (
            /* Sign In Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4 mt-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Campus Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="112415079@cse.iiitp.ac.in"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-iiitp-border rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-iiitp-gold text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-iiitp-border rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-iiitp-gold text-sm transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-iiitp-burgundy to-red-700 hover:from-red-800 hover:to-red-600 disabled:opacity-50 text-white font-semibold rounded-lg text-sm shadow-md transition-all duration-200"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 mt-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Harshit Nagpal"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-iiitp-border rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-iiitp-gold text-xs transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Institutional Email (<span className="text-iiitp-gold">CSE/ECE</span>)
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="112415079@cse.iiitp.ac.in or 112416001@ece.iiitp.ac.in"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-iiitp-border rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-iiitp-gold text-xs transition-colors"
                />
                
                {/* Branch Live Detection Banner */}
                {detectedBranch ? (
                  <div className="mt-2 p-2 bg-iiitp-success/10 border border-iiitp-success/30 rounded-md flex items-center justify-between text-xxs text-iiitp-success">
                    <span className="flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Branch: {detectedBranch.branch}
                    </span>
                    <span className="font-mono bg-iiitp-success/20 px-1.5 py-0.5 rounded">
                      MIS: {detectedBranch.mis}
                    </span>
                  </div>
                ) : (
                  <p className="text-[9.5px] text-slate-500 mt-1">
                    Format: <code className="text-slate-300">&lt;MIS&gt;@cse.iiitp.ac.in</code> or <code className="text-slate-300">&lt;MIS&gt;@ece.iiitp.ac.in</code>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={regContact}
                  onChange={(e) => setRegContact(e.target.value)}
                  placeholder="+91 9988776655"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-iiitp-border rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-iiitp-gold text-xs transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-iiitp-border rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-iiitp-gold text-xs transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-iiitp-burgundy to-red-700 hover:from-red-800 hover:to-red-600 disabled:opacity-50 text-white font-semibold rounded-lg text-xs uppercase tracking-wider shadow-md transition-all duration-200 mt-2"
              >
                {loading ? 'Creating Student Account...' : 'Register & Launch Portal'}
              </button>
            </form>
          )}

          {/* Quick Demo Access Divider */}
          <div className="relative flex py-5 items-center mt-6">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-slate-500 text-xxs font-semibold uppercase tracking-widest">
              Demo Access Panel
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <p className="text-slate-400 text-xs text-center mb-3">
            Click to instantly log in with pre-seeded demo accounts:
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('STUDENT')}
              className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-slate-800 hover:border-iiitp-info/40 bg-slate-900/40 hover:bg-iiitp-info/10 text-center transition-all duration-200"
            >
              <span className="text-xs font-bold text-white">Student SOS</span>
              <span className="text-xxs text-iiitp-info mt-0.5 font-semibold">Harshit (112415079)</span>
            </button>

            <button
              onClick={() => handleQuickLogin('RESPONDER')}
              className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-slate-800 hover:border-iiitp-success/40 bg-slate-900/40 hover:bg-iiitp-success/10 text-center transition-all duration-200"
            >
              <span className="text-xs font-bold text-white">Responder</span>
              <span className="text-xxs text-iiitp-success mt-0.5 font-semibold">Rajesh (Security)</span>
            </button>

            <button
              onClick={() => handleQuickLogin('ADMIN')}
              className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-slate-800 hover:border-iiitp-danger/40 bg-slate-900/40 hover:bg-iiitp-danger/10 text-center transition-all duration-200"
            >
              <span className="text-xs font-bold text-white">Security Admin</span>
              <span className="text-xxs text-iiitp-danger mt-0.5 font-semibold">Control Center</span>
            </button>

            <button
              onClick={() => handleQuickLogin('FACULTY')}
              className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-slate-800 hover:border-iiitp-gold/40 bg-slate-900/40 hover:bg-iiitp-gold/10 text-center transition-all duration-200"
            >
              <span className="text-xs font-bold text-white">Faculty Coordinator</span>
              <span className="text-xxs text-iiitp-gold mt-0.5 font-semibold">Anagha Uday Khiste</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
