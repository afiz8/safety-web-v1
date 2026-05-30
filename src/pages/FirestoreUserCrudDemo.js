import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// Demo CRUD untuk collection "user" (field: uid, name, email)
// - Ambil data (read)
// - Tambah data (create)
// - Hapus data (delete)

export default function FirestoreUserCrudDemo() {
  const colRef = useMemo(() => collection(db, 'user'), []);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [uid, setUid] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const snap = await getDocs(colRef);
      const rows = [];
      snap.forEach((d) => {
        rows.push({ id: d.id, ...d.data() });
      });
      setItems(rows);
    } catch (e) {
      console.error(e);
      setError(e?.message || 'Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!uid.trim() || !name.trim()) {
      setError('Minimal uid dan name wajib diisi');
      return;
    }

    setCreating(true);
    setError('');
    try {
      await addDoc(colRef, {
        uid: uid.trim(),
        name: name.trim(),
        email: email.trim() || null,
        createdAt: serverTimestamp(),
      });

      setUid('');
      setName('');
      setEmail('');

      await load();
    } catch (e2) {
      console.error(e2);
      setError(e2?.message || 'Gagal menambah data');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!docId) return;

    const ok = window.confirm('Hapus data ini?');
    if (!ok) return;

    setDeletingId(docId);
    setError('');
    try {
      await deleteDoc(doc(colRef, docId));
      await load();
    } catch (e) {
      console.error(e);
      setError(e?.message || 'Gagal menghapus data');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Firestore CRUD Demo (Collection: <span className="text-blue-600">user</span>)
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Contoh: ambil data, tampilkan, tambah data, hapus data menggunakan React Hooks.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Tambah User</h2>

          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">uid</label>
              <input
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                className="border rounded-lg px-3 py-2 bg-transparent text-gray-900 dark:text-white"
                placeholder="contoh: 123"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border rounded-lg px-3 py-2 bg-transparent text-gray-900 dark:text-white"
                placeholder="contoh: Budi"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">email (opsional)</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border rounded-lg px-3 py-2 bg-transparent text-gray-900 dark:text-white"
                placeholder="contoh: budi@email.com"
              />
            </div>

            <div className="md:col-span-3 flex gap-3 items-center mt-2">
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Menyimpan...' : 'Tambah'}
              </button>
              <button
                type="button"
                onClick={load}
                className="px-5 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Refresh
              </button>
            </div>
          </form>

          {error && <p className="text-red-600 mt-3 text-sm">{error}</p>}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Daftar User</h2>

          {loading ? (
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300">Belum ada data.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-3">uid</th>
                    <th className="py-2 pr-3">name</th>
                    <th className="py-2 pr-3">email</th>
                    <th className="py-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2 pr-3 text-sm">{row.uid}</td>
                      <td className="py-2 pr-3 text-sm">{row.name}</td>
                      <td className="py-2 pr-3 text-sm">{row.email || '-'}</td>
                      <td className="py-2">
                        <button
                          disabled={deletingId === row.id}
                          onClick={() => handleDelete(row.id)}
                          className="px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {deletingId === row.id ? 'Menghapus...' : 'Hapus'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            Catatan: delete menggunakan doc id dari Firestore.
          </p>
        </div>
      </div>
    </div>
  );
}

