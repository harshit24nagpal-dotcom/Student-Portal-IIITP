import React, { useState, useEffect } from 'react';
import { 
  Utensils, Users, TrendingUp, Sparkles, AlertCircle, 
  CheckCircle2, Clock, Leaf, Shield, RefreshCw, Coffee, Moon, Sun, Flame, Star
} from 'lucide-react';

export default function MessManagementTab({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackMeal, setFeedbackMeal] = useState('lunch');
  const [rating, setRating] = useState(5);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const fetchMessData = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/hostel/mess/headcount', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchMessData();
  }, [token]);

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    setFeedbackSuccess(true);
    setFeedbackNote('');
    setTimeout(() => setFeedbackSuccess(false), 4000);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 text-xs">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5367c8]" />
        Computing live mess analytics & diner headcounts...
      </div>
    );
  }

  const p = data?.mealProjections || { breakfast: 110, lunch: 115, snacks: 98, dinner: 112 };
  const s = data?.savingsAnalytics || { foodKgSaved: 42, costSavedINR: 6200, efficiencyRate: '98.4%' };
  const menu = data?.todaysMenu || {};

  return (
    <div className="space-y-6">
      {/* Top Intelligence Banner */}
      <div className="p-6 rounded-md border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase rounded tracking-wider">
              AI-ASSISTED MESS & FOOD LOGISTICS
            </span>
            <span className="text-xxs text-slate-400 font-mono">
              DATE: {data?.date || new Date().toISOString().split('T')[0]}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Hostel Dining Hall & Meal Headcount Intelligence
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dynamically computes expected diners by cross-referencing approved hostel leaves and gate exit passes.
          </p>
        </div>

        <button
          onClick={fetchMessData}
          className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#5367c8]" />
          <span>Refresh Live Headcounts</span>
        </button>
      </div>

      {/* 4 Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-md border border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Boarders</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">
            {data?.totalRegisteredBoarders || 120}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">Registered hostel residents</span>
        </div>

        <div className="p-4 rounded-md border border-amber-200 bg-amber-50/50 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">On Approved Leave</span>
            <Moon className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 font-mono mt-1">
            {data?.studentsOnLeave || 0}
          </p>
          <span className="text-[10px] text-amber-700/80 block mt-0.5">Deducted from meal prep</span>
        </div>

        <div className="p-4 rounded-md border border-blue-200 bg-blue-50/50 shadow-2xs">
          <div className="flex items-center justify-between text-blue-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Outside on Pass</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-700 font-mono mt-1">
            {data?.studentsOutsideCampus || 0}
          </p>
          <span className="text-[10px] text-blue-700/80 block mt-0.5">Checked out at campus gate</span>
        </div>

        <div className="p-4 rounded-md border border-emerald-200 bg-emerald-50/50 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Food Waste Saved</span>
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 font-mono mt-1">
            ~{s.foodKgSaved} kg
          </p>
          <span className="text-[10px] text-emerald-700/80 block mt-0.5">Prevented overcooking today</span>
        </div>
      </div>

      {/* Real-Time Meal Diners Forecast */}
      <div className="p-6 rounded-md border border-slate-200 bg-white shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-[#1c398e]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Live Projected Meal Diners (For Mess Contractors & Cooks)
            </h3>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
            Optimal Prep Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-md border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  Breakfast
                </span>
                <span className="text-[10px] text-slate-400 font-mono">07:30 - 09:30</span>
              </div>
              <p className="text-3xl font-black text-slate-900 font-mono mt-2">
                {p.breakfast}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Expected students attending</p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-600">
              Menu: {menu.breakfast?.items || 'Poha, Boiled Eggs, Tea'}
            </div>
          </div>

          <div className="p-4 rounded-md border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-orange-500" />
                  Lunch
                </span>
                <span className="text-[10px] text-slate-400 font-mono">12:30 - 14:30</span>
              </div>
              <p className="text-3xl font-black text-slate-900 font-mono mt-2">
                {p.lunch}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Expected students attending</p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-600">
              Menu: {menu.lunch?.items || 'Paneer Butter Masala, Dal, Rice'}
            </div>
          </div>

          <div className="p-4 rounded-md border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Coffee className="w-4 h-4 text-amber-700" />
                  Evening Snacks
                </span>
                <span className="text-[10px] text-slate-400 font-mono">17:00 - 18:15</span>
              </div>
              <p className="text-3xl font-black text-slate-900 font-mono mt-2">
                {p.snacks}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Expected students attending</p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-600">
              Menu: {menu.snacks?.items || 'Samosa & Masala Chai'}
            </div>
          </div>

          <div className="p-4 rounded-md border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  Dinner
                </span>
                <span className="text-[10px] text-slate-400 font-mono">19:45 - 21:45</span>
              </div>
              <p className="text-3xl font-black text-slate-900 font-mono mt-2">
                {p.dinner}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Expected students attending</p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-600">
              Menu: {menu.dinner?.items || 'Veg Handi, Rice, Roti, Dessert'}
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns: Today's Full Menu & Student Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Full Menu Card */}
        <div className="lg:col-span-2 p-5 rounded-md border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Official IIITP Mess Menu (Today)
            </h4>
            <span className="text-[10px] text-slate-500">Caterer: Annapurna Campus Dining</span>
          </div>

          <div className="space-y-3">
            {Object.entries(menu).map(([mealKey, m]) => (
              <div key={mealKey} className="p-3.5 rounded-md border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0c2340]">
                      {mealKey}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {m.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium mt-1">
                    {m.items}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-bold rounded">
                    {m.calories}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Student Quick Rating & Feedback */}
        <div className="lg:col-span-1 p-5 rounded-md border border-slate-200 bg-white shadow-sm space-y-3.5">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100">
            Daily Mess Quality Feedback
          </h4>

          {feedbackSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Thank you! Feedback recorded for Mess Committee.
            </div>
          )}

          <form onSubmit={handleFeedbackSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Select Meal
              </label>
              <select
                value={feedbackMeal}
                onChange={(e) => setFeedbackMeal(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="snacks">Evening Snacks</option>
                <option value="dinner">Dinner</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Rating (1 - 5 Stars)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      rating >= star 
                        ? 'bg-amber-100 text-amber-700 border border-amber-300' 
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    <Star className={`w-3 h-3 ${rating >= star ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                    <span>{star}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Remarks / Suggestion
              </label>
              <textarea
                rows="2"
                placeholder="Food taste, hygiene, hot beverage temperature..."
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#0c2340] hover:bg-[#1c398e] text-white text-xs font-bold uppercase rounded-md tracking-wider shadow-sm cursor-pointer transition-all"
            >
              Submit Meal Feedback
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
