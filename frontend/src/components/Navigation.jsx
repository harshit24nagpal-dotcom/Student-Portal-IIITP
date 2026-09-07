import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import SOSModal from './SOSModal';
import { Shield, LogOut, Radio, ChevronDown, Check, X } from 'lucide-react';

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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-[#5367c8] animate-pulse" />
              <span className="hidden sm:inline">Role Switcher</span>
              <span className="sm:hidden">Switch</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showDemoDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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
                  <span>Faculty Instructor</span>
                  {user.role === 'FACULTY' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </button>
                <button
                  onClick={() => handleQuickSwitch('FACULTY_ADVISOR')}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-between cursor-pointer"
                >
                  <span>Faculty Advisor</span>
                  {user.role === 'FACULTY_ADVISOR' && <Check className="w-3.5 h-3.5 text-purple-600" />}
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

          {/* PULSING GLOBAL EMERGENCY BUTTON */}
          <button
            onClick={() => setIsSosOpen(true)}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase rounded-xl tracking-wider shadow-sm flex items-center gap-1.5 cursor-pointer animate-pulse"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>SOS</span>
          </button>

          {/* User profile widget */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-2.5 sm:pl-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800">{user.name}</p>
              <span className={`inline-block text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full border mt-0.5 ${getRoleColor(user.role)}`}>
                {user.role}
              </span>
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1c398e] text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs">
              {user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Floating toast notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full">
        {inAppAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-2xl shadow-xl border flex items-start justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300 ${
              alert.type === 'danger'
                ? 'bg-red-50 border-red-200 text-red-900 shadow-red-100'
                : alert.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-amber-100'
                : 'bg-white border-slate-200 text-slate-800 shadow-slate-200'
            }`}
          >
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-wider mb-0.5">{alert.title}</p>
              <p className="text-[11px] leading-relaxed text-slate-600 font-medium">{alert.message}</p>
            </div>
            <button
              onClick={() => removeAlert(alert.id)}
              className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <SOSModal 
        isOpen={isSosOpen} 
        onClose={() => setIsSosOpen(false)} 
        onSOSTriggered={() => {
          if (activeTab === 'dashboard') window.location.reload();
        }}
      />
    </>
  );
}
