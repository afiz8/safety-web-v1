import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ShareButton from '../components/ShareButton';

const API_URL = 'http://localhost:5000/api/jam-kerja-selamat';

const JamKerjaSelamat = () => {
  const [logs, setLogs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    site: 'Site A',
    date: new Date().toISOString().split('T')[0],
    hours: '',
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [errorMsg, setErrorMsg] = useState('');

  const sites = ['Site A', 'Site B', 'Site C', 'Site D'];
  const TARGET_MONTHLY = 6000;

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLogs(data);
      setLastUpdate(new Date());
      setErrorMsg('');
    } catch (error) {
      console.error('Fetch error:', error);
      setErrorMsg('Gagal memuat data. Pastikan backend berjalan di port 5000.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    let interval;
    if (autoRefresh) interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      site: 'Site A',
      date: new Date().toISOString().split('T')[0],
      hours: '',
    });
    setEditingId(null);
  };

  const quickAdd = (hours) => {
    setFormData(prev => ({ ...prev, hours: (parseFloat(prev.hours || 0) + hours).toString() }));
  };

  const addLog = async (e) => {
    e.preventDefault();
    const hoursNum = parseFloat(formData.hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      alert('Jam kerja harus lebih dari 0');
      return;
    }

    const newLog = {
      site: formData.site,
      date: formData.date,
      hours: hoursNum,
      status: 'Safe'
    };

    try {
      let response;
      if (editingId) {
        response = await fetch(`${API_URL}/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLog)
        });
      } else {
        response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLog)
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error:', errorData);
        alert(`Error: ${errorData.error || 'Gagal menyimpan'}`);
        return;
      }

      const saved = await response.json();
      if (editingId) {
        setLogs(logs.map(log => log._id === editingId ? saved : log));
      } else {
        setLogs([saved, ...logs]);
      }
      resetForm();
      setErrorMsg('');
    } catch (error) {
      console.error('Network error:', error);
      alert('Tidak dapat terhubung ke server. Pastikan backend berjalan di http://localhost:5000');
    }
  };

  const handleEdit = (log) => {
    setFormData({
      site: log.site,
      date: log.date,
      hours: log.hours.toString(),
    });
    setEditingId(log._id);
  };

  const deleteLog = async (id) => {
    if (!window.confirm('Hapus data ini?')) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setLogs(logs.filter(log => log._id !== id));
    } catch (error) {
      console.error(error);
      alert('Gagal menghapus data');
    }
  };

  const stats = useMemo(() => {
    const totalJks = logs.reduce((sum, log) => sum + log.hours, 0);
    const thisMonth = logs.filter(log => {
      const logDate = new Date(log.date);
      const now = new Date();
      return logDate.getFullYear() === now.getFullYear() && logDate.getMonth() === now.getMonth();
    }).reduce((sum, log) => sum + log.hours, 0);
    const uniqueDays = new Set(logs.map(log => log.date)).size;
    const avgDaily = uniqueDays > 0 ? totalJks / uniqueDays : 0;
    const uniqueSites = new Set(logs.map(log => log.site)).size;
    const progressPercent = Math.min(100, (thisMonth / TARGET_MONTHLY) * 100);
    const isNearTarget = thisMonth >= TARGET_MONTHLY * 0.9 && thisMonth < TARGET_MONTHLY;
    return { totalJks, thisMonth, avgDaily, uniqueSites, progressPercent, isNearTarget };
  }, [logs]);

  const chartData = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dailyTotals = {};
    logs.forEach(log => {
      if (new Date(log.date) >= thirtyDaysAgo) {
        dailyTotals[log.date] = (dailyTotals[log.date] || 0) + log.hours;
      }
    });
    return Object.entries(dailyTotals).map(([date, hours]) => ({ date, hours })).sort((a,b) => new Date(a.date) - new Date(b.date));
  }, [logs]);

  const todayTotal = logs.filter(log => log.date === new Date().toISOString().split('T')[0]).reduce((sum,log) => sum + log.hours, 0);
  const shareMessage = `Laporan JKS JSMS\nTotal JKS: ${stats.totalJks.toLocaleString()} jam\nBulan ini: ${stats.thisMonth.toLocaleString()} jam\nTarget bulan: ${TARGET_MONTHLY.toLocaleString()} jam\nRata-rata harian: ${Math.round(stats.avgDaily).toLocaleString()} jam\nSite aktif: ${stats.uniqueSites}`;

  if (loading) return <div className="flex justify-center items-center h-64 text-gray-500">Memuat data...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              ⏱️ Jam Kerja Selamat
            </h1>
            <p className="text-gray-600 mt-1">Tracking real-time jam kerja aman | Auto-refresh setiap 10 detik</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">Last update: {lastUpdate.toLocaleTimeString()}</span>
              <button onClick={() => { fetchLogs(); }} className="text-xs text-emerald-600 underline">↻ Refresh</button>
              <label className="flex items-center gap-1 text-xs text-gray-500">
                <input type="checkbox" checked={autoRefresh} onChange={() => setAutoRefresh(!autoRefresh)} />
                Auto-refresh
              </label>
            </div>
            {errorMsg && <div className="text-red-500 text-xs mt-1">{errorMsg}</div>}
          </div>
          <div className="flex gap-4 items-center">
            <div className="bg-emerald-500/10 backdrop-blur rounded-2xl p-4 border border-emerald-200 text-center">
              <p className="text-2xl font-bold text-emerald-800">{stats.totalJks.toLocaleString()} jam</p>
              <p className="text-emerald-600 text-sm">Total JKS</p>
            </div>
            <ShareButton title="Jam Kerja Selamat" text={shareMessage} buttonText="Bagikan JKS" />
          </div>
        </div>

        {/* Kartu Statistik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 shadow-md border border-white/50">
            <h3 className="text-sm font-semibold text-gray-500">Total JKS</h3>
            <div className="text-3xl font-bold text-gray-800 mt-1">{stats.totalJks.toLocaleString()} jam</div>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 shadow-md border border-white/50">
            <h3 className="text-sm font-semibold text-gray-500">This Month</h3>
            <div className="text-3xl font-bold text-gray-800 mt-1">{stats.thisMonth.toLocaleString()} jam</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${stats.progressPercent}%` }}></div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>Progress {Math.round(stats.progressPercent)}%</span>
              <span>Target {TARGET_MONTHLY.toLocaleString()} jam</span>
            </div>
            {stats.isNearTarget && <div className="text-xs text-orange-500 mt-1">⚠️ Mendekati target bulanan!</div>}
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 shadow-md border border-white/50">
            <h3 className="text-sm font-semibold text-gray-500">Avg Daily</h3>
            <div className="text-3xl font-bold text-gray-800 mt-1">{Math.round(stats.avgDaily).toLocaleString()} jam</div>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 shadow-md border border-white/50">
            <h3 className="text-sm font-semibold text-gray-500">Sites Aktif</h3>
            <div className="text-3xl font-bold text-gray-800 mt-1">{stats.uniqueSites}</div>
          </div>
        </div>

        {/* Grafik */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 border border-white/50">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📈 Tren JKS 30 Hari Terakhir</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(val) => `${val.toLocaleString()} jam`} />
                <Legend />
                <Line type="monotone" dataKey="hours" stroke="#10B981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">Belum ada data</div>
          )}
        </div>

        {/* Form */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">{editingId ? '✏️ Edit Log' : '➕ Tambah Log Baru'}</h3>
          <form onSubmit={addLog} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Site</label>
                <select name="site" value={formData.site} onChange={handleInputChange} className="w-full p-2 border rounded-xl">
                  {sites.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full p-2 border rounded-xl" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Jam Kerja</label>
                <input type="number" step="0.1" name="hours" value={formData.hours} onChange={handleInputChange} placeholder="0" className="w-full p-2 border rounded-xl" required />
              </div>
              <div className="flex gap-2 items-end">
                <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700">
                  {editingId ? 'Update' : 'Simpan'}
                </button>
                <button type="button" onClick={resetForm} className="bg-gray-400 text-white px-4 py-2 rounded-xl hover:bg-gray-500">Batal</button>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => quickAdd(1)} className="px-3 py-1 bg-emerald-100 rounded-full text-sm">+1 jam</button>
              <button type="button" onClick={() => quickAdd(8)} className="px-3 py-1 bg-emerald-100 rounded-full text-sm">+8 jam</button>
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, hours: '' }))} className="px-3 py-1 bg-gray-100 rounded-full text-sm">Reset</button>
            </div>
          </form>
        </div>

        {/* Tabel */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg overflow-hidden">
          <div className="p-5 border-b">
            <h3 className="text-xl font-bold">📋 Riwayat Log</h3>
            <p className="text-sm text-gray-500">Total {logs.length} entri | Hari ini: {todayTotal.toLocaleString()} jam</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-emerald-50">
                <tr><th className="p-3 text-left">Site</th><th className="p-3 text-left">Tanggal</th><th className="p-3 text-right">Jam</th><th className="p-3 text-center">Status</th><th className="p-3 text-center">Aksi</th></tr>
              </thead>
              <tbody>
                {logs.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(log => (
                  <tr key={log._id} className="border-b hover:bg-emerald-50/50">
                    <td className="p-3">{log.site}</td>
                    <td className="p-3">{log.date}</td>
                    <td className="p-3 text-right font-bold">{log.hours} jam</td>
                    <td className="p-3 text-center"><span className="bg-emerald-100 px-2 py-1 rounded-full text-xs">Safe</span></td>
                    <td className="p-3 text-center space-x-2">
                      <button onClick={() => handleEdit(log)} className="text-blue-500">Edit</button>
                      <button onClick={() => deleteLog(log._id)} className="text-red-400">Hapus</button>
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
};

export default JamKerjaSelamat;