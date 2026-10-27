import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, CheckCircle2, Clock, MapPin, Phone, 
  Tag, Filter, AlertCircle, Sparkles, RefreshCw, X, ShieldCheck
} from 'lucide-react';

export default function LostAndFoundTab({ token, user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'LOST' | 'FOUND'
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Form state
  const [showReportModal, setShowReportModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formType, setFormType] = useState('LOST');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ELECTRONICS');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [contactInfo, setContactInfo] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Claim modal state
  const [claimingItem, setClaimingItem] = useState(null);
  const [claimNotes, setClaimNotes] = useState('');

  const fetchItems = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:5000/api/lostfound?';
      if (typeFilter !== 'ALL') url += `type=${typeFilter}&`;
      if (categoryFilter !== 'ALL') url += `category=${categoryFilter}&`;
      if (searchQuery.trim()) url += `search=${encodeURIComponent(searchQuery)}&`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchItems();
  }, [token, typeFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  const handleReportItem = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !location.trim()) {
      setError('Title, description, and location are required.');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/lostfound', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: formType,
          title,
          category,
          description,
          location,
          date,
          contactInfo: contactInfo || user?.email || user?.contactNumber
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Notice for ${formType === 'LOST' ? 'Lost Item' : 'Found Item'} published to Campus Board!`);
        setShowReportModal(false);
        setTitle('');
        setDescription('');
        setLocation('');
        fetchItems();
      } else {
        setError(data.error || 'Failed to submit report');
      }
    } catch (err) {
      setError('Network connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    if (!claimingItem) return;

    try {
      const res = await fetch(`http://localhost:5000/api/lostfound/${claimingItem.id}/claim`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ claimNotes })
      });
      if (res.ok) {
        setMessage('Claim recorded! Contact information shared with finder.');
        setClaimingItem(null);
        setClaimNotes('');
        fetchItems();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/lostfound/${id}/resolve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage('Item marked as successfully returned/resolved!');
        fetchItems();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-md border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-md">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              Campus Lost & Found Bulletin
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Community noticeboard for reporting misplaced belongings and claiming recovered articles across campus.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="px-4 py-2 bg-[#0c2340] hover:bg-[#1c398e] text-white text-xs font-bold uppercase rounded-md tracking-wider shadow-sm flex items-center gap-2 cursor-pointer transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Report Item</span>
        </button>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {message}
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="p-4 bg-white border border-slate-200 rounded-md shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by keywords, location (e.g. 'watch', 'mess', 'calculator')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1c398e]"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Type Filter */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md text-xs font-bold">
            {['ALL', 'LOST', 'FOUND'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-md text-[10px] uppercase transition-all cursor-pointer ${
                  typeFilter === t
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none font-semibold text-slate-700"
          >
            <option value="ALL">All Categories</option>
            <option value="ELECTRONICS">Electronics & Gadgets</option>
            <option value="ID_CARDS_WALLETS">ID Cards & Wallets</option>
            <option value="KEYS">Keys & Locks</option>
            <option value="CLOTHING">Clothing & Accessories</option>
            <option value="DOCUMENTS_BOOKS">Books & Stationary</option>
            <option value="OTHER">Other</option>
          </select>

          <button
            onClick={fetchItems}
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid of Items */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#5367c8]" />
          Loading lost and found directory...
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-md text-slate-500 text-xs">
          No items found matching the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const isLost = item.type === 'LOST';
            const isResolved = item.status === 'RESOLVED';
            const isMine = item.reportedById === user?.id;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-md border bg-white shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-3 ${
                  isResolved ? 'opacity-70 border-slate-200' : isLost ? 'border-amber-200/80' : 'border-emerald-200/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase rounded border ${
                      isLost
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {item.type} ITEM
                    </span>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.date}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-2">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="mt-3 space-y-1 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.contactInfo}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    isResolved 
                      ? 'bg-slate-100 text-slate-600'
                      : item.status === 'CLAIMED'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {item.status}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {!isResolved && (
                      <button
                        onClick={() => setClaimingItem(item)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold uppercase rounded-md cursor-pointer"
                      >
                        Claim Item
                      </button>
                    )}

                    {(isMine || ['ADMIN', 'HOSTEL_WARDEN'].includes(user?.role)) && !isResolved && (
                      <button
                        onClick={() => handleResolve(item.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase rounded-md cursor-pointer"
                      >
                        Mark Returned
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-md w-full border border-slate-200 p-6 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                Report Lost or Found Item
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportItem} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Report Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('LOST')}
                    className={`py-2 text-xs font-bold rounded-md border cursor-pointer ${
                      formType === 'LOST'
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    I Lost an Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('FOUND')}
                    className={`py-2 text-xs font-bold rounded-md border cursor-pointer ${
                      formType === 'FOUND'
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    I Found an Item
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Item Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blue Titan Watch, Dell Laptop Charger"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                >
                  <option value="ELECTRONICS">Electronics & Gadgets</option>
                  <option value="ID_CARDS_WALLETS">ID Cards & Wallets</option>
                  <option value="KEYS">Keys & Locks</option>
                  <option value="CLOTHING">Clothing & Bags</option>
                  <option value="DOCUMENTS_BOOKS">Documents, Notebooks & Books</option>
                  <option value="OTHER">Other Belongings</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Location (Where Lost or Found) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reading Hall 2, Mess table 4, Ground"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Description & Unique Identification Marks *
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Mention color, brand, stickers, keychains or specific characteristics..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Contact Info / Collection Point
                </label>
                <input
                  type="text"
                  placeholder="Your phone number, email or Main Gate Security"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-[#0c2340] hover:bg-[#1c398e] text-white text-xs font-bold rounded-md cursor-pointer"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim Modal */}
      {claimingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-sm w-full border border-slate-200 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-900">
              Claim: {claimingItem.title}
            </h3>
            <p className="text-xs text-slate-500">
              Provide proof of ownership or describe identifying marks to verify claim.
            </p>

            <form onSubmit={handleClaim} className="space-y-3">
              <textarea
                rows="3"
                required
                placeholder="e.g. My lock wallpaper is..., or my name is written on page 3..."
                value={claimNotes}
                onChange={(e) => setClaimNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setClaimingItem(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#0c2340] hover:bg-[#1c398e] text-white text-xs font-bold rounded-md cursor-pointer"
                >
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
