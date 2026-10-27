import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import SOSModal from './SOSModal';
import { Shield, LogOut, Radio, ChevronDown, Check, X, Phone, PhoneCall } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab }) {
  const { user, logout, quickLogin } = useAuth();
  const { inAppAlerts, removeAlert } = useSocket();
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [showDemoDropdown, setShowDemoDropdown] = useState(false);

  const handleQuickSwitch = async (role) => {
    try {
      await quickLogin(role);
      setShowDemoDropdown(false);
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
      case 'ADMIN': return 'bg-red-50 text-red-700 border-red-200';
      case 'SECURITY': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'RESPONDER': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PLACEMENT_OFFICER': return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      case 'FACULTY': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'FACULTY_ADVISOR': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'HOSTEL_WARDEN': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'CLEARANCE_OFFICER': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  if (!user) return null;

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between shadow-xs">
        {/* Left: Brand with Prominent Official IIIT Pune Logo */}
        <div className="flex items-center gap-3.5">
          <img 
            src="/iiitp_logo.png" 
            alt="IIIT Pune Official Logo" 
            className="w-13 h-13 sm:w-15 sm:h-15 md:w-16 md:h-16 object-contain drop-shadow-sm transition-transform hover:scale-105" 
          />
          <div className="flex flex-col justify-center">
            <h1 className="font-black text-base sm:text-lg tracking-tight text-[#0c2340] leading-tight">
              IIIT PUNE
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-500 tracking-wider font-bold uppercase leading-tight">
              CAMPUS PORTAL
            </p>
          </div>
        </div>

        {/* Center/Right: Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick Demo Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDemoDropdown(!showDemoDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-md text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-[#5367c8] animate-pulse" />
              <span className="hidden sm:inline">Role Switcher</span>
              <span className="sm:hidden">Switch</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showDemoDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-md shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-3.5 py-1.5 border-b border-slate-100">
                  Select System Role
                </p>
                <button
                  onClick={() => handleQuickSwitch('STUDENT')}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-between cursor-pointer"
                >
                  <span>Student Portal</span>
                  {user.role === 'STUDENT' && <Check className="w-3.5 h-3.5 text-[#5367c8]" />}
                </button>
                <button
                  onClick={() => handleQuickSwitch('FACULTY')}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-between cursor-pointer"
                >
                  <span>Faculty (Teaching & Advisory)</span>
                  {(user.role === 'FACULTY' || user.role === 'FACULTY_ADVISOR') && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </button>
                <button
                  onClick={() => handleQuickSwitch('PLACEMENT_OFFICER')}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-between cursor-pointer"
                >
                  <span>Placement Officer (T&P)</span>
                  {user.role === 'PLACEMENT_OFFICER' && <Check className="w-3.5 h-3.5 text-cyan-700" />}
                </button>
                <button
                  onClick={() => handleQuickSwitch('HOSTEL_WARDEN')}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-between cursor-pointer"
                >
                  <span>Hostel Warden</span>
                  {user.role === 'HOSTEL_WARDEN' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </button>
                <button
                  onClick={() => handleQuickSwitch('CLEARANCE_OFFICER')}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-between cursor-pointer"
                >
                  <span>No-Dues Clearance Officer</span>
                  {user.role === 'CLEARANCE_OFFICER' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                <button
                  onClick={() => handleQuickSwitch('RESPONDER')}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-between cursor-pointer"
                >
                  <span>Responder Dispatch</span>
                  {user.role === 'RESPONDER' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                <button
                  onClick={() => handleQuickSwitch('ADMIN')}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-between cursor-pointer"
                >
                  <span>Security & Admin Command</span>
                  {user.role === 'ADMIN' && <Check className="w-3.5 h-3.5 text-red-600" />}
                </button>
              </div>
            )}
          </div>

          {/* 1-Click Phone Call Helpline (Direct Phone Calling) */}
          <a
            href="tel:9826381867"
            className="px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded-md tracking-wider shadow-sm flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
            title="Instant 1-Click Call Campus Control (+91 9826381867)"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Call Help</span>
          </a>

          {/* PULSING GLOBAL EMERGENCY BUTTON */}
          <button
            onClick={() => setIsSosOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase rounded-md tracking-wider shadow-sm flex items-center gap-1.5 cursor-pointer animate-pulse"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>SOS</span>
          </button>

          {/* User profile widget */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-2.5 sm:pl-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800">{user.name}</p>
              <span className={`inline-block text-[9px] font-semibold uppercase px-2 py-0.5 rounded border mt-0.5 ${getRoleColor(user.role)}`}>
                {user.role}
              </span>
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-[#1c398e] text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs">
              {user.name ? user.name[0] : 'U'}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Floating Global SOS Modal */}
      <SOSModal isOpen={isSosOpen} onClose={() => setIsSosOpen(false)} />

      {/* In-app Toast Broadcasts */}
      {inAppAlerts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {inAppAlerts.map((alert) => (
            <div
              key={alert.id}
              className="pointer-events-auto p-3.5 rounded-md shadow-lg border border-red-500 bg-red-900 text-white flex items-start justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300"
            >
              <div className="flex items-start gap-2.5">
                <Shield className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold tracking-tight uppercase text-red-200">
                    {alert.title || 'Emergency Notification'}
                  </h4>
                  <p className="text-xs text-slate-100 mt-0.5">{alert.message}</p>
                </div>
              </div>
              <button
                onClick={() => removeAlert(alert.id)}
                className="text-slate-300 hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
