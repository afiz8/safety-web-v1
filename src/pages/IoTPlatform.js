import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaWifi, FaBatteryFull, FaExclamationTriangle, FaMicrochip, 
  FaTachometerAlt, FaPlus, FaTimes, FaTrash, FaEdit 
} from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const IoTPlatform = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState({
    assetId: '',
    name: '',
    type: 'Sensor Gas',
    locationName: '',
    status: 'normal',
    battery: 100,
    value: 0
  });
  const [stats, setStats] = useState({ total: 0, online: 0, warning: 0, danger: 0 });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/api/iot-assets');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAssets(data);
      const total = data.length;
      const online = data.filter(a => a.status === 'normal').length;
      const warning = data.filter(a => a.status === 'warning').length;
      const danger = data.filter(a => a.status === 'danger').length;
      setStats({ total, online, warning, danger });
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data sensor. Pastikan backend berjalan.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newAsset = {
        assetId: formData.assetId || 'SEN' + Date.now(),
        name: formData.name,
        type: formData.type,
        location: { name: formData.locationName },
        status: formData.status,
        battery: parseInt(formData.battery),
        value: parseFloat(formData.value)
      };
      
      let url = 'http://localhost:5000/api/iot-assets';
      let method = 'POST';
      
      if (editingAsset) {
        url = `http://localhost:5000/api/iot-assets/${editingAsset._id}`;
        method = 'PUT';
      }
      
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsset)
      });
      
      if (!res.ok) throw new Error(editingAsset ? 'Gagal update sensor' : 'Gagal tambah sensor');
      
      await fetchAssets();
      setShowForm(false);
      setEditingAsset(null);
      setFormData({ assetId: '', name: '', type: 'Sensor Gas', locationName: '', status: 'normal', battery: 100, value: 0 });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin hapus sensor ini?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/iot-assets/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Gagal hapus sensor');
      await fetchAssets();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setFormData({
      assetId: asset.assetId || '',
      name: asset.name || '',
      type: asset.type || 'Sensor Gas',
      locationName: asset.location?.name || '',
      status: asset.status || 'normal',
      battery: asset.battery || 100,
      value: asset.value || 0
    });
    setShowForm(true);
  };

  const addDemoData = async () => {
    const dummy = {
      assetId: 'SENSOR' + Math.floor(Math.random()*1000),
      name: 'Sensor Gas Area A',
      type: 'Sensor Gas',
      location: { name: 'Site A - Workshop' },
      status: ['normal','warning','danger'][Math.floor(Math.random()*3)],
      battery: Math.floor(Math.random()*100),
      value: Math.floor(Math.random()*50)
    };
    await fetch('http://localhost:5000/api/iot-assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dummy)
    });
    fetchAssets();
  };

  const chartData = [
    { time: '00:00', gas: 12, suhu: 28 },
    { time: '04:00', gas: 15, suhu: 27 },
    { time: '08:00', gas: 10, suhu: 29 },
    { time: '12:00', gas: 8, suhu: 32 },
    { time: '16:00', gas: 14, suhu: 31 },
    { time: '20:00', gas: 11, suhu: 30 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-500">Memuat data sensor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-red-50 p-6 rounded-2xl max-w-md">
          <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-red-700">Error</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <button onClick={fetchAssets} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-full">Coba Lagi</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            IoT Smart Monitoring Platform
          </h1>
          <p className="text-gray-500 mt-2">Pantau aset keselamatan dan pekerja secara real-time</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/60 backdrop-blur rounded-2xl p-4 text-center shadow-sm">
            <FaMicrochip className="mx-auto text-blue-500 text-2xl mb-2" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-gray-500">Total Sensor</p>
          </div>
          <div className="bg-white/60 backdrop-blur rounded-2xl p-4 text-center shadow-sm">
            <FaWifi className="mx-auto text-green-500 text-2xl mb-2" />
            <p className="text-2xl font-bold">{stats.online}</p>
            <p className="text-xs text-gray-500">Normal</p>
          </div>
          <div className="bg-white/60 backdrop-blur rounded-2xl p-4 text-center shadow-sm">
            <FaExclamationTriangle className="mx-auto text-yellow-500 text-2xl mb-2" />
            <p className="text-2xl font-bold">{stats.warning}</p>
            <p className="text-xs text-gray-500">Peringatan</p>
          </div>
          <div className="bg-white/60 backdrop-blur rounded-2xl p-4 text-center shadow-sm">
            <FaExclamationTriangle className="mx-auto text-red-500 text-2xl mb-2" />
            <p className="text-2xl font-bold">{stats.danger}</p>
            <p className="text-xs text-gray-500">Bahaya</p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white/60 backdrop-blur rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><FaTachometerAlt /> Tren Sensor (Gas & Suhu)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="gas" stroke="#f97316" name="Gas (ppm)" />
              <Line yAxisId="right" type="monotone" dataKey="suhu" stroke="#3b82f6" name="Suhu (°C)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tombol Aksi */}
        <div className="flex justify-between items-center gap-3">
          <button
            onClick={() => {
              setEditingAsset(null);
              setFormData({ assetId: '', name: '', type: 'Sensor Gas', locationName: '', status: 'normal', battery: 100, value: 0 });
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-md text-sm hover:bg-blue-700 transition flex items-center gap-2"
          >
            <FaPlus /> Tambah Sensor Manual
          </button>
          <button
            onClick={addDemoData}
            className="bg-gray-600 text-white px-4 py-2 rounded-full shadow-md text-sm hover:bg-gray-700 transition flex items-center gap-2"
          >
            <FaMicrochip /> Tambah Data Demo
          </button>
        </div>

        {/* Daftar Aset IoT */}
        <div className="bg-white/60 backdrop-blur rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold mb-3">Status Aset IoT</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100/50">
                <tr><th>ID</th><th>Nama</th><th>Lokasi</th><th>Status</th><th>Baterai</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {assets.map(asset => (
                  <tr key={asset._id} className="border-b border-gray-200 hover:bg-gray-50/50">
                    <td className="py-2 font-mono text-xs">{asset.assetId}</td>
                    <td className="py-2 font-medium">{asset.name}</td>
                    <td className="py-2">{asset.location?.name || '-'}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        asset.status === 'normal' ? 'bg-green-100 text-green-700' :
                        asset.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {asset.status === 'normal' ? 'Normal' : asset.status === 'warning' ? 'Peringatan' : 'Bahaya'}
                      </span>
                    </td>
                    <td className="py-2">
                      <FaBatteryFull className={`inline mr-1 ${asset.battery > 50 ? 'text-green-500' : 'text-red-500'}`} /> 
                      {asset.battery}%
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(asset)}
                          className="text-blue-500 hover:text-blue-700 transition"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(asset._id)}
                          className="text-red-500 hover:text-red-700 transition"
                          title="Hapus"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {assets.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-400">
                      Belum ada data sensor. Klik "Tambah Sensor Manual" untuk menambahkan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form Tambah/Edit Sensor */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingAsset ? 'Edit Sensor' : 'Tambah Sensor Baru'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Sensor (opsional)</label>
                <input
                  type="text"
                  value={formData.assetId}
                  onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Otomatis jika kosong"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sensor *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Sensor Gas Area A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                <input
                  type="text"
                  value={formData.locationName}
                  onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Site A - Workshop"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">Normal (Hijau)</option>
                  <option value="warning">Peringatan (Kuning)</option>
                  <option value="danger">Bahaya (Merah)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Baterai (%)</label>
                <input
                  type="number"
                  value={formData.battery}
                  onChange={(e) => setFormData({ ...formData, battery: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Sensor</label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                {editingAsset ? 'Update Sensor' : 'Simpan Sensor'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IoTPlatform;