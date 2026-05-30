import React, { useState, useEffect, useContext, useMemo } from 'react';
import { UserContext } from '../App';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Area, ComposedChart } from 'recharts';
import { 
  FaTachometerAlt, FaShieldAlt, FaChartLine, FaUsers, FaAward, FaRocket, 
  FaBell, FaCrown, FaGem, FaDiamond, FaStar, FaBuilding, FaClipboardList,
  FaCheckCircle, FaExclamationTriangle, FaPlus, FaEdit, FaTrash, FaSearch,
  FaCalendarAlt, FaChartBar, FaFileAlt, FaEye, FaThumbsUp
} from 'react-icons/fa';
import RiskHeatmap from '../components/RiskHeatmap';
import ShareButton from '../components/ShareButton';

const DashboardHSSE = () => {
  const { notifications, setNotifications, session } = useContext(UserContext);
  
  const [jobs, setJobs] = useState([]);
  const [jobName, setJobName] = useState('');
  const [jobWorkers, setJobWorkers] = useState(0);
  const [jobStatus, setJobStatus] = useState('Pending');
  const [jobRisk, setJobRisk] = useState('Low');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('all');

  const [kontraktorList, setKontraktorList] = useState([]);
  const [apdList, setApdList] = useState([]);
  const [izinList, setIzinList] = useState([]);
  const [insidenList, setInsidenList] = useState([]);
  const [observasiList, setObservasiList] = useState([]);
  const [checklistList, setChecklistList] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [animatedValue, setAnimatedValue] = useState(0);

  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  const loadJobs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/jobs`);
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0) {
          const sample = [
            { name: 'Pembangunan Jalan', workers: 25, status: 'Completed', risk: 'Medium', date: '2025-03-01' },
            { name: 'Perawatan Mesin', workers: 10, status: 'In Progress', risk: 'High', date: '2025-03-10' },
            { name: 'Inspeksi Rutin', workers: 5, status: 'Pending', risk: 'Low', date: '2025-03-15' },
          ];
          for (const job of sample) {
            await fetch(`${API_BASE}/api/jobs`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(job)
            });
          }
          const res2 = await fetch(`${API_BASE}/api/jobs`);
          const seeded = await res2.json();
          setJobs(seeded);
        } else {
          setJobs(data);
        }
      }
    } catch (err) {
      console.error('Gagal load jobs:', err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await loadJobs();
      const [kontraktorRes, apdRes, izinRes, insidenRes, observasiRes] = await Promise.all([
        fetch(`${API_BASE}/api/kontraktor`),
        fetch(`${API_BASE}/api/apd`),
        fetch(`${API_BASE}/api/izin-kerja`),
        fetch(`${API_BASE}/api/incidents`),
        fetch(`${API_BASE}/api/observasi`)
      ]);
      if (kontraktorRes.ok) setKontraktorList(await kontraktorRes.json());
      if (apdRes.ok) setApdList(await apdRes.json());
      if (izinRes.ok) setIzinList(await izinRes.json());
      if (insidenRes.ok) setInsidenList(await insidenRes.json());
      if (observasiRes.ok) setObservasiList(await observasiRes.json());
      const checklistRes = await fetch(`${API_BASE}/api/checklists`);
      if (checklistRes.ok) setChecklistList(await checklistRes.json());
    } catch (err) {
      console.error('Gagal load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobName.trim()) return alert('Nama job harus diisi');
    const jobData = {
      name: jobName,
      workers: Number(jobWorkers),
      status: jobStatus,
      risk: jobRisk,
      date: new Date().toISOString().split('T')[0],
      createdBy: session?.username || 'anonymous'
    };
    try {
      if (editingId !== null) {
        await fetch(`${API_BASE}/api/jobs/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jobData)
        });
        await loadJobs();
        setEditingId(null);
      } else {
        const res = await fetch(`${API_BASE}/api/jobs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jobData)
        });
        if (res.ok) {
          await loadJobs();
          setNotifications([{ 
            _id: Date.now(), 
            message: `✨ Job baru ditambahkan: ${jobName}`, 
            date: new Date().toISOString(), 
            read: false 
          }, ...notifications]);
        }
      }
      setJobName('');
      setJobWorkers(0);
      setJobStatus('Pending');
      setJobRisk('Low');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan job');
    }
  };

  const handleEdit = (job) => {
    setJobName(job.name);
    setJobWorkers(job.workers);
    setJobStatus(job.status);
    setJobRisk(job.risk);
    setEditingId(job._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus job ini?')) {
      await fetch(`${API_BASE}/api/jobs/${id}`, { method: 'DELETE' });
      await loadJobs();
    }
  };

  const totalJobs = jobs.length;
  const totalIncidents = jobs.filter(job => job.risk === 'High').length + insidenList.length + observasiList.filter(o => o.type === 'Negative').length;
  const totalChecklists = checklistList.length;
  const checklistPassRate = totalChecklists > 0 ? Math.round(checklistList.reduce((sum, cl) => sum + (cl.passRate || 0), 0) / totalChecklists) : 0;
  const totalWorkers = jobs.reduce((sum, job) => sum + (job.workers || 0), 0);
  const completedJobs = jobs.filter(job => job.status === 'Completed').length;
  const compliance = totalJobs === 0 ? 0 : Math.round((completedJobs / totalJobs) * 100);

  const chartData = [
    { name: 'Pending', value: jobs.filter(j => j.status === 'Pending').length, color: '#f59e0b' },
    { name: 'In Progress', value: jobs.filter(j => j.status === 'In Progress').length, color: '#3b82f6' },
    { name: 'Completed', value: jobs.filter(j => j.status === 'Completed').length, color: '#10b981' },
  ];

  const riskDistribution = [
    { name: 'Low', value: jobs.filter(j => j.risk === 'Low').length, color: '#10b981' },
    { name: 'Medium', value: jobs.filter(j => j.risk === 'Medium').length, color: '#f59e0b' },
    { name: 'High', value: jobs.filter(j => j.risk === 'High').length, color: '#ef4444' },
  ];

  const incidentTrend = useMemo(() => {
    const months = {};
    insidenList.forEach(inc => {
      const month = inc.tanggal ? inc.tanggal.substring(0,7) : new Date(inc.createdAt).toISOString().substring(0,7);
      months[month] = (months[month] || 0) + 1;
    });
    return Object.entries(months).map(([month, count]) => ({ month, count })).sort((a,b) => a.month.localeCompare(b.month));
  }, [insidenList]);

  const earlyWarnings = useMemo(() => {
    const warnings = [];
    if (checklistPassRate < 90) warnings.push({ level: 'warning', msg: `Checklist pass rate rendah: ${checklistPassRate}%` });
    const recentFailed = checklistList.filter(cl => cl.passRate < 80 && new Date(cl.createdAt) > new Date(Date.now() - 7*24*60*60*1000));
    if (recentFailed.length > 0) warnings.push({ level: 'danger', msg: `${recentFailed.length} checklist gagal minggu ini` });
    kontraktorList.forEach(k => { if (k.rating && k.rating < 3) warnings.push({ level: 'warning', msg: `Kontraktor ${k.name} rating ${k.rating}` }); });
    apdList.forEach(apd => {
      if (apd.stok === 0) warnings.push({ level: 'danger', msg: `Stok ${apd.nama} habis!` });
      if (apd.tanggalKadaluarsa) {
        const diffDays = Math.ceil((new Date(apd.tanggalKadaluarsa) - new Date()) / (1000*60*60*24));
        if (diffDays <= 7 && diffDays > 0) warnings.push({ level: 'warning', msg: `${apd.nama} kadaluarsa dalam ${diffDays} hari` });
      }
    });
    return warnings.slice(0,5);
  }, [kontraktorList, apdList, jobs, checklistList, checklistPassRate, observasiList]);

  const filteredJobs = jobs.filter(job => {
    const matchSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRisk = selectedRisk === 'all' || job.risk === selectedRisk;
    return matchSearch && matchRisk;
  });

  const sitesRisk = [
    { name: 'Site A', risk: 'Low', score: 92, color: 'from-emerald-500 to-emerald-600' },
    { name: 'Site B', risk: 'Medium', score: 78, color: 'from-yellow-500 to-yellow-600' },
    { name: 'Site C', risk: 'High', score: 45, color: 'from-red-500 to-red-600' },
    { name: 'Site D', risk: 'Low', score: 88, color: 'from-emerald-500 to-emerald-600' },
  ];

  const shareMessage = `Dashboard HSSE JSMS\nTotal Jobs: ${totalJobs}\nIncidents: ${totalIncidents}\nCompliance: ${compliance}%\nTotal Workers: ${totalWorkers}\nChecklists: ${totalChecklists} (pass rate ${checklistPassRate}%)`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-blue-500 animate-spin animation-delay-150"></div>
            <div className="absolute inset-4 rounded-full border-4 border-transparent border-t-purple-500 animate-spin animation-delay-300"></div>
            <FaGem className="absolute inset-0 m-auto text-4xl text-white" />
          </div>
          <p className="text-white text-xl mt-8 font-light tracking-wider">LOADING PREMIUM DASHBOARD...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
      </div>

      <div className="relative z-10 p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header Premium */}
        <div className="relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-transparent to-purple-500/20"></div>
          <div className="relative p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                    <FaCrown className="text-white text-2xl" />
                  </div>
                  <span className="px-4 py-2 bg-white/10 backdrop-blur rounded-full text-emerald-300 text-sm font-semibold tracking-wider">
                    PREMIUM DASHBOARD • REAL-TIME
                  </span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-black text-white mb-3">
                  Dashboard <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">HSSE</span>
                </h1>
                <p className="text-gray-300 text-lg">Enterprise-grade safety management platform with real-time analytics</p>
                {session?.role && (
                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shadow-xl">
                      <span className="text-white">👑</span>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Welcome back,</p>
                      <p className="text-white font-bold">{session.role}</p>
                    </div>
                  </div>
                )}
              </div>
              <ShareButton title="Dashboard HSSE" text={shareMessage} buttonText="Bagikan" />
            </div>
          </div>
        </div>

        {/* Offline Status */}
        {isOffline && (
          <div className="bg-yellow-500/20 backdrop-blur border border-yellow-500/30 p-4 rounded-2xl">
            <div className="flex items-center gap-3 text-yellow-300">
              <span className="text-xl">📴</span>
              <strong>OFFLINE MODE</strong>
              <span className="ml-auto text-sm">Data tersimpan secara lokal</span>
            </div>
          </div>
        )}

        {/* Metric Cards Grid Premium */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                  <FaShieldAlt className="text-white text-xl" />
                </div>
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold">+18%</span>
              </div>
              <p className="text-gray-400 text-sm mb-1">Total Safe Hours</p>
              <p className="text-3xl font-bold text-white">{totalWorkers.toLocaleString()}K</p>
              <div className="mt-3 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <FaExclamationTriangle className="text-white text-xl" />
                </div>
                <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold">-12%</span>
              </div>
              <p className="text-gray-400 text-sm mb-1">Incidents</p>
              <p className="text-3xl font-bold text-white">{totalIncidents}</p>
              <div className="mt-3 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-gradient-to-r from-red-500 to-red-600 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                  <FaCheckCircle className="text-white text-xl" />
                </div>
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold">+5%</span>
              </div>
              <p className="text-gray-400 text-sm mb-1">Compliance</p>
              <p className="text-3xl font-bold text-white">{compliance}%</p>
              <div className="mt-3 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-orange-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                  <FaUsers className="text-white text-xl" />
                </div>
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold">+3</span>
              </div>
              <p className="text-gray-400 text-sm mb-1">Total Workers</p>
              <p className="text-3xl font-bold text-white">{totalWorkers}</p>
              <div className="mt-3 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Early Warnings */}
        {earlyWarnings.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-500/10 to-red-500/10 backdrop-blur rounded-2xl p-5 border border-yellow-500/30">
            <div className="flex items-center gap-3 mb-3">
              <FaBell className="text-yellow-400 text-xl" />
              <h3 className="text-yellow-400 font-bold text-lg">⚠️ Early Warning System</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {earlyWarnings.map((w, idx) => (
                <div key={idx} className={`p-3 rounded-xl ${w.level === 'danger' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'} text-sm`}>
                  ⚠️ {w.msg}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts Grid Premium */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job Status Chart */}
          <div className="bg-white/5 backdrop-blur rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FaChartBar className="text-emerald-400" /> Job Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px' }} />
                <Bar dataKey="value">
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Distribution Pie Chart */}
          <div className="bg-white/5 backdrop-blur rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FaChartLine className="text-purple-400" /> Risk Distribution
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskDistribution.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {riskDistribution.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-400 text-sm">{item.name}</span>
                  <span className="text-white font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Incident Trend Chart */}
        {incidentTrend.length > 0 && (
          <div className="bg-white/5 backdrop-blur rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FaChartLine className="text-red-400" /> Incident Trend per Month
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={incidentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 5 }} />
                <Area type="monotone" dataKey="count" fill="#ef4444" fillOpacity={0.1} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Risk Heatmap */}
        <RiskHeatmap data={jobs.map(job => ({ likelihood: job.risk === 'High' ? 5 : job.risk === 'Medium' ? 3 : 1, consequence: 3 }))} />

        {/* Site Risk Map Grid */}
        <div className="bg-white/5 backdrop-blur rounded-3xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FaBuilding className="text-blue-400" /> Site Risk Map
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sitesRisk.map(site => (
              <div key={site.name} className={`bg-gradient-to-br ${site.color} rounded-xl p-5 text-white shadow-xl hover:scale-105 transition-all duration-300`}>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-2xl">🏭</span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${site.risk === 'Low' ? 'bg-emerald-500/30' : site.risk === 'Medium' ? 'bg-yellow-500/30' : 'bg-red-500/30'}`}>
                    {site.risk}
                  </span>
                </div>
                <h4 className="text-xl font-bold mb-2">{site.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black">{site.score}%</span>
                  <span className="text-sm opacity-80">Safety Score</span>
                </div>
                <div className="mt-3 h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${site.score}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Input Job Premium */}
        <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur rounded-3xl p-6 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FaPlus className="text-emerald-400" /> {editingId ? 'Edit Job' : 'Add New Job'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <input type="text" placeholder="Job Name" value={jobName} onChange={e => setJobName(e.target.value)} className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
            <input type="number" placeholder="Workers" value={jobWorkers} onChange={e => setJobWorkers(Number(e.target.value))} className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <select value={jobStatus} onChange={e => setJobStatus(e.target.value)} className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option className="bg-gray-800">Pending</option><option className="bg-gray-800">In Progress</option><option className="bg-gray-800">Completed</option>
            </select>
            <select value={jobRisk} onChange={e => setJobRisk(e.target.value)} className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option className="bg-gray-800">Low</option><option className="bg-gray-800">Medium</option><option className="bg-gray-800">High</option>
            </select>
            <button type="submit" className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg">
              {editingId ? 'Update Job' : 'Add Job'}
            </button>
          </form>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setJobName(''); setJobWorkers(0); setJobStatus('Pending'); setJobRisk('Low'); }} className="mt-3 px-4 py-2 bg-gray-600/50 text-gray-300 rounded-lg text-sm hover:bg-gray-600 transition">Cancel Edit</button>
          )}
        </div>

        {/* Jobs Table with Search & Filter */}
        <div className="bg-white/5 backdrop-blur rounded-3xl p-6 border border-white/10">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FaClipboardList className="text-blue-400" /> Job List
            </h3>
            <div className="flex gap-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input type="text" placeholder="Search jobs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <select value={selectedRisk} onChange={e => setSelectedRisk(e.target.value)} className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option className="bg-gray-800" value="all">All Risks</option>
                <option className="bg-gray-800" value="Low">Low</option><option className="bg-gray-800" value="Medium">Medium</option><option className="bg-gray-800" value="High">High</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr className="text-gray-400 text-left">
                  <th className="pb-3">Job Name</th><th className="pb-3">Workers</th><th className="pb-3">Status</th><th className="pb-3">Risk</th><th className="pb-3">Date</th><th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map(job => (
                  <tr key={job._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 text-white font-medium">{job.name}</td>
                    <td className="py-3 text-gray-300">{job.workers}</td>
                    <td className="py-3"><span className={`px-3 py-1 rounded-full text-xs font-bold ${job.status === 'Completed' ? 'bg-emerald-500/30 text-emerald-300' : job.status === 'In Progress' ? 'bg-blue-500/30 text-blue-300' : 'bg-yellow-500/30 text-yellow-300'}`}>{job.status}</span></td>
                    <td className="py-3"><span className={`px-3 py-1 rounded-full text-xs font-bold ${job.risk === 'Low' ? 'bg-emerald-500/30 text-emerald-300' : job.risk === 'Medium' ? 'bg-yellow-500/30 text-yellow-300' : 'bg-red-500/30 text-red-300'}`}>{job.risk}</span></td>
                    <td className="py-3 text-gray-400">{job.date}</td>
                    <td className="py-3"><div className="flex gap-2"><button onClick={() => handleEdit(job)} className="text-blue-400 hover:text-blue-300"><FaEdit /></button><button onClick={() => handleDelete(job._id)} className="text-red-400 hover:text-red-300"><FaTrash /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredJobs.length === 0 && <div className="text-center py-8 text-gray-500">No jobs found.</div>}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">© 2024 JSMS HSSE - Enterprise Safety Management Platform</p>
          <p className="text-gray-600 text-xs mt-2">Powered by MongoDB Atlas | Real-time Data Sync</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHSSE;