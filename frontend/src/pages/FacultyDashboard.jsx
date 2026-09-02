import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, Users, Calendar, CheckCircle2, XCircle, 
  Save, Filter, AlertCircle, Sparkles, CheckSquare, XSquare, ShieldAlert
} from 'lucide-react';

export default function FacultyDashboard() {
  const { user, token } = useAuth();
  const [subjectsList, setSubjectsList] = useState([]);
  const [selectedSection, setSelectedSection] = useState('Section A (CSE)');
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [students, setStudents] = useState([]);
  const [attendanceState, setAttendanceState] = useState({}); // { studentId: 'PRESENT' | 'ABSENT' }
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Fetch available subjects
  useEffect(() => {
    fetch('/api/attendance/subjects', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSubjectsList(data);
          // Default subject to first matching section
          const match = data.find(s => s.section === selectedSection);
          if (match) setSelectedSubjectCode(match.code);
        }
      })
      .catch(err => console.error(err));
  }, [token]);

  // Update selected subject when section changes
  useEffect(() => {
    const match = subjectsList.find(s => s.section === selectedSection);
    if (match) setSelectedSubjectCode(match.code);
  }, [selectedSection, subjectsList]);

  // 2. Fetch student roster when section, subject, or date changes
  useEffect(() => {
    if (!selectedSection) return;
    setLoadingStudents(true);
    setSuccessMessage('');
    setErrorMessage('');

    // Fetch student list for section
    fetch(`/api/attendance/section-students?section=${encodeURIComponent(selectedSection)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const studentArr = Array.isArray(data) ? data : [];
        setStudents(studentArr);

        // Fetch existing marked sheet if available
        if (selectedSubjectCode && attendanceDate) {
          fetch(`/api/attendance/marked-sheet?subjectCode=${selectedSubjectCode}&section=${encodeURIComponent(selectedSection)}&date=${attendanceDate}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(res => res.json())
            .then(records => {
              const stateMap = {};
              if (Array.isArray(records) && records.length > 0) {
                records.forEach(r => {
                  stateMap[r.studentId] = r.status;
                });
              } else {
                // Default all to PRESENT
                studentArr.forEach(s => {
                  stateMap[s.id] = 'PRESENT';
                });
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

  // Toggle individual student status
  const toggleStatus = (studentId) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'PRESENT' ? 'ABSENT' : 'PRESENT'
    }));
  };

  // Bulk actions
  const setAllStatus = (status) => {
    const updated = {};
    students.forEach(s => {
      updated[s.id] = status;
    });
    setAttendanceState(updated);
  };

  // Submit attendance sheet
  const handleSaveAttendance = async () => {
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    const subjectObj = subjectsList.find(s => s.code === selectedSubjectCode && s.section === selectedSection);
    const records = students.map(s => ({
      studentId: s.id,
      status: attendanceState[s.id] || 'PRESENT'
    }));

    try {
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subjectCode: selectedSubjectCode,
          subjectName: subjectObj ? subjectObj.name : selectedSubjectCode,
          section: selectedSection,
          date: attendanceDate,
          records
        })
      });

      const resData = await response.json();
      if (response.ok) {
        setSuccessMessage(`Attendance saved successfully! (${records.length} students logged)`);
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        setErrorMessage(resData.error || 'Failed to save attendance.');
      }
    } catch (err) {
      setErrorMessage('Network error while saving attendance.');
    } finally {
      setSaving(false);
    }
  };

  // Metrics
  const totalStudents = students.length;
  const presentCount = Object.values(attendanceState).filter(s => s === 'PRESENT').length;
  const absentCount = totalStudents - presentCount;
  const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  const currentSubjectObj = subjectsList.find(s => s.code === selectedSubjectCode && s.section === selectedSection);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-100">
      {/* Top Banner */}
      <div className="glass-card p-6 rounded-2xl border border-iiitp-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-iiitp-gold/15 border border-iiitp-gold/30 text-iiitp-gold text-[10px] font-black uppercase rounded tracking-wider">
              FACULTY ACADEMIC CONSOLE
            </span>
            <span className="text-xxs text-slate-400 font-mono">
              STAFF ID: {user?.userId || 'FAC-2024'}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Welcome, {user?.name}!</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Indian Institute of Information Technology, Pune • Daily Student Attendance Management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Selected Date</span>
            <span className="text-sm font-black text-iiitp-gold font-mono">{attendanceDate}</span>
          </div>
        </div>
      </div>

      {/* Control Panel: Section, Subject, Date Selection */}
      <div className="glass-card p-6 rounded-2xl border border-iiitp-border grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-iiitp-gold" />
            1. Select Batch & Section
          </label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-iiitp-gold"
          >
            <option value="Section A (CSE)">3rd Sem Section A (CSE) • LH01</option>
            <option value="Section B (CSE)">3rd Sem Section B (CSE) • LH03</option>
            <option value="Section C (ECE)">3rd Sem Section C (ECE) • CR01</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-iiitp-info" />
            2. Course Subject
          </label>
          <select
            value={selectedSubjectCode}
            onChange={(e) => setSelectedSubjectCode(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-iiitp-info"
          >
            {subjectsList
              .filter(s => s.section === selectedSection)
              .map(s => (
                <option key={`${s.code}-${s.section}`} value={s.code}>
                  {s.code} - {s.name} ({s.facultyName})
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-iiitp-success" />
            3. Attendance Date
          </label>
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-iiitp-success font-mono"
          />
        </div>
      </div>

      {/* Roster & Marking Interface */}
      <div className="glass-card p-6 rounded-2xl border border-iiitp-border space-y-5">
        {/* Header summary & Bulk Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">
                {currentSubjectObj ? currentSubjectObj.name : selectedSubjectCode} ({selectedSubjectCode})
              </h3>
              <span className="px-2 py-0.5 bg-iiitp-gold/20 text-iiitp-gold text-[10px] font-bold rounded uppercase">
                {selectedSection}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Instructor: <span className="text-slate-200 font-bold">{currentSubjectObj?.facultyName || user?.name}</span>
            </p>
          </div>

          {/* Quick Stats Badges & Actions */}
          <div className="flex items-center flex-wrap gap-2.5">
            <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-center text-xs">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Present</span>
              <span className="font-extrabold text-iiitp-success">{presentCount} / {totalStudents}</span>
            </div>

            <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-center text-xs">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Absent</span>
              <span className="font-extrabold text-iiitp-danger">{absentCount}</span>
            </div>

            <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-center text-xs">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Ratio</span>
              <span className="font-extrabold text-iiitp-gold font-mono">{attendancePercentage}%</span>
            </div>

            <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block"></div>

            <button
              onClick={() => setAllStatus('PRESENT')}
              className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              All Present
            </button>

            <button
              onClick={() => setAllStatus('ABSENT')}
              className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-400 border border-red-500/30 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <XSquare className="w-3.5 h-3.5" />
              All Absent
            </button>
          </div>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="p-3.5 bg-iiitp-success/15 border border-iiitp-success/30 text-iiitp-success text-xs rounded-xl flex items-center gap-2 font-bold animate-pulse">
            <CheckCircle2 className="w-4 h-4" />
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 bg-iiitp-danger/15 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4" />
            {errorMessage}
          </div>
        )}

        {/* Student Roster Grid / Table */}
        {loadingStudents ? (
          <div className="p-12 text-center text-slate-500 text-xs font-bold space-y-2">
            <div className="w-6 h-6 border-2 border-iiitp-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p>Fetching Student Roster for {selectedSection}...</p>
          </div>
        ) : students.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Student MIS ID</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Institutional Email</th>
                  <th className="py-3 px-4 text-center">Daily Status Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {students.map((student, idx) => {
                  const status = attendanceState[student.id] || 'PRESENT';
                  const isPresent = status === 'PRESENT';
                  return (
                    <tr key={student.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-iiitp-gold">{student.userId}</td>
                      <td className="py-3 px-4 font-extrabold text-white">{student.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{student.email}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleStatus(student.id)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 mx-auto w-32 shadow ${
                            isPresent
                              ? 'bg-iiitp-success/20 border border-iiitp-success/40 text-iiitp-success hover:bg-iiitp-success/30'
                              : 'bg-iiitp-danger/20 border border-red-500/40 text-red-400 hover:bg-iiitp-danger/30'
                          }`}
                        >
                          {isPresent ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              PRESENT
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              ABSENT
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
            No students found registered for {selectedSection}.
          </div>
        )}

        {/* Submit Button */}
        {students.length > 0 && (
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-iiitp-gold to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-glow-gold flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Attendance Sheet...' : 'Save & Publish Attendance Record'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
