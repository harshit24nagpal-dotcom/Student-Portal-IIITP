import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { API_URL } from '../config/api';
import { 
  Building, Calendar, Clock, Users, CheckCircle2, AlertTriangle, 
  Sparkles, Filter, Check, X, Shield, ChevronRight, User, Plus,
  FileText, Download, QrCode, Phone, Info, Award, HelpCircle, 
  ExternalLink, Layers, Search, RefreshCw, Send, ArrowRight, Lock
} from 'lucide-react';

export default function InfrastructureReservationTab() {
  const { user, token } = useAuth();
  const { socket } = useSocket();

  // Selected date and filters
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    // Default to a weekday
    return today.toISOString().split('T')[0];
  });
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [venueTypeFilter, setVenueTypeFilter] = useState('ALL'); // ALL, LECTURE_HALL, CLASSROOM
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'reservations' | 'clubs'

  // Data states
  const [venues, setVenues] = useState([]);
  const [clubsData, setClubsData] = useState(null);
  const [occupancyGrid, setOccupancyGrid] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gridLoading, setGridLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modals state
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [showClubModal, setShowClubModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [selectedPass, setSelectedPass] = useState(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');

  // Preselected booking slot from grid
  const [prefilledSlot, setPrefilledSlot] = useState(null);

  // Faculty booking form inputs
  const [facTitle, setFacTitle] = useState('');
  const [facPurpose, setFacPurpose] = useState('EXTRA_CLASS');
  const [facVenueId, setFacVenueId] = useState('LH01');
  const [facDate, setFacDate] = useState(selectedDate);
  const [facTimeSlot, setFacTimeSlot] = useState('17:30 - 18:30');
  const [facCourseCode, setFacCourseCode] = useState('');
  const [facBatch, setFacBatch] = useState('3rd Sem Section A (CSE)');
  const [facAttendees, setFacAttendees] = useState(60);
  const [facTechReqs, setFacTechReqs] = useState(['Laser Projector', 'Air Conditioned']);
  const [facReason, setFacReason] = useState('');
  const [isFacCustomTiming, setIsFacCustomTiming] = useState(false);
  const [facCustomStartTime, setFacCustomStartTime] = useState('17:30');
  const [facCustomEndTime, setFacCustomEndTime] = useState('19:30');

  // Club booking form inputs (Restricted to Heads & Co-Heads)
  const [clubCode, setClubCode] = useState('BIT_LEGION');
  const [clubTitle, setClubTitle] = useState('');
  const [clubDesc, setClubDesc] = useState('');
  const [clubReason, setClubReason] = useState('');
  const [clubPurpose, setClubPurpose] = useState('CLUB_EVENT');
  const [clubVenueId, setClubVenueId] = useState('LH06');
  const [clubDate, setClubDate] = useState(selectedDate);
  const [clubTimeSlot, setClubTimeSlot] = useState('17:30 - 19:30');
  const [isCustomTiming, setIsCustomTiming] = useState(false);
  const [customStartTime, setCustomStartTime] = useState('18:00');
  const [customEndTime, setCustomEndTime] = useState('20:30');
  const [applicantPosition, setApplicantPosition] = useState('HEAD'); // 'HEAD' | 'CO_HEAD' | 'MEMBER'
  const [clubAttendees, setClubAttendees] = useState(80);
  const [clubContact, setClubContact] = useState('');
  const [clubTechReqs, setClubTechReqs] = useState(['High-Lumen Projector', 'Audio System', 'High-speed Wi-Fi']);

  // Compute Day from Date
  useEffect(() => {
    if (selectedDate) {
      const d = new Date(selectedDate);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      setSelectedDay(days[d.getDay()] || 'Monday');
    }
  }, [selectedDate]);

  // Determine if the current student is an authorized Club Head or Co-Head
  const myLeadClub = React.useMemo(() => {
    if (!clubsData?.categories || !user) return user?.clubLeadership || null;
    const cleanName = (user.name || '').toLowerCase().trim();
    for (const cat of clubsData.categories) {
      for (const c of cat.clubs) {
        if (c.head?.name && cleanName.includes(c.head.name.toLowerCase().trim())) {
          return {
            ...c,
            categoryName: cat.name,
            facultyInCharge: cat.facultyInCharge,
            coInCharge: cat.coInCharge,
            userPosition: 'HEAD',
            userContact: c.head.mobile
          };
        }
        if (c.coHead?.name && cleanName.includes(c.coHead.name.toLowerCase().trim())) {
          return {
            ...c,
            categoryName: cat.name,
            facultyInCharge: cat.facultyInCharge,
            coInCharge: cat.coInCharge,
            userPosition: 'CO_HEAD',
            userContact: c.coHead.mobile
          };
        }
      }
    }
    return user?.clubLeadership || null;
  }, [clubsData, user]);

  const canRequestClubRoom = Boolean(myLeadClub) || user?.role === 'ADMIN';

  // Automatically pre-set and lock club parameters for designated club leaders
  useEffect(() => {
    if (myLeadClub) {
      setClubCode(myLeadClub.code);
      setApplicantPosition(myLeadClub.userPosition || 'HEAD');
      setClubContact(myLeadClub.userContact || myLeadClub.mobile || '');
    }
  }, [myLeadClub]);

  // Fetch initial base data
  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [vRes, cRes, rRes] = await Promise.all([
        fetch(`${API_URL}/reservations/venues`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/reservations/clubs`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/reservations`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (vRes.ok) setVenues(await vRes.json());
      if (cRes.ok) setClubsData(await cRes.json());
      if (rRes.ok) setReservations(await rRes.json());
    } catch (err) {
      console.error('Error fetching reservation data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch occupancy grid whenever date/day/type filter changes
  const fetchGrid = async () => {
    if (!token) return;
    setGridLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/reservations/live-grid?date=${selectedDate}&day=${selectedDay}&venueType=${venueTypeFilter}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setOccupancyGrid(data.grid || []);
      }
    } catch (err) {
      console.error('Error fetching grid:', err);
    } finally {
      setGridLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    fetchGrid();
  }, [token, selectedDate, selectedDay, venueTypeFilter]);

  // Real-time socket listener for reservation updates
  useEffect(() => {
    if (!socket) return;
    const handleCreated = (data) => {
      fetchGrid();
      fetchData();
    };
    const handleUpdated = (data) => {
      fetchGrid();
      fetchData();
    };

    socket.on('venue_reservation_created', handleCreated);
    socket.on('venue_reservation_updated', handleUpdated);

    return () => {
      socket.off('venue_reservation_created', handleCreated);
      socket.off('venue_reservation_updated', handleUpdated);
    };
  }, [socket, selectedDate]);

  // Helper: Find selected club details
  const getSelectedClubInfo = () => {
    if (!clubsData || !clubsData.categories) return null;
    for (const cat of clubsData.categories) {
      const cl = cat.clubs.find(c => c.code === clubCode);
      if (cl) {
        return {
          ...cl,
          categoryName: cat.name,
          categoryId: cat.id,
          facultyInCharge: cat.facultyInCharge,
          coInCharge: cat.coInCharge || null,
          sacFaculty: clubsData.sacFacultyInCharge
        };
      }
    }
    return null;
  };

  const currentClubInfo = getSelectedClubInfo();

  // Auto-fill club head contact when club changes
  useEffect(() => {
    if (currentClubInfo && currentClubInfo.head) {
      setClubContact(currentClubInfo.head.mobile);
    }
  }, [clubCode, clubsData]);

  // Handle open reservation modal from grid click
  const handleSlotClick = (venue, slotObj) => {
    if (slotObj.status === 'ACADEMIC_CLASS') {
      alert(`Occupied by academic lecture: ${slotObj.label}\nInstructor: ${slotObj.classDetails?.faculty || 'N/A'}\nBatch: ${slotObj.classDetails?.batch || 'N/A'}`);
      return;
    }
    if (slotObj.status === 'RESERVED') {
      const fullRes = reservations.find(r => r.id === slotObj.reservation?.id);
      if (fullRes) {
        setSelectedPass(fullRes);
        setShowPassModal(true);
      }
      return;
    }

    // If available slot clicked
    setPrefilledSlot({
      venueId: venue.venueId,
      venueName: venue.venueName,
      timeSlot: slotObj.slot
    });

    if (user?.role === 'FACULTY' || user?.role === 'FACULTY_ADVISOR') {
      setFacVenueId(venue.venueId);
      setFacDate(selectedDate);
      setFacTimeSlot(slotObj.slot);
      setShowFacultyModal(true);
    } else if (canRequestClubRoom) {
      if (myLeadClub) {
        setClubCode(myLeadClub.code);
        setApplicantPosition(myLeadClub.userPosition || 'HEAD');
        setClubContact(myLeadClub.userContact || myLeadClub.mobile || '');
      }
      setClubVenueId(venue.venueId);
      setClubDate(selectedDate);
      setClubTimeSlot(slotObj.slot);
      setShowClubModal(true);
    } else {
      setErrorMessage('Access Restricted: Under SAC Policy, only appointed Club Heads and Co-Heads can submit room reservation requests. Regular students can only view timetable occupancy.');
    }
  };

  // Submit Faculty Reservation
  const handleFacultySubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const effectiveTime = isFacCustomTiming ? `${facCustomStartTime} - ${facCustomEndTime}` : facTimeSlot;

    try {
      const res = await fetch(`${API_URL}/reservations/faculty`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          venueId: facVenueId,
          date: facDate,
          timeSlot: effectiveTime,
          title: facTitle,
          purpose: facPurpose,
          reason: facReason,
          courseCode: facCourseCode,
          targetBatch: facBatch,
          expectedAttendees: facAttendees,
          techRequirements: facTechReqs
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Success! ${data.message}`);
        setShowFacultyModal(false);
        setFacTitle('');
        setFacReason('');
        fetchGrid();
        fetchData();
        if (data.reservation) {
          setSelectedPass(data.reservation);
          setShowPassModal(true);
        }
      } else {
        setErrorMessage(data.error || 'Failed to reserve classroom.');
      }
    } catch (err) {
      setErrorMessage('Network error while reserving classroom.');
    }
  };

  // Submit Club Event Proposal (Restricted to Heads & Co-Heads)
  const handleClubSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (applicantPosition !== 'HEAD' && applicantPosition !== 'CO_HEAD') {
      setErrorMessage('Authorization Error: Under SAC policy, only appointed Club Heads or Co-Heads can submit room reservation requests.');
      return;
    }

    if (!clubReason || clubReason.trim().length < 10) {
      setErrorMessage('Please provide a detailed reason/justification for why the room is needed (min 10 characters).');
      return;
    }

    const effectiveTime = isCustomTiming ? `${customStartTime} - ${customEndTime}` : clubTimeSlot;
    const currentClub = getSelectedClubInfo();
    const verifiedName = applicantPosition === 'CO_HEAD' ? (currentClub?.coHead?.name || 'Club Co-Head') : (currentClub?.head?.name || user?.name);
    const verifiedMobile = clubContact || (applicantPosition === 'CO_HEAD' ? currentClub?.coHead?.mobile : currentClub?.head?.mobile);

    try {
      const res = await fetch(`${API_URL}/reservations/club`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          clubCode,
          venueId: clubVenueId,
          date: clubDate,
          timeSlot: effectiveTime,
          title: clubTitle,
          description: clubDesc,
          reason: clubReason,
          applicantPosition,
          applicantName: verifiedName,
          applicantMobile: verifiedMobile,
          purpose: clubPurpose,
          expectedAttendees: clubAttendees,
          techRequirements: clubTechReqs,
          headContact: verifiedMobile
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Success! ${data.message}`);
        setShowClubModal(false);
        setClubTitle('');
        setClubDesc('');
        setClubReason('');
        fetchGrid();
        fetchData();
      } else {
        setErrorMessage(data.error || 'Failed to submit club proposal.');
      }
    } catch (err) {
      setErrorMessage('Network error while submitting proposal.');
    }
  };

  // Multi-Stage Approvals
  const handleLevel1Approve = async (id) => {
    try {
      const res = await fetch(`${API_URL}/reservations/${id}/approve-level1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ remarks: approvalRemarks || 'Level-1 approval granted by Faculty In-charge.' })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        setApprovalRemarks('');
        fetchData();
        fetchGrid();
      } else {
        setErrorMessage(data.error || 'Failed to approve');
      }
    } catch (err) {
      setErrorMessage('Network error');
    }
  };

  const handleFinalApprove = async (id) => {
    try {
      const res = await fetch(`${API_URL}/reservations/${id}/approve-final`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ remarks: approvalRemarks || 'Officially sanctioned by Dr. Shubham Shukla (SAC Faculty In-charge).' })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        setApprovalRemarks('');
        fetchData();
        fetchGrid();
        if (data.reservation) {
          setSelectedPass(data.reservation);
          setShowPassModal(true);
        }
      } else {
        setErrorMessage(data.error || 'Failed to sanction');
      }
    } catch (err) {
      setErrorMessage('Network error');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Please enter the reason for rejection:');
    if (!reason) return;
    try {
      const res = await fetch(`${API_URL}/reservations/${id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Reservation rejected.');
        fetchData();
        fetchGrid();
      }
    } catch (err) {
      setErrorMessage('Network error');
    }
  };

  const handleCancelBooking = async (id) => {
    if (!confirm('Are you sure you want to cancel this reservation and release the slot?')) return;
    try {
      const res = await fetch(`${API_URL}/reservations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccessMessage('Reservation cancelled.');
        fetchData();
        fetchGrid();
        if (selectedPass?.id === id) setShowPassModal(false);
      }
    } catch (err) {
      setErrorMessage('Network error');
    }
  };

  // Filtered venues for display
  const filteredGrid = occupancyGrid.filter(v => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.venueName.toLowerCase().includes(q) ||
      v.venueId.toLowerCase().includes(q) ||
      v.primaryBatch.toLowerCase().includes(q) ||
      v.equipment.some(e => e.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5 font-sans text-slate-800">

      {/* Top Banner & Quick Metrics */}
      <div className="p-5 sm:p-6 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-[#0c2340] text-[10px] font-black uppercase rounded tracking-wider">
              OFFICIAL CAMPUS INFRASTRUCTURE SYSTEM
            </span>
            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase rounded">
              LH01–LH08 • CR01–CR10
            </span>
            <span className="text-xxs text-slate-500 font-mono font-bold">
              TIMETABLE SYNC: ODD SEM AY2026-27
            </span>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
            Campus Infrastructure & Venue Reservation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time timetable occupancy lookup • Instant faculty booking for extra sessions & quizzes • 2-tier SAC hierarchy approval for student clubs
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {(user?.role === 'FACULTY' || user?.role === 'FACULTY_ADVISOR' || user?.role === 'ADMIN') && (
            <button
              onClick={() => {
                setPrefilledSlot(null);
                setShowFacultyModal(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-[#0c2340] hover:bg-[#16355d] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Teacher Session / Quiz Booking</span>
            </button>
          )}

          {/* Club Proposal Button - ONLY shown to appointed Heads and Co-Heads */}
          {canRequestClubRoom && (
            <button
              onClick={() => {
                setPrefilledSlot(null);
                if (myLeadClub) {
                  setClubCode(myLeadClub.code);
                  setApplicantPosition(myLeadClub.userPosition || 'HEAD');
                  setClubContact(myLeadClub.userContact || myLeadClub.mobile || '');
                }
                setShowClubModal(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-[#5c6bc0] hover:bg-[#4d5cb5] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              <span>
                Submit Club Proposal ({myLeadClub?.name || 'SAC'} {myLeadClub?.userPosition === 'HEAD' ? 'Head' : 'Co-Head'})
              </span>
            </button>
          )}

          {!canRequestClubRoom && user?.role === 'STUDENT' && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Club Permissions: Reserved for Club Heads & Co-Heads</span>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between font-medium animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between font-medium animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-red-700 hover:text-red-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Views Switcher */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#5c6bc0]" />
            <span>Live Timetable & Empty Slots Matrix</span>
          </button>

          <button
            onClick={() => setViewMode('reservations')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'reservations' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>All Bookings & Approvals ({reservations.length})</span>
          </button>

          <button
            onClick={() => setViewMode('clubs')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'clubs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>SAC Hierarchy & Club Heads</span>
          </button>
        </div>

        {/* Legend */}
        {viewMode === 'grid' && (
          <div className="flex items-center gap-3 text-xxs font-bold uppercase flex-wrap">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-300 border border-slate-400"></span> Academic Class
            </span>
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span> Empty Slot (Bookable)
            </span>
            <span className="flex items-center gap-1 text-[#5c6bc0]">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#5c6bc0]"></span> Approved Booking
            </span>
            <span className="flex items-center gap-1 text-amber-600">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-400"></span> Under SAC Review
            </span>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* VIEW 1: LIVE OCCUPANCY GRID & EMPTY SLOTS MATRIX                      */}
      {/* ===================================================================== */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              
              {/* Date Input */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase">Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-[#5c6bc0]"
                />
              </div>

              {/* Day Selector */}
              <div className="flex items-center gap-1">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      selectedDay.toLowerCase() === d.toLowerCase()
                        ? 'bg-[#0c2340] text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>

              {/* Venue Type Filter */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400 font-bold ml-1">Type:</span>
                <select
                  value={venueTypeFilter}
                  onChange={(e) => setVenueTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                >
                  <option value="ALL">All Venues (LH & CR)</option>
                  <option value="LECTURE_HALL">Lecture Halls (LH01–LH08)</option>
                  <option value="CLASSROOM">Classrooms (CR01–CR10)</option>
                </select>
              </div>

            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search venue, batch, facilities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#5c6bc0]"
              />
            </div>
          </div>

          {/* Grid Table Container */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
            {gridLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#5c6bc0]" />
                <span>Synchronizing timetable occupancy matrix...</span>
              </div>
            ) : filteredGrid.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No matching venues found.
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4 w-60 sticky left-0 bg-slate-50 z-10 border-r border-slate-200 shadow-xs">
                      Venue Details
                    </th>
                    {filteredGrid[0]?.slots?.map((s, idx) => (
                      <th key={s.slot} className="py-3 px-2 text-center min-w-[110px] border-r border-slate-200/60 last:border-r-0">
                        <span className="block text-slate-700">{s.slot.split(' - ')[0]}</span>
                        <span className="text-slate-400 font-mono text-[9px]">to {s.slot.split(' - ')[1]}</span>
                        {idx >= 8 && (
                          <span className="block mt-0.5 text-[8px] px-1 bg-indigo-50 text-[#5c6bc0] font-bold rounded">
                            EVENING
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredGrid.map((venue) => (
                    <tr key={venue.venueId} className="hover:bg-slate-50/50 transition-colors">
                      
                      {/* Venue Column (Sticky Left) */}
                      <td className="py-3 px-4 sticky left-0 bg-white hover:bg-slate-50/50 z-10 border-r border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className={`font-black font-mono text-xs px-2 py-0.5 rounded ${
                            venue.type === 'LECTURE_HALL' ? 'bg-blue-50 text-[#0c2340] border border-blue-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {venue.venueId}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            {venue.capacity} Seats
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-900 text-xs mt-1 truncate">
                          {venue.venueName}
                        </h4>
                        
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {venue.building} • {venue.floor}
                        </p>

                        <div className="mt-1 flex items-center gap-1 flex-wrap">
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded truncate max-w-[200px]">
                            {venue.primaryBatch}
                          </span>
                        </div>
                      </td>

                      {/* Slots Columns */}
                      {venue.slots.map((slotObj) => {
                        const isClass = slotObj.status === 'ACADEMIC_CLASS';
                        const isAvail = slotObj.status === 'AVAILABLE';
                        const isReserved = slotObj.status === 'RESERVED';
                        const isPending = slotObj.status === 'PENDING_APPROVAL';
                        const isBreak = slotObj.status === 'BREAK';

                        return (
                          <td
                            key={slotObj.slot}
                            onClick={() => handleSlotClick(venue, slotObj)}
                            className="py-2 px-1.5 text-center border-r border-slate-200/60 last:border-r-0 cursor-pointer align-top"
                          >
                            {isClass && (
                              <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200/80 transition-all text-left h-full min-h-[64px] flex flex-col justify-between">
                                <div>
                                  <span className="font-black text-[11px] text-[#0c2340] block truncate">
                                    {slotObj.classDetails?.subjectCode}
                                  </span>
                                  <span className="text-[9px] text-slate-600 block truncate leading-tight mt-0.5" title={slotObj.classDetails?.subjectName}>
                                    {slotObj.classDetails?.subjectName}
                                  </span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 truncate block mt-1">
                                  {slotObj.classDetails?.faculty}
                                </span>
                              </div>
                            )}

                            {isBreak && (
                              <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-800 text-[10px] font-bold flex items-center justify-center min-h-[64px]">
                                Break
                              </div>
                            )}

                            {isAvail && (
                              <div 
                                className={`p-2 rounded-lg bg-emerald-50/70 border border-dashed border-emerald-300 text-emerald-800 transition-all flex flex-col items-center justify-center min-h-[64px] ${
                                  (canRequestClubRoom || user?.role === 'FACULTY' || user?.role === 'FACULTY_ADVISOR' || user?.role === 'ADMIN') ? 'hover:bg-emerald-100 cursor-pointer group' : 'cursor-default opacity-85'
                                }`}
                                title={(canRequestClubRoom || user?.role === 'FACULTY' || user?.role === 'FACULTY_ADVISOR' || user?.role === 'ADMIN') ? 'Empty Slot: Click to Reserve Venue' : 'Empty Slot (Reservation restricted to Faculty & Club Heads)'}
                              >
                                <span className="text-[10px] font-black uppercase text-emerald-700 flex items-center gap-1 group-hover:scale-105 transition-transform">
                                  {(canRequestClubRoom || user?.role === 'FACULTY' || user?.role === 'FACULTY_ADVISOR' || user?.role === 'ADMIN') && <Plus className="w-3 h-3 text-emerald-600" />}
                                  Empty
                                </span>
                                {(canRequestClubRoom || user?.role === 'FACULTY' || user?.role === 'FACULTY_ADVISOR' || user?.role === 'ADMIN') ? (
                                  <span className="text-[8px] font-bold text-emerald-600 mt-0.5">
                                    Book Slot →
                                  </span>
                                ) : (
                                  <span className="text-[8px] font-medium text-slate-400 mt-0.5">
                                    Vacant
                                  </span>
                                )}
                              </div>
                            )}

                            {isReserved && (
                              <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-950 text-left min-h-[64px] flex flex-col justify-between hover:shadow-xs transition-all">
                                <div>
                                  <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-[#5c6bc0] text-white inline-block mb-0.5">
                                    BOOKED
                                  </span>
                                  <h5 className="font-bold text-[10px] text-slate-900 leading-tight truncate" title={slotObj.reservation?.title}>
                                    {slotObj.reservation?.title}
                                  </h5>
                                </div>
                                <span className="text-[9px] text-slate-500 font-semibold truncate block mt-1">
                                  {slotObj.reservation?.clubName || slotObj.reservation?.bookedBy}
                                </span>
                              </div>
                            )}

                            {isPending && (
                              <div className="p-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-left min-h-[64px] flex flex-col justify-between">
                                <div>
                                  <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-amber-500 text-white inline-block mb-0.5">
                                    IN REVIEW
                                  </span>
                                  <h5 className="font-bold text-[10px] text-amber-950 leading-tight truncate">
                                    {slotObj.reservation?.title}
                                  </h5>
                                </div>
                                <span className="text-[9px] text-amber-800 font-semibold truncate block mt-1">
                                  SAC Pending
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}

                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 2: ALL RESERVATIONS & APPROVAL PIPELINE                          */}
      {/* ===================================================================== */}
      {viewMode === 'reservations' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reservations.map((res) => {
              const isFaculty = res.type === 'FACULTY';
              const isSanctioned = res.status === 'APPROVED';
              const isPendingL1 = res.status === 'PENDING_FACULTY_INCHARGE';
              const isPendingL2 = res.status === 'PENDING_SAC_INCHARGE';
              const isRejected = res.status === 'REJECTED';

              return (
                <div key={res.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
                  <div>
                    {/* Badge Strip */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        isFaculty ? 'bg-blue-50 text-[#0c2340] border border-blue-200' : 'bg-purple-50 text-purple-900 border border-purple-200'
                      }`}>
                        {isFaculty ? 'Academic Faculty Booking' : `SAC Club: ${res.clubName}`}
                      </span>

                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isSanctioned ? 'bg-emerald-100 text-emerald-800' :
                        isPendingL1 ? 'bg-amber-100 text-amber-800' :
                        isPendingL2 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {isSanctioned ? 'SANCTIONED' :
                         isPendingL1 ? 'WAITING LEVEL-1' :
                         isPendingL2 ? 'WAITING SAC INCHARGE' : 'REJECTED'}
                      </span>
                    </div>

                    <h4 className="font-black text-sm text-slate-900 leading-snug">{res.title}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">REF: {res.id}</p>

                    {/* Venue & Timing Details */}
                    <div className="my-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">Venue:</span>
                        <span className="font-bold text-slate-800">{res.venueName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">Date & Slot:</span>
                        <span className="font-bold text-slate-800">{res.date} ({res.day}) • {res.timeSlot}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">Requested By:</span>
                        <span className="font-bold text-slate-800">{res.requestedBy?.name}</span>
                      </div>
                      {res.expectedAttendees && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold">Attendees:</span>
                          <span className="font-bold text-slate-800">~{res.expectedAttendees} Students</span>
                        </div>
                      )}
                    </div>

                    {/* Multi-Step Approval Flow Visualization */}
                    {!isFaculty && (
                      <div className="my-3 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-2">
                          SAC Approval Flow Hierarchy:
                        </span>
                        
                        <div className="space-y-1.5 text-xs">
                          {/* Step 1: Club Submission */}
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="text-[11px] text-slate-700">Proposal Submitted by Club Head</span>
                          </div>

                          {/* Step 2: Level-1 Respective Faculty In-charge */}
                          <div className="flex items-center gap-2">
                            {res.level1Approval ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
                            )}
                            <div className="text-[11px]">
                              <span className="font-bold text-slate-800">Level 1: </span>
                              <span className="text-slate-600">{res.categoryFaculty || 'Faculty In-charge'}</span>
                              {res.level1Approval && (
                                <span className="text-emerald-700 text-[10px] block italic">
                                  ✓ Approved: "{res.level1Approval.remarks}"
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Step 3: Final SAC Faculty In-charge (Dr. Shubham Shukla) */}
                          <div className="flex items-center gap-2">
                            {res.finalApproval ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            )}
                            <div className="text-[11px]">
                              <span className="font-bold text-slate-800">Level 2 (Final): </span>
                              <span className="text-slate-600">{res.sacFaculty || 'Dr. Shubham Shukla'}</span>
                              {res.finalApproval && (
                                <span className="text-emerald-700 text-[10px] block italic">
                                  ✓ Sanctioned: "{res.finalApproval.remarks}"
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    {/* View Allotment Pass */}
                    {isSanctioned ? (
                      <button
                        onClick={() => {
                          setSelectedPass(res);
                          setShowPassModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                        <span>View Pass</span>
                      </button>
                    ) : (
                      <div className="text-[11px] text-amber-700 font-semibold italic">
                        Pass generated upon SAC sanction.
                      </div>
                    )}

                    {/* Approver Controls (Available for Admin, Faculty, or Review) */}
                    {(user?.role === 'ADMIN' || user?.role === 'FACULTY' || user?.role === 'FACULTY_ADVISOR') && (
                      <div className="flex items-center gap-1.5">
                        {isPendingL1 && (
                          <button
                            onClick={() => handleLevel1Approve(res.id)}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer"
                            title="Approve as Respective Faculty In-charge"
                          >
                            Approve L1
                          </button>
                        )}

                        {(isPendingL2 || isPendingL1) && (
                          <button
                            onClick={() => handleFinalApprove(res.id)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer"
                            title="Final Sanction as SAC In-charge (Dr. Shubham Shukla)"
                          >
                            Sanction SAC
                          </button>
                        )}

                        {!isRejected && (
                          <button
                            onClick={() => handleReject(res.id)}
                            className="px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-md text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    )}

                    {/* Requester cancellation */}
                    {(user?.userId === res.requestedBy?.userId || user?.role === 'ADMIN') && (
                      <button
                        onClick={() => handleCancelBooking(res.id)}
                        className="text-[10px] text-slate-400 hover:text-red-600 font-semibold cursor-pointer ml-auto"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 3: SAC HIERARCHY & OFFICIAL CLUB HEADS DIRECTORY                 */}
      {/* ===================================================================== */}
      {viewMode === 'clubs' && clubsData && (
        <div className="space-y-6">
          
          {/* Top SAC In-charge Card */}
          <div className="p-6 rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50/70 to-blue-50/70 shadow-sm max-w-2xl mx-auto text-center">
            <span className="px-3 py-1 rounded-full bg-[#5c6bc0] text-white text-[10px] font-black uppercase tracking-wider">
              OVERALL SAC COORDINATION & FINAL APPROVAL
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-2">
              {clubsData.sacFacultyInCharge?.name}
            </h3>
            <p className="text-xs text-slate-600 font-semibold mt-0.5">
              {clubsData.sacFacultyInCharge?.designation}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
              {clubsData.sacFacultyInCharge?.responsibilities}
            </p>
            <div className="mt-3 flex items-center justify-center gap-4 text-xs font-mono text-slate-700">
              <span>Email: {clubsData.sacFacultyInCharge?.email}</span>
              <span>•</span>
              <span>{clubsData.sacFacultyInCharge?.office}</span>
            </div>
          </div>

          {/* 4 Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {clubsData.categories?.map((cat) => (
              <div key={cat.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
                <div>
                  <div className="pb-2 border-b border-slate-100">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      CATEGORY
                    </span>
                    <h4 className="font-black text-base text-slate-900 mt-1">{cat.name}</h4>
                    
                    {/* Faculty In-charge */}
                    <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-200/70 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Faculty In-charge:</span>
                      <span className="font-bold text-[#0c2340] block">{cat.facultyInCharge.name}</span>
                      {cat.coInCharge && (
                        <span className="text-[10px] text-slate-600 block mt-0.5">
                          Co-Incharge: {cat.coInCharge.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Registered Clubs under Category */}
                  <div className="mt-3 space-y-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">
                      Clubs & Leadership ({cat.clubs.length}):
                    </span>

                    {cat.clubs.map((c) => (
                      <div key={c.code} className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{c.name}</span>
                          <span className="text-[9px] font-mono font-bold text-[#5c6bc0]">{c.code}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{c.focus}</p>

                        <div className="mt-2 pt-1.5 border-t border-slate-200/60 text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Head:</span>
                            <span className="font-bold text-slate-800">{c.head.name}</span>
                          </div>
                          <div className="flex items-center justify-between font-mono text-[10px] text-slate-600">
                            <span>Phone:</span>
                            <a href={`tel:${c.head.mobile}`} className="font-bold text-blue-700 hover:underline">
                              {c.head.mobile}
                            </a>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-slate-500">Co-Head:</span>
                            <span className="font-bold text-slate-700">{c.coHead.name}</span>
                          </div>
                          <div className="flex items-center justify-between font-mono text-[10px] text-slate-600">
                            <span>Phone:</span>
                            <a href={`tel:${c.coHead.mobile}`} className="font-bold text-blue-700 hover:underline">
                              {c.coHead.mobile}
                            </a>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setClubCode(cat.clubs[0].code);
                    setShowClubModal(true);
                  }}
                  className="w-full mt-4 py-2 bg-slate-100 hover:bg-[#5c6bc0] hover:text-white text-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Request Venue for {cat.name} →
                </button>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: TEACHER / FACULTY EXTRA SESSION & QUIZ BOOKING               */}
      {/* ===================================================================== */}
      {showFacultyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowFacultyModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Building className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">
                Reserve Lecture Hall / Classroom (Faculty)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Schedule extra lectures, quizzes, remedial classes, or student workshops in empty slots.
            </p>

            <form onSubmit={handleFacultySubmit} className="space-y-3.5 text-xs">
              
              {/* Session Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Session Title / Purpose Description *
                </label>
                <input
                  type="text"
                  required
                  value={facTitle}
                  onChange={(e) => setFacTitle(e.target.value)}
                  placeholder="e.g. Surprise Quiz on TOC / Extra Problem-Solving Workshop"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#5c6bc0]"
                />
              </div>

              {/* Grid: Type & Course Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Activity Type *
                  </label>
                  <select
                    value={facPurpose}
                    onChange={(e) => setFacPurpose(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="EXTRA_CLASS">Extra Academic Class</option>
                    <option value="QUIZ">Departmental Quiz / Test</option>
                    <option value="WORKSHOP">Hands-on Workshop</option>
                    <option value="REMEDIAL">Remedial / Doubt Solving Session</option>
                    <option value="PROJECT_REVIEW">Project Review / Evaluation</option>
                    <option value="SEMINAR">Guest Lecture / Seminar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={facCourseCode}
                    onChange={(e) => setFacCourseCode(e.target.value)}
                    placeholder="e.g. LNO / DAA / TOC"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Grid: Venue & Batch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Select Venue (LH 1-8 / CR 1-10) *
                  </label>
                  <select
                    value={facVenueId}
                    onChange={(e) => setFacVenueId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                  >
                    <optgroup label="Lecture Halls (LH)">
                      {venues.filter(v => v.type === 'LECTURE_HALL').map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.capacity} Seats)</option>
                      ))}
                    </optgroup>
                    <optgroup label="Classrooms (CR)">
                      {venues.filter(v => v.type === 'CLASSROOM').map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.capacity} Seats)</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Target Student Batch
                  </label>
                  <select
                    value={facBatch}
                    onChange={(e) => setFacBatch(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="3rd Sem Section A (CSE)">3rd Sem Section A (CSE)</option>
                    <option value="3rd Sem Section B (CSE)">3rd Sem Section B (CSE)</option>
                    <option value="3rd Sem Section C (CSE)">3rd Sem Section C (CSE)</option>
                    <option value="3rd Sem Section D (ECE)">3rd Sem Section D (ECE)</option>
                    <option value="5th Sem Section A (CSE)">5th Sem Section A (CSE)</option>
                    <option value="5th Sem Section B (CSE)">5th Sem Section B (CSE)</option>
                    <option value="5th Sem Section C (ECE)">5th Sem Section C (ECE)</option>
                    <option value="All Year Batches">Open to All Batches</option>
                  </select>
                </div>
              </div>

              {/* Reason / Academic Objective */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Reason for Booking & Academic Objective *
                </label>
                <textarea
                  required
                  rows={2}
                  value={facReason}
                  onChange={(e) => setFacReason(e.target.value)}
                  placeholder="Explain session objectives (e.g. Pre-midsem remedial practice on Dynamic Programming, doubt resolution, or special quiz)..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#5c6bc0]"
                />
              </div>

              {/* Grid: Date & Customizable Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Reservation Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={facDate}
                    onChange={(e) => setFacDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase">
                      Time Slot *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsFacCustomTiming(!isFacCustomTiming)}
                      className="text-[10px] font-bold text-[#5c6bc0] hover:underline cursor-pointer"
                    >
                      {isFacCustomTiming ? 'Standard Slots' : 'Customise ⏱️'}
                    </button>
                  </div>

                  {!isFacCustomTiming ? (
                    <select
                      value={facTimeSlot}
                      onChange={(e) => setFacTimeSlot(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                    >
                      <option value="17:30 - 18:30">17:30 - 18:30 (Evening Academic Slot)</option>
                      <option value="18:30 - 19:30">18:30 - 19:30 (Evening Academic Slot)</option>
                      <option value="19:30 - 21:00">19:30 - 21:00 (Night Study Session)</option>
                      <option value="13:30 - 14:30">13:30 - 14:30 (Free Slot / Afternoons)</option>
                      <option value="14:30 - 15:30">14:30 - 15:30 (Free Slot)</option>
                      <option value="15:30 - 16:30">15:30 - 16:30 (Free Slot)</option>
                      <option value="16:30 - 17:30">16:30 - 17:30 (Free Slot)</option>
                    </select>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="time"
                        value={facCustomStartTime}
                        onChange={(e) => setFacCustomStartTime(e.target.value)}
                        className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                      />
                      <input
                        type="time"
                        value={facCustomEndTime}
                        onChange={(e) => setFacCustomEndTime(e.target.value)}
                        className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2 text-[11px] text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Faculty academic bookings are verified against the master timetable and <strong>auto-approved instantly</strong>. A digital allotment pass is issued and displayed on the master occupancy board.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFacultyModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0c2340] hover:bg-[#16355d] text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Confirm Instant Reservation
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: SAC CLUB EVENT PROPOSAL (HIERARCHICAL APPROVAL)              */}
      {/* ===================================================================== */}
      {showClubModal && canRequestClubRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowClubModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Award className="w-5 h-5 text-[#5c6bc0]" />
              <h3 className="text-base font-bold text-slate-900">
                Club Event / Meet Venue Proposal (SAC Flow)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Submit venue request for club workshops, hackathons, or auditions through official SAC hierarchy.
            </p>

            <form onSubmit={handleClubSubmit} className="space-y-3.5 text-xs">
              
              {/* Select Club - Locked to their specific club if designated leader */}
              {myLeadClub ? (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Authorized SAC Club (Locked to Your Official Leadership)
                  </label>
                  <div className="p-3.5 bg-purple-50/90 border border-purple-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-900 text-sm flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#5c6bc0]" />
                        <span>{myLeadClub.name}</span>
                        <span className="font-mono text-xs text-purple-700 font-bold">({myLeadClub.code})</span>
                      </span>
                      <span className="px-2.5 py-0.5 bg-purple-200/90 text-purple-900 text-[10px] font-black uppercase rounded">
                        {myLeadClub.userPosition === 'HEAD' ? 'Official Club Head' : 'Official Club Co-Head'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs">{myLeadClub.focus}</p>
                    <p className="text-[10px] text-purple-700 font-semibold pt-0.5 flex items-center gap-1">
                      <Check className="w-3 h-3 text-purple-600" />
                      <span>Permission requests are strictly restricted to your designated club ({myLeadClub.name}).</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Select Registered SAC Club *
                  </label>
                  <select
                    value={clubCode}
                    onChange={(e) => setClubCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                  >
                    {clubsData?.categories?.map(cat => (
                      <optgroup key={cat.id} label={`${cat.name} (In-charge: ${cat.facultyInCharge.name})`}>
                        {cat.clubs.map(c => (
                          <option key={c.code} value={c.code}>{c.name} — {c.focus}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}

              {/* Dynamic Hierarchy Routing Preview Card */}
              {currentClubInfo && (
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900">Category: {currentClubInfo.categoryName}</span>
                    <span className="text-purple-700 font-mono">Code: {currentClubInfo.code}</span>
                  </div>
                  <div className="text-slate-700">
                    <strong>Level 1 Approver: </strong> {currentClubInfo.facultyInCharge.name} ({currentClubInfo.facultyInCharge.title})
                  </div>
                  <div className="text-slate-700">
                    <strong>Level 2 Final Sanction: </strong> {currentClubInfo.sacFaculty?.name} (Overall SAC In-charge)
                  </div>
                  <div className="text-slate-600 pt-1 border-t border-purple-200/60 flex items-center justify-between">
                    <span>Registered Head: <strong>{currentClubInfo.head.name}</strong></span>
                    <span>Contact: <strong>{currentClubInfo.head.mobile}</strong></span>
                  </div>
                </div>
              )}

              {/* Event Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Event / Workshop Title *
                </label>
                <input
                  type="text"
                  required
                  value={clubTitle}
                  onChange={(e) => setClubTitle(e.target.value)}
                  placeholder="e.g. 24-Hour CodeSprint Hackathon / Annual Dance Audition"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#5c6bc0]"
                />
              </div>

              {/* Event Purpose & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Event Type *
                  </label>
                  <select
                    value={clubPurpose}
                    onChange={(e) => setClubPurpose(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="CLUB_EVENT">Flagship Club Event</option>
                    <option value="WORKSHOP">Hands-on Technical Workshop</option>
                    <option value="HACKATHON">Hackathon / Coding Sprint</option>
                    <option value="AUDITION">Club Audition / Recruitment</option>
                    <option value="CLUB_MEET">General Body / Core Committee Meet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Expected Attendees (~Students)
                  </label>
                  <input
                    type="number"
                    value={clubAttendees}
                    onChange={(e) => setClubAttendees(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Venue & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Desired Venue *
                  </label>
                  <select
                    value={clubVenueId}
                    onChange={(e) => setClubVenueId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                  >
                    <optgroup label="Lecture Halls (LH01–LH08)">
                      {venues.filter(v => v.type === 'LECTURE_HALL').map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.capacity} Seats)</option>
                      ))}
                    </optgroup>
                    <optgroup label="Classrooms (CR01–CR10)">
                      {venues.filter(v => v.type === 'CLASSROOM').map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.capacity} Seats)</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={clubDate}
                    onChange={(e) => setClubDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Applicant Authorization */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block text-[11px] font-bold text-slate-800 uppercase">
                  Applicant Official Capacity * (SAC Regulation: Only Heads & Co-Heads)
                </label>
                {myLeadClub ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-900 bg-purple-50 border border-purple-200 p-2.5 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Verified: {user?.name} — Designated {myLeadClub.userPosition === 'HEAD' ? 'Head' : 'Co-Head'} of {myLeadClub.name}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
                      applicantPosition === 'HEAD' 
                        ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold shadow-xs' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}>
                      <input
                        type="radio"
                        name="applicantPosition"
                        value="HEAD"
                        checked={applicantPosition === 'HEAD'}
                        onChange={() => setApplicantPosition('HEAD')}
                        className="accent-[#5c6bc0]"
                      />
                      <div>
                        <span className="block font-bold">Club Head</span>
                        <span className="text-[10px] text-slate-500 truncate block max-w-[120px]">{currentClubInfo?.head?.name}</span>
                      </div>
                    </label>

                    <label className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
                      applicantPosition === 'CO_HEAD' 
                        ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold shadow-xs' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}>
                      <input
                        type="radio"
                        name="applicantPosition"
                        value="CO_HEAD"
                        checked={applicantPosition === 'CO_HEAD'}
                        onChange={() => setApplicantPosition('CO_HEAD')}
                        className="accent-[#5c6bc0]"
                      />
                      <div>
                        <span className="block font-bold">Club Co-Head</span>
                        <span className="text-[10px] text-slate-500 truncate block max-w-[120px]">{currentClubInfo?.coHead?.name || 'Co-Head'}</span>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* Detailed Reason & Justification */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Detailed Reason & Justification for Venue Requirement *
                </label>
                <textarea
                  required
                  rows={2}
                  value={clubReason}
                  onChange={(e) => setClubReason(e.target.value)}
                  placeholder="Explain why this classroom/lecture hall is needed (e.g. Offline round for 80 registered hackathon teams with projector & power backup)..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#5c6bc0]"
                />
                <span className="text-[10px] text-slate-400">
                  Minimum 10 characters explaining your event agenda and venue requirement.
                </span>
              </div>

              {/* Customizable Timings Mode */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Timings Allocation *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomTiming(!isCustomTiming)}
                    className="text-[11px] font-bold text-[#5c6bc0] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Clock className="w-3 h-3" />
                    <span>{isCustomTiming ? '← Standard Slots' : 'Customise Timings ⏱️'}</span>
                  </button>
                </div>

                {!isCustomTiming ? (
                  <select
                    value={clubTimeSlot}
                    onChange={(e) => setClubTimeSlot(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                  >
                    <option value="17:30 - 19:30">17:30 - 19:30 (Evening Slot - Recommended for Clubs)</option>
                    <option value="18:30 - 21:00">18:30 - 21:00 (Night Hackathon / Rehearsal)</option>
                    <option value="17:30 - 18:30">17:30 - 18:30 (Evening 1-Hour Meet)</option>
                    <option value="14:30 - 17:30">14:30 - 17:30 (Weekend / Friday Free Slot)</option>
                    <option value="09:30 - 13:30">09:30 - 13:30 (Weekend Morning Half-Day)</option>
                    <option value="09:30 - 17:30">09:30 - 17:30 (Weekend Full-Day Event)</option>
                  </select>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Start Time</label>
                        <input
                          type="time"
                          value={customStartTime}
                          onChange={(e) => setCustomStartTime(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">End Time</label>
                        <input
                          type="time"
                          value={customEndTime}
                          onChange={(e) => setCustomEndTime(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                        />
                      </div>
                    </div>
                    <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-[11px] text-indigo-900 font-bold flex items-center justify-between">
                      <span>Customized Window:</span>
                      <span className="font-mono">{customStartTime} – {customEndTime}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Head Contact */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Point of Contact Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  value={clubContact}
                  onChange={(e) => setClubContact(e.target.value)}
                  placeholder="e.g. 9588742961"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClubModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canRequestClubRoom || applicantPosition === 'MEMBER'}
                  className={`px-5 py-2.5 font-bold rounded-xl shadow-sm transition-all cursor-pointer ${
                    (!canRequestClubRoom || applicantPosition === 'MEMBER')
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-[#5c6bc0] hover:bg-[#4d5cb5] text-white'
                  }`}
                >
                  Submit Official Room Proposal ({applicantPosition === 'CO_HEAD' ? 'Co-Head' : 'Head'})
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: OFFICIAL DIGITAL VENUE ALLOTMENT SLIP & SECURITY PASS        */}
      {/* ===================================================================== */}
      {showPassModal && selectedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 relative text-left">
            <button
              onClick={() => setShowPassModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official Header */}
            <div className="text-center pb-4 border-b border-slate-200">
              <img 
                src="/iiitp_logo_clean.png" 
                alt="IIIT Pune" 
                className="w-14 h-14 object-contain mx-auto mb-1.5" 
              />
              <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">
                INDIAN INSTITUTE OF INFORMATION TECHNOLOGY PUNE
              </span>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mt-0.5">
                Official Infrastructure Allotment & Security Gatepass
              </h3>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                REF NO: {selectedPass.id} • ALLOTTED ON: {selectedPass.date}
              </p>
            </div>

            {/* Pass Content Details */}
            <div className="my-4 space-y-2.5 text-xs">
              
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Allotted Hall / Classroom:</span>
                  <span className="text-base font-black text-[#0c2340]">{selectedPass.venueName}</span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-full">
                  SANCTIONED
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Date & Day:</span>
                  <span className="font-bold text-slate-800">{selectedPass.date} ({selectedPass.day})</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Timings:</span>
                  <span className="font-bold text-slate-800">{selectedPass.timeSlot}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Activity / Title:</span>
                <span className="font-bold text-slate-900">{selectedPass.title}</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Authorized Member:</span>
                  <span className="font-bold text-slate-800">{selectedPass.requestedBy?.name}</span>
                  <span className="text-[10px] text-slate-500 block">{selectedPass.requestedBy?.designation || selectedPass.requestedBy?.role}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Sanctioning Authority:</span>
                  <span className="font-bold text-[#0c2340]">{selectedPass.finalApproval?.approvedBy || 'Dr. Shubham Shukla'}</span>
                  <span className="text-[10px] text-slate-500 block">SAC Faculty In-charge</span>
                </div>
              </div>

              {/* QR Code and Security Verification */}
              <div className="mt-3 p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-900 uppercase block">Security Gatepass Token:</span>
                  <span className="font-mono text-xs font-black text-[#0c2340]">{selectedPass.passQrCode || 'PASS-IIITP-VERIFIED'}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Show at Academic Estate Desk for hall key handover.</p>
                </div>
                <div className="w-14 h-14 bg-white border border-slate-300 rounded-lg p-1.5 flex items-center justify-center shrink-0">
                  <QrCode className="w-full h-full text-slate-800" />
                </div>
              </div>

            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[10px]">Valid for entry during specified slot only.</span>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#0c2340] hover:bg-[#16355d] text-white font-bold rounded-lg transition-colors cursor-pointer"
              >
                Print / Save Pass
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
