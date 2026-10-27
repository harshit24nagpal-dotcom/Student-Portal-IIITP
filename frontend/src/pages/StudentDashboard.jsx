import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  Heart, Flame, ShieldAlert, Activity, AlertCircle, HelpCircle, 
  MapPin, Phone, User, Clock, AlertTriangle, Shield, CheckCircle, Check,
  BookOpen, Building, Calendar, GraduationCap, Sparkles, Send, Award, 
  CheckCircle2, ChevronRight, FileCheck, CheckSquare, AlertOctagon,
  ChevronLeft, ChevronRight as ChevronRightIcon, ExternalLink, Mail, Hash, BookMarked, Download, PhoneCall
} from 'lucide-react';
import SOSModal from '../components/SOSModal';
import SemesterRegistrationTab from '../components/SemesterRegistrationTab';
import NoDuesClearanceTab from '../components/NoDuesClearanceTab';
import HostelLeaveTab from '../components/HostelLeaveTab';
import MessManagementTab from '../components/MessManagementTab';
import HostelTicketingTab from '../components/HostelTicketingTab';
import ComplaintsTab from '../components/ComplaintsTab';
import LostAndFoundTab from '../components/LostAndFoundTab';
import AnnouncementsTab from '../components/AnnouncementsTab';
import PlacementDriveTab from '../components/PlacementDriveTab';
import RoommateAllotmentTab from '../components/RoommateAllotmentTab';
import { 
  LogOut, LogIn, Utensils, Wrench, MessageSquare, Tag, EyeOff, ShieldCheck,
  Briefcase, Megaphone, Bed, Sparkles as SparklesIcon
} from 'lucide-react';
import { API_URL } from '../config/api';

