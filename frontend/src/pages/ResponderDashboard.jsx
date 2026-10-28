import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  Shield, Check, X, ShieldAlert, Award, Clock, 
  MapPin, Phone, User, Play, Edit, CheckCircle,
  Volume2, VolumeX, Bell, BellRing, AlertTriangle, 
  Radio, PhoneCall, Smartphone, Flame, HeartPulse, RefreshCw,
  ExternalLink, Zap
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
  const [activeList, setActiveList] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [history, setHistory] = useState([]);
  const [availability, setAvailability] = useState(user?.responder?.availabilityStatus || 'AVAILABLE');
  const [performance, setPerformance] = useState(null);
  const [resolvingNotes, setResolvingNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Siren and Out-of-Screen Alerting states
  const sirenRef = useRef(new SirenSynth());
  const [isSirenMuted, setIsSirenMuted] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(25);
  const [allCallAlert, setAllCallAlert] = useState(null);
  const [notifPermission, setNotifPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
    return () => {
      sirenRef.current.stop();
    };
  }, [token, user?.responder?.id]);

  // Request native browser desktop push notifications
  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        new Notification('IIITP Emergency Response Terminal Active', {
          body: 'Emergency push notifications are now active. You will receive immediate alerts even when this tab is minimized.',
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
          requireInteraction: true,
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

  const showToast = (msg) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch active emergencies
      const activeRes = await fetch(`${API_URL}/emergencies/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const activeData = await activeRes.json();
      const list = Array.isArray(activeData) ? activeData : [];
      setActiveList(list);

      // Find emergency actively assigned to this responder
      const myResponderId = user?.responder?.id;
      let myJob = null;
      if (myResponderId) {
        myJob = list.find(req => 
          req.assignments?.some(a => a.responderId === myResponderId && a.status !== 'DECLINED')
        );
      }

      // If no pre-assigned job but there is only 1 reported emergency that has no active accepted responder,
      // officer can focus on it immediately
      setActiveJob(myJob || null);

      // 2. Fetch Performance & Status
      if (myResponderId) {
        const perfRes = await fetch(`${API_URL}/responders/${myResponderId}/performance`, {
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
      const myHistory = myResponderId ? historyList.filter(req => 
        req.assignments?.some(a => a.responderId === myResponderId && (a.status === 'ACCEPTED' || req.status === 'RESOLVED'))
      ) : historyList;
      setHistory(myHistory);

    } catch (err) {
      console.error('Error fetching responder dashboard data:', err);
    }
  };

  const getMyAssignment = (job = activeJob) => {
    if (!job || !user?.responder?.id) return null;
    return job.assignments?.find(a => a.responderId === user.responder.id);
  };
  const myAssignment = getMyAssignment();

  // Socket updates: Real-time emergency listeners
  useEffect(() => {
    if (!socket) return;

    const handleEmergencyUpdated = () => {
      fetchDashboardData();
    };

    const handleNewEmergency = (data) => {
      fetchDashboardData();
      if (!isSirenMuted) {
        sirenRef.current.start();
        setTimeout(() => sirenRef.current.stop(), 5000);
      }
      sendDesktopNotification(
        `🚨 [SOS DISPATCH] NEW EMERGENCY: ${data.emergency?.id || 'CAMPUS ALERT'}`,
        `Urgent ${data.emergency?.type || 'Emergency'} at ${data.emergency?.manualLocation || 'Campus Coordinates'}. Respond immediately!`,
        `sos-${data.emergency?.id}`
      );
    };

    const handleEmergencyReassigned = (data) => {
      fetchDashboardData();
      if (data.newResponderId === user?.responder?.id) {
        if (!isSirenMuted) {
          sirenRef.current.start();
          setTimeout(() => sirenRef.current.stop(), 5000);
        }
        sendDesktopNotification(
          `[DISPATCH CASCADE] SOS REASSIGNED: ${data.requestId}`,
          `Prior responder timed out. You are now primary officer for ${data.request?.type} at ${data.request?.manualLocation}!`,
          `sos-cascade-${data.requestId}`
        );
      }
    };

    const handleAllCall = (data) => {
      setAllCallAlert(data);
      if (!isSirenMuted) sirenRef.current.start();
      sendDesktopNotification(
        `[RED ALERT] ALL-CALL SECURITY: ${data.requestId}`,
        `ALL ON-DUTY OFFICERS MOBILIZE IMMEDIATELY TO ${data.request?.manualLocation || 'Campus Location'}!`,
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
  }, [socket, user?.responder?.id, isSirenMuted]);

  // SLA Countdown & Siren Triggering for Pending Assignment
  useEffect(() => {
    const isPending = myAssignment?.status === 'PENDING';

    if (isPending) {
      const assignedTime = myAssignment.assignedAt ? new Date(myAssignment.assignedAt).getTime() : Date.now();
      
      const updateTimer = () => {
        const elapsed = Math.floor((Date.now() - assignedTime) / 1000);
        const rem = Math.max(0, 25 - elapsed);
        setSecondsRemaining(rem);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);

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

  // Tab Title Flashing Alert
  useEffect(() => {
    const originalTitle = 'IIITP - Emergency Operations';
    let flashInterval = null;
    const isPending = myAssignment?.status === 'PENDING';

    if (isPending) {
      let toggle = false;
      flashInterval = setInterval(() => {
        document.title = toggle
          ? `(1) 🚨 CRITICAL SOS ALERT - ${activeJob?.type || 'INCIDENT'}`
          : `⚡ ACCEPT DISPATCH NOW [${secondsRemaining}s SLA]`;
        toggle = !toggle;
      }, 700);
    } else if (allCallAlert) {
      let toggle = false;
      flashInterval = setInterval(() => {
        document.title = toggle
          ? `🚨 ALL-CALL SECURITY RED ALERT!`
          : `IMMEDIATE MOBILIZATION REQUIRED`;
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
      if (!user?.responder?.id) return;
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
        showToast(`Duty status updated to ${newStatus}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Accept / Claim Job
  const handleAcceptJob = async (emergencyId = null) => {
    const targetId = emergencyId || activeJob?.id;
    if (!targetId) return;

    sirenRef.current.stop();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/emergencies/${targetId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAvailability('BUSY');
        showToast(`Dispatched to Incident ${targetId}. You are now EN ROUTE.`);
        await fetchDashboardData();
      } else {
        const d = await res.json();
        alert(`Accept failed: ${d.error || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error while responding to emergency.');
    } finally {
      setLoading(false);
    }
  };

  // Decline job
  const handleDeclineJob = async (emergencyId = null) => {
    const targetId = emergencyId || activeJob?.id;
    if (!targetId) return;
    const conf = window.confirm('Are you sure you want to decline? The system will immediately cascade dispatch to the next officer.');
    if (!conf) return;

    sirenRef.current.stop();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/emergencies/${targetId}/decline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setActiveJob(null);
        showToast(`Declined ${targetId}. Cascaded to queue.`);
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Arrive at scene
  const handleArriveJob = async (emergencyId = null) => {
    const targetId = emergencyId || activeJob?.id;
    if (!targetId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/emergencies/${targetId}/arrive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast(`Arrival confirmed for Incident ${targetId}. Protocol ACTIVE.`);
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Resolve Job
  const handleResolveJob = async (emergencyId = null) => {
    const targetId = emergencyId || activeJob?.id;
    if (!targetId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/emergencies/${targetId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: resolvingNotes || 'Resolved successfully by officer on scene.' }),
      });
      if (res.ok) {
        setResolvingNotes('');
        setActiveJob(null);
        setAvailability('AVAILABLE');
        showToast(`Incident ${targetId} resolved and logged in central registry.`);
        await fetchDashboardData();
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

  const getEmergencyIcon = (type) => {
    switch (type) {
      case 'FIRE': return <Flame className="w-5 h-5 text-red-600" />;
      case 'MEDICAL': return <HeartPulse className="w-5 h-5 text-emerald-600" />;
      case 'SECURITY': return <ShieldAlert className="w-5 h-5 text-indigo-600" />;
      default: return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    }
  };

  // Safe fallback skills if skills array is empty
  const responderSkills = (user?.responder?.skills && user.responder.skills.length > 0)
    ? user.responder.skills.map(s => s.skill)
    : ['CAMPUS SECURITY', 'FIRE CONTAINMENT', 'FIRST AID & CPR', 'CROWD CONTROL'];

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans text-slate-800">

      {/* TOAST SUCCESS BANNER */}
      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-md text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ALL-CALL RED ALERT MODAL */}
      {allCallAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-lg w-full bg-white border-2 border-red-600 rounded-lg p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center text-red-600 mx-auto animate-bounce">
              <ShieldAlert className="w-8 h-8" />
            </div>
            
            <div>
              <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase rounded tracking-widest">
                LEVEL 3 • RED ALERT • ALL-CALL DISPATCH
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">
                CAMPUS-WIDE MOBILIZATION
              </h2>
              <p className="text-xs text-red-700 font-semibold mt-1">
                Primary responders missed acknowledgment SLA. All security and emergency personnel must mobilize immediately.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-md border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Incident Code:</span>
                <span className="font-black text-slate-900">{allCallAlert.requestId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Category:</span>
                <span className="font-black text-red-600 uppercase">{allCallAlert.request?.type || 'CRITICAL'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-bold text-slate-900">{allCallAlert.request?.manualLocation || 'Campus Center'}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setAllCallAlert(null);
                sirenRef.current.stop();
                fetchDashboardData();
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-md shadow cursor-pointer transition-all"
            >
              ACKNOWLEDGE RED ALERT & REFRESH PORTAL
            </button>
          </div>
        </div>
      )}

      {/* EMERGENCY READINESS & OUT-OF-SCREEN ALERTING BAR */}
      <div className="p-3.5 bg-slate-900 text-white rounded-lg flex flex-wrap items-center justify-between gap-4 text-xs shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="font-black text-white text-xs flex items-center gap-1.5">
              <span>ERT EMERGENCY DISPATCH RADAR</span>
              <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded font-bold uppercase">
                ACTIVE
              </span>
            </h4>
            <p className="text-[10px] text-slate-400">
              Desktop Push notifications, Web Audio dual-tone siren, and real-time CAD dispatch operational.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {notifPermission !== 'granted' ? (
            <button
              onClick={requestNotificationPermission}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
            >
              <Bell className="w-3.5 h-3.5" /> Enable Desktop Push
            </button>
          ) : (
            <span className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-[10px] font-bold rounded-md flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Push Enabled
            </span>
          )}

          <button
            onClick={handleToggleSirenTest}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
            title="Play 3-second test siren"
          >
            <Volume2 className="w-3.5 h-3.5 text-red-400" /> Test Siren
          </button>

          <button
            onClick={() => {
              setIsSirenMuted(!isSirenMuted);
              if (!isSirenMuted) sirenRef.current.stop();
            }}
            className={`px-3 py-1.5 border rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
              isSirenMuted
                ? 'bg-red-950/40 border-red-800/60 text-red-400'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {isSirenMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            {isSirenMuted ? 'Muted' : 'Siren On'}
          </button>

          <button
            onClick={fetchDashboardData}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
            title="Refresh emergency data"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS: Duty Status & Performance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Availability Status Card */}
        <div className="glass-card p-5 rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
              DUTY STATUS CONFIG
            </span>
            <h4 className="text-sm font-black text-slate-900 mb-3">
              Current Availability: <span className={
                availability === 'AVAILABLE' ? 'text-emerald-600' :
                availability === 'BUSY' ? 'text-amber-600' : 'text-slate-600'
              }>{availability}</span>
            </h4>
          </div>
          
          <div className="flex gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-lg">
            {[
              { id: 'AVAILABLE', label: 'Available', activeClass: 'bg-emerald-600 text-white shadow-sm' },
              { id: 'BUSY', label: 'On Call / Busy', activeClass: 'bg-amber-600 text-white shadow-sm' },
              { id: 'OFFLINE', label: 'Off Duty', activeClass: 'bg-slate-700 text-white shadow-sm' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => handleAvailabilityChange(btn.id)}
                className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-black uppercase transition-all cursor-pointer text-center ${
                  availability === btn.id 
                    ? btn.activeClass 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {availability === 'OFFLINE' && (
            <p className="text-[10px] text-amber-700 font-semibold mt-2">
              ⚠️ You are off duty. Switch to Available to receive automatic dispatches.
            </p>
          )}
        </div>

        {/* Stats 1: Resolved Incidents */}
        <div className="glass-card p-5 rounded-lg border border-slate-200 bg-white shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">RESOLVED CASES</p>
            <h4 className="text-2xl font-black text-slate-900 mt-1">
              {performance?.resolvedCount ?? user?.responder?.resolvedCount ?? history.length ?? 0}
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Verified on-campus closures</p>
          </div>
        </div>

        {/* Stats 2: Avg Response Time */}
        <div className="glass-card p-5 rounded-lg border border-slate-200 bg-white shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AVG RESPONSE TIME</p>
            <h4 className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-1">
              <span>{performance?.avgResponseTimeMinutes ?? 3.5}</span>
              <span className="text-xs text-slate-500 font-bold">mins</span>
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Fast CAD alert turnaround</p>
          </div>
        </div>

        {/* Stats 3: Skills Badge */}
        <div className="glass-card p-5 rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col justify-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">RESPONSIBLE SKILLS</p>
          <div className="flex flex-wrap gap-1.5">
            {responderSkills.map((sk, idx) => (
              <span key={idx} className="text-[10px] font-black uppercase bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                {sk}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Ranked CAD priority dispatch</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: PRIMARY ASSIGNED EMERGENCY CONSOLE (IF ASSIGNED TO THIS OFFICER) */}
      {/* ========================================================================= */}
      {activeJob && (
        <div className="w-full space-y-4">
          
          {/* STATE A: PENDING ASSIGNMENT (COUNTDOWN + ACCEPT / DECLINE) */}
          {myAssignment?.status === 'PENDING' && (
            <div className="bg-red-50 border-2 border-red-500 rounded-lg p-5 sm:p-6 shadow-xl space-y-4 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase rounded tracking-widest flex items-center gap-1.5 shadow-sm">
                  <ShieldAlert className="w-3.5 h-3.5 animate-bounce" />
                  URGENT DISPATCH ASSIGNED TO YOU
                </span>
                
                <div className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider border flex items-center gap-1.5 ${
                  secondsRemaining <= 10 
                    ? 'bg-red-600 text-white border-red-700 animate-pulse'
                    : 'bg-amber-100 border-amber-300 text-amber-900'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  SLA: {secondsRemaining}s REMAINING TO ACCEPT
                </div>
              </div>

              {/* SLA Countdown Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-600">
                  <span>Auto-Cascade Timeout Window</span>
                  <span className="text-red-700">Auto-Reassigns at 0s</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      secondsRemaining <= 10 ? 'bg-red-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.max(0, (secondsRemaining / 25) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-red-100 text-red-600">
                  {getEmergencyIcon(activeJob.type)}
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    CRITICAL {activeJob.type} INCIDENT
                  </h3>
                  <p className="text-xs text-slate-600">
                    Incident ID: <span className="font-mono font-bold text-slate-900">{activeJob.id}</span>
                  </p>
                </div>
              </div>

              {/* Incident Details Box */}
              <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-2.5 text-xs shadow-sm">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-semibold">Location:</span>
                  <span className="font-black text-slate-900 flex items-center gap-1 text-sm">
                    <MapPin className="w-4 h-4 text-red-600 shrink-0" />
                    {activeJob.manualLocation || 'Campus Coordinates'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-semibold">Student Reporter:</span>
                  <span className="font-bold text-slate-900">{activeJob.reporterName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-semibold">Reporter Phone:</span>
                  <a href={`tel:${activeJob.reporterContact}`} className="font-bold text-blue-600 hover:underline flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {activeJob.reporterContact}
                  </a>
                </div>
                {activeJob.description && (
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 mt-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">REPORTER NOTES</p>
                    <p className="text-xs text-slate-800 italic mt-0.5">&quot;{activeJob.description}&quot;</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleAcceptJob(activeJob.id)}
                  disabled={loading}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" /> ACCEPT DISPATCH & ENGAGE (EN ROUTE)
                </button>
                <button
                  onClick={() => handleDeclineJob(activeJob.id)}
                  disabled={loading}
                  className="py-3 px-4 bg-red-100 hover:bg-red-200 text-red-700 font-black rounded-lg text-xs uppercase tracking-wider border border-red-300 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <X className="w-4 h-4" /> DECLINE / CASCADE TO NEXT OFFICER
                </button>
              </div>
            </div>
          )}

          {/* STATE B: ACCEPTED & IN PROGRESS (EN ROUTE OR ON SCENE) */}
          {(myAssignment?.status === 'ACCEPTED' || activeJob.status === 'RESPONDER_EN_ROUTE' || activeJob.status === 'RESPONDER_ARRIVED') && (
            <div className="glass-card p-5 sm:p-6 rounded-lg border-2 border-emerald-500 bg-white shadow-lg space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase rounded tracking-wider flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> ACTIVE DEPLOYMENT
                  </span>
                  <span className="text-xs font-black text-slate-500 uppercase">
                    STATUS: <span className="text-emerald-700 font-black">{activeJob.status.replace(/_/g, ' ')}</span>
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">ID: {activeJob.id}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-slate-100 text-slate-800">
                  {getEmergencyIcon(activeJob.type)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{activeJob.type} EMERGENCY</h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Target: <span className="text-slate-900 font-bold">{activeJob.manualLocation}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Reporter</span>
                  <span className="font-bold text-slate-900 text-sm">{activeJob.reporterName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Direct Phone Line</span>
                  <a href={`tel:${activeJob.reporterContact}`} className="font-bold text-blue-600 hover:underline flex items-center gap-1 text-sm mt-0.5">
                    <Phone className="w-3.5 h-3.5" /> {activeJob.reporterContact}
                  </a>
                </div>
                {activeJob.description && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block text-[10px] font-bold uppercase">Situation Brief</span>
                    <p className="text-xs text-slate-700 italic mt-0.5">&quot;{activeJob.description}&quot;</p>
                  </div>
                )}
              </div>

              {/* Progress Stage 1: En Route -> Mark Arrived */}
              {activeJob.status === 'RESPONDER_EN_ROUTE' && (
                <div className="pt-2">
                  <button
                    onClick={() => handleArriveJob(activeJob.id)}
                    disabled={loading}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {loading ? 'Confirming Arrival...' : '📍 I HAVE ARRIVED AT SCENE (MARK ARRIVED)'}
                  </button>
                </div>
              )}

              {/* Progress Stage 2: Arrived -> Resolution Notes & Close */}
              {activeJob.status === 'RESPONDER_ARRIVED' && (
                <div className="space-y-3 pt-2">
                  <div className="bg-amber-50 border border-amber-300 p-3 rounded-md text-xs text-amber-900 font-bold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Officer on scene. Assess the situation, administer protocol, and enter resolution notes below.</span>
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      Incident Resolution Notes & Action Taken
                    </label>
                    <textarea
                      value={resolvingNotes}
                      onChange={(e) => setResolvingNotes(e.target.value)}
                      placeholder="Detail actions taken (e.g., medical treatment provided, security threat neutralized, area secured)..."
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 text-xs shadow-inner"
                    />
                  </div>

                  <button
                    onClick={() => handleResolveJob(activeJob.id)}
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {loading ? 'Closing Incident...' : '✅ RESOLVE EMERGENCY & CLOSE DISPATCH'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: LIVE CAMPUS EMERGENCY QUEUE (ALL ACTIVE UNRESOLVED INCIDENTS) */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
              CAMPUS EMERGENCY DISPATCH RADAR ({activeList.length} ACTIVE)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            Real-time feed across campus sectors
          </span>
        </div>

        {activeList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeList.map((em) => {
              const isAssignedToMe = em.assignments?.some(a => a.responderId === user?.responder?.id && a.status !== 'DECLINED');
              const hasAcceptedResponder = em.assignments?.some(a => a.status === 'ACCEPTED');
              const assignedOfficer = em.assignments?.find(a => a.status === 'ACCEPTED' || a.status === 'PENDING')?.responder?.user?.name;

              return (
                <div 
                  key={em.id} 
                  className={`p-4 rounded-lg border transition-all ${
                    isAssignedToMe 
                      ? 'bg-red-50/70 border-red-400 shadow-md' 
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-md bg-slate-100">
                        {getEmergencyIcon(em.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900 text-sm">{em.id}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-100 text-red-700 border border-red-200">
                            {em.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          {em.manualLocation || 'Campus Coordinates'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        em.status === 'REPORTED' 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {em.status.replace(/_/g, ' ')}
                      </span>
                      {em.escalationLevel > 0 && (
                        <p className="text-[10px] font-black text-red-600 mt-1">
                          ESCALATION L{em.escalationLevel}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold block uppercase">Student Reporter</span>
                      <span className="font-semibold text-slate-800">{em.reporterName}</span>
                      {em.reporterContact && (
                        <a href={`tel:${em.reporterContact}`} className="text-blue-600 hover:underline ml-2 font-bold inline-flex items-center gap-0.5">
                          <Phone className="w-3 h-3" /> {em.reporterContact}
                        </a>
                      )}
                    </div>

                    {assignedOfficer && !isAssignedToMe && (
                      <span className="text-[11px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                        Officer: {assignedOfficer}
                      </span>
                    )}

                    {/* Immediate Response Action */}
                    {!isAssignedToMe ? (
                      <button
                        onClick={() => handleAcceptJob(em.id)}
                        disabled={loading}
                        className="py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer transition-all ml-auto"
                      >
                        <Zap className="w-3.5 h-3.5" /> RESPOND / TAKE DISPATCH
                      </button>
                    ) : (
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 ml-auto">
                        ASSIGNED TO YOU
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card rounded-lg border border-slate-200 bg-white p-8 text-center max-w-lg mx-auto space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">Campus Status Normal • No Active Emergencies</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              All sectors are currently calm. Keep your duty status set to <span className="text-emerald-600 font-bold">AVAILABLE</span> to receive automatic dispatch alerts when a student triggers SOS.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: HISTORICAL DEPLOYMENT RESOLUTION LOGS */}
      {/* ========================================================================= */}
      <div className="glass-card p-5 sm:p-6 rounded-lg border border-slate-200 bg-white space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
            YOUR DEPLOYMENT RESOLUTION LOGS ({history.length})
          </h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase">Archived in Central Safety Audit</span>
        </div>

        {history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {history.map((req) => (
              <div key={req.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between text-xs gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-900">{req.id}</span>
                    <span className="text-[10px] font-black uppercase bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                      {req.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Reporter: <span className="font-semibold text-slate-800">{req.reporterName}</span> • {req.manualLocation}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-bold rounded uppercase">
                    RESOLVED
                  </span>
                  {req.notes && (
                    <p className="text-[10px] text-slate-500 mt-1 italic max-w-[200px] truncate" title={req.notes}>
                      &quot;{req.notes}&quot;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-500 text-xs">
            No historical assignments resolved yet.
          </div>
        )}
      </div>

    </div>
  );
}
