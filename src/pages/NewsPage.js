import React, { useState, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCalendarAlt, FaEye, FaTimes, FaShare, FaBookmark, FaRegBookmark, 
  FaSync, FaExternalLinkAlt, FaHeart, FaRegHeart, FaComment, 
  FaPlus, FaTrash, FaEdit, FaSearch, FaFilter, FaTag, FaUpload,
  FaMoon, FaSun, FaUser, FaSpinner, FaPaperPlane
} from 'react-icons/fa';
import { UserContext } from '../App';

const NewsPage = () => {
  const { session, darkMode, toggleDarkMode, notifications, setNotifications } = useContext(UserContext);
  const [news, setNews] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    image: '',
    category: 'Berita',
    tags: [],
    sourceUrl: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [likes, setLikes] = useState({});
  const [bookmarks, setBookmarks] = useState({});

  const API_BASE = 'http://localhost:5000';
  const userId = session?.userId || 'anonymous';
  const canEdit = session?.role === 'Admin';

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/news?`;
      if (searchTerm) url += `search=${searchTerm}&`;
      if (tagFilter !== 'all') url += `tag=${tagFilter}&`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNews(data);
        const likesMap = {};
        const bookmarksMap = {};
        data.forEach(n => {
          likesMap[n._id] = n.likedBy?.includes(userId) || false;
          bookmarksMap[n._id] = n.bookmarks?.includes(userId) || false;
        });
        setLikes(likesMap);
        setBookmarks(bookmarksMap);
      }
    } catch (err) {
      console.error('Gagal fetch news:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, tagFilter, userId]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // ==================== FUNGSI KOMENTAR (DIUBAH KE komentar-berita) ====================
  const fetchComments = async (newsId) => {
    try {
      const res = await fetch(`${API_BASE}/api/komentar-berita/${newsId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Gagal fetch comments:', err);
    }
  };

  const addComment = async () => {
    if (!commentInput.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/komentar-berita`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsId: selectedNews._id,
          userId,
          userName: session?.name || 'Anonymous',
          content: commentInput
        })
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments(prev => [newComment, ...prev]);
        setCommentInput('');
      }
    } catch (err) {
      console.error('Gagal tambah komentar:', err);
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('Hapus komentar ini?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/komentar-berita/${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        setComments(prev => prev.filter(c => c._id !== commentId));
      }
    } catch (err) {
      console.error('Gagal hapus komentar:', err);
    }
  };

  const openNewsDetail = async (newsItem) => {
    try {
      const res = await fetch(`${API_BASE}/api/news/${newsItem._id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedNews(data);
        await fetchComments(data._id);
      }
    } catch (err) {
      console.error('Gagal fetch detail:', err);
    }
  };

  const toggleLike = async (newsId) => {
    try {
      const res = await fetch(`${API_BASE}/api/news/${newsId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        const data = await res.json();
        setLikes(prev => ({ ...prev, [newsId]: data.liked }));
        setNews(prev => prev.map(n => n._id === newsId ? { ...n, likes: data.likes } : n));
        if (selectedNews && selectedNews._id === newsId) {
          setSelectedNews(prev => ({ ...prev, likes: data.likes }));
        }
      }
    } catch (err) {
      console.error('Gagal like:', err);
    }
  };

  const toggleBookmark = async (newsId) => {
    try {
      const res = await fetch(`${API_BASE}/api/news/${newsId}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        const data = await res.json();
        setBookmarks(prev => ({ ...prev, [newsId]: data.bookmarked }));
      }
    } catch (err) {
      console.error('Gagal bookmark:', err);
    }
  };

  const uploadImage = async (file) => {
    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('files', file);
    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formDataUpload
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

  const handleSubmitNews = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          author: session?.name,
          authorId: userId,
          tags: formData.tags.filter(t => t),
          createdAt: new Date()
        })
      });
      if (res.ok) {
        await fetchNews();
        setShowForm(false);
        setFormData({ title: '', summary: '', content: '', image: '', category: 'Berita', tags: [], sourceUrl: '' });
        const notifRes = await fetch(`${API_BASE}/api/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `📰 Berita baru: ${formData.title}`, read: false, date: new Date().toISOString() })
        });
        if (notifRes.ok) {
          setNotifications?.(prev => [{ id: Date.now(), message: `📰 Berita baru: ${formData.title}`, date: new Date().toISOString(), read: false }, ...prev]);
        }
      }
    } catch (err) {
      console.error('Gagal simpan berita:', err);
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

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const allTags = ['Safety', 'Incident', 'Pelatihan', 'Regulasi', 'Acara', 'Tips'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-6 px-4 transition-colors duration-300 ${
      darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 to-blue-50/30'
    }`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className={`text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
              📰 Berita K3 Terkini
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Update berita keselamatan kerja, insiden, dan pelatihan
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleDarkMode} className={`p-2 rounded-full transition ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            {canEdit && (
              <button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-5 py-2 rounded-full shadow-md hover:shadow-lg transition flex items-center gap-2">
                <FaPlus /> Buat Berita
              </button>
            )}
            <button onClick={fetchNews} className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 flex items-center gap-2">
              <FaSync /> Refresh
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`} />
            <input type="text" placeholder="Cari berita..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-300 outline-none transition ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`} />
          </div>
          <div className="relative">
            <FaTag className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`} />
            <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className={`pl-9 pr-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
              <option value="all">Semua Tag</option>
              {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
            </select>
          </div>
        </div>

        {/* Grid Berita */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((item) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              className={`rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer ${
                darkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white'
              }`}
              onClick={() => openNewsDetail(item)}
            >
              <div className="relative h-48 overflow-hidden">
                <img src={item.image || 'https://via.placeholder.com/400x200?text=News'} alt={item.title} className="w-full h-full object-cover transition duration-500 hover:scale-105" />
                <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                  {item.category}
                </div>
                {item.tags?.length > 0 && (
                  <div className="absolute bottom-3 left-3 flex gap-1">
                    {item.tags.slice(0, 2).map(tag => <span key={tag} className="bg-blue-500/80 text-white text-xs px-2 py-0.5 rounded-full">{tag}</span>)}
                  </div>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                  <span><FaCalendarAlt className="inline mr-1" /> {formatDate(item.createdAt)}</span>
                  <span><FaEye className="inline mr-1" /> {item.views || 0}</span>
                </div>
                <h3 className={`text-xl font-bold mb-2 line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {item.title}
                </h3>
                <p className={`text-sm mb-4 line-clamp-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {item.summary || item.content?.substring(0, 150)}
                </p>
                <div className="flex justify-between items-center mt-auto">
                  <div className="flex items-center gap-3">
                    <button onClick={(e) => { e.stopPropagation(); toggleLike(item._id); }} className={`flex items-center gap-1 text-sm transition ${likes[item._id] ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
                      {likes[item._id] ? <FaHeart /> : <FaRegHeart />} {item.likes || 0}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleBookmark(item._id); }} className={`text-sm transition ${bookmarks[item._id] ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}>
                      {bookmarks[item._id] ? <FaBookmark /> : <FaRegBookmark />}
                    </button>
                    <span className="text-xs text-gray-400"><FaComment className="inline mr-1" /> {item.comments?.length || 0}</span>
                  </div>
                  <span className="text-xs text-gray-400">{item.author}</span>
                </div>
              </div>
            </motion.div>
          ))}
          {news.length === 0 && (
            <div className={`col-span-full text-center py-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Tidak ada berita yang ditemukan.
            </div>
          )}
        </div>
      </div>

      {/* Modal Detail Berita */}
      <AnimatePresence>
        {selectedNews && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedNews(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className={`relative rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelectedNews(null)} className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black text-white p-2 rounded-full transition"><FaTimes /></button>
              <img src={selectedNews.image || 'https://via.placeholder.com/800x400?text=News'} alt={selectedNews.title} className="w-full h-64 object-cover" />
              <div className="p-6">
                <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-4">
                  <span><FaCalendarAlt className="inline mr-1" /> {formatDate(selectedNews.createdAt)}</span>
                  <span><FaEye className="inline mr-1" /> {selectedNews.views || 0}</span>
                  <span className="bg-blue-100 text-blue-800 px-2 rounded-full">{selectedNews.category}</span>
                  {selectedNews.tags?.map(tag => <span key={tag} className="bg-gray-100 text-gray-700 px-2 rounded-full">{tag}</span>)}
                </div>
                <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{selectedNews.title}</h2>
                <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedNews.content}</p>
                {selectedNews.sourceUrl && (
                  <a href={selectedNews.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">Sumber Asli <FaExternalLinkAlt size={12} /></a>
                )}
                
                {/* Like & Bookmark */}
                <div className="flex gap-4 mb-6 pb-4 border-b border-gray-200">
                  <button onClick={() => toggleLike(selectedNews._id)} className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${likes[selectedNews._id] ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-600'}`}>
                    {likes[selectedNews._id] ? <FaHeart /> : <FaRegHeart />} {selectedNews.likes || 0}
                  </button>
                  <button onClick={() => toggleBookmark(selectedNews._id)} className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${bookmarks[selectedNews._id] ? 'bg-yellow-100 text-yellow-500' : 'bg-gray-100 text-gray-600'}`}>
                    {bookmarks[selectedNews._id] ? <FaBookmark /> : <FaRegBookmark />} Simpan
                  </button>
                </div>

                {/* Comments Section */}
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Komentar ({comments.length})</h3>
                <div className="flex gap-3 mb-6">
                  <input type="text" placeholder="Tulis komentar..." value={commentInput} onChange={(e) => setCommentInput(e.target.value)} className={`flex-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-300 outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`} />
                  <button onClick={addComment} className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition"><FaPaperPlane /></button>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {comments.map(comment => (
                    <div key={comment._id} className={`p-3 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <FaUser className="text-gray-400 text-sm" />
                          <span className="font-semibold text-sm">{comment.userName}</span>
                          <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                        </div>
                        {(comment.userId === userId || canEdit) && (
                          <button onClick={() => deleteComment(comment._id)} className="text-red-500 hover:text-red-700"><FaTrash size={12} /></button>
                        )}
                      </div>
                      <p className="text-sm mt-1">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Form Buat Berita (Admin) */}
      <AnimatePresence>
        {showForm && canEdit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className={`rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Buat Berita Baru</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
              </div>
              <form onSubmit={handleSubmitNews} className="space-y-3">
                <input type="text" placeholder="Judul Berita *" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} required />
                <input type="text" placeholder="Ringkasan" value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                <textarea placeholder="Isi Berita *" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} rows="4" required />
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  <option>Berita</option><option>Insiden</option><option>Pelatihan</option><option>Regulasi</option><option>Tips</option>
                </select>
                <div>
                  <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Tag</label>
                  <div className="flex gap-2 mt-1">
                    <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Tambah tag" className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                    <button type="button" onClick={addTag} className="px-3 py-2 bg-green-500 text-white rounded-lg">+</button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.tags.map(tag => <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">{tag}<button type="button" onClick={() => removeTag(tag)} className="text-red-500">×</button></span>)}
                  </div>
                </div>
                <div>
                  <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Upload Gambar</label>
                  <input type="file" accept="image/*" onChange={async (e) => {
                    const url = await uploadImage(e.target.files[0]);
                    if (url) setFormData({...formData, image: url});
                  }} className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                  {formData.image && <div className="mt-1 text-xs text-green-500">✓ Gambar terupload</div>}
                </div>
                <input type="url" placeholder="Sumber URL (opsional)" value={formData.sourceUrl} onChange={e => setFormData({...formData, sourceUrl: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                <button type="submit" disabled={uploading} className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition">
                  {uploading ? 'Uploading...' : 'Publikasikan'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewsPage;