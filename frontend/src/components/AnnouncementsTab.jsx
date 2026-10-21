import React, { useState, useEffect } from 'react';
import { 
  Bell, AlertCircle, Calendar, Sparkles, Filter, 
  Clock, ShieldAlert, Tag, RefreshCw, Megaphone, ChevronRight
} from 'lucide-react';
import { API_URL } from '../config/api';

export default function AnnouncementsTab({ token, portalType = 'ACADEMIC' }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/announcements?portalType=${portalType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAnnouncements(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAnnouncements();
  }, [token, portalType]);

  const filtered = announcements.filter(a => {
    if (categoryFilter === 'ALL') return true;
    return a.category === categoryFilter;
  });

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-50 text-red-700 border-red-200 animate-pulse';
      case 'HIGH':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-2xl ${portalType === 'ACADEMIC' ? 'bg-blue-100 text-[#1c398e]' : 'bg-amber-100 text-amber-800'}`}>
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-black uppercase rounded tracking-wider">
                {portalType} BULLETIN
              </span>
              <span className="text-xxs text-slate-400 font-mono">
                IIIT PUNE OFFICIAL CIRCULARS
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {portalType === 'ACADEMIC' 
                ? 'Academic Announcements & Official Circulars' 
                : 'Hostel & Mess Live Noticeboard'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {portalType === 'ACADEMIC'
                ? 'Navratri dress code circulars, mid-semester exam datesheets, and event schedules.'
                : 'Special festive menus, dining schedule delays, curfew notifications, and facility maintenance.'}
            </p>
          </div>
        </div>

        <button
          onClick={fetchAnnouncements}
          className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#5367c8]" />
          <span>Refresh Notices</span>
        </button>
      </div>

      {/* Featured / Highlight Notice for Navratri & Mess */}
      {portalType === 'ACADEMIC' ? (
        <div className="p-5 rounded-2xl border border-amber-300 bg-linear-to-r from-amber-50 to-orange-50/40 shadow-xs flex items-start gap-4">
          <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl mt-0.5">
            <Sparkles className="w-5 h-5 text-amber-600 animate-spin" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 text-[9px] font-black uppercase rounded">
                SPECIAL CELEBRATION CIRCULAR
              </span>
              <span className="text-xxs text-amber-800 font-bold">Oct 15 - Oct 23</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Navratri 9-Days Special Celebration: Traditional Dress Code Permitted
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              In celebration of the auspicious Navratri festival, students and faculty are warmly permitted to attend lectures in cultural traditional Indian ethnic attire. Cultural committee Garba night entry passes available at Dean Office.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-2xl border border-red-300 bg-linear-to-r from-red-50 to-amber-50/40 shadow-xs flex items-start gap-4">
          <div className="p-2.5 bg-red-100 text-red-700 rounded-xl mt-0.5">
            <Clock className="w-5 h-5 text-red-600 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-red-200/80 text-red-900 text-[9px] font-black uppercase rounded">
                TODAY'S MESS UPDATE
              </span>
              <span className="text-xxs text-red-800 font-bold">Dinner Delayed by 30 Mins</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Special Navratri Festive Menu & Dinner Timing Reschedule
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              Today's evening dining features a grand festive feast (Sabudana Vada, Kuttu Poori, Paneer Lababdar, and Kesari Kheer). 
              <strong> Dinner service will commence at 08:15 PM</strong> (delayed by 30 mins) to allow hot dessert preparation.
            </p>
          </div>
        </div>
      )}

      {/* Announcements List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#5367c8]" />
          Loading circular notices...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-xs">
          No announcements found for this section.
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:shadow-sm transition-all space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase rounded-full border ${getPriorityStyle(item.priority)}`}>
                    {item.priority}
                  </span>
                  {item.badgeText && (
                    <span className="px-2.5 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 text-[9px] font-bold rounded-full">
                      {item.badgeText}
                    </span>
                  )}
                  <span className="text-xs font-bold text-slate-900">
                    {item.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{item.date}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {item.content}
              </p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Issued by: <strong>{item.authorRole}</strong></span>
                <span className="text-[10px] text-slate-400 uppercase font-mono">
                  Ref: #IIITP-ANN-{item.id}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
