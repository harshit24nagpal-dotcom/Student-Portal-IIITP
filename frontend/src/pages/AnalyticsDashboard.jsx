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
  const { token } = { token: localStorage.getItem('token') }; // Quick fetch
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
        <Clock className="w-10 h-10 text-iiitp-gold animate-spin" />
        <p className="text-sm text-slate-400">Aggregating Campus Incident Records...</p>
      </div>
    );
  }

  const { summary, categoryDistribution, statusDistribution, hotspots, hourlyDistribution, leaderboard } = data;

  return (
    <div className="space-y-6">
      
      {/* 1. Aggregation Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Emergencies */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-slate-900/40 rounded-full blur-xl"></div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">TOTAL SOS ALERTS</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h4 className="text-3xl font-black text-white">{summary.totalRequests}</h4>
            <span className="text-[10px] text-slate-400 font-semibold">reported</span>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AVG RESPONSE TIME</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h4 className="text-3xl font-black text-iiitp-success">
              {summary.avgResponseTimeMinutes}
            </h4>
            <span className="text-[10px] text-slate-400 font-semibold">minutes</span>
          </div>
        </div>

        {/* Escalated Count */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ESCALATED INCIDENTS</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h4 className="text-3xl font-black text-iiitp-warning">{summary.escalatedRequests}</h4>
            <span className="text-[10px] text-slate-400 font-semibold">needed admin</span>
          </div>
        </div>

        {/* Efficiency index */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">RESOLVED RATIO</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h4 className="text-3xl font-black text-iiitp-info">
              {summary.totalRequests > 0 
                ? `${Math.round((summary.resolvedRequests / summary.totalRequests) * 100)}%` 
                : '100%'}
            </h4>
            <span className="text-[10px] text-slate-400 font-semibold">resolution rate</span>
          </div>
        </div>
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Breakdown (Pie) */}
        <div className="lg:col-span-1 glass-card p-5 rounded-2xl border border-slate-800 flex flex-col h-[350px]">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-iiitp-danger" />
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
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak reporting hours (Bar) */}
        <div className="lg:col-span-2 glass-card p-5 rounded-2xl border border-slate-800 flex flex-col h-[350px]">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-iiitp-info" />
            PEAK ALERTS BY HOUR OF DAY
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                  labelStyle={{ fontSize: '11px', color: '#94a3b8' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hotspots Section (horizontal bar) */}
        <div className="lg:col-span-1 glass-card p-5 rounded-2xl border border-slate-800 flex flex-col h-[320px]">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-iiitp-gold" />
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#64748b" fontSize={10} />
                  <YAxis type="category" dataKey="location" stroke="#94a3b8" fontSize={9} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#ec4899" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                No hot spots registered.
              </div>
            )}
          </div>
        </div>

        {/* Responder performance (Leaderboard Table) */}
        <div className="lg:col-span-2 glass-card p-5 rounded-2xl border border-slate-800 flex flex-col h-[320px] overflow-hidden">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-iiitp-success" />
            RESPONDER PERFORMANCE BOARD
          </h3>
          <div className="flex-1 overflow-y-auto pr-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="pb-2.5">Name</th>
                  <th className="pb-2.5">Specialization</th>
                  <th className="pb-2.5 text-center">Resolved</th>
                  <th className="pb-2.5 text-center">Avg Response</th>
                  <th className="pb-2.5 text-right">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {leaderboard.map((resp, i) => (
                  <tr key={resp.id} className="text-slate-300 hover:text-white">
                    <td className="py-2.5 font-semibold text-slate-100 flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">{i + 1}.</span>
                      {resp.name}
                    </td>
                    <td className="py-2.5 text-slate-400">{resp.role}</td>
                    <td className="py-2.5 text-center font-bold text-slate-200">{resp.resolvedCount}</td>
                    <td className="py-2.5 text-center text-slate-300 font-medium">
                      {resp.avgResponseMinutes} mins
                    </td>
                    <td className="py-2.5 text-right font-black text-iiitp-gold">
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
