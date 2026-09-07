import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line 
} from 'recharts';
import { 
  Activity, AlertTriangle, ShieldAlert, Award, Clock, TrendingUp, MapPin 
} from 'lucide-react';

const COLORS = ['#ef4444', '#f97316', '#a855f7', '#f59e0b', '#ec4899', '#64748b'];

export default function AnalyticsDashboard() {
  const { token } = { token: localStorage.getItem('token') };
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  }, [token]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      setData(d);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Clock className="w-8 h-8 text-[#0c2340] animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Aggregating Campus Incident Records...</p>
      </div>
    );
  }

  const { summary, categoryDistribution, statusDistribution, hotspots, hourlyDistribution, leaderboard } = data;

  return (
    <div className="space-y-6 font-sans text-slate-800">
      
      {/* 1. Aggregation Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Emergencies */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm relative overflow-hidden">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">TOTAL SOS ALERTS</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h4 className="text-3xl font-black text-slate-900">{summary.totalRequests}</h4>
            <span className="text-[10px] text-slate-500 font-semibold">reported</span>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AVG RESPONSE TIME</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h4 className="text-3xl font-black text-emerald-700">
              {summary.avgResponseTimeMinutes}
            </h4>
            <span className="text-[10px] text-slate-500 font-semibold">minutes</span>
          </div>
        </div>

        {/* Escalated Count */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ESCALATED INCIDENTS</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h4 className="text-3xl font-black text-amber-600">{summary.escalatedRequests}</h4>
            <span className="text-[10px] text-slate-500 font-semibold">needed admin</span>
          </div>
        </div>

        {/* Efficiency index */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">RESOLVED RATIO</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h4 className="text-3xl font-black text-[#0c2340]">
              {summary.totalRequests > 0 
                ? `${Math.round((summary.resolvedRequests / summary.totalRequests) * 100)}%` 
                : '100%'}
            </h4>
            <span className="text-[10px] text-slate-500 font-semibold">resolution rate</span>
          </div>
        </div>
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Breakdown (Pie) */}
        <div className="lg:col-span-1 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col h-[350px]">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            SOS INCIDENT BY CATEGORY
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#0f172a', fontSize: '12px' }}
                />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', color: '#64748b' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak reporting hours (Bar) */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col h-[350px]">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            PEAK ALERTS BY HOUR OF DAY
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#0f172a', fontSize: '12px' }}
                  labelStyle={{ fontSize: '11px', color: '#64748b' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hotspots Section (horizontal bar) */}
        <div className="lg:col-span-1 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col h-[320px]">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-amber-600" />
            CAMPUS EMERGENCY HOTSPOTS
          </h3>
          <div className="flex-1 min-h-0">
            {hotspots.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={hotspots}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 30, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                  <YAxis type="category" dataKey="location" stroke="#64748b" fontSize={9} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#0f172a', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#ec4899" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                No hot spots registered.
              </div>
            )}
          </div>
        </div>

        {/* Responder performance (Leaderboard Table) */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col h-[320px] overflow-hidden">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-600" />
            RESPONDER PERFORMANCE BOARD
          </h3>
          <div className="flex-1 overflow-y-auto pr-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="pb-2.5">Name</th>
                  <th className="pb-2.5">Specialization</th>
                  <th className="pb-2.5 text-center">Resolved</th>
                  <th className="pb-2.5 text-center">Avg Response</th>
                  <th className="pb-2.5 text-right">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.map((resp, i) => (
                  <tr key={resp.id} className="text-slate-700 hover:bg-slate-50">
                    <td className="py-2.5 font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">{i + 1}.</span>
                      {resp.name}
                    </td>
                    <td className="py-2.5 text-slate-500">{resp.role}</td>
                    <td className="py-2.5 text-center font-bold text-slate-800">{resp.resolvedCount}</td>
                    <td className="py-2.5 text-center text-slate-600 font-medium">
                      {resp.avgResponseMinutes} mins
                    </td>
                    <td className="py-2.5 text-right font-black text-amber-600">
                      ★ {resp.rating}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
