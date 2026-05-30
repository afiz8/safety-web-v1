import React, { useState, useEffect } from 'react';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [form, setForm] = useState({ id: null, name: '', site: '', points: 0 });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('jsms_leaderboard');
    if (stored) setLeaders(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem('jsms_leaderboard', JSON.stringify(leaders));
  }, [leaders]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name) return alert('Nama harus diisi');
    if (editingId) {
      setLeaders(leaders.map(l => l.id === editingId ? { ...form, id: editingId, points: Number(form.points) } : l));
      setEditingId(null);
    } else {
      setLeaders([{ ...form, id: Date.now(), points: Number(form.points) }, ...leaders]);
    }
    setForm({ id: null, name: '', site: '', points: 0 });
  };

  const handleEdit = (item) => { setForm(item); setEditingId(item.id); };
  const handleDelete = (id) => { if (window.confirm('Hapus?')) setLeaders(leaders.filter(l => l.id !== id)); };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Leaderboard K3</h1>
      <div className="bg-white p-4 rounded shadow">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input name="name" placeholder="Nama Karyawan" value={form.name} onChange={handleChange} className="border p-2 rounded" required />
          <input name="site" placeholder="Site" value={form.site} onChange={handleChange} className="border p-2 rounded" />
          <input name="points" type="number" placeholder="Poin" value={form.points} onChange={handleChange} className="border p-2 rounded" />
          <div className="md:col-span-3 flex gap-3">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{editingId ? 'Update' : 'Tambah'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ id: null, name: '', site: '', points: 0 }); }} className="bg-gray-500 text-white px-4 py-2 rounded">Batal</button>}
          </div>
        </form>
      </div>
      <div className="bg-white p-4 rounded shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100"><tr><th>Nama</th><th>Site</th><th>Poin</th><th>Aksi</th></tr></thead>
          <tbody>
            {leaders.sort((a,b) => b.points - a.points).map(item => (
              <tr key={item.id} className="border-b"><td className="p-2">{item.name}</td><td className="p-2">{item.site}</td><td className="p-2">{item.points}</td>
              <td className="p-2"><button onClick={() => handleEdit(item)} className="text-blue-600 mr-2">Edit</button><button onClick={() => handleDelete(item.id)} className="text-red-600">Hapus</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default Leaderboard;