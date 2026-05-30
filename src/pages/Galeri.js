import React, { useState, useEffect, useContext } from 'react';
import { FaTimes, FaHeart, FaRegHeart, FaPlayCircle, FaShare, FaDownload, FaEye, FaThumbsUp, FaCrown, FaGem, FaStar, FaSearch, FaFilter, FaTh, FaBars, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { UserContext } from '../App';

const Galeri = () => {
  const { session } = useContext(UserContext);
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('semua');
  const [selectedItem, setSelectedItem] = useState(null);
  const [likedItems, setLikedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  // Load gallery items dari backend
  const loadGalleryItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/gallery`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        const savedLikes = localStorage.getItem('jsms_galeri_likes');
        if (savedLikes) {
          const saved = JSON.parse(savedLikes);
          setLikedItems(saved);
        }
      }
    } catch (err) {
      console.error('Gagal load gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGalleryItems();
  }, []);

  useEffect(() => {
    localStorage.setItem('jsms_galeri_likes', JSON.stringify(likedItems));
  }, [likedItems]);

  const toggleLike = async (itemId) => {
    if (!session?.userId) {
      alert('✨ Silakan login untuk menyukai konten ✨');
      return;
    }
    
    const isCurrentlyLiked = likedItems[itemId] || false;
    setLikedItems(prev => ({ ...prev, [itemId]: !isCurrentlyLiked }));
    setItems(prev => prev.map(item => 
      item._id === itemId 
        ? { ...item, likes: isCurrentlyLiked ? item.likes - 1 : item.likes + 1 }
        : item
    ));
    
    try {
      const res = await fetch(`${API_BASE}/api/gallery/${itemId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.userId })
      });
      if (res.ok) {
        const result = await res.json();
        setItems(prev => prev.map(item =>
          item._id === itemId ? { ...item, likes: result.likes } : item
        ));
        setLikedItems(prev => ({ ...prev, [itemId]: result.liked }));
      } else {
        setLikedItems(prev => ({ ...prev, [itemId]: isCurrentlyLiked }));
        setItems(prev => prev.map(item =>
          item._id === itemId ? { ...item, likes: isCurrentlyLiked ? item.likes + 1 : item.likes - 1 } : item
        ));
      }
    } catch (err) {
      console.error('Gagal like:', err);
      setLikedItems(prev => ({ ...prev, [itemId]: isCurrentlyLiked }));
      setItems(prev => prev.map(item =>
        item._id === itemId ? { ...item, likes: isCurrentlyLiked ? item.likes + 1 : item.likes - 1 } : item
      ));
    }
  };

  const handleShare = async (item) => {
    const url = `${window.location.origin}/galeri/${item._id}`;
    const shareText = `📸 ${item.title} - JSMS HSSE Gallery`;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, text: shareText, url });
      } catch (err) { console.log('Share dibatalkan'); }
    } else {
      navigator.clipboard.writeText(`${shareText}\n${url}`);
      alert('✅ Link berhasil disalin!');
    }
  };

  const handleDownload = (item) => {
    // Untuk download, perlu lewat backend karena file di public frontend
    const link = document.createElement('a');
    link.href = item.path;
    link.download = item.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('✅ Download dimulai!');
  };

  const categories = ['all', ...new Set(items.map(item => item.category))];
  
  const filteredItems = items.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchType = filter === 'semua' || item.type === filter;
    return matchSearch && matchCategory && matchType;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getSizeClass = (index) => {
    if (viewMode === 'list') return '';
    const patterns = ['md:col-span-1', 'md:col-span-2', 'md:col-span-1 md:row-span-2', 'md:col-span-2 md:row-span-2'];
    return patterns[index % patterns.length];
  };

  const totalLikes = items.reduce((sum, item) => sum + (item.likes || 0), 0);
  const totalViews = items.length * 100 + totalLikes * 5;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-blue-500 animate-spin animation-delay-150"></div>
            <div className="absolute inset-4 rounded-full border-4 border-transparent border-t-purple-500 animate-spin animation-delay-300"></div>
            <FaGem className="absolute inset-0 m-auto text-4xl text-white" />
          </div>
          <p className="text-white text-xl mt-8 font-light tracking-wider">LOADING PREMIUM GALLERY...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
      </div>

      <div className="relative z-10 p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header Premium */}
        <div className="relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-transparent to-purple-500/20"></div>
          <div className="relative p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                    <FaCrown className="text-white text-2xl" />
                  </div>
                  <span className="px-4 py-2 bg-white/10 backdrop-blur rounded-full text-emerald-300 text-sm font-semibold tracking-wider">
                    PREMIUM GALLERY • 4K ULTRA HD
                  </span>
                </div>
                <h1 className="text-4xl lg:text-6xl font-black text-white mb-3">
                  Safety & <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">Activities Gallery</span>
                </h1>
                <p className="text-gray-300 text-lg">Premium documentation of safety activities, training, and emergency response</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="px-5 py-3 bg-white/10 backdrop-blur rounded-xl text-white hover:bg-white/20 transition-all">
                  {viewMode === 'grid' ? <FaBars className="text-xl" /> : <FaTh className="text-xl" />}
                </button>
                <button onClick={() => setShowFilterPanel(!showFilterPanel)} className="px-5 py-3 bg-white/10 backdrop-blur rounded-xl text-white hover:bg-white/20 transition-all">
                  <FaFilter className="text-xl" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                <FaEye className="text-white text-xl" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Views</p>
                <p className="text-2xl font-bold text-white">{totalViews.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg">
                <FaHeart className="text-white text-xl" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Likes</p>
                <p className="text-2xl font-bold text-white">{totalLikes.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <FaStar className="text-white text-xl" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Items</p>
                <p className="text-2xl font-bold text-white">{items.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                <FaGem className="text-white text-xl" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Premium Quality</p>
                <p className="text-2xl font-bold text-white">4K HDR</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-gray-300 text-sm font-semibold block mb-2">🔍 Search</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search gallery..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="text-gray-300 text-sm font-semibold block mb-2">📁 Category</label>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {categories.map(cat => <option key={cat} value={cat} className="bg-gray-800">{cat === 'all' ? 'All Categories' : cat}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-300 text-sm font-semibold block mb-2">🎬 Media Type</label>
                <div className="flex gap-3">
                  <button onClick={() => setFilter('semua')} className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${filter === 'semua' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>All</button>
                  <button onClick={() => setFilter('image')} className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${filter === 'image' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>📷 Images</button>
                  <button onClick={() => setFilter('video')} className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${filter === 'video' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>🎥 Videos</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gallery Grid / List View */}
        {currentItems.length === 0 ? (
          <div className="text-center py-20 bg-white/5 backdrop-blur rounded-3xl border border-white/10">
            <div className="text-7xl mb-4">📸</div>
            <p className="text-gray-400 text-xl">Tidak ada konten yang ditemukan.</p>
            <p className="text-gray-500 mt-2">Coba ubah filter atau kata kunci pencarian.</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 auto-rows-min gap-6' : 'space-y-4'}>
            {currentItems.map((item, idx) => {
              const sizeClass = viewMode === 'grid' ? getSizeClass(idx) : '';
              const isLiked = likedItems[item._id] || false;
              // PERUBAHAN: Langsung pakai item.path (tanpa API_BASE) karena gambar di folder public
              const imageUrl = item.path;
              
              if (viewMode === 'list') {
                return (
                  <div key={item._id} className="group bg-white/5 backdrop-blur rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-48 h-40 bg-gray-800 relative overflow-hidden">
                        {item.type === 'video' ? (
                          <video src={imageUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img src={imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found'; }} />
                        )}
                      </div>
                      <div className="flex-1 p-5">
                        <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                        <p className="text-gray-400 text-sm mb-3">{item.category}</p>
                        <p className="text-gray-300 text-sm mb-4">{item.description || 'Premium safety documentation'}</p>
                        <div className="flex gap-3">
                          <button onClick={() => setSelectedItem(item)} className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg text-sm hover:bg-emerald-500/30 transition">🔍 View</button>
                          <button onClick={() => toggleLike(item._id)} className="px-4 py-2 bg-rose-500/20 text-rose-300 rounded-lg text-sm hover:bg-rose-500/30 transition flex items-center gap-2">{isLiked ? <FaHeart /> : <FaRegHeart />} {item.likes || 0}</button>
                          <button onClick={() => handleShare(item)} className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-sm hover:bg-blue-500/30 transition"><FaShare /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              
              return (
                <div key={item._id} className={`group relative overflow-hidden rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer bg-white/5 backdrop-blur border border-white/10 hover:border-white/20 ${sizeClass}`} onClick={() => setSelectedItem(item)}>
                  {item.type === 'video' ? (
                    <div className="relative w-full h-full min-h-[250px] bg-gray-900">
                      <video src={imageUrl} className="w-full h-full object-cover" muted loop />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition">
                        <FaPlayCircle className="text-white text-6xl drop-shadow-2xl group-hover:scale-110 transition-transform" />
                      </div>
                    </div>
                  ) : (
                    <img src={imageUrl} alt={item.title} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" loading="lazy" onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Premium+Image'; }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                    <h3 className="text-white font-bold text-xl mb-1">{item.title}</h3>
                    <p className="text-gray-200 text-sm mb-2">{item.category}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-white text-xs bg-black/50 px-3 py-1 rounded-full">{item.type === 'video' ? '🎥 Video' : '📷 4K Image'}</span>
                      <div className="flex gap-3">
                        <button onClick={(e) => { e.stopPropagation(); toggleLike(item._id); }} className="text-white hover:text-red-500 transition text-xl">
                          {isLiked ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleShare(item); }} className="text-white hover:text-blue-400 transition text-xl"><FaShare /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDownload(item); }} className="text-white hover:text-emerald-400 transition text-xl"><FaDownload /></button>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur rounded-full px-3 py-1 text-xs text-white flex items-center gap-1">
                    {isLiked ? <FaHeart className="text-red-500 text-xs" /> : <FaHeart className="text-gray-400 text-xs" />}
                    <span>{item.likes || 0}</span>
                  </div>
                  {item.type === 'video' && <div className="absolute top-3 left-3 bg-black/50 backdrop-blur rounded-full px-3 py-1 text-xs text-white">🎥 VIDEO</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-8">
            <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-5 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all disabled:opacity-50"><FaArrowLeft /></button>
            <span className="text-white px-4 py-2 bg-white/10 rounded-xl">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-5 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all disabled:opacity-50"><FaArrowRight /></button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">© 2024 JSMS HSSE - Enterprise Safety Management Platform</p>
          <p className="text-gray-600 text-xs mt-2">Premium Gallery | 4K Ultra HD Content</p>
        </div>
      </div>

      {/* Premium Lightbox Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4" onClick={() => setSelectedItem(null)}>
          <div className="relative max-w-6xl w-full max-h-[90vh] bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-white/20" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedItem(null)} className="absolute top-5 right-5 z-20 bg-black/50 hover:bg-black text-white p-3 rounded-full transition-all hover:scale-110">
              <FaTimes size={24} />
            </button>
            <div className="absolute top-5 left-5 z-20 bg-black/50 backdrop-blur rounded-full px-4 py-2 text-white text-sm font-semibold flex items-center gap-2">
              {selectedItem.type === 'video' ? '🎥 PREMIUM VIDEO' : '📷 4K ULTRA HD'}
            </div>
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-gray-800 to-gray-900">
              <h2 className="text-3xl font-bold text-white">{selectedItem.title}</h2>
              <div className="flex gap-2 mt-2">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs">{selectedItem.category}</span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs flex items-center gap-1"><FaEye /> {selectedItem.likes * 5 + 100} views</span>
              </div>
            </div>
            <div className="p-6 flex justify-center items-center max-h-[55vh] overflow-auto bg-black/30">
              {selectedItem.type === 'video' ? (
                <video src={selectedItem.path} controls autoPlay className="max-w-full max-h-[50vh] rounded-xl shadow-2xl">
                  Browser tidak mendukung video.
                </video>
              ) : (
                <img src={selectedItem.path} alt={selectedItem.title} className="max-w-full max-h-[50vh] object-contain rounded-xl shadow-2xl" onError={(e) => { e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found'; }} />
              )}
            </div>
            <div className="p-6 border-t border-white/10 flex justify-between items-center bg-gradient-to-r from-gray-800 to-gray-900">
              <div className="flex gap-3">
                <button onClick={() => toggleLike(selectedItem._id)} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${likedItems[selectedItem._id] ? 'bg-rose-500 text-white shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                  {likedItems[selectedItem._id] ? <FaHeart /> : <FaRegHeart />}
                  {likedItems[selectedItem._id] ? `Liked (${selectedItem.likes || 0})` : `Like (${selectedItem.likes || 0})`}
                </button>
                <button onClick={() => handleShare(selectedItem)} className="flex items-center gap-2 px-6 py-3 bg-blue-500/20 text-blue-300 rounded-xl font-semibold hover:bg-blue-500/30 transition"><FaShare /> Share</button>
                <button onClick={() => handleDownload(selectedItem)} className="flex items-center gap-2 px-6 py-3 bg-emerald-500/20 text-emerald-300 rounded-xl font-semibold hover:bg-emerald-500/30 transition"><FaDownload /> Download</button>
              </div>
              <button onClick={() => setSelectedItem(null)} className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-emerald-700 transition shadow-lg">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Galeri;