import React, { useState, useEffect, useContext } from 'react';
import { FaEdit, FaTrash, FaSave, FaDownload, FaUpload, FaUndo, FaSearch, FaCog, FaSync, FaEye, FaDatabase, FaShieldAlt } from 'react-icons/fa';
import { UserContext } from '../App';

const ContentAdminPage = () => {
  const { session } = useContext(UserContext);
  const [pages, setPages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(null);
  const [editData, setEditData] = useState(null);
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [notif, setNotif] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  const pageList = [
    { id: 'osh-overview', name: 'OSH Overview', icon: '📊', sections: ['stats', 'principles', 'scopeItems', 'benefits'] },
    { id: 'osh-systems', name: 'Sistem K3 Nasional', icon: '🏛️', sections: ['components', 'pillars', 'indicators'] },
    { id: 'labour-standards', name: 'Standar Internasional', icon: '🌐', sections: ['conventions', 'framework'] },
    { id: 'sectors-hazards', name: 'Sektor & Bahaya', icon: '⚠️', sections: ['sectors', 'hazards'] },
    { id: 'occupational-diseases', name: 'Penyakit Akibat Kerja', icon: '🩺', sections: ['diseases', 'prevention'] },
    { id: 'psychosocial-risks', name: 'Risiko Psikososial', icon: '🧠', sections: ['stress', 'harassment', 'violence', 'mental'] },
    { id: 'osh-statistics', name: 'Statistik K3', icon: '📈', sections: ['globalStats', 'trends'] },
    { id: 'osh-management-systems', name: 'Sistem Manajemen K3', icon: '⚙️', sections: ['systems', 'elements'] },
    { id: 'publications-resources', name: 'Publikasi & Sumber Daya', icon: '📚', sections: ['publications', 'resources'] },
    { id: 'vision-zero', name: 'Vision Zero', icon: '🎯', sections: ['rules', 'principles'] },
    { id: 'global-strategy', name: 'Strategi Global', icon: '🌍', sections: ['goals', 'actions'] }
  ];

  const loadContentForPage = async (pageId, sectionId) => {
    try {
      const res = await fetch(`${API_BASE}/api/site-content/${pageId}/${sectionId}`);
      if (res.ok) {
        const result = await res.json();
        return result.data;
      }
      return null;
    } catch (err) {
      console.error('Error load content:', err);
      return null;
    }
  };

  const loadPages = async () => {
    setLoading(true);
    const loaded = [];
    for (const page of pageList) {
      const pageData = { ...page, sections: [] };
      for (const section of page.sections) {
        const data = await loadContentForPage(page.id, section);
        pageData.sections.push({
          id: section,
          hasData: !!data,
          preview: data ? (typeof data === 'string' ? data.substring(0, 80) + '...' : JSON.stringify(data).substring(0, 80) + '...') : 'Default'
        });
      }
      loaded.push(pageData);
    }
    setPages(loaded);
    setLoading(false);
  };

  useEffect(() => {
    if (session?.role === 'Admin') {
      loadPages();
    }
  }, [session?.role]);

  const showNotif = (message, type = 'success') => {
    setNotif({ message, type });
    setTimeout(() => setNotif(null), 3000);
  };

  const handleEdit = (pageId, sectionId) => {
    setSelected({ pageId, sectionId });
    setEditData({});
    const loadEditData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/site-content/${pageId}/${sectionId}`);
        if (res.ok) {
          const result = await res.json();
          setEditData(result.data || {});
        } else {
          setEditData({});
        }
      } catch (err) {
        console.error(err);
        setEditData({});
      }
    };
    loadEditData();
  };

  const handleSave = async () => {
    if (!selected || !editData) return;
    try {
      const res = await fetch(`${API_BASE}/api/site-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: selected.pageId,
          sectionId: selected.sectionId,
          data: editData,
          updatedBy: session?.username || 'admin'
        })
      });
      if (res.ok) {
        showNotif('✅ Konten tersimpan ke database!');
        await loadPages();
        setSelected(null);
        setEditData(null);
      } else {
        showNotif('❌ Gagal menyimpan', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotif('Error: ' + err.message, 'error');
    }
  };

  const handleDelete = async (pageId, sectionId) => {
    if (!window.confirm('⚠️ Reset ke default?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/site-content/${pageId}/${sectionId}`, { method: 'DELETE' });
      if (res.ok) {
        showNotif('🔄 Direset ke default.');
        await loadPages();
      } else {
        showNotif('❌ Gagal reset', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotif('Error: ' + err.message, 'error');
    }
  };

  const handleResetAll = async () => {
    if (!window.confirm('⚠️ RESET SEMUA KONTEN? Tindakan ini tidak dapat dibatalkan!')) return;
    for (const page of pageList) {
      for (const section of page.sections) {
        try {
          await fetch(`${API_BASE}/api/site-content/${page.id}/${section}`, { method: 'DELETE' });
        } catch (err) {
          console.error(err);
        }
      }
    }
    showNotif('✅ Semua konten direset!');
    await loadPages();
  };

  const handleExport = async () => {
    const allData = {};
    for (const page of pageList) {
      for (const section of page.sections) {
        const res = await fetch(`${API_BASE}/api/site-content/${page.id}/${section}`);
        if (res.ok) {
          const result = await res.json();
          if (result.data) {
            allData[`${page.id}_${section}`] = result.data;
          }
        }
      }
    }
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jsms-backup-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showNotif('📥 Backup berhasil di-download!');
  };

  const handleImport = async () => {
    try {
      const imported = JSON.parse(importText);
      for (const [key, data] of Object.entries(imported)) {
        const [pageId, sectionId] = key.split('_');
        if (pageId && sectionId) {
          await fetch(`${API_BASE}/api/site-content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageId, sectionId, data, updatedBy: session?.username || 'admin' })
          });
        }
      }
      showNotif('✅ Import berhasil!');
      setShowImport(false);
      setImportText('');
      await loadPages();
    } catch (e) {
      showNotif('❌ Gagal import! JSON tidak valid', 'error');
    }
  };

  if (session?.role !== 'Admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md">
          <div className="text-7xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold text-red-600 mb-3">Akses Ditolak</h1>
          <p className="text-gray-600">Halaman ini hanya dapat diakses oleh Administrator.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Memuat konten database...</p>
        </div>
      </div>
    );
  }

  const filtered = pages.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalEdited = pages.reduce((sum, p) => sum + p.sections.filter(s => s.hasData).length, 0);
  const totalSections = pages.reduce((sum, p) => sum + p.sections.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50">
      {/* Header Mewah */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-yellow-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-yellow-600 to-orange-500 bg-clip-text text-transparent flex items-center gap-3">
                <FaCog className="text-orange-500" /> Kelola Konten ILO
              </h1>
              <p className="text-gray-500 mt-1">Edit konten halaman Topik K3 (ILO) - Data tersimpan di MongoDB</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-md transition-all">
                <FaDownload /> Export
              </button>
              <button onClick={() => setShowImport(!showImport)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl shadow-md transition-all">
                <FaUpload /> Import
              </button>
              <button onClick={handleResetAll} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-md transition-all">
                <FaUndo /> Reset All
              </button>
              <button onClick={loadPages} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl shadow-md transition-all">
                <FaSync /> Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistik Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Halaman</p>
                <p className="text-3xl font-bold">{pages.length}</p>
              </div>
              <FaDatabase className="text-4xl opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Konten Teredit</p>
                <p className="text-3xl font-bold">{totalEdited}/{totalSections}</p>
              </div>
              <FaEdit className="text-4xl opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-5 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Status Database</p>
                <p className="text-2xl font-bold">MongoDB Active</p>
              </div>
              <FaShieldAlt className="text-4xl opacity-50" />
            </div>
          </div>
        </div>

        {/* Notifikasi */}
        {notif && (
          <div className={`mb-6 p-4 rounded-2xl shadow-lg flex items-center gap-3 ${notif.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-green-100 text-green-800 border border-green-200'}`}>
            <span className="text-xl">{notif.type === 'error' ? '⚠️' : '✅'}</span>
            <span className="font-medium">{notif.message}</span>
          </div>
        )}

        {/* Import Modal */}
        {showImport && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 mb-6 border-2 border-yellow-200">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <FaUpload className="text-purple-500" /> Import Data JSON
            </h3>
            <textarea 
              value={importText} 
              onChange={e => setImportText(e.target.value)} 
              placeholder='Paste JSON backup di sini...' 
              className="w-full h-40 p-4 border-2 rounded-xl dark:bg-gray-700 font-mono text-sm focus:ring-2 focus:ring-yellow-400 outline-none" 
            />
            <div className="flex gap-3 mt-4">
              <button onClick={handleImport} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-md transition-all">
                Import
              </button>
              <button onClick={() => setShowImport(false)} className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold shadow-md transition-all">
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-8">
          <FaSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
          <input 
            type="text" 
            placeholder="Cari halaman..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full pl-14 pr-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none shadow-sm bg-white dark:bg-gray-800 text-lg"
          />
        </div>

        {/* Grid Halaman */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map(page => (
            <div key={page.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-yellow-100">
              {/* Header Halaman */}
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 p-5 border-b border-yellow-200">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{page.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">{page.name}</h2>
                    <p className="text-sm text-gray-500">{page.id}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-700 rounded-full text-xs font-semibold">
                    📝 {page.sections.filter(s => s.hasData).length} edited
                  </span>
                  <span className="px-3 py-1 bg-gray-500/20 text-gray-600 rounded-full text-xs font-semibold">
                    📚 {page.sections.length} sections
                  </span>
                </div>
              </div>

              {/* Grid Sections */}
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {page.sections.map(section => (
                    <div 
                      key={section.id} 
                      className={`rounded-xl p-4 transition-all duration-200 hover:shadow-md border-2 ${
                        section.hasData 
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200' 
                          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${section.hasData ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                          <span className="font-semibold text-gray-700 dark:text-gray-200 capitalize text-sm">{section.id}</span>
                        </div>
                        {section.hasData && (
                          <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Modified</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 min-h-[40px]">
                        {section.preview}
                      </p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(page.id, section.id)} 
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl transition-all"
                        >
                          <FaEdit size={12} /> Edit
                        </button>
                        {section.hasData && (
                          <button 
                            onClick={() => handleDelete(page.id, section.id)} 
                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-xl transition-all"
                            title="Reset ke default"
                          >
                            <FaTrash size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-md">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg">Tidak ada halaman yang sesuai dengan pencarian.</p>
          </div>
        )}
      </div>

      {/* Modal Edit Premium */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto animate-fade-in">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b-2 border-yellow-200 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-bold">EDIT MODE</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{selected.pageId} / {selected.sectionId}</h3>
                <p className="text-sm text-gray-500 mt-1">Edit konten dalam format JSON</p>
              </div>
              <button 
                onClick={() => { setSelected(null); setEditData(null); }} 
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
                <FaEye className="text-yellow-500" />
                <span>Edit data JSON secara langsung. Pastikan format JSON valid.</span>
              </div>
              <textarea 
                value={JSON.stringify(editData, null, 2)} 
                onChange={e => { 
                  try { 
                    setEditData(JSON.parse(e.target.value)); 
                  } catch (err) { 
                    // Biarkan tidak berubah jika JSON tidak valid
                  } 
                }} 
                className="w-full h-96 p-4 border-2 rounded-xl dark:bg-gray-700 font-mono text-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none"
              />
              <div className="flex gap-3 mt-6">
                <button onClick={handleSave} className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold shadow-lg transition-all">
                  <FaSave /> Simpan Perubahan
                </button>
                <button 
                  onClick={() => { setSelected(null); setEditData(null); }} 
                  className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-bold shadow-lg transition-all"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentAdminPage;