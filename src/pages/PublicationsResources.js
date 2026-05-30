import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBook, FaFilePdf, FaVideo, FaExternalLinkAlt, FaDownload, 
  FaSearch, FaFilter, FaBookmark, FaRegBookmark, FaEye, FaTimes,
  FaMoon, FaSun, FaPlus, FaEdit, FaTrash, FaSpinner, FaRobot
} from 'react-icons/fa';
import { UserContext } from '../App';

const PublicationsResources = () => {
  const { session, darkMode, toggleDarkMode, notifications, setNotifications } = useContext(UserContext);
  const [resources, setResources] = useState([]);
  const [popularResources, setPopularResources] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('publications');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState({
    title: '', type: 'publication', category: '', description: '', fileUrl: '', duration: '', year: '', tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);

  const API_BASE = 'http://localhost:5000';
  const userId = session?.userId || 'anonymous';
  const canEdit = session?.role === 'Admin';

  const categories = [
    { id: 'publications', label: 'Publikasi ILO', icon: FaBook },
    { id: 'regulations', label: 'Regulasi Indonesia', icon: FaFilePdf },
    { id: 'videos', label: 'Video & Training', icon: FaVideo },
    { id: 'links', label: 'Link Eksternal', icon: FaExternalLinkAlt }
  ];

  const fetchResources = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/resources?type=${activeCategory}&`;
      if (searchTerm) url += `search=${searchTerm}&`;
      if (typeFilter !== 'all') url += `type=${typeFilter}&`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setResources(data);
      }
    } catch (err) {
      console.error('Gagal fetch resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularResources = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/resources/popular`);
      if (res.ok) {
        const data = await res.json();
        setPopularResources(data);
      }
    } catch (err) {
      console.error('Gagal fetch popular:', err);
    }
  };

  const fetchRecommendations = async () => {
    if (userId === 'anonymous') return;
    try {
      const res = await fetch(`${API_BASE}/api/resources/recommendations/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } catch (err) {
      console.error('Gagal fetch recommendations:', err);
    }
  };

  const fetchBookmarks = async () => {
    if (userId === 'anonymous') return;
    try {
      const res = await fetch(`${API_BASE}/api/bookmarks/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data.map(b => b._id));
      }
    } catch (err) {
      console.error('Gagal fetch bookmarks:', err);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchPopularResources();
    fetchRecommendations();
    fetchBookmarks();
  }, [activeCategory, searchTerm, typeFilter]);

  const toggleBookmark = async (resourceId) => {
    if (userId === 'anonymous') {
      alert('Login untuk menyimpan bookmark');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/bookmarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, resourceId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.bookmarked) {
          setBookmarks(prev => [...prev, resourceId]);
        } else {
          setBookmarks(prev => prev.filter(id => id !== resourceId));
        }
      }
    } catch (err) {
      console.error('Gagal bookmark:', err);
    }
  };

  const incrementDownload = async (resourceId) => {
    try {
      await fetch(`${API_BASE}/api/resources/${resourceId}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
    } catch (err) {
      console.error('Gagal increment download:', err);
    }
  };

  const uploadFile = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('files', file);
    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        return data.files[0]?.url || '';
      }
      return '';
    } catch (err) {
      console.error('Upload gagal:', err);
      return '';
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let url = `${API_BASE}/api/resources`;
      let method = 'POST';
      if (editingResource) {
        url = `${API_BASE}/api/resources/${editingResource._id}`;
        method = 'PUT';
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.filter(t => t),
          createdBy: session?.name
        })
      });
      if (res.ok) {
        await fetchResources();
        setShowForm(false);
        setEditingResource(null);
        setFormData({ title: '', type: 'publication', category: '', description: '', fileUrl: '', duration: '', year: '', tags: [] });
      }
    } catch (err) {
      console.error('Gagal simpan:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus resource ini?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/resources/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchResources();
      }
    } catch (err) {
      console.error('Gagal hapus:', err);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const getTypeColor = (type) => {
    const colors = {
      'publication': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'regulation': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'video': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'link': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type) => {
    const labels = {
      'publication': 'Publikasi',
      'regulation': 'Regulasi',
      'video': 'Video',
      'link': 'Link Eksternal'
    };
    return labels[type] || type;
  };

  // Filter resources based on active category
  const filteredResources = resources.filter(r => {
    if (activeCategory === 'publications') return r.type === 'publication';
    if (activeCategory === 'regulations') return r.type === 'regulation';
    if (activeCategory === 'videos') return r.type === 'video';
    if (activeCategory === 'links') return r.type === 'link';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-6 px-4 transition-colors duration-300 ${
      darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-slate-50 via-amber-50/30 to-yellow-50/30'
    }`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <FaBook className="text-4xl text-amber-500" />
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Publikasi & Sumber Daya
              </h1>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Perpustakaan digital K3 - Publikasi, regulasi, video, dan link
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleDarkMode} className={`p-2 rounded-full transition ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            {canEdit && (
              <button onClick={() => { setEditingResource(null); setFormData({ title: '', type: 'publication', category: '', description: '', fileUrl: '', duration: '', year: '', tags: [] }); setShowForm(true); }} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full shadow-md hover:shadow-lg transition flex items-center gap-2">
                <FaPlus /> Tambah
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`} />
            <input type="text" placeholder="Cari dokumen (judul, deskripsi, tag)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-amber-300 outline-none transition ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`} />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
            <option value="all">Semua Tipe</option>
            <option value="publication">Publikasi</option>
            <option value="regulation">Regulasi</option>
            <option value="video">Video</option>
            <option value="link">Link</option>
          </select>
        </div>

        {/* AI Recommendation Section */}
        {recommendations.length > 0 && (
          <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <div className="flex items-center gap-2 mb-3">
              <FaRobot className="text-purple-500 text-xl" />
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Rekomendasi untuk Anda</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recommendations.slice(0, 3).map(rec => (
                <div key={rec._id} className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-amber-50'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{rec.title}</p>
                      <p className="text-xs text-gray-500">{rec.type}</p>
                    </div>
                    <button onClick={() => toggleBookmark(rec._id)} className="text-yellow-500">
                      {bookmarks.includes(rec._id) ? <FaBookmark /> : <FaRegBookmark />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                  : `bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50`
              }`}
            >
              <cat.icon /> {cat.label}
            </button>
          ))}
        </div>

        {/* Popular Resources (Top 5) */}
        {popularResources.length > 0 && (
          <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <FaEye className="text-amber-500" /> Paling Sering Dibaca
            </h3>
            <div className="flex flex-wrap gap-3">
              {popularResources.map(pop => (
                <div key={pop._id} className={`px-3 py-2 rounded-full text-sm ${darkMode ? 'bg-gray-700' : 'bg-amber-100'}`}>
                  {pop.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resources Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <motion.div
              key={resource._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              className={`rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden ${darkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white'}`}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(resource.type)}`}>
                    {getTypeLabel(resource.type)}
                  </span>
                  <button onClick={() => toggleBookmark(resource._id)} className="text-yellow-500">
                    {bookmarks.includes(resource._id) ? <FaBookmark /> : <FaRegBookmark />}
                  </button>
                </div>
                <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{resource.title}</h3>
                <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{resource.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  {resource.year && <span>📅 {resource.year}</span>}
                  {resource.duration && <span>⏱️ {resource.duration}</span>}
                  <span>👁️ {resource.views || 0}</span>
                  <span>⬇️ {resource.downloads || 0}</span>
                </div>
                {resource.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {resource.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">{tag}</span>
                    ))}
                  </div>
                )}
                {resource.type === 'link' && resource.fileUrl && (
                  <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer" className="text-amber-600 text-sm flex items-center gap-1">Kunjungi <FaExternalLinkAlt size={12} /></a>
                )}
                {resource.type !== 'link' && resource.fileUrl && (
                  <a href={resource.fileUrl} download onClick={() => incrementDownload(resource._id)} className="text-amber-600 text-sm flex items-center gap-1">Download <FaDownload size={12} /></a>
                )}
                {canEdit && (
                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={() => { setEditingResource(resource); setFormData({ title: resource.title, type: resource.type, category: resource.category || '', description: resource.description || '', fileUrl: resource.fileUrl || '', duration: resource.duration || '', year: resource.year || '', tags: resource.tags || [] }); setShowForm(true); }} className="flex-1 py-1.5 bg-blue-500 text-white rounded-lg text-sm">Edit</button>
                    <button onClick={() => handleDelete(resource._id)} className="flex-1 py-1.5 bg-red-500 text-white rounded-lg text-sm">Hapus</button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {filteredResources.length === 0 && (
            <div className={`col-span-full text-center py-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Belum ada data. {canEdit && 'Klik "Tambah" untuk menambahkan resource.'}
            </div>
          )}
        </div>

        {/* Quick Access */}
        <div className={`bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl p-8 lg:p-12 text-white`}>
          <h2 className="text-3xl font-bold mb-8 text-center">Akses Cepat</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'ILO OSH Portal', desc: 'Akses publikasi dan data K3 global', action: 'Kunjungi' },
              { title: 'Kemenaker e-Registration', desc: 'Registrasi dan sertifikasi SMK3', action: 'Daftar' },
              { title: 'OSH Training Center', desc: 'Pelatihan online dan sertifikasi', action: 'Pelajari' },
              { title: 'Incident Reporting', desc: 'Laporkan kecelakaan kerja', action: 'Laporkan' }
            ].map((item, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm opacity-90 mb-4">{item.desc}</p>
                <button className="px-4 py-2 bg-white text-amber-600 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors">
                  {item.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && canEdit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className={`rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{editingResource ? 'Edit Resource' : 'Tambah Resource'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input type="text" placeholder="Judul *" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} required />
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  <option value="publication">Publikasi</option>
                  <option value="regulation">Regulasi</option>
                  <option value="video">Video</option>
                  <option value="link">Link Eksternal</option>
                </select>
                <input type="text" placeholder="Kategori" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                <textarea placeholder="Deskripsi" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} rows="2" />
                <input type="text" placeholder="URL / File path" value={formData.fileUrl} onChange={e => setFormData({...formData, fileUrl: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                <input type="text" placeholder="Durasi (untuk video)" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                <input type="number" placeholder="Tahun" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                <div>
                  <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Tag</label>
                  <div className="flex gap-2 mt-1">
                    <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Tambah tag" className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                    <button type="button" onClick={addTag} className="px-3 py-2 bg-green-500 text-white rounded-lg">+</button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.tags.map(tag => <span key={tag} className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs flex items-center gap-1">{tag}<button type="button" onClick={() => removeTag(tag)} className="text-red-500">×</button></span>)}
                  </div>
                </div>
                <div>
                  <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Upload File</label>
                  <input type="file" onChange={async (e) => {
                    const url = await uploadFile(e.target.files[0]);
                    if (url) setFormData(prev => ({ ...prev, fileUrl: url }));
                  }} className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                </div>
                <button type="submit" disabled={uploading} className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition">
                  {uploading ? 'Uploading...' : (editingResource ? 'Update' : 'Simpan')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicationsResources;