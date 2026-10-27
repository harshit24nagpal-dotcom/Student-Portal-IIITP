import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { 
  BellRing, Plus, Trash2, Edit2, CheckCircle2, AlertCircle, 
  RefreshCw, Filter, Calendar, Tag, ShieldCheck, Megaphone,
  BookOpen, Building2, Globe, X
} from 'lucide-react';

export default function AdminAnnouncementsTab() {
  const { token, user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDivision, setSelectedDivision] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    content: '',
    portalType: 'ACADEMIC',
    category: 'CIRCULAR',
    priority: 'NORMAL',
    badgeText: ''
  });

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/announcements?portalType=${selectedDivision}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAnnouncements(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAnnouncements();
  }, [token, selectedDivision]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm({
      title: '',
      content: '',
      portalType: 'ACADEMIC',
      category: 'CIRCULAR',
      priority: 'NORMAL',
      badgeText: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      content: item.content,
      portalType: item.portalType || 'ACADEMIC',
      category: item.category || 'CIRCULAR',
      priority: item.priority || 'NORMAL',
      badgeText: item.badgeText || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const url = editingItem 
        ? `${API_URL}/announcements/${editingItem.id}` 
        : `${API_URL}/announcements`;
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(editingItem ? 'Announcement updated successfully!' : 'New official announcement published!');
        setShowModal(false);
        fetchAnnouncements();
      } else {
        setError(data.error || 'Failed to save announcement.');
      }
    } catch (err) {
      setError('Network error saving announcement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this official announcement?')) return;
    try {
      const res = await fetch(`${API_URL}/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage('Announcement deleted successfully.');
        fetchAnnouncements();
      } else {
        setError('Failed to delete announcement.');
      }
    } catch (err) {
      setError('Network error deleting announcement.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-md border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-900 text-[10px] font-black uppercase rounded tracking-wider border border-indigo-200">
              COMMUNICATIONS GOVERNANCE
            </span>
            <span className="text-xxs text-slate-500 font-mono">
              INSTITUTE-WIDE BROADCASTS
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Official Announcements & Circulars Governance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, Edit, Publish and Manage Notices across Academic, Hostel and Campus Divisions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnnouncements}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-md text-slate-600 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-[#0c2340] hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-md shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Publish New Announcement
          </button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center justify-between gap-2 font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-md flex items-center justify-between gap-2 font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-700 hover:text-red-900 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Division Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedDivision('ALL')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            selectedDivision === 'ALL'
              ? 'bg-[#0c2340] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>All Broadcasts ({announcements.length})</span>
        </button>

        <button
          onClick={() => setSelectedDivision('ACADEMIC')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            selectedDivision === 'ACADEMIC'
              ? 'bg-[#0c2340] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Academic & Exam Circulars</span>
        </button>

        <button
          onClick={() => setSelectedDivision('HOSTEL')}
          className={`px-3.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            selectedDivision === 'HOSTEL'
              ? 'bg-[#0c2340] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Hostel & Mess Updates</span>
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="p-12 text-center text-slate-400 border border-slate-200 rounded-md bg-white space-y-2">
            <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold uppercase tracking-wider">No announcements posted for this division yet.</p>
          </div>
        ) : (
          announcements.map(item => {
            const isUrgent = item.priority === 'URGENT';
            const isHigh = item.priority === 'HIGH';
            const isAcad = item.portalType === 'ACADEMIC';
            const isHostel = item.portalType === 'HOSTEL';

            return (
              <div 
                key={item.id} 
                className="p-5 rounded-md border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                      isAcad 
                        ? 'bg-blue-50 text-blue-800 border-blue-200' 
                        : isHostel 
                        ? 'bg-amber-50 text-amber-800 border-amber-200' 
                        : 'bg-purple-50 text-purple-800 border-purple-200'
                    }`}>
                      {item.portalType}
                    </span>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                      isUrgent 
                        ? 'bg-red-50 text-red-800 border-red-200' 
                        : isHigh 
                        ? 'bg-amber-50 text-amber-800 border-amber-200' 
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {item.priority}
                    </span>

                    {item.badgeText && (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                        {item.badgeText}
                      </span>
                    )}

                    <span className="text-xxs text-slate-400 font-mono">
                      Posted by: {item.authorRole || 'ADMIN'} • {item.date}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-md text-xs transition-colors cursor-pointer"
                      title="Edit Notice"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-md text-xs transition-colors cursor-pointer"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{item.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-line">{item.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =========================================================================
          CREATE / EDIT ANNOUNCEMENT MODAL
         ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingItem ? 'Edit Official Circular' : 'Publish Official Circular / Notice'}
                </h3>
                <p className="text-xxs text-slate-500">Notice will broadcast to all enrolled student & faculty dashboards</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Notice Headline / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. End-Semester Examination Schedule for Monsoon Session"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-md text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Target Portal</label>
                  <select
                    value={form.portalType}
                    onChange={(e) => setForm({...form, portalType: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-md text-xs font-semibold"
                  >
                    <option value="ACADEMIC">ACADEMIC</option>
                    <option value="HOSTEL">HOSTEL</option>
                    <option value="COMMON">COMMON (All)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Priority Level</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({...form, priority: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-md text-xs font-semibold"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH PRIORITY</option>
                    <option value="URGENT">URGENT (Alert)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Notice Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({...form, category: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-md text-xs font-semibold"
                  >
                    <option value="CIRCULAR">CIRCULAR</option>
                    <option value="EXAM">EXAM NOTIFICATION</option>
                    <option value="MESS_UPDATE">MESS UPDATE</option>
                    <option value="DRESS_CODE">DRESS CODE</option>
                    <option value="FESTIVAL">FESTIVAL / HOLIDAY</option>
                    <option value="GENERAL">GENERAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Optional Highlight Badge (e.g. Navratri Special, Hall Tickets Ready)</label>
                <input
                  type="text"
                  placeholder="e.g. Hall Tickets Active"
                  value={form.badgeText}
                  onChange={(e) => setForm({...form, badgeText: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-md text-xs"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Notice Details & Circular Body</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write official circular content here..."
                  value={form.content}
                  onChange={(e) => setForm({...form, content: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-md text-xs leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs uppercase rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#0c2340] hover:bg-slate-900 text-white font-bold text-xs uppercase rounded-md shadow-xs cursor-pointer"
                >
                  {saving ? 'Publishing...' : editingItem ? 'Save Changes' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}