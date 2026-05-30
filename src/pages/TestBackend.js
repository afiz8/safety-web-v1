import React, { useState, useEffect } from 'react';
import { getItems, createItem, updateItem, deleteItem } from '../services/api';

const TestBackend = () => {
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [loading, setLoading] = useState(false);

  // Ambil semua item saat halaman dimuat
  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const data = await getItems();
    if (data) setItems(data);
    setLoading(false);
  };

  // Tambah item
  const handleAdd = async () => {
    if (!newItemName) {
      alert('Nama item harus diisi!');
      return;
    }
    const result = await createItem({ 
      name: newItemName, 
      category: newItemCategory || 'Umum' 
    });
    if (result) {
      setNewItemName('');
      setNewItemCategory('');
      loadItems();
    } else {
      alert('Gagal menambah item');
    }
  };

  // Hapus item
  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus item ini?')) {
      await deleteItem(id);
      loadItems();
    }
  };

  // Mulai edit
  const startEdit = (item) => {
    setEditingId(item._id);
    setEditName(item.name);
    setEditCategory(item.category || '');
  };

  // Simpan edit
  const handleUpdate = async (id) => {
    const result = await updateItem(id, { 
      name: editName, 
      category: editCategory 
    });
    if (result) {
      setEditingId(null);
      loadItems();
    } else {
      alert('Gagal update item');
    }
  };

  // Batal edit
  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditCategory('');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🧪 Test Koneksi Backend MongoDB</h1>
      
      {/* Status Koneksi */}
      <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg">
        ✅ Backend terhubung di {process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}
      </div>

      {/* Form Tambah Item */}
      <div className="mb-8 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-semibold mb-3">➕ Tambah Item Baru</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Nama item*"
            className="border p-2 rounded flex-1 min-w-[150px]"
          />
          <input
            type="text"
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value)}
            placeholder="Kategori (opsional)"
            className="border p-2 rounded flex-1 min-w-[150px]"
          />
          <button 
            onClick={handleAdd}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Tambah
          </button>
        </div>
      </div>

      {/* Daftar Item */}
      <div className="border rounded-lg overflow-hidden">
        <h2 className="text-lg font-semibold p-4 bg-gray-100 border-b">📋 Daftar Item</h2>
        {loading && <div className="p-4 text-center">Loading...</div>}
        {!loading && items.length === 0 && (
          <div className="p-4 text-center text-gray-500">Belum ada item. Tambahkan item baru di atas.</div>
        )}
        <ul className="divide-y">
          {items.map((item) => (
            <li key={item._id} className="p-4 flex flex-wrap items-center justify-between gap-2">
              {editingId === item._id ? (
                // Mode Edit
                <div className="flex gap-2 flex-1 flex-wrap">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border p-1 rounded flex-1"
                  />
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="Kategori"
                    className="border p-1 rounded flex-1"
                  />
                  <button 
                    onClick={() => handleUpdate(item._id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Simpan
                  </button>
                  <button 
                    onClick={cancelEdit}
                    className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                // Mode Tampil
                <>
                  <div className="flex-1">
                    <span className="font-medium">{item.name}</span>
                    {item.category && (
                      <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      ID: {item._id}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => startEdit(item)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(item._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Hapus
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Informasi API */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg text-sm">
        <h3 className="font-semibold mb-2">📡 Endpoint API yang tersedia:</h3>
        <ul className="space-y-1 font-mono text-xs">
          <li>GET    /api/items</li>
          <li>GET    /api/items/:id</li>
          <li>POST   /api/items</li>
          <li>PUT    /api/items/:id</li>
          <li>DELETE /api/items/:id</li>
        </ul>
      </div>
    </div>
  );
};

export default TestBackend;