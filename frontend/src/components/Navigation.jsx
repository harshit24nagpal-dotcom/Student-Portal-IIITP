import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import SOSModal from './SOSModal';
import { Shield, LogOut, Radio, User, Bell, ChevronDown, Check, X } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab }) {
  const { user, logout, quickLogin } = useAuth();
  const { inAppAlerts, removeAlert } = useSocket();
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [showDemoDropdown, setShowDemoDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleQuickSwitch = async (role) => {
    try {
      await quickLogin(role);
      setShowDemoDropdown(false);
      // Reset active tab for the new role if necessary
      if (role === 'ADMIN' || role === 'SECURITY') {
        setActiveTab('live');
      } else {
        setActiveTab('dashboard');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-iiitp-danger/20 text-red-400 border-red-500/30';
      case 'SECURITY': return 'bg-iiitp-warning/20 text-orange-400 border-orange-500/30';
      case 'RESPONDER': return 'bg-iiitp-success/20 text-green-400 border-green-500/30';
      case 'FACULTY': return 'bg-iiitp-gold/20 text-iiitp-gold border-iiitp-gold/30';
      default: return 'bg-iiitp-info/20 text-blue-400 border-blue-500/30';
    }
  };

  if (!user) return null;

  return (
    <>
      <header className="glass sticky top-0 z-40 w-full border-b border-iiitp-border px-6 py-4 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-iiitp-burgundy/20 rounded-lg border border-iiitp-burgundy/40 text-iiitp-danger">
            <Shield className="w-5 h-5 text-iiitp-danger animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-wide text-white leading-none">IIIT PUNE</h1>
            <p className="text-[10px] text-iiitp-gold tracking-widest uppercase font-semibold mt-0.5">CAMPUS CONNECT</p>
          </div>
        </div>

        {/* Center/Right: Actions */}
        <div className="flex items-center gap-4">
          {/* Quick Demo Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDemoDropdown(!showDemoDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-xs font-semibold rounded-lg text-slate-300 hover:border-slate-700 transition-colors"
            >
              <Radio className="w-3.5 h-3.5 text-iiitp-gold animate-pulse" />
              <span>Demo Quick Switch</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {showDemoDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-950 border border-iiitp-border rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="text-[10px] text-slate-500 font-extrabold uppercase px-3 py-1.5 border-b border-slate-900">
                  Switch User Role
                </p>
                <button
                  onClick={() => handleQuickSwitch('STUDENT')}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-900 hover:text-white flex items-center justify-between"
                >
                  <span>Student Portal</span>
                  {user.role === 'STUDENT' && <Check className="w-3.5 h-3.5 text-iiitp-info" />}
                </button>
                <button
                  onClick={() => handleQuickSwitch('FACULTY')}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-900 hover:text-white flex items-center justify-between"
                >
                  <span>Faculty Coordinator</span>
                  {user.role === 'FACULTY' && <Check className="w-3.5 h-3.5 text-iiitp-gold" />}
                </button>
                <button
                  onClick={() => handleQuickSwitch('RESPONDER')}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-900 hover:text-white flex items-center justify-between"
                >
                  <span>Responder Dispatch</span>
                  {user.role === 'RESPONDER' && <Check className="w-3.5 h-3.5 text-iiitp-success" />}
                </button>
                <button
                  onClick={() => handleQuickSwitch('ADMIN')}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-900 hover:text-white flex items-center justify-between"
                >
                  <span>Security Command</span>
                  {user.role === 'ADMIN' && <Check className="w-3.5 h-3.5 text-iiitp-danger" />}
                </button>
              </div>
            )}
          </div>

          {/* PULSING GLOBAL EMERGENCY BUTTON */}
          <button
            onClick={() => setIsSosOpen(true)}
            className="px-4 py-1.5 bg-iiitp-danger text-white text-xs font-black uppercase rounded-lg tracking-widest hover:bg-red-700 animate-pulse border border-red-500/40 shadow-glow-danger flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>TRIGGER SOS</span>
          </button>

          {/* User profile widget */}
          <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-200">{user.name}</p>
              <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded border mt-0.5 ${getRoleColor(user.role)}`}>
                {user.role}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-iiitp-gold font-bold text-xs uppercase">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded-lg transition-all"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Floating toast notifications for real-time Socket updates */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full">
        {inAppAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-xl shadow-2xl border flex items-start justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300 ${
              alert.type === 'danger'
                ? 'bg-red-950/95 border-red-500/50 text-red-200 shadow-red-950/40'
                : alert.type === 'warning'
                ? 'bg-amber-950/95 border-amber-500/50 text-amber-200 shadow-amber-950/40'
                : 'bg-slate-900/95 border-slate-800 text-slate-200 shadow-black/50'
            }`}
          >
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-wider mb-0.5">{alert.title}</p>
              <p className="text-[11px] leading-relaxed text-slate-300">{alert.message}</p>
            </div>
            <button
              onClick={() => removeAlert(alert.id)}
              className="p-0.5 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-200 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Render the SOS Modal */}
      <SOSModal 
        isOpen={isSosOpen} 
        onClose={() => setIsSosOpen(false)} 
        onSOSTriggered={(emergency) => {
          // If we have a custom trigger hook (e.g. refresh listings)
          if (activeTab === 'dashboard') {
            window.location.reload(); // Quick refresh to load active request
          }
        }}
      />
    </>
  );
}
