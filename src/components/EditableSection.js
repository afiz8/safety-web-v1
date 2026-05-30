import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../App';
import { FaEdit, FaSave, FaTimes, FaUndo } from 'react-icons/fa';

/**
 * EditableSection - Komponen reusable untuk konten yang bisa diedit Admin
 * Data disimpan ke MongoDB (bukan localStorage)
 */
const EditableSection = ({ 
  sectionId, 
  pageId, 
  title, 
  defaultData, 
  renderDisplay, 
  renderEdit,
  className = ''
}) => {
  const { session } = useContext(UserContext);
  const isAdmin = session?.role === 'Admin';
  
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  
  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // Load data dari backend
  useEffect(() => {
    const loadContent = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/site-content/${pageId}/${sectionId}`);
        if (!res.ok) throw new Error('Gagal mengambil data');
        const result = await res.json();
        if (result.data) {
          setData(result.data);
        } else {
          setData(defaultData);
        }
      } catch (err) {
        console.error('Gagal load content:', err);
        setError('Gagal memuat data dari server. Menggunakan data default.');
        setData(defaultData);
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, [pageId, sectionId, defaultData, API_BASE]);

  const handleEdit = () => {
    setEditData(JSON.parse(JSON.stringify(data)));
    setEditMode(true);
    setSaved(false);
  };
  
  const handleSave = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/site-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          sectionId,
          data: editData,
          updatedBy: session?.username || session?.user?.username || 'admin'
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setData(editData);
        setEditMode(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        alert('Gagal menyimpan: ' + (result.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Gagal menyimpan data. Periksa koneksi backend.');
    }
  };
  
  const handleCancel = () => {
    setEditMode(false);
    setEditData(null);
  };
  
  const handleReset = async () => {
    if (window.confirm('Yakin ingin mengembalikan ke data default? Semua perubahan akan hilang.')) {
      try {
        await fetch(`${API_BASE}/api/site-content/${pageId}/${sectionId}`, { method: 'DELETE' });
        setData(defaultData);
        setEditMode(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        alert('Gagal mereset data');
      }
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Memuat konten...</div>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Admin Toolbar */}
      {isAdmin && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
          {saved && (
            <span className="px-3 py-1 bg-green-500 text-white text-xs rounded-full animate-pulse">
              ✓ Tersimpan
            </span>
          )}
          {!editMode ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg shadow-md transition-all"
              title="Edit konten"
            >
              <FaEdit /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg shadow-md transition-all"
              >
                <FaSave /> Simpan
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg shadow-md transition-all"
              >
                <FaTimes /> Batal
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg shadow-md transition-all"
                title="Reset ke default"
              >
                <FaUndo />
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Content */}
      {error && !editMode && (
        <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 text-sm rounded">{error}</div>
      )}
      {editMode && isAdmin ? (
        <div className="border-2 border-blue-400 rounded-2xl p-6 bg-blue-50/50 dark:bg-blue-900/20">
          <h3 className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-4 flex items-center gap-2">
            <FaEdit /> Mode Edit: {title}
          </h3>
          {renderEdit(editData, setEditData)}
        </div>
      ) : (
        renderDisplay(data)
      )}
    </div>
  );
};

export default EditableSection;