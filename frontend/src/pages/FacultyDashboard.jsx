import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL, getFileUrl } from '../config/api';
import { 
  BookOpen, Users, Calendar, CheckCircle2, XCircle, 
  Save, Filter, AlertCircle, Sparkles, CheckSquare, XSquare, ShieldAlert,
  FileCheck, Download, Clock, AlertTriangle, User, RefreshCw
} from 'lucide-react';

export default function FacultyDashboard() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'advisor_registration' | 'advisor_alerts'

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

  // Advisee attendance state
  const [adviseeMetrics, setAdviseeMetrics] = useState([]);

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
        }
      })
      .catch(err => console.error(err));
  }, [token]);

  useEffect(() => {
    const match = subjectsList.find(s => s.section === selectedSection);
    if (match) setSelectedSubjectCode(match.code);
  }, [selectedSection, subjectsList]);

  // Fetch roster
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

  useEffect(() => {
    if (token) {
      fetchAdvisorPending();
      fetchAdviseeMetrics();
    }
  }, [token, activeTab]);

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
        setSuccessMessage(`Successfully saved attendance for ${selectedSubjectCode} on ${attendanceDate}!`);
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
        setSuccessMessage(`Registration marked ${action}!`);
        setAdvisorRemarks('');
        fetchAdvisorPending();
      }
    } catch (err) {
      setErrorMessage('Error recording advisor verification');
    } finally {
      setAdvisorLoading(false);
    }
  };

  const currentSubjectObj = subjectsList.find(s => s.code === selectedSubjectCode && s.section === selectedSection);
  const presentCount = Object.values(attendanceState).filter(s => s === 'PRESENT').length;
  const absentCount = Object.values(attendanceState).filter(s => s === 'ABSENT').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-800">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-50 text-[#1c398e] text-[10px] font-bold uppercase rounded tracking-wider border border-blue-200">
              FACULTY & ADVISOR PORTAL
            </span>
            <span className="text-xxs text-slate-500 font-mono">
              INSTRUCTOR: {user?.name}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Faculty Academic Console</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Attendance Management • Semester Registration Approvals • Advisee Shortage Monitoring
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'attendance' ? 'bg-[#1c398e] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Mark Attendance</span>
          </button>

          <button
            onClick={() => setActiveTab('advisor_registration')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'advisor_registration' ? 'bg-[#5367c8] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Advisor Registrations ({pendingAdvisorRegs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('advisor_alerts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'advisor_alerts' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Advisee Attendance Alerts</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 text-red-600" />
          {errorMessage}
        </div>
      )}

      {/* TAB 1: ATTENDANCE MARKING */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200 bg-white grid grid-cols-1 md:grid-cols-3 gap-4 shadow-sm">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Select Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#5367c8]"
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
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#5367c8]"
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
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-[#5367c8]"
              />
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{currentSubjectObj?.name} ({selectedSubjectCode})</h3>
                <p className="text-xs text-slate-500">Class Roll Call • {students.length} Enrolled Students</p>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setAllStatus('PRESENT')} className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 cursor-pointer">Mark All Present</button>
                <button onClick={() => setAllStatus('ABSENT')} className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-100 cursor-pointer">Mark All Absent</button>
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
                            className={`px-3.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
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

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSaveAttendance}
                disabled={saving}
                className="px-5 py-2.5 bg-[#5367c8] hover:bg-[#475bc2] text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm flex items-center gap-2 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving Sheet...' : 'Submit & Save Attendance Sheet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FACULTY ADVISOR SEMESTER REGISTRATION APPROVALS */}
      {activeTab === 'advisor_registration' && (
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
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
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
              <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
                No registrations currently pending Faculty Advisor approval.
              </div>
            )}
          </div>

          {selectedReg ? (
            <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200 bg-white space-y-5 shadow-sm">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase">ADVISOR REVIEW</span>
                <h3 className="text-base font-bold text-slate-900">{selectedReg.student?.name}</h3>
                <p className="text-xs text-slate-500 font-mono">MIS: {selectedReg.student?.userId} • {selectedReg.student?.section}</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Student Uploaded Proofs</h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedReg.documents?.map(doc => (
                    <div key={doc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
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
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 h-20 focus:outline-none focus:border-[#5367c8]"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => handleAdvisorAction('APPROVED')}
                    disabled={advisorLoading}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Grant Final Approval
                  </button>
                  <button
                    onClick={() => handleAdvisorAction('RESUBMISSION_REQUIRED')}
                    disabled={advisorLoading}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Request Resubmission
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 glass-card p-12 rounded-2xl border border-slate-200 bg-white text-center flex flex-col justify-center items-center shadow-sm">
              <FileCheck className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700">Select a registration from queue</h3>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADVISEE ATTENDANCE SHORTAGE MONITORING */}
      {activeTab === 'advisor_alerts' && (
        <div className="glass-card p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
