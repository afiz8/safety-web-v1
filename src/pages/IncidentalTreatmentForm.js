import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../App';

const IncidentalTreatmentForm = () => {
  const { session } = useContext(UserContext);
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tipe: 'FIRST-AID',
    nama: '',
    lokasi: '',
    tanggal: new Date().toISOString().split('T')[0],
    kronologi: '',
    tindakan: '',
    status: 'Open',
    prioritas: 'Medium'
  });

  const canAccess = session?.role === 'Admin' || session?.role === 'Supervisor';

  // Ambil data dari backend
  const loadIncidents = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/incidents`);
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
      }
    } catch (err) {
      console.error('Gagal load:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) loadIncidents();
  }, [canAccess]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama || !formData.lokasi) {
      alert('Nama pasien dan lokasi wajib diisi!');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdBy: session?.username || 'anonymous'
        })
      });

      if (res.ok) {
        alert('✅ Data berhasil disimpan!');
        setShowForm(false);
        loadIncidents(); // refresh tabel
        // Reset form
        setFormData({
          tipe: 'FIRST-AID',
          nama: '',
          lokasi: '',
          tanggal: new Date().toISOString().split('T')[0],
          kronologi: '',
          tindakan: '',
          status: 'Open',
          prioritas: 'Medium'
        });
      } else {
        const err = await res.json();
        alert('❌ Gagal: ' + (err.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      console.error(err);
      alert('❌ Gagal terhubung ke server');
    }
  };

  if (!canAccess) {
    return <div className="p-8 text-center text-red-600">Akses ditolak. Halaman ini hanya untuk Admin & Supervisor.</div>;
  }

  if (loading) {
    return <div className="p-8 text-center">Memuat data...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📋 Laporan Insiden K3</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
        >
          + Laporan Baru
        </button>
      </div>

      {/* Tabel Data */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Nama Pasien</th>
              <th className="p-3 text-left">Lokasi</th>
              <th className="p-3 text-left">Tipe</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map(inc => (
              <tr key={inc._id} className="border-t hover:bg-gray-50">
                <td className="p-3">{inc.nama || '-'}</td>
                <td className="p-3">{inc.lokasi || '-'}</td>
                <td className="p-3">{inc.tipe === 'FIRST-AID' ? '🩹 First Aid' : '🏥 Medical Treatment'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    inc.status === 'Open' ? 'bg-red-100 text-red-700' :
                    inc.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                  }`}>{inc.status}</span>
                </td>
                <td className="p-3">{inc.tanggal || '-'}</td>
              </tr>
            ))}
            {incidents.length === 0 && (
              <tr><td colSpan="5" className="p-8 text-center text-gray-500">Belum ada data insiden</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form Sederhana */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Tambah Laporan Baru</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" name="nama" placeholder="Nama Pasien *" value={formData.nama} onChange={handleChange} className="w-full p-2 border rounded" required />
              <input type="text" name="lokasi" placeholder="Lokasi *" value={formData.lokasi} onChange={handleChange} className="w-full p-2 border rounded" required />
              <select name="tipe" value={formData.tipe} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="FIRST-AID">First Aid</option>
                <option value="MEDICAL-TREATMENT">Medical Treatment</option>
              </select>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded">
                <option>Open</option><option>In Progress</option><option>Closed</option>
              </select>
              <input type="date" name="tanggal" value={formData.tanggal} onChange={handleChange} className="w-full p-2 border rounded" />
              <textarea name="kronologi" placeholder="Kronologi kejadian" rows="2" value={formData.kronologi} onChange={handleChange} className="w-full p-2 border rounded"></textarea>
              <textarea name="tindakan" placeholder="Tindakan / Treatment" rows="2" value={formData.tindakan} onChange={handleChange} className="w-full p-2 border rounded"></textarea>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentalTreatmentForm;