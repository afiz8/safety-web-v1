import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, FaCalendarAlt, FaFileExport, FaFilter, FaSyncAlt, 
  FaArrowUp, FaArrowDown, FaChartLine, FaDownload, FaEye 
} from 'react-icons/fa';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LaggingIndicator = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const containerRef = useRef(null);
  const touchStartY = useRef(0);

  const [chartData, setChartData] = useState([
    { month: 'Okt', incidents: 12 },
    { month: 'Nov', incidents: 15 },
    { month: 'Des', incidents: 10 },
    { month: 'Jan', incidents: 8 },
    { month: 'Feb', incidents: 5 },
    { month: 'Mar', incidents: 7 }
  ]);

  const API_BASE = 'http://localhost:5000';

  const fetchData = async () => {
    try {
      let url = `${API_BASE}/api/lagging-incidents?`;
      if (searchTerm) url += `search=${searchTerm}&`;
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;
      if (locationFilter && locationFilter !== 'all') url += `location=${locationFilter}&`;
      
      const [incidentsRes, statsRes, locationsRes] = await Promise.all([
        fetch(url),
        fetch(`${API_BASE}/api/lagging-stats`),
        fetch(`${API_BASE}/api/lagging-locations`)
      ]);
      
      const incidentsData = await incidentsRes.json();
      const statsData = await statsRes.json();
      const locationsData = await locationsRes.json();
      
      setIncidents(incidentsData);
      setStats(statsData);
      setLocations(locationsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm, startDate, endDate, locationFilter]);

  // Pull to refresh
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (loading || refreshing) return;
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop === 0) {
      const deltaY = e.touches[0].clientY - touchStartY.current;
      if (deltaY > 60) {
        e.preventDefault();
        setRefreshing(true);
        fetchData();
      }
    }
  };

  const csvData = incidents.map(inc => ({
    ID: inc.incidentId,
    Type: inc.type,
    Date: new Date(inc.date).toLocaleDateString(),
    Location: inc.location,
    Project: inc.project,
    Status: inc.status,
    Severity: inc.severity,
    Description: inc.description
  }));

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Lagging Indicators Report', 14, 10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 18);
    autoTable(doc, {
      head: [['ID', 'Type', 'Date', 'Location', 'Status', 'Severity']],
      body: incidents.map(inc => [
        inc.incidentId, inc.type, new Date(inc.date).toLocaleDateString(), 
        inc.location, inc.status, inc.severity
      ]),
      startY: 30,
    });
    doc.save('lagging-indicators.pdf');
  };

  const getStatValue = (metric) => {
    const stat = stats.find(s => s.metric === metric);
    if (!stat) return metric === 'safeHours' ? '2.3M' : '0';
    return metric === 'safeHours' ? `${stat.value}M` : stat.value;
  };

  const getStatTrend = (metric) => {
    const stat = stats.find(s => s.metric === metric);
    return stat?.trend || '';
  };

  const isTrendUp = (metric) => {
    const stat = stats.find(s => s.metric === metric);
    return stat?.trendUp || false;
  };

  const statConfigs = [
    { metric: 'totalIncidents', title: 'Total Incidents', icon: '🚨', color: 'bg-red-500' },
    { metric: 'nearMiss', title: 'Near Miss', icon: '⚠️', color: 'bg-orange-500' },
    { metric: 'ltisr', title: 'Accident Rate (LTISR)', icon: '📉', color: 'bg-yellow-500' },
    { metric: 'safeHours', title: 'Jam Kerja Selamat', icon: '🛡️', color: 'bg-emerald-500' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-16 bg-gray-200 rounded-2xl w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-40 bg-white/60 rounded-2xl"></div>)}
          </div>
          <div className="h-80 bg-white/60 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-red-500/10 to-yellow-500/20 opacity-75"></div>
        <div className="relative z-10 p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="text-center lg:text-left mb-8">
            <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-gray-900 via-red-700 to-orange-600 bg-clip-text text-transparent">
              Lagging Indicators
            </h1>
            <p className="text-gray-600 mt-2">Track incidents, accident rates, and safety performance metrics</p>
          </div>

          {/* Pull to refresh */}
          {refreshing && (
            <div className="text-center py-2 text-blue-500 text-sm flex justify-center items-center gap-2">
              <FaSyncAlt className="animate-spin" /> Menyegarkan...
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {statConfigs.map((stat, index) => {
              const value = getStatValue(stat.metric);
              const trend = getStatTrend(stat.metric);
              const trendUp = isTrendUp(stat.metric);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/60 hover:shadow-xl transition-all"
                >
                  <div className="text-3xl mb-3">{stat.icon}</div>
                  <h3 className="text-2xl font-black text-gray-900">{value}</h3>
                  <p className="text-xs font-semibold text-gray-500 mt-1">{stat.title}</p>
                  {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold mt-2 ${trendUp ? 'text-red-600' : 'text-green-600'}`}>
                      {trendUp ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
                      {trend}
                      {trendUp && <span className="ml-1 text-red-500">(Bad)</span>}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Chart */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/60">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><FaChartLine className="text-red-500"/> Incident Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="incidents" stroke="#ef4444" fill="url(#colorIncidents)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Filter Bar */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/60 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[180px]">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="text"
                      placeholder="Search incident..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-300"
                    />
                  </div>
                </div>
                <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                  <FaFilter size={12} /> Filter
                </button>
                <CSVLink data={csvData} filename="lagging-indicators.csv" className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                  <FaDownload size={12} /> CSV
                </CSVLink>
                <button onClick={exportPDF} className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                  <FaFileExport size={12} /> PDF
                </button>
              </div>
            </div>
            
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-4 border-t border-gray-100 bg-gray-50/50"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                      <div className="relative">
                        <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                      <div className="relative">
                        <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                      <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-xl">
                        <option value="all">All Locations</option>
                        {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Incidents Table */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/70 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Recent Incidents</h3>
              <p className="text-gray-500 text-xs">Total: {incidents.length} incidents</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Location</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-400">No incidents found</td>
                    </tr>
                  ) : (
                    incidents.map((incident) => (
                      <tr key={incident._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{incident.incidentId}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            incident.type === 'Near Miss' ? 'bg-orange-100 text-orange-700' :
                            incident.type === 'First Aid' ? 'bg-emerald-100 text-emerald-700' :
                            incident.type === 'Medical Treatment' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {incident.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(incident.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{incident.location}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            incident.status === 'Closed' ? 'bg-emerald-100 text-emerald-700' :
                            incident.status === 'Investigating' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {incident.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            incident.severity === 'Low' ? 'bg-green-100 text-green-700' :
                            incident.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            incident.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {incident.severity}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LaggingIndicator;