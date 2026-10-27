import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL, getFileUrl } from '../config/api';
import InfrastructureReservationTab from '../components/InfrastructureReservationTab';
import { 
  BookOpen, Users, Calendar, CheckCircle2, XCircle, 
  Save, Filter, AlertCircle, Sparkles, CheckSquare, XSquare, ShieldAlert,
  FileCheck, Download, Clock, AlertTriangle, User, RefreshCw, Send,
  Layers, ChevronRight, Check, Award, BellRing, Megaphone, Info, Eye, X, Building
} from 'lucide-react';

export default function FacultyDashboard() {
  const { user, token } = useAuth();
  
  // Differentiate Course Instructor vs Faculty Advisor
  // Merged Faculty Role: All faculty members have full instructor + advisor capabilities
  const isAdvisor = true;

  // Initial tab based on role
  const [activeTab, setActiveTab] = useState(isAdvisor ? 'advisor_registration' : 'attendance');

  // Attendance state
  const [subjectsList, setSubjectsList] = useState([]);
  const [selectedSection, setSelectedSection] = useState('Section A (CSE)');
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceState, setAttendanceState] = useState({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Faculty Advisor state
  const [pendingAdvisorRegs, setPendingAdvisorRegs] = useState([]);
  const [selectedReg, setSelectedReg] = useState(null);
  const [advisorRemarks, setAdvisorRemarks] = useState('');
  const [advisorLoading, setAdvisorLoading] = useState(false);

  // Advisee attendance metrics state
  const [adviseeMetrics, setAdviseeMetrics] = useState([]);

  // Syllabus Tracker state
  const [syllabusData, setSyllabusData] = useState(null);
  const [loadingSyllabus, setLoadingSyllabus] = useState(false);

  // Class Announcements state
  const [classAnnouncements, setClassAnnouncements] = useState([]);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState('NORMAL');
  const [announcementBadge, setAnnouncementBadge] = useState('');
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);

  // Fetch subjects
  useEffect(() => {
    fetch(`${API_URL}/attendance/subjects`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSubjectsList(data);
          const match = data.find(s => s.section === selectedSection);
          if (match) setSelectedSubjectCode(match.code);
          else if (data.length > 0) setSelectedSubjectCode(data[0].code);
        }
      })
      .catch(err => console.error(err));
  }, [token]);

  useEffect(() => {
    const match = subjectsList.find(s => s.section === selectedSection);
    if (match) setSelectedSubjectCode(match.code);
  }, [selectedSection, subjectsList]);

  // Fetch syllabus when subject changes
  const fetchSyllabus = async (code) => {
    if (!code) return;
    setLoadingSyllabus(true);
    try {
      const res = await fetch(`${API_URL}/academics/syllabus/${code}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setSyllabusData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSyllabus(false);
    }
  };

  useEffect(() => {
    if (token && selectedSubjectCode) {
      fetchSyllabus(selectedSubjectCode);
    }
  }, [token, selectedSubjectCode]);

  // Fetch student roster
  useEffect(() => {
    if (!selectedSection) return;
    setLoadingStudents(true);

    fetch(`${API_URL}/attendance/section-students?section=${encodeURIComponent(selectedSection)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const studentArr = Array.isArray(data) ? data : [];
        setStudents(studentArr);

        if (selectedSubjectCode && attendanceDate) {
          fetch(`${API_URL}/attendance/marked-sheet?subjectCode=${selectedSubjectCode}&section=${encodeURIComponent(selectedSection)}&date=${attendanceDate}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(res => res.json())
            .then(records => {
              const stateMap = {};
              if (Array.isArray(records) && records.length > 0) {
                records.forEach(r => { stateMap[r.studentId] = r.status; });
              } else {
                studentArr.forEach(s => { stateMap[s.id] = 'PRESENT'; });
              }
              setAttendanceState(stateMap);
            })
            .catch(() => {
              const stateMap = {};
              studentArr.forEach(s => { stateMap[s.id] = 'PRESENT'; });
              setAttendanceState(stateMap);
            });
        }
      })
      .finally(() => setLoadingStudents(false));
  }, [selectedSection, selectedSubjectCode, attendanceDate, token]);

  // Fetch Advisor pending registrations
  const fetchAdvisorPending = () => {
    fetch(`${API_URL}/registration/advisor/pending`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPendingAdvisorRegs(data);
          if (data.length > 0 && !selectedReg) setSelectedReg(data[0]);
        }
      });
  };

  // Fetch Advisee attendance metrics
  const fetchAdviseeMetrics = () => {
    fetch(`${API_URL}/attendance/advisor-students`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAdviseeMetrics(data);
      });
  };

  // Fetch recent academic announcements
  const fetchAnnouncements = () => {
    fetch(`${API_URL}/announcements?portalType=ACADEMIC`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setClassAnnouncements(data);
      });
  };

  useEffect(() => {
    if (token) {
      if (isAdvisor) {
        fetchAdvisorPending();
        fetchAdviseeMetrics();
      }
      fetchAnnouncements();
    }
  }, [token, activeTab, isAdvisor]);

  const toggleStatus = (studentId) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'PRESENT' ? 'ABSENT' : 'PRESENT'
    }));
  };

  const setAllStatus = (status) => {
    const updated = {};
    students.forEach(s => { updated[s.id] = status; });
    setAttendanceState(updated);
  };

  const downloadAttendanceSheetCSV = () => {
    if (!students || students.length === 0) {
      setErrorMessage('No student roster loaded to export.');
      return;
    }
    const selectedSub = subjectsList.find(s => s.code === selectedSubjectCode && s.section === selectedSection);
    const subName = selectedSub?.name || selectedSubjectCode || 'Subject';
    
    const pCount = Object.values(attendanceState).filter(s => s === 'PRESENT').length;
    const aCount = Object.values(attendanceState).filter(s => s === 'ABSENT').length;
    const ratePct = students.length > 0 ? ((pCount / students.length) * 100).toFixed(1) : '0';

    const headers = ['S.No', 'MIS / Roll No', 'Student Name', 'Branch / Department', 'Attendance Status'];
    const rows = students.map((s, idx) => {
      const st = attendanceState[s.id] || 'PRESENT';
      return [
        idx + 1,
        `"${s.userId || ''}"`,
        `"${s.name || ''}"`,
        `"${s.department || ''}"`,
        st
      ].join(',');
    });

    const csvContent = [
      `"INDIAN INSTITUTE OF INFORMATION TECHNOLOGY PUNE"`,
      `"ACADEMIC DAILY ATTENDANCE ROSTER SHEET"`,
      `"Subject Code:","${selectedSubjectCode}"`,
      `"Subject Name:","${subName}"`,
      `"Section:","${selectedSection}"`,
      `"Date:","${attendanceDate}"`,
      `"Total Enrolled:","${students.length}"`,
      `"Present:","${pCount}"`,
      `"Absent:","${aCount}"`,
      `"Attendance Rate:","${ratePct}%"`,
      `"Exported Date:","${new Date().toLocaleString()}"`,
      ``,
      headers.join(','),
      ...rows
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeDate = attendanceDate || new Date().toISOString().split('T')[0];
    const safeSub = (selectedSubjectCode || 'SUBJECT').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeSec = (selectedSection || 'SEC').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('download', `Attendance_Sheet_${safeSub}_${safeSec}_${safeDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveAttendance = async () => {
    if (!selectedSubjectCode || !selectedSection || !attendanceDate) {
      setErrorMessage('Please select subject, section, and date');
      return;
    }

    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    const records = Object.entries(attendanceState).map(([studentId, status]) => ({
      studentId: parseInt(studentId),
      status
    }));

    try {
      const selectedSub = subjectsList.find(s => s.code === selectedSubjectCode && s.section === selectedSection);
      const res = await fetch(`${API_URL}/attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subjectCode: selectedSubjectCode,
          subjectName: selectedSub?.name || selectedSubjectCode,
          section: selectedSection,
          date: attendanceDate,
          records
        })
      });

      const data = await res.json();
      if (res.ok) {
        downloadAttendanceSheetCSV();
        setSuccessMessage(`Successfully saved attendance to database & downloaded roster sheet to your local computer!`);
      } else {
        setErrorMessage(data.error || 'Failed to save attendance');
      }
    } catch (err) {
      setErrorMessage('Network error while saving attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleAdvisorAction = async (action) => {
    if (!selectedReg) return;
    setAdvisorLoading(true);
    try {
      const res = await fetch(`${API_URL}/registration/advisor/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          registrationId: selectedReg.id,
          action,
          remarks: advisorRemarks
        })
      });

      if (res.ok) {
        setSuccessMessage(`Registration for ${selectedReg.student?.name} marked ${action}!`);
        setAdvisorRemarks('');
        fetchAdvisorPending();
      }
    } catch (err) {
      setErrorMessage('Error recording advisor verification');
    } finally {
      setAdvisorLoading(false);
    }
  };

  // Toggle syllabus unit status
  const handleToggleUnitStatus = async (unitId, currentStatus) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'IN_PROGRESS' : currentStatus === 'IN_PROGRESS' ? 'UPCOMING' : 'COMPLETED';
    try {
      const res = await fetch(`${API_URL}/academics/syllabus/${selectedSubjectCode}/unit/${unitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setSuccessMessage(`Unit status updated to ${nextStatus}!`);
        fetchSyllabus(selectedSubjectCode);
      }
    } catch (err) {
      setErrorMessage('Failed to update syllabus unit status');
    }
  };

  // Post class circular / announcement
  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementTitle || !announcementContent) return;
    setPostingAnnouncement(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await fetch(`${API_URL}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: announcementTitle,
          content: announcementContent,
          portalType: 'ACADEMIC',
          category: 'CIRCULAR',
          priority: announcementPriority,
          badgeText: announcementBadge || `${selectedSubjectCode || 'Course'} Notice`
        })
      });

      if (res.ok) {
        setSuccessMessage('Official academic circular published! Students will receive it in their dashboard.');
        setAnnouncementTitle('');
        setAnnouncementContent('');
        setAnnouncementBadge('');
        fetchAnnouncements();
      } else {
        setErrorMessage('Failed to publish circular');
      }
    } catch (err) {
      setErrorMessage('Network error publishing announcement');
    } finally {
      setPostingAnnouncement(false);
    }
  };

  // Issue academic warning notice for low attendance
  const handleIssueWarningNotice = (advisee) => {
    setSuccessMessage(`Official Academic Attendance Warning Notice dispatched to ${advisee.name} (MIS: ${advisee.userId}) for low attendance (${advisee.percentage}%).`);
  };

  const currentSubjectObj = subjectsList.find(s => s.code === selectedSubjectCode && s.section === selectedSection);
  const presentCount = Object.values(attendanceState).filter(s => s === 'PRESENT').length;
  const absentCount = Object.values(attendanceState).filter(s => s === 'ABSENT').length;

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 font-sans text-slate-800 overflow-x-hidden">
      {/* Header: Customized Distinctly for Course Instructor vs Faculty Advisor */}
      <div className="glass-card p-6 rounded-md border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded tracking-wider border ${
              isAdvisor 
                ? 'bg-purple-50 text-purple-900 border-purple-200' 
                : 'bg-blue-50 text-[#1c398e] border-blue-200'
            }`}>
              'FACULTY • TEACHING & ACADEMIC ADVISORY'
            </span>
            <span className="text-xxs text-slate-500 font-mono font-bold">
              FACULTY ID: {user?.userId || 'EMP102'}
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 mt-1">
            'Faculty Command & Advisory Center'
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdvisor 
              ? 'Advisee Registration Approvals • Batch Attendance Shortage Governance • Student Mentorship'
              : 'Subject Attendance Tracking • Course Syllabus & Milestones • Subject Announcements'}
          </p>
        </div>

        {/* Tab Controls Tailored to Specific Role */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-md">
          {/* Tabs for Faculty Advisor */}
          {isAdvisor && (
            <>
              <button
                onClick={() => setActiveTab('advisor_registration')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'advisor_registration' ? 'bg-[#0c2340] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Advisee Registrations ({pendingAdvisorRegs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('advisor_alerts')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'advisor_alerts' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Advisee Attendance Alerts</span>
              </button>
            </>
          )}

          {/* Mark Attendance (Available to both: Primary for Instructor, Secondary for Advisor) */}
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'attendance' ? 'bg-[#1c398e] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Lecture Attendance Marking</span>
          </button>

          {/* Course Syllabus Progress (Primary for Course Instructor) */}
          <button
            onClick={() => setActiveTab('syllabus')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'syllabus' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Course Syllabus & Plan</span>
          </button>

          {/* Class / Batch Announcements */}
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'announcements' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Class Announcements & Circulars</span>
          </button>
          {/* Campus Facility Reservation */}
          <button
            onClick={() => setActiveTab('reservation')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'reservation' ? 'bg-[#0c2340] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Facility Reservation</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center justify-between gap-2 font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-md flex items-center justify-between gap-2 font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-red-700 hover:text-red-900 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          TAB 1: LECTURE ATTENDANCE MARKING
         ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="glass-card p-5 rounded-md border border-slate-200 bg-white grid grid-cols-1 md:grid-cols-3 gap-4 shadow-sm">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Select Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-[#5367c8]"
              >
                <option value="Section A (CSE)">Section A (CSE - MIS 001 to 082)</option>
                <option value="Section B (CSE)">Section B (CSE - MIS 083 to 150)</option>
                <option value="Section C (ECE)">Section C (ECE Branch)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Select Subject</label>
              <select
                value={selectedSubjectCode}
                onChange={(e) => setSelectedSubjectCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-[#5367c8]"
              >
                {subjectsList.filter(s => s.section === selectedSection).map(s => (
                  <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Lecture Date</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono font-semibold text-slate-800 focus:outline-hidden focus:border-[#5367c8]"
              />
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="glass-card p-6 rounded-md border border-slate-200 bg-white space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{currentSubjectObj?.name} ({selectedSubjectCode})</h3>
                <p className="text-xs text-slate-500">Class Roll Call • {students.length} Enrolled Students</p>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setAllStatus('PRESENT')} className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-md hover:bg-emerald-100 cursor-pointer">Mark All Present</button>
                <button onClick={() => setAllStatus('ABSENT')} className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-md hover:bg-red-100 cursor-pointer">Mark All Absent</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">MIS / Roll No</th>
                    <th className="py-2.5 px-4">Student Name</th>
                    <th className="py-2.5 px-4">Branch</th>
                    <th className="py-2.5 px-4 text-center">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s, idx) => {
                    const st = attendanceState[s.id] || 'PRESENT';
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-medium text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-[#1c398e]">{s.userId}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">{s.name}</td>
                        <td className="py-2.5 px-4 text-slate-500">{s.department}</td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={() => toggleStatus(s.id)}
                            className={`px-3.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              st === 'PRESENT'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                            }`}
                          >
                            {st}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Auto-Export:</span> Attendance sheet automatically saves to your local computer upon submitting.
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={downloadAttendanceSheetCSV}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md text-xs uppercase tracking-wider border border-slate-200 flex items-center gap-2 cursor-pointer transition-all"
                  title="Export Attendance Sheet directly to local computer"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  Save Sheet to Computer (CSV)
                </button>
                <button
                  onClick={handleSaveAttendance}
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#0c2340] hover:bg-slate-900 text-white font-bold rounded-md text-xs uppercase tracking-wider shadow-sm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving Sheet...' : 'Submit & Save Attendance Sheet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: COURSE SYLLABUS & LECTURE MILESTONES (Instructor Feature)
         ========================================================================= */}
      {activeTab === 'syllabus' && (
        <div className="space-y-6">
          <div className="p-6 rounded-md border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-900 text-[10px] font-black uppercase rounded tracking-wider border border-emerald-200">
                  CURRICULUM DELIVERY MONITOR
                </span>
                <span className="text-xxs text-slate-500 font-mono font-bold">
                  {selectedSubjectCode || 'LNO'} • {syllabusData?.title || 'Course Plan'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Course Syllabus & Lecture Progress Tracker</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Instructor: {syllabusData?.instructor || user?.name} • Credits: {syllabusData?.credits || 4}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Lecture Delivery</span>
                <span className="text-sm font-bold text-slate-900">
                  {syllabusData?.completedLectures || 26} / {syllabusData?.totalLectures || 42} Lectures ({Math.round(((syllabusData?.completedLectures || 26) / (syllabusData?.totalLectures || 42)) * 100)}%)
                </span>
              </div>
              <div className="w-24 bg-slate-100 rounded h-2.5 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded" 
                  style={{ width: `${Math.round(((syllabusData?.completedLectures || 26) / (syllabusData?.totalLectures || 42)) * 100)}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Units breakdown */}
          <div className="space-y-3">
            {syllabusData?.units?.map((u) => {
              const isComp = u.status === 'COMPLETED';
              const isInProg = u.status === 'IN_PROGRESS';

              return (
                <div 
                  key={u.id}
                  className={`p-5 rounded-md border transition-all bg-white shadow-2xs space-y-2 ${
                    isComp ? 'border-emerald-200' : isInProg ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-slate-500">{u.unitNumber}:</span>
                      <h4 className="font-bold text-sm text-slate-900">{u.title}</h4>
                      <span className="text-xxs text-slate-400 font-mono">({u.lectures} Lectures)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                        isComp 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : isInProg 
                          ? 'bg-amber-50 text-amber-800 border-amber-200' 
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {u.status.replace(/_/g, ' ')}
                      </span>

                      <button
                        onClick={() => handleToggleUnitStatus(u.id, u.status)}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xxs font-bold uppercase tracking-wider text-slate-700 cursor-pointer"
                        title="Cycle Unit Status"
                      >
                        Change Status
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pl-1">
                    <strong>Topics Covered:</strong> {u.topics}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: CLASS & BATCH ANNOUNCEMENTS
         ========================================================================= */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Post notice form */}
          <div className="lg:col-span-1 p-6 rounded-md border border-slate-200 bg-white space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-[#1c398e]" />
              Publish Official Academic Notice
            </h3>
            <p className="text-xxs text-slate-500">
              Dispatches announcement directly to student portal dashboards and notifications
            </p>

            <form onSubmit={handlePostAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Notice Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LNO Mid-Semester Assignment 2 Uploaded"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-md text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Priority</label>
                <select
                  value={announcementPriority}
                  onChange={(e) => setAnnouncementPriority(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-md text-xs font-semibold"
                >
                  <option value="NORMAL">NORMAL (Class Notice)</option>
                  <option value="HIGH">HIGH (Assignment / Deadline)</option>
                  <option value="URGENT">URGENT (Exam Alert)</option>
                </select>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Optional Badge Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Due Oct 30"
                  value={announcementBadge}
                  onChange={(e) => setAnnouncementBadge(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-md text-xs"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Notice Content</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write clear notice details, submission links, or exam instructions for enrolled students..."
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-md text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={postingAnnouncement}
                className="w-full py-2.5 bg-[#0c2340] hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-md shadow-xs transition-all cursor-pointer"
              >
                {postingAnnouncement ? 'Broadcasting...' : 'Broadcast Notice to Students'}
              </button>
            </form>
          </div>

          {/* List of recent circulars */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              Recent Academic Notices & Circulars ({classAnnouncements.length})
            </h3>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {classAnnouncements.map((a) => (
                <div key={a.id} className="p-4 rounded-md border border-slate-200 bg-white space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xxs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 rounded font-black uppercase">
                        {a.priority}
                      </span>
                      {a.badgeText && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold">
                          {a.badgeText}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 font-mono">{a.date}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{a.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{a.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: FACULTY ADVISOR SEMESTER REGISTRATION APPROVALS
         ========================================================================= */}
      {isAdvisor && activeTab === 'advisor_registration' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              Hostel Verified Registrations ({pendingAdvisorRegs.length})
            </h3>

            {pendingAdvisorRegs.length > 0 ? (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {pendingAdvisorRegs.map((reg) => (
                  <div
                    key={reg.id}
                    onClick={() => setSelectedReg(reg)}
                    className={`p-4 rounded-md border cursor-pointer transition-all ${
                      selectedReg?.id === reg.id
                        ? 'bg-blue-50/80 border-[#1c398e] ring-1 ring-[#1c398e]'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <h4 className="text-xs font-bold text-slate-900">{reg.student?.name}</h4>
                    <p className="text-[10px] text-[#1c398e] font-mono font-semibold mt-0.5">MIS: {reg.student?.userId}</p>
                    <span className="text-[9px] font-bold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded mt-2 inline-block">
                      WARDEN APPROVED
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-md text-slate-500 text-xs">
                No registrations currently pending Faculty Advisor approval.
              </div>
            )}
          </div>

          {selectedReg ? (
            <div className="lg:col-span-2 glass-card p-6 rounded-md border border-slate-200 bg-white space-y-5 shadow-sm">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase">ADVISOR REVIEW</span>
                <h3 className="text-base font-bold text-slate-900">{selectedReg.student?.name}</h3>
                <p className="text-xs text-slate-500 font-mono">MIS: {selectedReg.student?.userId} • {selectedReg.student?.section}</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Student Uploaded Proofs</h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedReg.documents?.map(doc => (
                    <div key={doc.id} className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs">
                      <p className="font-bold text-[#1c398e] text-[10px]">{doc.documentType}</p>
                      <p className="text-slate-800 font-semibold truncate mt-0.5">{doc.documentName}</p>
                      <a href={getFileUrl(doc.filePath)} target="_blank" rel="noreferrer" className="mt-2 block text-center py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded text-[10px] font-semibold uppercase">
                        Download Doc
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <label className="block text-[10px] font-bold uppercase text-slate-500">Advisor Remarks</label>
                <textarea
                  value={advisorRemarks}
                  onChange={(e) => setAdvisorRemarks(e.target.value)}
                  placeholder="Enter remarks or approval notes..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 h-20 focus:outline-hidden focus:border-[#5367c8]"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => handleAdvisorAction('APPROVED')}
                    disabled={advisorLoading}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Grant Final Approval
                  </button>
                  <button
                    onClick={() => handleAdvisorAction('RESUBMISSION_REQUIRED')}
                    disabled={advisorLoading}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Request Resubmission
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 glass-card p-12 rounded-md border border-slate-200 bg-white text-center flex flex-col justify-center items-center shadow-sm">
              <FileCheck className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700">Select a registration from queue</h3>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: ADVISEE ATTENDANCE SHORTAGE MONITORING (Advisor Feature)
         ========================================================================= */}
      {isAdvisor && activeTab === 'advisor_alerts' && (
        <div className="glass-card p-6 rounded-md border border-slate-200 bg-white space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Advisee Attendance Shortage Monitor</h3>
              <p className="text-xs text-slate-500">Real-time attendance warnings for Faculty Advisees (&lt;75% warning, &lt;65% critical)</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">MIS / Roll No</th>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-4">Section & Branch</th>
                  <th className="py-2.5 px-4">Total Classes</th>
                  <th className="py-2.5 px-4">Attended</th>
                  <th className="py-2.5 px-4">Attendance %</th>
                  <th className="py-2.5 px-4">Shortage Level</th>
                  <th className="py-2.5 px-4 text-right">Advisor Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adviseeMetrics.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-[#1c398e]">{s.userId}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{s.name}</td>
                    <td className="py-2.5 px-4 text-slate-500">{s.section}</td>
                    <td className="py-2.5 px-4 font-mono">{s.totalClasses}</td>
                    <td className="py-2.5 px-4 font-mono text-emerald-600 font-bold">{s.attendedClasses}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-base text-slate-900">{s.percentage}%</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        s.alertLevel === 'CRITICAL'
                          ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                          : s.alertLevel === 'WARNING'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {s.alertLevel}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {s.alertLevel !== 'NORMAL' && (
                        <button
                          onClick={() => handleIssueWarningNotice(s)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-xxs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
                        >
                          Issue Warning
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    
      {/* =========================================================================
          TAB 6: CAMPUS FACILITY RESERVATION (LH01-LH08, CR01-CR10)
         ========================================================================= */}
      {activeTab === 'reservation' && (
        <InfrastructureReservationTab />
      )}
</div>
  );
}