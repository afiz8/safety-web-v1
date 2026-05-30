import React, { useState, useEffect, useContext, useCallback } from 'react';
import { UserContext } from '../App';
import { FaCalendarAlt, FaSearch, FaEdit, FaTrash, FaSync } from 'react-icons/fa';
import FaceAttendance from '../components/FaceAttendance';

const Attendance = () => {
  const { session, users, notifications, setNotifications } = useContext(UserContext);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    id: null,
    userId: '',
    userName: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '',
    checkOut: '',
    status: 'Hadir',
    note: ''
  });
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [editingId, setEditingId] = useState(null);

  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  // Fungsi untuk memuat data dari backend MongoDB
  const loadAttendances = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/attendance`;
      if (session.role !== 'Admin') {
        url += `?userId=${session.userId}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAttendances(data);
      } else {
        console.error('Gagal load attendance');
      }
    } catch (err) {
      console.error('Error load attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, session.userId, session.role]);

  // Muat data saat komponen pertama kali render
  useEffect(() => {
    if (session.loggedIn) {
      loadAttendances();
    }
  }, [loadAttendances, session.loggedIn]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      id: null,
      userId: '',
      userName: '',
      date: new Date().toISOString().split('T')[0],
      checkIn: '',
      checkOut: '',
      status: 'Hadir',
      note: ''
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.userId || !form.date) {
      alert('Pilih pekerja dan tanggal!');
      return;
    }
    const user = users.find(u => u._id === form.userId);
    const userName = user ? user.name : 'Unknown';

    if (editingId) {
      // UPDATE attendance
      try {
        const res = await fetch(`${API_BASE}/api/attendance/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkIn: form.checkIn,
            checkOut: form.checkOut,
            status: form.status,
            note: form.note
          })
        });
        if (res.ok) {
          await loadAttendances();
          setEditingId(null);
          resetForm();
        }
      } catch (err) {
        console.error(err);
        alert('Gagal update attendance');
      }
    } else {
      // CREATE attendance
      try {
        const res = await fetch(`${API_BASE}/api/attendance/checkin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: form.userId,
            userName: userName,
            date: form.date,
            checkIn: form.checkIn || '',
            status: form.status,
            note: form.note,
            method: 'manual'
          })
        });
        if (res.ok) {
          await loadAttendances();
          resetForm();
          setNotifications([{ 
            _id: Date.now(), 
            message: `Absensi baru untuk ${userName} pada ${form.date}`, 
            date: new Date().toISOString(), 
            read: false 
          }, ...notifications]);
        } else {
          const err = await res.json();
          alert(err.error || 'Gagal simpan');
        }
      } catch (err) {
        console.error(err);
        alert('Gagal simpan attendance');
      }
    }
  };

  const handleEdit = (att) => {
    setForm({
      id: att._id,
      userId: att.userId,
      userName: att.userName,
      date: att.date,
      checkIn: att.checkIn,
      checkOut: att.checkOut,
      status: att.status,
      note: att.note
    });
    setEditingId(att._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus data absensi ini?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/attendance/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadAttendances();
      } else {
        alert('Gagal hapus');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal hapus attendance');
    }
  };

  const handleCheckIn = async () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const today = now.toISOString().split('T')[0];
    
    try {
      const res = await fetch(`${API_BASE}/api/attendance/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.userId,
          userName: users.find(u => u._id === session.userId)?.name || 'Pengguna',
          date: today,
          checkIn: timeStr,
          status: 'Hadir',
          method: 'manual'
        })
      });
      if (res.ok) {
        await loadAttendances();
        setNotifications([{ 
          _id: Date.now(), 
          message: `Check-in berhasil pada ${timeStr}`, 
          date: new Date().toISOString(), 
          read: false 
        }, ...notifications]);
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal check-in');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal check-in');
    }
  };

  const handleCheckOut = async () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const today = now.toISOString().split('T')[0];
    
    const todayAtt = attendances.find(a => a.userId === session.userId && a.date === today);
    if (!todayAtt) {
      alert('Anda belum check-in hari ini!');
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/api/attendance/checkout/${todayAtt._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkOut: timeStr })
      });
      if (res.ok) {
        await loadAttendances();
        setNotifications([{ 
          _id: Date.now(), 
          message: `Check-out berhasil pada ${timeStr}`, 
          date: new Date().toISOString(), 
          read: false 
        }, ...notifications]);
      } else {
        alert('Gagal check-out');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal check-out');
    }
  };

  const onFaceSuccess = () => {
    loadAttendances();
    alert('Check-in wajah berhasil!');
  };

  let filtered = [...attendances];
  if (filterDate) filtered = filtered.filter(a => a.date === filterDate);
  if (filterStatus !== 'semua') filtered = filtered.filter(a => a.status === filterStatus);
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (loading) return <div className="p-6 text-center">Memuat data absensi...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Manajemen Absensi</h1>
        <button onClick={loadAttendances} className="bg-gray-500 text-white p-2 rounded-full hover:bg-gray-600">
          <FaSync />
        </button>
      </div>

      {session.loggedIn && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Check-in / Check-out Hari Ini</h2>
          <div className="flex gap-4">
            <button onClick={handleCheckIn} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold">Check-in</button>
            <button onClick={handleCheckOut} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold">Check-out</button>
          </div>
          <p className="text-sm text-gray-500 mt-2">* Waktu otomatis sesuai jam perangkat Anda.</p>
        </div>
      )}

      {session.loggedIn && (
        <FaceAttendance
          userId={session.userId}
          userName={users.find(u => u._id === session.userId)?.name || 'Pengguna'}
          onSuccess={onFaceSuccess}
        />
      )}

      {(session.role === 'Admin' || session.role === 'Supervisor') && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Absensi' : 'Tambah Absensi'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Pekerja</label>
              <select name="userId" value={form.userId} onChange={handleChange} className="w-full p-2 border rounded" required>
                <option value="">Pilih Pekerja</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Tanggal</label>
              <input type="date" name="date" value={form.date} onChange={handleChange} className="w-full p-2 border rounded" required />
            </div>
            <div>
              <label className="block font-medium mb-1">Jam Masuk</label>
              <input type="time" name="checkIn" value={form.checkIn} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block font-medium mb-1">Jam Pulang</label>
              <input type="time" name="checkOut" value={form.checkOut} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block font-medium mb-1">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full p-2 border rounded">
                <option>Hadir</option><option>Izin</option><option>Sakit</option><option>Alpha</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block font-medium mb-1">Catatan (opsional)</label>
              <textarea name="note" value={form.note} onChange={handleChange} rows="2" className="w-full p-2 border rounded"></textarea>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg">{editingId ? 'Update' : 'Simpan'}</button>
              {editingId && <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-6 py-2 rounded-lg">Batal</button>}
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <div className="flex items-center gap-2">
            <FaCalendarAlt />
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="border rounded p-2" />
            {filterDate && <button onClick={() => setFilterDate('')} className="text-red-500">x</button>}
          </div>
          <div className="flex items-center gap-2">
            <FaSearch />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded p-2">
              <option value="semua">Semua Status</option>
              <option>Hadir</option><option>Izin</option><option>Sakit</option><option>Alpha</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="p-2 text-left">Pekerja</th>
                <th className="p-2 text-left">Tanggal</th>
                <th className="p-2 text-left">Masuk</th>
                <th className="p-2 text-left">Pulang</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Catatan</th>
                <th className="p-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(att => (
                <tr key={att._id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{att.userName}</td>
                  <td className="p-2">{att.date}</td>
                  <td className="p-2">{att.checkIn || '-'}</td>
                  <td className="p-2">{att.checkOut || '-'}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      att.status === 'Hadir' ? 'bg-green-100 text-green-800' :
                      att.status === 'Izin' ? 'bg-blue-100 text-blue-800' :
                      att.status === 'Sakit' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>{att.status}</span>
                  </td>
                  <td className="p-2">{att.note}</td>
                  <td className="p-2 text-center">
                    {(session.role === 'Admin' || session.role === 'Supervisor') && (
                      <>
                        <button onClick={() => handleEdit(att)} className="text-blue-600 mr-2"><FaEdit /></button>
                        <button onClick={() => handleDelete(att._id)} className="text-red-600"><FaTrash /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="7" className="text-center p-4 text-gray-500">Tidak ada data absensi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;