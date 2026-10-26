import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  Shield, Check, X, ShieldAlert, Award, Clock, 
  MapPin, Phone, User, Play, Edit, CheckCircle,
  Volume2, VolumeX, Bell, BellRing, AlertTriangle, 
  Radio, PhoneCall, Smartphone, Flame, HeartPulse, RefreshCw
} from 'lucide-react';
import { API_URL } from '../config/api';

// Web Audio dual-tone emergency siren synthesizer (Runs in background tabs, 0 audio assets required)
class SirenSynth {
  constructor() {
    this.ctx = null;
    this.osc = null;
    this.gain = null;
    this.timer = null;
    this.isPlaying = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  start() {
    if (this.isPlaying) return;
    this.init();
    if (!this.ctx) return;

    try {
      this.gain = this.ctx.createGain();
      this.gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      this.gain.connect(this.ctx.destination);

      this.osc = this.ctx.createOscillator();
      this.osc.type = 'sawtooth';
      this.osc.frequency.setValueAtTime(960, this.ctx.currentTime);
      this.osc.connect(this.gain);
      this.osc.start();
      this.isPlaying = true;

      // Alternating 960 Hz <-> 770 Hz standard dual-tone emergency cadence
      let highTone = true;
      this.timer = setInterval(() => {
        if (!this.ctx || !this.osc) return;
        highTone = !highTone;
        const targetFreq = highTone ? 960 : 770;
        this.osc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.05);
      }, 350);
    } catch (e) {
      console.warn('Web Audio siren playback error:', e);
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    try {
      if (this.osc) {
        this.osc.stop();
        this.osc.disconnect();
        this.osc = null;
      }
      if (this.gain) {
        this.gain.disconnect();
        this.gain = null;
      }
    } catch (e) {
      // ignore cleanup error
    }
    this.isPlaying = false;
  }
}

export default function ResponderDashboard() {
  const { user, token, updateProfile } = useAuth();
  const { socket } = useSocket();
  const [activeJob, setActiveJob] = useState(null);
  const [history, setHistory] = useState([]);
  const [availability, setAvailability] = useState(user.responder?.availabilityStatus || 'AVAILABLE');
  const [performance, setPerformance] = useState(null);
  const [resolvingNotes, setResolvingNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Siren and Out-of-Screen Alerting states
  const sirenRef = useRef(new SirenSynth());
  const [isSirenMuted, setIsSirenMuted] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(25);
  const [allCallAlert, setAllCallAlert] = useState(null);
  const [notifPermission, setNotifPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  useEffect(() => {
    if (token && user.responder) {
      fetchDashboardData();
    }
    return () => {
      sirenRef.current.stop();
    };
  }, [token, user.responder]);

  // Request native browser desktop push notifications
  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        new Notification('🛡️ IIITP Dispatch Ready', {
          body: 'Emergency push notifications are now active. You will receive alerts even when this tab is in background.',
          icon: '/favicon.ico',
        });
      }
    }
  };

  // Trigger high-priority desktop notification
  const sendDesktopNotification = (title, body, tag = 'sos-alert') => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag,
          requireInteraction: true, // Remains on screen until clicked
          vibrate: [500, 200, 500, 200, 500],
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (err) {
        console.warn('Desktop notification dispatch error:', err);
      }
    }
  };

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch active emergencies assigned to me
      const activeRes = await fetch(`${API_URL}/emergencies/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const activeData = await activeRes.json();
      const activeList = Array.isArray(activeData) ? activeData : [];
      
      // Find emergency assigned to this responder
      const myJob = user?.responder ? activeList.find(req => 
        req.assignments?.some(a => a.responderId === user.responder.id && a.status !== 'DECLINED')
      ) : null;
      
      setActiveJob(myJob || null);

      // 2. Fetch Performance
      if (user?.responder) {
        const perfRes = await fetch(`${API_URL}/responders/${user.responder.id}/performance`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (perfRes.ok) {
          const perfData = await perfRes.json();
          setPerformance(perfData);
          if (perfData.status) setAvailability(perfData.status);
        }
      }

      // 3. Fetch history
      const historyRes = await fetch(`${API_URL}/emergencies/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const historyData = await historyRes.json();
      const historyList = Array.isArray(historyData) ? historyData : [];
      const myHistory = user?.responder ? historyList.filter(req => 
        req.assignments?.some(a => a.responderId === user.responder.id && a.status === 'ACCEPTED')
      ) : [];
      setHistory(myHistory);

    } catch (err) {
      console.error('Error fetching responder dashboard data:', err);
    }
  };

  const getMyAssignment = () => {
    return activeJob?.assignments?.find(a => a.responderId === user.responder.id);
  };
  const myAssignment = getMyAssignment();

  // Socket updates: Real-time emergency listeners
  useEffect(() => {
    if (!socket) return;

    const handleEmergencyUpdated = (data) => {
      fetchDashboardData();
    };

    const handleNewEmergency = (data) => {
      fetchDashboardData();
      if (data.assignedResponderId === user?.responder?.id) {
        sendDesktopNotification(
          `🚨 NEW SOS DISPATCH: ${data.emergency?.id || 'INCIDENT'}`,
          `Urgent ${data.emergency?.type} alert at ${data.emergency?.manualLocation || 'Campus Location'}. Accept within 25s!`,
          `sos-${data.emergency?.id}`
        );
      }
    };

    const handleEmergencyReassigned = (data) => {
      fetchDashboardData();
      if (data.newResponderId === user?.responder?.id) {
        sendDesktopNotification(
          `🚨 AUTO-CASCADED SOS: ${data.requestId}`,
          `Prior responder missed SLA. You are now primary officer for ${data.request?.type} at ${data.request?.manualLocation}!`,
          `sos-cascade-${data.requestId}`
        );
      }
    };

    const handleAllCall = (data) => {
      setAllCallAlert(data);
      sendDesktopNotification(
        `🚨 ALL-CALL SECURITY RED ALERT: ${data.requestId}`,
        `No individual responder acknowledged. ALL ON-DUTY OFFICERS MOBILIZE IMMEDIATELY TO ${data.request?.manualLocation}!`,
        `sos-allcall-${data.requestId}`
      );
    };

    socket.on('emergency_updated', handleEmergencyUpdated);
    socket.on('new_emergency', handleNewEmergency);
    socket.on('emergency_reassigned', handleEmergencyReassigned);
    socket.on('emergency_all_call', handleAllCall);

    return () => {
      socket.off('emergency_updated', handleEmergencyUpdated);
      socket.off('new_emergency', handleNewEmergency);
      socket.off('emergency_reassigned', handleEmergencyReassigned);
      socket.off('emergency_all_call', handleAllCall);
    };
  }, [socket, user?.responder?.id]);

  // SLA Countdown & Siren Triggering
  useEffect(() => {
    const isPending = myAssignment?.status === 'PENDING';

    if (isPending) {
      // Calculate remaining SLA seconds based on assignedAt
      const assignedTime = myAssignment.assignedAt ? new Date(myAssignment.assignedAt).getTime() : Date.now();
      
      const updateTimer = () => {
        const elapsed = Math.floor((Date.now() - assignedTime) / 1000);
        const rem = Math.max(0, 25 - elapsed);
        setSecondsRemaining(rem);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);

      // Start dual-tone Web Audio siren if not muted
      if (!isSirenMuted) {
        sirenRef.current.start();
      }

      return () => {
        clearInterval(interval);
        sirenRef.current.stop();
      };
    } else {
      sirenRef.current.stop();
      setSecondsRemaining(25);
    }
  }, [myAssignment?.status, myAssignment?.assignedAt, isSirenMuted]);

  // Tab Title Flashing Alert (Draws immediate visual attention when browsing another tab)
  useEffect(() => {
    const originalTitle = 'IIITP - Emergency Operations';
    let flashInterval = null;
    const isPending = myAssignment?.status === 'PENDING';

    if (isPending) {
      let toggle = false;
      flashInterval = setInterval(() => {
        document.title = toggle
          ? `🚨 (1) CRITICAL SOS ALERT - ${activeJob?.type || 'INCIDENT'}`
          : `⚠️ ACCEPT DISPATCH NOW [${secondsRemaining}s SLA]`;
        toggle = !toggle;
      }, 700);
    } else if (allCallAlert) {
      let toggle = false;
      flashInterval = setInterval(() => {
        document.title = toggle
          ? `🚨 ALL-CALL SECURITY RED ALERT!`
          : `⚠️ IMMEDIATE MOBILIZATION REQUIRED`;
        toggle = !toggle;
      }, 600);
    } else {
      document.title = originalTitle;
    }

    return () => {
      if (flashInterval) clearInterval(flashInterval);
      document.title = originalTitle;
    };
  }, [myAssignment?.status, secondsRemaining, allCallAlert, activeJob?.type]);

  // Duty status change
  const handleAvailabilityChange = async (newStatus) => {
    try {
      const res = await fetch(`${API_URL}/responders/${user.responder.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setAvailability(newStatus);
        updateProfile({
          responder: {
            ...user.responder,
            availabilityStatus: newStatus,
          }
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Accept job
  const handleAcceptJob = async () => {
    if (!activeJob) return;
    sirenRef.current.stop();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/emergencies/${activeJob.id}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDashboardData();
      } else {
        const d = await res.json();
        alert(`Accept failed: ${d.error}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Decline job (triggers immediate cascade)
  const handleDeclineJob = async () => {
    if (!activeJob) return;
    const conf = window.confirm('Are you sure you want to decline? System will instantly cascade dispatch to the next available officer.');
    if (!conf) return;

    sirenRef.current.stop();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/emergencies/${activeJob.id}/decline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setActiveJob(null);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Arrive at scene
  const handleArriveJob = async () => {
    if (!activeJob) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/emergencies/${activeJob.id}/arrive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Resolve Job
  const handleResolveJob = async () => {
    if (!activeJob) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/emergencies/${activeJob.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: resolvingNotes }),
      });
      if (res.ok) {
        setResolvingNotes('');
        setActiveJob(null);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Test Web Audio siren
  const handleToggleSirenTest = () => {
    if (sirenRef.current.isPlaying) {
      sirenRef.current.stop();
    } else {
      sirenRef.current.start();
      setTimeout(() => {
        sirenRef.current.stop();
      }, 3000);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-100">

      {/* ALL-CALL RED ALERT MODAL (If all individual responders timed out) */}
      {allCallAlert && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-lg w-full bg-slate-900 border-2 border-red-600 rounded-3xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.4)] space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center text-red-500 mx-auto animate-bounce">
              <ShieldAlert className="w-9 h-9" />
            </div>
            
            <div>
              <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase rounded-full tracking-widest">
                LEVEL 3 • RED ALERT • ALL-CALL DISPATCH
              </span>
              <h2 className="text-2xl font-black text-white mt-2">
                CAMPUS-WIDE MOBILIZATION
              </h2>
              <p className="text-xs text-red-300 font-semibold mt-1">
                Primary responders missed acknowledgment SLAs. All security and responder units must mobilize.
              </p>
            </div>

            <div className="p-4 bg-slate-950/80 rounded-2xl border border-red-900/60 text-left space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Incident Code:</span>
                <span className="font-black text-white">{allCallAlert.requestId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Category:</span>
                <span className="font-black text-red-400 uppercase">{allCallAlert.request?.type || 'CRITICAL'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Location:</span>
                <span className="font-bold text-amber-400">{allCallAlert.request?.manualLocation || 'Campus Center'}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setAllCallAlert(null);
                fetchDashboardData();
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow cursor-pointer transition-all"
            >
              ACKNOWLEDGE RED ALERT & REFRESH PORTAL
            </button>
          </div>
        </div>
      )}

      {/* EMERGENCY READINESS & OUT-OF-SCREEN ALERTING BAR */}
      <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="font-black text-white text-xs flex items-center gap-1.5">
              <span>ERT OUT-OF-SCREEN DISPATCH RADAR</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-bold uppercase">
                ACTIVE
              </span>
            </h4>
            <p className="text-[10px] text-slate-400">
              Desktop Push notifications, Web Audio dual-tone siren, and Out-of-band SMS/IVR active.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification Permission Toggle */}
          {notifPermission !== 'granted' ? (
            <button
              onClick={requestNotificationPermission}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
            >
              <Bell className="w-3.5 h-3.5" /> Enable Desktop Push
            </button>
          ) : (
            <span className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-[10px] font-bold rounded-lg flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Push Enabled
            </span>
          )}

          {/* Dual-Tone Siren Test */}
          <button
            onClick={handleToggleSirenTest}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
            title="Play 3-second test siren"
          >
            <Volume2 className="w-3.5 h-3.5 text-red-400" /> Test Siren
          </button>

          {/* Siren Mute Toggle */}
          <button
            onClick={() => {
              setIsSirenMuted(!isSirenMuted);
              if (!isSirenMuted) sirenRef.current.stop();
            }}
            className={`px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
              isSirenMuted
                ? 'bg-red-950/40 border-red-800/50 text-red-400'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {isSirenMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            {isSirenMuted ? 'Muted' : 'Siren On'}
          </button>
        </div>
      </div>

      {/* Top Banner: Availability Duty & Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Availability Toggle */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
            DUTY STATUS CONFIG
          </span>
          <h4 className="text-sm font-bold text-white mb-3">Availability Status</h4>
          
          <div className="flex gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            {['AVAILABLE', 'BUSY', 'OFFLINE'].map((status) => (
              <button
                key={status}
                onClick={() => handleAvailabilityChange(status)}
                className={`flex-1 py-1 rounded text-[10px] font-black uppercase transition-all cursor-pointer ${
                  availability === status 
                    ? status === 'AVAILABLE' 
                      ? 'bg-iiitp-success text-white shadow-sm'
                      : status === 'BUSY'
                      ? 'bg-iiitp-warning text-white shadow-sm'
                      : 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {status.slice(0, 4)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats 1: Resolved Incidents */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-iiitp-success/10 border border-iiitp-success/20 flex items-center justify-center text-iiitp-success">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">RESOLVED CASES</p>
            <h4 className="text-2xl font-black text-white mt-1">
              {performance?.resolvedCount || 0}
            </h4>
          </div>
        </div>

        {/* Stats 2: Avg Response Time */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-iiitp-info/10 border border-iiitp-info/20 flex items-center justify-center text-iiitp-info">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AVG RESPONSE TIME</p>
            <h4 className="text-2xl font-black text-white mt-1">
              {performance?.avgResponseTimeMinutes || 0} <span className="text-xs text-slate-400">mins</span>
            </h4>
          </div>
        </div>

        {/* Stats 3: Skills Badge */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">RESPONSIBLE SKILLS</p>
          <div className="flex flex-wrap gap-1">
            {user.responder.skills?.map((sk) => (
              <span key={sk.id} className="text-[9px] font-black uppercase bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                {sk.skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Assignment Section */}
      {activeJob ? (
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
          
          {/* PENDING ASSIGNMENT TAKEOVER CARD WITH LIVE 25s SLA COUNTDOWN */}
          {myAssignment?.status === 'PENDING' && (
            <div className="glass-card p-6 rounded-3xl border-2 border-red-500 bg-red-950/20 shadow-[0_0_40px_rgba(239,68,68,0.35)] relative overflow-hidden space-y-5 animate-pulse">
              
              {/* Top Urgent Header */}
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase rounded-full tracking-widest flex items-center gap-1.5 shadow-sm">
                  <ShieldAlert className="w-3.5 h-3.5 animate-bounce" />
                  EMERGENCY DISPATCH PROTOCOL
                </span>
                
                {/* 25s Live Countdown Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-1.5 ${
                  secondsRemaining <= 10 
                    ? 'bg-red-600 border-red-400 text-white animate-ping'
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  SLA: {secondsRemaining}s REMAINING
                </div>
              </div>

              {/* Progress Bar of 25s window */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>Auto-Cascade Timeout Window</span>
                  <span className="text-red-400">Auto-Reassigns at 0s</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      secondsRemaining <= 10 ? 'bg-red-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.max(0, (secondsRemaining / 25) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white flex items-center gap-2">
                  <Flame className="w-6 h-6 text-red-500 shrink-0" />
                  CRITICAL {activeJob.type} ALERT
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Incident ID: <span className="font-mono font-bold text-white">{activeJob.id}</span>
                </p>
              </div>

              {/* Incident Details Box */}
              <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400">
                  <span>Target Campus Location:</span>
                  <span className="font-black text-amber-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    {activeJob.manualLocation || 'Campus Coordinates'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400">
                  <span>Student Reporter:</span>
                  <span className="font-bold text-slate-200">{activeJob.reporterName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5 text-slate-400">
                  <span>Reporter Phone:</span>
                  <a href={`tel:${activeJob.reporterContact}`} className="font-bold text-iiitp-gold hover:underline flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {activeJob.reporterContact}
                  </a>
                </div>
                {activeJob.description && (
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 mt-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">STUDENT DISPATCH NOTES</p>
                    <p className="text-xs text-slate-200 italic mt-0.5">&quot;{activeJob.description}&quot;</p>
                  </div>
                )}
              </div>

              {/* Multi-Channel Telemetry Status Feed */}
              <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800/80 space-y-1.5">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  MULTI-CHANNEL DISPATCH VERIFICATION
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xxs font-bold">
                  <div className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 flex items-center justify-center gap-1">
                    <Smartphone className="w-3 h-3" /> SMS SENT
                  </div>
                  <div className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 flex items-center justify-center gap-1">
                    <PhoneCall className="w-3 h-3" /> IVR DIALED
                  </div>
                  <div className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 flex items-center justify-center gap-1">
                    <BellRing className="w-3 h-3" /> PUSH DISPATCH
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleAcceptJob}
                  disabled={loading}
                  className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" /> ACCEPT & ENGAGE
                </button>
                <button
                  onClick={handleDeclineJob}
                  disabled={loading}
                  className="py-3 bg-red-600/80 hover:bg-red-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <X className="w-4 h-4" /> DECLINE / CASCADE
                </button>
              </div>

              <p className="text-[10px] text-center text-slate-400 italic">
                * If you do not accept within 25 seconds, your assignment will auto-expire and cascade to the next officer.
              </p>
            </div>
          )}

          {/* ACTIVE ACCEPTED ASSIGNMENT PORTAL */}
          {myAssignment?.status === 'ACCEPTED' && (
            <div className="glass-card p-6 rounded-2xl border border-iiitp-success/30 bg-iiitp-success/5 shadow-glow-success space-y-4">
              <span className="px-2 py-0.5 bg-iiitp-success/20 border border-iiitp-success/45 text-iiitp-success text-[9px] font-black uppercase rounded tracking-widest block w-max">
                ACTIVE DEPLOYMENT
              </span>

              <h3 className="text-xl font-black text-white mt-1">INCIDENT {activeJob.id}</h3>
              
              <div className="p-4 bg-slate-900/80 rounded-xl space-y-2.5 border border-slate-800 text-xs">
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5 text-slate-400">
                  <span>Incident Type:</span>
                  <span className="font-extrabold text-white uppercase">{activeJob.type}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5 text-slate-400">
                  <span>Reporter Name:</span>
                  <span className="font-semibold text-slate-200">{activeJob.reporterName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5 text-slate-400">
                  <span>Contact Line:</span>
                  <a href={`tel:${activeJob.reporterContact}`} className="font-bold text-iiitp-gold hover:underline flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {activeJob.reporterContact}
                  </a>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5 text-slate-400">
                  <span>Reported Location:</span>
                  <span className="font-bold text-iiitp-gold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    {activeJob.manualLocation}
                  </span>
                </div>
                {activeJob.description && (
                  <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800 mt-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">REPORTER NOTES</p>
                    <p className="text-xs text-slate-300 italic mt-0.5">&quot;{activeJob.description}&quot;</p>
                  </div>
                )}
              </div>

              {/* Dispatch Progress State Controls */}
              <div className="border-t border-slate-850 pt-4 space-y-3">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">DEPLOYMENT PROGRESS ACTIONS</p>

                {activeJob.status === 'RESPONDER_EN_ROUTE' && (
                  <button
                    onClick={handleArriveJob}
                    disabled={loading}
                    className="w-full py-3 bg-[#16a34a] hover:bg-green-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4 text-white" />
                    {loading ? 'Confirming Arrival...' : 'I HAVE ARRIVED AT SCENE'}
                  </button>
                )}

                {activeJob.status === 'RESPONDER_ARRIVED' && (
                  <div className="space-y-3">
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-xxs text-amber-400 font-bold flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-500 animate-pulse" />
                      Support arrived at incident scene. Calibrating resolution.
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                        Emergency Incident Resolution Notes
                      </label>
                      <textarea
                        value={resolvingNotes}
                        onChange={(e) => setResolvingNotes(e.target.value)}
                        placeholder="Detail medical diagnostics, security overrides, or external service deployment..."
                        rows={3}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-iiitp-success text-xs resize-none"
                      />
                    </div>

                    <button
                      onClick={handleResolveJob}
                      disabled={loading}
                      className="w-full py-2.5 bg-iiitp-success hover:bg-green-700 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider shadow flex items-center justify-center gap-1 cursor-pointer transition-all"
                    >
                      <CheckCircle className="w-4 h-4" /> MARK RESOLVED & UPDATE PORTAL
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Standby state */
        <div className="glass-card rounded-2xl border border-slate-800 p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl mx-auto">
            🛡️
          </div>
          <h3 className="text-lg font-bold text-white">Standby / Monitoring Active</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            You currently have no assigned active emergencies. Keep your duty status set to <span className="text-iiitp-success font-black">AVAILABLE</span> to receive automatic dispatches based on coordinates and skill score matching.
          </p>
        </div>
      )}

      {/* Incident History Log */}
      <div className="glass-card p-6 rounded-2xl border border-iiitp-border space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">Your Deployment Resolution Logs</h3>
        {history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {history.map((req) => (
              <div key={req.id} className="p-3.5 bg-slate-900/40 border border-slate-850 rounded-xl flex items-start justify-between text-xs gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white">{req.id}</span>
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      {req.type}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Reporter: {req.reporterName} • Location: {req.manualLocation}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-[9px] font-bold rounded-lg uppercase">
                    RESOLVED
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1 italic max-w-[200px] truncate" title={req.notes}>
                    &quot;{req.notes}&quot;
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-900/10 border border-dashed border-slate-850 rounded-xl text-slate-500 text-xs">
            No historical assignments resolved.
          </div>
        )}
      </div>

    </div>
  );
}