export default function StudentDashboard() {
  const { user, token } = useAuth();
  const { socket } = useSocket();
  // Default landing tab is Profile / Student Identity Overview
  const [activePortalDivision, setActivePortalDivision] = useState('academic'); // 'academic' | 'hostel'
  const [portalTab, setPortalTab] = useState('profile'); // 'profile' | 'attendance' | 'registration' | 'nodues' | 'academics' | 'contacts' | 'facilities'
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [isSosOpen, setIsSosOpen] = useState(false);

  // Attendance & Calendar State
  const [attendanceData, setAttendanceData] = useState({ summary: [], detailedHistory: [], studentSection: '' });
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date(2026, 8, 1)); // Sept 2026
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('2026-09-08');

  // Booking state
  const [selectedFacility, setSelectedFacility] = useState('AI/ML Computing Lab');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Fetch student live attendance data from backend
  const fetchAttendance = () => {
    if (!token) return;
    setLoadingAttendance(true);
    fetch(`${API_URL}/attendance/student/attendance`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.summary)) {
          setAttendanceData(data);
        }
      })
      .catch(err => console.error('Attendance fetch error:', err))
      .finally(() => setLoadingAttendance(false));
  };

  useEffect(() => {
    fetchAttendance();
  }, [token]);

  const fetchContacts = async () => {
    try {
      const contactsRes = await fetch(`${API_URL}/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const contactsData = await contactsRes.json();
      if (Array.isArray(contactsData) && contactsData.length > 0) {
        setContacts(contactsData);
      } else {
        // Fallback default official directory
        setContacts([
          { id: 1, name: 'Campus Emergency Ambulance', number: '+91 9826381867', department: 'Emergency Health & Ambulance Services' },
          { id: 2, name: 'Harneshwar Multispeciality Hospital (Tie-up)', number: '+91 20 2742 2222 / +91 98220 12345', department: 'Empanelled Hospital (https://www.harneshwarhospital.com/)' },
          { id: 3, name: 'Chief Hostel Warden (Residence)', number: '+91 98230 12345', department: 'Hostel Affairs & Student Residence' },
          { id: 4, name: 'Student Grievance Cell', number: '+91 20 2345 6711', department: 'Student Affairs & Grievance Redressal' },
          { id: 5, name: 'Campus Security Landline', number: '020-23456789 / +91 9123456780', department: 'Main Gate & Central Control Room' },
          { id: 6, name: 'Anti-Ragging Squad Hotline', number: '1800-180-5522 / +91 20 2345 6710', department: 'Disciplinary & Anti-Ragging Committee' },
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchContacts();
    }
  }, [token]);

  // Dynamic Timetable & Course Syllabus state
  const [studentTimetable, setStudentTimetable] = useState([]);
  const [selectedTimetableDay, setSelectedTimetableDay] = useState('Today');
  const [studentSyllabus, setStudentSyllabus] = useState(null);
  const [selectedSyllabusCode, setSelectedSyllabusCode] = useState('LNO');
  const [academicCirculars, setAcademicCirculars] = useState([]);

  const fetchStudentTimetable = () => {
    if (!token) return;
    fetch(`${API_URL}/academics/timetable?section=${encodeURIComponent(user?.section || 'Section A (CSE)')}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setStudentTimetable(data);
      })
      .catch(console.error);
  };

  const fetchStudentSyllabus = (code) => {
    if (!token) return;
    fetch(`${API_URL}/academics/syllabus/${code || 'LNO'}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setStudentSyllabus(data))
      .catch(console.error);
  };

  const fetchAcademicCirculars = () => {
    if (!token) return;
    fetch(`${API_URL}/announcements?portalType=ACADEMIC`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAcademicCirculars(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (token) {
      fetchStudentTimetable();
      fetchStudentSyllabus(selectedSyllabusCode);
      fetchAcademicCirculars();
    }
  }, [token, portalTab, selectedSyllabusCode]);

  // Overall Attendance calculation
  const totalAttended = attendanceData.summary.reduce((acc, curr) => acc + curr.attendedClasses, 0);
  const totalClasses = attendanceData.summary.reduce((acc, curr) => acc + curr.totalClasses, 0);
  const overallPct = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 88;
  const hasShortage = attendanceData.summary.some(s => s.isShortage);

  const downloadStudentAttendanceCSV = () => {
    if (!attendanceData.summary || attendanceData.summary.length === 0) {
      alert('No attendance data available to download.');
      return;
    }
    const headers = ['Subject Code', 'Subject Name', 'Faculty Instructor', 'Total Classes', 'Attended Classes', 'Attendance %', 'Status'];
    const rows = attendanceData.summary.map(s => [
      `"${s.subjectCode}"`,
      `"${s.subjectName}"`,
      `"${s.facultyName || 'Faculty'}"`,
      s.totalClasses,
      s.attendedClasses,
      `${s.percentage}%`,
      s.isShortage ? 'SHORTAGE (<75%)' : 'NORMAL'
    ].join(','));

    const historyHeaders = ['Date', 'Subject Code', 'Subject Name', 'Slot Time', 'Class Status'];
    const historyRows = (attendanceData.detailedHistory || []).map(h => [
      `"${h.date}"`,
      `"${h.subjectCode}"`,
      `"${h.subjectName}"`,
      `"${h.slotTime || 'Regular'}"`,
      h.status
    ].join(','));

    const csvContent = [
      `"INDIAN INSTITUTE OF INFORMATION TECHNOLOGY PUNE"`,
      `"STUDENT ACADEMIC ATTENDANCE REPORT"`,
      `"Student Name:","${user?.name || ''}"`,
      `"MIS / Roll No:","${user?.userId || ''}"`,
      `"Department:","${user?.department || 'CSE'}"`,
      `"Section:","${attendanceData.studentSection || 'Section A'}"`,
      `"Overall Attendance:","${overallPct}%"`,
      `"Export Date:","${new Date().toLocaleString()}"`,
      ``,
      `"--- SUBJECT-WISE ATTENDANCE SUMMARY ---"`,
      headers.join(','),
      ...rows,
      ``,
      `"--- DAILY ATTENDANCE SESSION HISTORY ---"`,
      historyHeaders.join(','),
      ...historyRows
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `My_Attendance_Report_${user?.userId || 'student'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Calendar Helpers
  const year = currentCalendarMonth.getFullYear();
  const month = currentCalendarMonth.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentCalendarMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarMonth(new Date(year, month + 1, 1));
  };

  // Group detailed history by date string (YYYY-MM-DD)
  const historyByDate = {};
  (attendanceData.detailedHistory || []).forEach(record => {
    if (!record.date) return;
    if (!historyByDate[record.date]) {
      historyByDate[record.date] = [];
    }
    historyByDate[record.date].push(record);
  });

  // Selected date lectures
  const selectedDateLectures = historyByDate[selectedCalendarDate] || [];

  return (
    <div className="p-3 sm:p-6 pb-24 sm:pb-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans text-slate-800 bg-slate-50 min-h-[calc(100vh-65px)] overflow-x-hidden">
      
      {/* 1-CLICK EMERGENCY ASSISTANCE & SPEED-DIAL BAR */}
      <div className="p-3.5 sm:p-4 rounded-md border border-red-200 bg-linear-to-r from-red-50 via-white to-amber-50 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md bg-red-600 text-white flex items-center justify-center shadow-xs shrink-0 animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-red-700 tracking-wider">
                24x7 CAMPUS EMERGENCY SOS & DIRECT SPEED-DIAL
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 bg-red-100 text-red-800 font-bold text-[8px] rounded uppercase">
                1-Click Call
              </span>
            </div>
            <p className="text-xs font-black text-slate-900 leading-tight">
              In danger or need immediate help? Trigger CAD Broadcast or call direct:
            </p>
          </div>
        </div>

        {/* 1-Click Direct Phone Helpline Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <a
            href="tel:9826381867"
            className="flex-1 sm:flex-none px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-md shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            title="Call Campus Security QRT"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Security</span>
          </a>

          <a
            href="tel:9826381867"
            className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-md shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            title="Call Campus Ambulance"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Ambulance</span>
          </a>

          <button
            onClick={() => setIsSosOpen(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-md shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-slate-800"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
            <span>Open SOS Console</span>
          </button>
        </div>
      </div>

      {/* Top Greeting Header */}
      <div className="p-4 sm:p-6 rounded-md border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-[#0c2340] text-[10px] font-black uppercase rounded tracking-wider">
              OFFICIAL STUDENT PORTAL
            </span>
            <span className="text-xxs text-slate-500 font-mono font-bold">
              MIS: {user?.userId || '112415079'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mt-1 tracking-tight">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.name || 'Student'}!
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Indian Institute of Information Technology Pune • Academic Year 2026-27
          </p>
        </div>

        {/* Quick Overall Metrics Tag */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-right">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Current Attendance</span>
            <span className={`text-lg font-black font-mono flex items-center justify-end gap-1.5 ${overallPct >= 75 ? 'text-emerald-700' : 'text-red-600'}`}>
              {overallPct}%
              {overallPct >= 75 ? <Check className="w-4 h-4 text-emerald-600 inline" /> : <AlertTriangle className="w-4 h-4 text-red-600 inline" />}
            </span>
          </div>
        </div>
      </div>

      {/* PRIMARY DIVISION SWITCHER: 3 PILLARS */}
      <div className="p-1 rounded-md bg-slate-100 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-1.5">
        <button
          onClick={() => {
            setActivePortalDivision('academic');
            if (!['profile', 'placement', 'announcements_acad', 'attendance', 'registration', 'nodues', 'academics', 'facilities'].includes(portalTab)) {
              setPortalTab('placement');
            }
          }}
          className={`py-2 px-4 rounded-md text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activePortalDivision === 'academic'
              ? 'bg-[#0c2340] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Academic Portal</span>
        </button>

        <button
          onClick={() => {
            setActivePortalDivision('hostel');
            if (!['leaves', 'mess', 'roommate', 'tickets', 'announcements_hostel'].includes(portalTab)) {
              setPortalTab('roommate');
            }
          }}
          className={`py-2 px-4 rounded-md text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activePortalDivision === 'hostel'
              ? 'bg-[#1c398e] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Hostel Management</span>
        </button>

        <button
          onClick={() => {
            setActivePortalDivision('campus');
            if (!['lostfound', 'complaints', 'contacts'].includes(portalTab)) {
              setPortalTab('lostfound');
            }
          }}
          className={`py-2 px-4 rounded-md text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activePortalDivision === 'campus'
              ? 'bg-purple-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Campus Life & Grievances</span>
        </button>
      </div>

      {/* SUB-MODULE TABS FOR ACTIVE DIVISION */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 overflow-x-auto">
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          {activePortalDivision === 'academic' && (
            <>
              <button
                onClick={() => setPortalTab('profile')}
                className={`px-3.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  portalTab === 'profile'
                    ? 'bg-[#0c2340] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Student Profile</span>
              </button>

              <button
                onClick={() => setPortalTab('placement')}
                className={`px-3.5 py-2 rounded-md text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  portalTab === 'placement'
                    ? 'bg-blue-700 text-white shadow-sm ring-2 ring-blue-300'
                    : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>Placement CRM</span>
                <span className="px-1.5 py-0.5 bg-amber-400 text-amber-950 font-black text-[9px] rounded uppercase">
                  DRIVES
                </span>
              </button>

              <button
                onClick={() => setPortalTab('announcements_acad')}
                className={`px-3.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  portalTab === 'announcements_acad'
                    ? 'bg-[#0c2340] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Megaphone className="w-4 h-4 text-purple-600" />
                <span>Academic Circulars</span>
              </button>

              <button
                onClick={() => setPortalTab('attendance')}
                className={`px-3.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  portalTab === 'attendance'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Attendance & Calendar</span>
              </button>

              <button
                onClick={() => setPortalTab('registration')}
                className={`px-3.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  portalTab === 'registration'
                    ? 'bg-[#0c2340] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                <span>Semester Registration</span>
              </button>

              <button
                onClick={() => setPortalTab('nodues')}
                className={`px-3.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  portalTab === 'nodues'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>No-Dues Clearance</span>
              </button>

              <button
                onClick={() => setPortalTab('academics')}
                className={`px-3.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  portalTab === 'academics'
                    ? 'bg-[#0c2340] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Courses & Syllabi</span>
              </button>

              <button
                onClick={() => setPortalTab('facilities')}
                className={`px-3.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  portalTab === 'facilities'
                    ? 'bg-[#0c2340] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Campus Facilities</span>
              </button>
            </>
          )}

          {activePortalDivision === 'hostel' && (
            <>
              <button
                onClick={() => setPortalTab('roommate')}
                className={`px-3.5 py-2 rounded-md text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  portalTab === 'roommate'
                    ? 'bg-indigo-700 text-white shadow-sm ring-2 ring-indigo-300'
                    : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                <Bed className="w-4 h-4 text-indigo-600" />
                <span>Roommate Matching & Bed Allotment</span>
                <span className="px-1.5 py-0.5 bg-indigo-200 text-indigo-950 font-black text-[9px] rounded uppercase">
                  AI MATCH
                </span>
              </button>

              <button
                onClick={() => setPortalTab('leaves')}
                className={`px-3.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  portalTab === 'leaves'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Digital Leave / Outpass</span>
              </button>

              <button
                onClick={() => setPortalTab('mess')}
                className={`px-3.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  portalTab === 'mess'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Utensils className="w-4 h-4" />
                <span>Mess Headcount & Diners</span>
              </button>

              <button
                onClick={() => setPortalTab('tickets')}
                className={`px-3.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  portalTab === 'tickets'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Hostel Problems & Proof</span>
              </button>

              <button
                onClick={() => setPortalTab('announcements_hostel')}
                className={`px-3.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  portalTab === 'announcements_hostel'
                    ? 'bg-[#1c398e] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Megaphone className="w-4 h-4 text-amber-500" />
                <span>Hostel & Mess Notices</span>
              </button>
            </>
          )}

          {activePortalDivision === 'campus' && (
            <>
              <button
                onClick={() => setPortalTab('lostfound')}
                className={`px-3.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  portalTab === 'lostfound'
                    ? 'bg-purple-700 text-white shadow-sm ring-2 ring-purple-300'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Tag className="w-4 h-4 text-purple-600" />
                <span>Lost & Found Community Hub</span>
              </button>

              <button
                onClick={() => setPortalTab('complaints')}
                className={`px-3.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  portalTab === 'complaints'
                    ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-300'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-red-600" />
                <span>Campus Grievances & Redressal</span>
              </button>

              <button
                onClick={() => setPortalTab('contacts')}
                className={`px-3.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  portalTab === 'contacts'
                    ? 'bg-[#0c2340] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Emergency Hotline & Hospitals</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MAIN LANDING VIEW: STUDENT PROFILE & OVERVIEW                         */}
      {/* ========================================================================= */}
      {activePortalDivision === 'academic' && portalTab === 'profile' && (
        <div className="space-y-6">
          
          {/* Main Comprehensive Profile Card */}
          <div className="p-6 sm:p-8 rounded-md border border-slate-200 bg-white shadow-sm space-y-6">
            
            {/* Header with College Emblem */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-4">
                <img 
                  src="/iiitp_logo.png" 
                  alt="IIIT Pune" 
                  className="w-16 h-16 object-contain drop-shadow-xs" 
                />
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    INDIAN INSTITUTE OF INFORMATION TECHNOLOGY PUNE
                  </h3>
                  <p className="text-xs font-bold text-[#0c2340] tracking-wider uppercase mt-0.5">
                    Official Student Identity Record
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black rounded uppercase self-start sm:self-center flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>ACTIVE & VERIFIED STUDENT</span>
              </span>
            </div>

            {/* Profile Grid Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left: Avatar & Key Badges */}
              <div className="md:col-span-1 p-6 bg-slate-50 border border-slate-200 rounded-md flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-24 h-24 rounded bg-[#0c2340] text-white font-black text-3xl flex items-center justify-center shadow-md">
                  {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'HN'}
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">{user?.name || 'Harshit Nagpal'}</h4>
                  <p className="text-xs font-mono font-bold text-[#0c2340] mt-0.5">MIS: {user?.userId || '112415079'}</p>
                </div>
                <div className="w-full pt-2 border-t border-slate-200 text-xxs font-bold text-slate-500 space-y-1 text-left">
                  <p>• Department: <span className="text-slate-800 font-semibold">{user?.department || 'Computer Science & Engineering'}</span></p>
                  <p>• Batch: <span className="text-slate-800 font-semibold">{user?.batch || '2024-2028'}</span></p>
                  <p>• Semester: <span className="text-slate-800 font-semibold">{user?.semester || 3}rd Semester</span></p>
                </div>
              </div>

              {/* Center & Right: Detailed Academic Data */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-md space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">FULL NAME</span>
                  <p className="text-sm font-bold text-slate-900">{user?.name || 'Harshit Nagpal'}</p>
                </div>

                <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-md space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">MIS / ROLL NUMBER</span>
                  <p className="text-sm font-mono font-bold text-[#0c2340]">{user?.userId || '112415079'}</p>
                </div>

                <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-md space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">DEGREE & PROGRAMME</span>
                  <p className="text-sm font-bold text-slate-900">{user?.programme || 'Bachelor of Technology (B.Tech)'}</p>
                </div>

                <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-md space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">COURSE / BRANCH</span>
                  <p className="text-sm font-bold text-[#0c2340]">
                    {user?.email?.includes('@ece.') ? 'Electronics & Communication Engineering (ECE)' : 'Computer Science & Engineering (CSE)'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-md space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">INSTITUTIONAL EMAIL</span>
                  <p className="text-xs font-mono font-semibold text-slate-700 break-all">{user?.email}</p>
                </div>

                <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-md space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PRIMARY PHONE NUMBER</span>
                  <p className="text-xs font-mono font-semibold text-slate-700">{user?.contactNumber || '+91 99887 76655'}</p>
                </div>

                <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-md space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ENROLLED SECTION</span>
                  <p className="text-xs font-bold text-slate-800">{user?.section || 'Section A (CSE - MIS 001 to 082)'}</p>
                </div>

                <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-md space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">HOSTEL RESIDENCE</span>
                  <p className="text-xs font-bold text-slate-800">{user?.hostelBlock || 'Vindhyachal Boys Hostel (BH-1)'}</p>
                </div>

              </div>

            </div>

            {/* Quick Portal Action Cards */}
            <div className="border-t border-slate-100 pt-5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3.5">
                Quick Campus Portals & High-Priority Actions
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div 
                  onClick={() => { setActivePortalDivision('academic'); setPortalTab('placement'); }}
                  className="p-4 bg-blue-50/60 border border-blue-200 hover:border-blue-500 rounded-md shadow-xs transition-all cursor-pointer group hover:bg-blue-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-900 group-hover:text-blue-700">Placement CRM</span>
                    <Briefcase className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-[10px] text-blue-700 font-medium mt-1">Active drives: Google, Microsoft, NVIDIA</p>
                  <span className="mt-2 inline-block px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded-md uppercase">1-Click Apply →</span>
                </div>

                <div 
                  onClick={() => { setActivePortalDivision('hostel'); setPortalTab('roommate'); }}
                  className="p-4 bg-indigo-50/60 border border-indigo-200 hover:border-indigo-500 rounded-md shadow-xs transition-all cursor-pointer group hover:bg-indigo-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-900 group-hover:text-indigo-700">Roommate & Bed Allotment</span>
                    <Bed className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-[10px] text-indigo-700 font-medium mt-1">Lifestyle Survey & 96% Match Algorithm</p>
                  <span className="mt-2 inline-block px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black rounded-md uppercase">Select Room & Bed →</span>
                </div>

                <div 
                  onClick={() => { setActivePortalDivision('academic'); setPortalTab('announcements_acad'); }}
                  className="p-4 bg-purple-50/60 border border-purple-200 hover:border-purple-500 rounded-md shadow-xs transition-all cursor-pointer group hover:bg-purple-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-900 group-hover:text-purple-700">Campus Circulars</span>
                    <Megaphone className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-[10px] text-purple-700 font-medium mt-1">Navratri Dress Code & Mess Delay Alerts</p>
                  <span className="mt-2 inline-block px-2 py-0.5 bg-purple-700 text-white text-[9px] font-black rounded-md uppercase">View Notices →</span>
                </div>

                <div 
                  onClick={() => { setActivePortalDivision('campus'); setPortalTab('lostfound'); }}
                  className="p-4 bg-amber-50/60 border border-amber-200 hover:border-amber-500 rounded-md shadow-xs transition-all cursor-pointer group hover:bg-amber-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-900 group-hover:text-amber-700">Lost & Found Hub</span>
                    <Tag className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-[10px] text-amber-700 font-medium mt-1">Lost Casio Calculator, Boat Earbuds, ID</p>
                  <span className="mt-2 inline-block px-2 py-0.5 bg-amber-600 text-white text-[9px] font-black rounded-md uppercase">Claim & Report →</span>
                </div>

                <div 
                  onClick={() => { setActivePortalDivision('academic'); setPortalTab('attendance'); }}
                  className="p-4 bg-white border border-slate-200 hover:border-emerald-500 rounded-md shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">Attendance Calendar</span>
                    <Calendar className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Daily lectures & percentage tracking</p>
                </div>

                <div 
                  onClick={() => { setActivePortalDivision('academic'); setPortalTab('registration'); }}
                  className="p-4 bg-white border border-slate-200 hover:border-blue-500 rounded-md shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Semester Registration</span>
                    <FileCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Fee verification & Roommate questionnaire</p>
                </div>

                <div 
                  onClick={() => { setActivePortalDivision('academic'); setPortalTab('nodues'); }}
                  className="p-4 bg-white border border-slate-200 hover:border-amber-500 rounded-md shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-amber-700">No-Dues Clearance</span>
                    <GraduationCap className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">15-Department clearance certificate</p>
                </div>

                <div 
                  onClick={() => { setActivePortalDivision('campus'); setPortalTab('contacts'); }}
                  className="p-4 bg-white border border-slate-200 hover:border-red-500 rounded-md shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-red-700">Emergency Contacts</span>
                    <Phone className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Ambulance, Hospital & Security</p>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ATTENDANCE & INTERACTIVE DAILY CALENDAR                                */}
      {/* ========================================================================= */}
      {activePortalDivision === 'academic' && portalTab === 'attendance' && (
        <div className="space-y-6">
          
          {/* Top Overview Meter */}
          <div className="p-6 rounded-md border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase rounded tracking-wider">
                  DAILY ACADEMIC ATTENDANCE TRACKER
                </span>
                <span className="text-xxs text-slate-500 font-mono font-bold">
                  Section: {attendanceData.studentSection || 'Section A (CSE)'}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900">Semester Daily Attendance Calendar & Roster</h3>
              <p className="text-xs text-slate-500">
                Live attendance records updated by faculty instructors. Maintain &ge; 75% overall and per subject.
              </p>
            </div>

            {/* Total Percentage Stats */}
            <div className="flex items-center gap-4 bg-slate-50 p-4 border border-slate-200 rounded-md shrink-0 flex-wrap">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Overall Percentage</span>
                <span className={`text-2xl font-black font-mono ${overallPct >= 75 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {overallPct}%
                </span>
              </div>
              <div className="h-10 w-px bg-slate-200"></div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Exam Eligibility</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded uppercase ${
                  !hasShortage 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {!hasShortage ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-700" />
                      <span>ELIGIBLE</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                      <span>SHORTAGE ALERT</span>
                    </>
                  )}
                </span>
              </div>
              <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>
              <button
                type="button"
                onClick={downloadStudentAttendanceCSV}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-[#1c398e] border border-slate-200 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                title="Download complete attendance report to your computer"
              >
                <Download className="w-3.5 h-3.5 text-[#1c398e]" />
                <span>Save Sheet (CSV)</span>
              </button>
            </div>
          </div>

          {/* Interactive Calendar & Daily Breakdown Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Monthly Calendar Component */}
            <div className="lg:col-span-2 p-6 rounded-md border border-slate-200 bg-white shadow-sm space-y-4">
              
              {/* Calendar Header with Month Selector */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#0c2340]" />
                  <h3 className="text-base font-black text-slate-900">
                    {monthNames[month]} {year}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={handlePrevMonth}
                    className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleNextMonth}
                    className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 transition-colors cursor-pointer"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Headers (Sun - Sat) */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {/* Empty cells before month start */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-14 bg-slate-50/40 rounded-md border border-transparent"></div>
                ))}

                {/* Days of current month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
                  const monthStr = (month + 1) < 10 ? `0${month + 1}` : `${month + 1}`;
                  const fullDateStr = `${year}-${monthStr}-${dayStr}`;

                  const dayRecords = historyByDate[fullDateStr] || [];
                  const isSelected = selectedCalendarDate === fullDateStr;
                  const isWeekend = new Date(year, month, dayNum).getDay() === 0 || new Date(year, month, dayNum).getDay() === 6;

                  const hasAbsent = dayRecords.some(r => r.status === 'ABSENT');
                  const hasPresent = dayRecords.some(r => r.status === 'PRESENT');

                  return (
                    <div
                      key={fullDateStr}
                      onClick={() => setSelectedCalendarDate(fullDateStr)}
                      className={`h-14 p-1.5 rounded-md border flex flex-col justify-between transition-all cursor-pointer select-none ${
                        isSelected 
                          ? 'border-[#0c2340] ring-2 ring-[#0c2340]/20 bg-blue-50/30' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? 'text-[#0c2340]' : 'text-slate-800'}`}>
                          {dayNum}
                        </span>
                        {isWeekend && (
                          <span className="text-[8px] font-semibold text-slate-300 uppercase">OFF</span>
                        )}
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-1">
                        {hasAbsent ? (
                          <span className="w-2 h-2 rounded-full bg-red-500" title="Absent in lecture"></span>
                        ) : hasPresent ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Present in all lectures"></span>
                        ) : isWeekend ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                        ) : null}

                        {dayRecords.length > 0 && (
                          <span className="text-[9px] font-mono text-slate-500 font-semibold">
                            {dayRecords.filter(r => r.status === 'PRESENT').length}/{dayRecords.length}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-3 border-t border-slate-100 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Present (All Classes)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Absent (Shortage on day)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Weekend / Holiday
                </span>
              </div>

            </div>

            {/* Right: Selected Date Class Timeline */}
            <div className="lg:col-span-1 p-6 rounded-md border border-slate-200 bg-white shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">DATE DETAILS</span>
                <h3 className="text-base font-black text-slate-900">{selectedCalendarDate}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedDateLectures.length} scheduled lectures recorded
                </p>
              </div>

              {selectedDateLectures.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateLectures.map((lec) => (
                    <div 
                      key={lec.id} 
                      className={`p-3.5 rounded-md border text-xs space-y-1.5 ${
                        lec.status === 'PRESENT' 
                          ? 'bg-emerald-50/40 border-emerald-200' 
                          : 'bg-red-50/40 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{lec.subjectCode}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                          lec.status === 'PRESENT' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {lec.status}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-700">{lec.subjectName}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-md text-slate-500 text-xs">
                  No classes conducted on this date.
                </div>
              )}
            </div>

          </div>

          {/* Subject-Wise Attendance Progress Cards */}
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Subject-Wise Breakdown & Criteria
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {attendanceData.summary.map((subject) => {
                const isShortage = subject.isShortage;
                return (
                  <div 
                    key={subject.subjectCode} 
                    className={`p-5 rounded-md border transition-all space-y-4 bg-white shadow-sm ${
                      isShortage 
                        ? 'border-red-300 ring-2 ring-red-500/10' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-black rounded uppercase border border-slate-200">
                          {subject.subjectCode}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 mt-1.5 leading-snug">{subject.subjectName}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Faculty: <span className="text-slate-800 font-bold">{subject.facultyName}</span></p>
                      </div>
                      
                      <div className="text-right">
                        <span className={`text-xl font-black font-mono ${isShortage ? 'text-red-600' : 'text-emerald-700'}`}>
                          {subject.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                        <span>Attended: {subject.attendedClasses} / {subject.totalClasses} Lectures</span>
                        <span>Target: 75%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded overflow-hidden border border-slate-200">
                        <div 
                          className={`h-full rounded transition-all duration-500 ${
                            isShortage ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(subject.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Bottom Status Tag */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      {isShortage ? (
                        <span className="text-red-600 font-bold flex items-center gap-1">
                          <AlertOctagon className="w-3.5 h-3.5" />
                          Attendance below 75%
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Good Standing
                        </span>
                      )}

                      <span className="text-slate-400 font-medium">
                        {subject.absentClasses} Absent
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SEMESTER REGISTRATION TAB                                             */}
      {/* ========================================================================= */}
      {portalTab === 'registration' && <SemesterRegistrationTab />}

      {/* ========================================================================= */}
      {/* 4. NO-DUES CLEARANCE TAB                                                 */}
      {/* ========================================================================= */}
      {portalTab === 'nodues' && <NoDuesClearanceTab />}

      {/* ========================================================================= */}
      {/* 5. ACADEMICS & TIMETABLE TAB                                             */}
      {/* ========================================================================= */}
      {activePortalDivision === 'academic' && portalTab === 'academics' && (
        <div className="space-y-6">
          {/* Top: Dynamic Weekly Timetable Engine */}
          <div className="p-6 rounded-md border border-slate-200 bg-white shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Live Academic Lecture Schedule & Classroom Allotments
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Synchronized with IIIT Pune Academic Timetable Engine • {user?.section || 'Section A (CSE)'}
                </p>
              </div>

              {/* Day Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {['Today', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
                  const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
                  const isCurrent = day === 'Today' || day === todayName;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedTimetableDay(day)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                        selectedTimetableDay === day
                          ? 'bg-[#0c2340] text-white shadow-xs'
                          : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      {day} {day === 'Today' && `(${todayName.slice(0, 3)})`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Timetable slots */}
            {(() => {
              const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
              const targetDay = selectedTimetableDay === 'Today' ? todayName : selectedTimetableDay;
              const slots = studentTimetable.filter(s => s.day.toLowerCase() === targetDay.toLowerCase());

              if (slots.length === 0) {
                return (
                  <div className="p-8 text-center text-slate-400 text-xs italic bg-slate-50 rounded-md border border-slate-200">
                    No lectures scheduled for {targetDay}. Enjoy your academic study & lab hours!
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {slots.map((slot) => (
                    <div key={slot.id} className="p-4 bg-slate-50 border border-slate-200 rounded-md hover:border-slate-300 transition-all shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold font-mono rounded">
                          {slot.timeSlot}
                        </span>
                        <span className="px-1.5 py-0.2 bg-white border border-slate-200 text-slate-700 text-[10px] font-mono font-bold rounded">
                          {slot.room}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">{slot.subjectName}</h4>
                        <p className="text-xxs text-slate-500 font-semibold mt-0.5">Instructor: {slot.facultyName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Course Syllabus Progress Tracker */}
            <div className="lg:col-span-2 p-6 rounded-md border border-slate-200 bg-white shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#0c2340]" />
                    Curriculum Syllabus & Lecture Delivery Tracker
                  </h3>
                  <p className="text-xxs text-slate-500">Live lecture progress maintained by assigned Course Instructors</p>
                </div>

                {/* Subject Selector Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {['LNO', 'ML', 'HCI'].map((code) => (
                    <button
                      key={code}
                      onClick={() => {
                        setSelectedSyllabusCode(code);
                        fetchStudentSyllabus(code);
                      }}
                      className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition-all cursor-pointer ${
                        selectedSyllabusCode === code
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              {studentSyllabus && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-md flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{studentSyllabus.title} ({studentSyllabus.code})</h4>
                      <p className="text-xxs text-slate-500">Instructor: {studentSyllabus.instructor} • Credits: {studentSyllabus.credits}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Syllabus Completion</span>
                      <span className="text-sm font-black text-emerald-800 font-mono">
                        {studentSyllabus.completedLectures} / {studentSyllabus.totalLectures} Lectures ({Math.round((studentSyllabus.completedLectures / studentSyllabus.totalLectures) * 100)}%)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {studentSyllabus.units?.map((u) => {
                      const isComp = u.status === 'COMPLETED';
                      const isInProg = u.status === 'IN_PROGRESS';

                      return (
                        <div key={u.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{u.unitNumber}: {u.title}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({u.lectures} Lectures)</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                              isComp 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : isInProg 
                                ? 'bg-amber-50 text-amber-800 border-amber-200' 
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {u.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-xxs text-slate-600">
                            <strong>Topics:</strong> {u.topics}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right 1 Col: Live Academic Circulars */}
            <div className="space-y-4">
              <div className="p-6 rounded-md border border-slate-200 bg-white shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-blue-600" />
                    Academic Circulars
                  </h3>
                  <button
                    onClick={() => { setActivePortalDivision('academic'); setPortalTab('announcements_acad'); }}
                    className="text-xxs text-blue-700 hover:underline font-bold"
                  >
                    View All →
                  </button>
                </div>

                <div className="space-y-3">
                  {academicCirculars.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No circulars posted yet.</p>
                  ) : (
                    academicCirculars.slice(0, 3).map((item) => (
                      <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-1 hover:border-slate-300 transition-all">
                        <div className="flex items-center justify-between text-xxs">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded font-black uppercase">
                            {item.priority}
                          </span>
                          <span className="text-slate-400 font-mono">{item.date}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs leading-snug">{item.title}</h4>
                        <p className="text-xxs text-slate-600 line-clamp-2">{item.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. EMERGENCY CONTACTS DIRECTORY                                          */}
      {/* ========================================================================= */}
      {activePortalDivision === 'academic' && portalTab === 'contacts' && (
        <div className="space-y-6">
          <div className="p-6 rounded-md border border-slate-200 bg-white shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-red-600" />
                  IIIT Pune Official Emergency Hotline Directory
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  24x7 Campus Ambulances, Empanelled Hospital, Wardens & Security Control Room
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {contacts.map((contact) => {
                const isHospital = contact.name.toLowerCase().includes('harneshwar');
                return (
                  <div 
                    key={contact.id} 
                    className="p-4 bg-slate-50 border border-slate-200 rounded-md flex flex-col justify-between gap-3 hover:border-slate-300 hover:bg-slate-100/60 transition-colors shadow-xs"
                  >
                    <div>
                      <span className="inline-block text-[9px] text-[#0c2340] font-black uppercase tracking-wider bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md mb-1.5">
                        {contact.department.split('(')[0]}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{contact.name}</h4>
                      {isHospital && (
                        <a 
                          href="https://www.harneshwarhospital.com/" 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[11px] text-blue-700 font-bold hover:underline flex items-center gap-1 mt-1"
                        >
                          Visit Hospital Website <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="font-mono text-xs font-bold text-slate-800">{contact.number}</span>
                      <a
                        href={`tel:${contact.number.split('/')[0].trim()}`}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase rounded-md shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
                        title="Call Line"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. CAMPUS FACILITY BOOKINGS                                               */}
      {/* ========================================================================= */}
      {activePortalDivision === 'academic' && portalTab === 'facilities' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Booking Form */}
            <div className="lg:col-span-1 p-6 rounded-md border border-slate-200 bg-white shadow-sm space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                Reserve Campus Infrastructure
              </h3>

              {bookingSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Facility Slot Reserved Successfully!
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); setBookingSuccess(true); setTimeout(() => setBookingSuccess(false), 4000); }} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Select Facility / Lab</label>
                  <select
                    value={selectedFacility}
                    onChange={(e) => setSelectedFacility(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:border-blue-600"
                  >
                    <option value="AI/ML Computing Lab">AI/ML High Performance GPU Lab</option>
                    <option value="Robotics & IoT Innovation Hub">Robotics & IoT Innovation Hub</option>
                    <option value="Auditorium & Seminar Hall">Main Auditorium & Seminar Hall</option>
                    <option value="Indoor Badminton & Sports Complex">Indoor Badminton & Sports Complex</option>
                    <option value="VLSI & Circuit Design Lab">VLSI & Circuit Design Lab</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Reservation Date</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Time Slot</label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:border-blue-600"
                  >
                    <option value="">Choose Time Slot</option>
                    <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                    <option value="11:30 AM - 01:30 PM">11:30 AM - 01:30 PM</option>
                    <option value="02:30 PM - 04:30 PM">02:30 PM - 04:30 PM</option>
                    <option value="05:00 PM - 07:00 PM">05:00 PM - 07:00 PM</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0c2340] hover:bg-[#1a365d] text-white font-extrabold rounded-md text-xs uppercase tracking-wider shadow cursor-pointer transition-colors"
                >
                  Submit Booking Request
                </button>
              </form>
            </div>

            {/* Campus Facilities List */}
            <div className="lg:col-span-2 p-6 rounded-md border border-slate-200 bg-white shadow-sm space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Campus Infrastructure Directory</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900">AI/ML GPU Computing Lab</h4>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-black rounded uppercase">AVAILABLE</span>
                  </div>
                  <p className="text-[10px] text-slate-600">Equipped with 32 NVIDIA RTX Workstations for Deep Learning research.</p>
                  <p className="text-[10px] text-blue-800 font-bold">Location: Academic Block 2, Floor 3</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900">Robotics & IoT Innovation Hub</h4>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-black rounded uppercase">AVAILABLE</span>
                  </div>
                  <p className="text-[10px] text-slate-600">Microcontroller programmer stations, 3D printers, and drone testing grids.</p>
                  <p className="text-[10px] text-blue-800 font-bold">Location: Academic Block 1, Ground Floor</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900">Main Seminar Hall</h4>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-black rounded uppercase">BOOKED TODAY</span>
                  </div>
                  <p className="text-[10px] text-slate-600">300-seat acoustic auditorium with dual 4K laser projection.</p>
                  <p className="text-[10px] text-blue-800 font-bold">Location: Admin Complex, Wing B</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900">VLSI & Microelectronics Lab</h4>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-black rounded uppercase">AVAILABLE</span>
                  </div>
                  <p className="text-[10px] text-slate-600">Cadence & Synopsys EDA Tool suites for ECE hardware synthesis.</p>
                  <p className="text-[10px] text-blue-800 font-bold">Location: ECE Block, Floor 2</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* TARGETED PLACEMENT CRM TAB                                               */}
      {/* ========================================================================= */}
      {activePortalDivision === 'academic' && portalTab === 'placement' && (
        <PlacementDriveTab token={token} user={user} />
      )}

      {/* ========================================================================= */}
      {/* ACADEMIC CIRCULARS & NOTICES TAB                                         */}
      {/* ========================================================================= */}
      {activePortalDivision === 'academic' && portalTab === 'announcements_acad' && (
        <AnnouncementsTab token={token} portalType="ACADEMIC" />
      )}

      {/* ========================================================================= */}
      {/* HOSTEL ROOMMATE MATCHING & BED ALLOTMENT TAB                             */}
      {/* ========================================================================= */}
      {activePortalDivision === 'hostel' && portalTab === 'roommate' && (
        <RoommateAllotmentTab token={token} user={user} />
      )}

      {/* ========================================================================= */}
      {/* HOSTEL & MESS CIRCULARS TAB                                              */}
      {/* ========================================================================= */}
      {activePortalDivision === 'hostel' && portalTab === 'announcements_hostel' && (
        <AnnouncementsTab token={token} portalType="HOSTEL" />
      )}

      {/* ========================================================================= */}
      {/* HOSTEL MANAGEMENT TAB VIEWS                                              */}
      {/* ========================================================================= */}
      {activePortalDivision === 'hostel' && portalTab === 'leaves' && (
        <HostelLeaveTab token={token} user={user} />
      )}

      {activePortalDivision === 'hostel' && portalTab === 'mess' && (
        <MessManagementTab token={token} />
      )}

      {activePortalDivision === 'hostel' && portalTab === 'tickets' && (
        <HostelTicketingTab token={token} user={user} />
      )}

      {/* ========================================================================= */}
      {/* CAMPUS LIFE & GRIEVANCES TAB VIEWS                                       */}
      {/* ========================================================================= */}
      {activePortalDivision === 'campus' && portalTab === 'complaints' && (
        <ComplaintsTab token={token} user={user} />
      )}

      {activePortalDivision === 'campus' && portalTab === 'lostfound' && (
        <LostAndFoundTab token={token} user={user} />
      )}

      {/* Global Emergency Contacts accessible from anywhere */}
      {(portalTab === 'contacts' || (activePortalDivision === 'campus' && portalTab === 'contacts')) && (
        <div className="space-y-6">
          <div className="p-6 rounded-md border border-slate-200 bg-white shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-red-600" />
                  IIIT Pune Official Emergency Hotline Directory
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  24x7 Campus Ambulances, Empanelled Hospital, Wardens & Security Control Room
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {contacts.map((contact) => {
                const isHospital = contact.name.toLowerCase().includes('harneshwar');
                return (
                  <div 
                    key={contact.id} 
                    className="p-4 bg-slate-50 border border-slate-200 rounded-md flex flex-col justify-between gap-3 hover:border-slate-300 hover:bg-slate-100/60 transition-colors shadow-xs"
                  >
                    <div>
                      <span className="inline-block text-[9px] text-[#0c2340] font-black uppercase tracking-wider bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md mb-1.5">
                        {contact.department.split('(')[0]}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{contact.name}</h4>
                      {isHospital && (
                        <a 
                          href="https://www.harneshwarhospital.com/" 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[11px] text-blue-700 font-bold hover:underline flex items-center gap-1 mt-1"
                        >
                          Visit Hospital Website <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="font-mono text-xs font-bold text-slate-800">{contact.number}</span>
                      <a
                        href={`tel:${contact.number.split('/')[0].trim()}`}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase rounded-md shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
                        title="Call Line"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE STICKY FLOATING QUICK CALL & SOS ACTION BAR (PHONE-ONLY) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-between gap-2 shadow-[0_-4px_25px_rgba(0,0,0,0.12)]">
        <button
          onClick={() => setIsSosOpen(true)}
          className="flex-1 py-2.5 bg-red-600 text-white font-black text-xs uppercase tracking-wider rounded-md shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all animate-pulse cursor-pointer"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>SOS ALERT</span>
        </button>

        <a
          href="tel:9826381867"
          className="flex-1 py-2.5 bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-md shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
        >
          <Phone className="w-4 h-4" />
          <span>CALL SECURITY</span>
        </a>

        <a
          href="tel:9826381867"
          className="px-3.5 py-2.5 bg-[#0c2340] text-white font-black text-xs uppercase tracking-wider rounded-md shadow-sm flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
          title="Campus Ambulance"
        >
          <PhoneCall className="w-4 h-4 text-emerald-400" />
          <span>AMB</span>
        </a>
      </div>

      {/* Global SOS Modal trigger */}
      <SOSModal isOpen={isSosOpen} onClose={() => setIsSosOpen(false)} onSOSTriggered={() => {}} />
    </div>
  );
}
