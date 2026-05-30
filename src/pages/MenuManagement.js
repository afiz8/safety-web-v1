import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, FaEdit, FaTrash, FaSearch, FaStar, FaRegStar, 
  FaMoon, FaSun, FaBell, FaChartBar, FaHome, FaUser,
  FaHardHat, FaClipboardList, FaBuilding, FaShieldAlt,
  FaCog, FaEye, FaEyeSlash, FaFilter, FaTimes, FaCheckCircle
} from 'react-icons/fa';
import { UserContext } from '../App';

const MenuManagement = () => {
  const { session, darkMode, toggleDarkMode, notifications } = useContext(UserContext);
  const [menus, setMenus] = useState([]);
  const [filteredMenus, setFilteredMenus] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'FaChartBar',
    path: '',
    roles: [],
    order: 0,
    isActive: true,
    isFavorite: false,
    category: 'Umum',
    description: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const API_BASE = 'http://localhost:5000';

  const iconOptions = [
    { name: 'FaChartBar', icon: <FaChartBar /> },
    { name: 'FaHome', icon: <FaHome /> },
    { name: 'FaUser', icon: <FaUser /> },
    { name: 'FaHardHat', icon: <FaHardHat /> },
    { name: 'FaClipboardList', icon: <FaClipboardList /> },
    { name: 'FaBuilding', icon: <FaBuilding /> },
    { name: 'FaShieldAlt', icon: <FaShieldAlt /> },
    { name: 'FaCog', icon: <FaCog /> },
    { name: 'FaBell', icon: <FaBell /> }
  ];

  const categoryOptions = ['Umum', 'Dashboard', 'HSSE', 'Transaksi', 'Laporan', 'Pengaturan'];
  const roleOptions = ['Admin', 'Supervisor', 'Karyawan'];

  const fetchMenus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/navigasi-menu`);
      const data = await res.json();
      setMenus(data);
      setFilteredMenus(data);
    } catch (err) {
      console.error('Gagal fetch menu navigasi:', err);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  useEffect(() => {
    let filtered = menus;
    
    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.path?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(m => m.category === categoryFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(m => statusFilter === 'active' ? m.isActive : !m.isActive);
    }
    
    if (showFavoritesOnly) {
      filtered = filtered.filter(m => m.isFavorite);
    }
    
    filtered.sort((a, b) => (a.order || 0) - (b.order || 0));
    setFilteredMenus(filtered);
  }, [menus, searchTerm, categoryFilter, statusFilter, showFavoritesOnly]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_BASE}/api/navigasi-menu/${editingId}` : `${API_BASE}/api/navigasi-menu`;
    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      setFormData({ name: '', icon: 'FaChartBar', path: '', roles: [], order: 0, isActive: true, isFavorite: false, category: 'Umum', description: '' });
      setEditingId(null);
      setShowForm(false);
      fetchMenus();
    } catch (err) {
      console.error('Error simpan:', err);
    }
  };

  const handleEdit = (menu) => {
    setEditingId(menu._id);
    setFormData({
      name: menu.name,
      icon: menu.icon,
      path: menu.path,
      roles: menu.roles || [],
      order: menu.order || 0,
      isActive: menu.isActive,
      isFavorite: menu.isFavorite || false,
      category: menu.category || 'Umum',
      description: menu.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus menu ini?')) {
      await fetch(`${API_BASE}/api/navigasi-menu/${id}`, { method: 'DELETE' });
      fetchMenus();
    }
  };

  const toggleFavorite = async (menu) => {
    try {
      await fetch(`${API_BASE}/api/navigasi-menu/${menu._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...menu, isFavorite: !menu.isFavorite })
      });
      fetchMenus();
    } catch (err) {
      console.error('Error toggle favorite:', err);
    }
  };

  const toggleActive = async (menu) => {
    try {
      await fetch(`${API_BASE}/api/navigasi-menu/${menu._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...menu, isActive: !menu.isActive })
      });
      fetchMenus();
    } catch (err) {
      console.error('Error toggle active:', err);
    }
  };

  const handleRoleChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({ ...formData, roles: selectedOptions });
  };

  const getIconComponent = (iconName) => {
    const found = iconOptions.find(i => i.name === iconName);
    return found ? found.icon : <FaChartBar />;
  };

  const canEdit = session?.role === 'Admin';
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const stats = {
    total: menus.length,
    active: menus.filter(m => m.isActive).length,
    inactive: menus.filter(m => !m.isActive).length,
    favorites: menus.filter(m => m.isFavorite).length
  };

  return (
    <div className={`min-h-screen py-6 px-4 transition-colors duration-300 ${
      darkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-orange-50/20'
    }`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent'}`}>
              Manajemen Menu Navigasi
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Kelola menu navigasi sistem
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleDarkMode} className={`p-2 rounded-full transition relative ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
              {darkMode ? <FaSun /> : <FaMoon />}
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
            </button>
            {canEdit && (
              <button onClick={() => { setEditingId(null); setFormData({ name: '', icon: 'FaChartBar', path: '', roles: [], order: 0, isActive: true, isFavorite: false, category: 'Umum', description: '' }); setShowForm(true); }} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2 rounded-full shadow-md hover:shadow-lg transition flex items-center gap-2">
                <FaPlus /> Tambah Menu
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <FaChartBar className="text-orange-500 text-2xl mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.total}</p>
            <p className="text-xs text-gray-500">Total Menu</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <FaCheckCircle className="text-green-500 text-2xl mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.active}</p>
            <p className="text-xs text-gray-500">Aktif</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <FaEyeSlash className="text-red-500 text-2xl mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.inactive}</p>
            <p className="text-xs text-gray-500">Nonaktif</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <FaStar className="text-yellow-500 text-2xl mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.favorites}</p>
            <p className="text-xs text-gray-500">Favorit</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`} />
            <input type="text" placeholder="Cari menu (nama, path, kategori)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-300 outline-none transition ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`} />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={`px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
            <option value="all">Semua Kategori</option>
            {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
          <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${showFavoritesOnly ? 'bg-yellow-500 text-white' : (darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200')}`}>
            <FaStar /> Favorit
          </button>
        </div>

        {/* Menu Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMenus.map((menu, idx) => (
            <motion.div
              key={menu._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
              className={`rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden ${darkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white/80 backdrop-blur border border-white/40'}`}
            >
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${menu.isActive ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-gray-500'} text-white text-xl`}>
                      {getIconComponent(menu.icon)}
                    </div>
                    <div>
                      <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{menu.name}</h3>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{menu.path}</p>
                    </div>
                  </div>
                  <button onClick={() => toggleFavorite(menu)} className="text-yellow-500 hover:scale-110 transition">
                    {menu.isFavorite ? <FaStar /> : <FaRegStar />}
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${menu.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {menu.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">{menu.category}</span>
                    {menu.roles?.map(r => <span key={r} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">{r}</span>)}
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Order: {menu.order}
                  </p>
                  {menu.description && <p className="text-xs text-gray-400">{menu.description}</p>}
                </div>
                {canEdit && (
                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={() => handleEdit(menu)} className="flex-1 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition">Edit</button>
                    <button onClick={() => toggleActive(menu)} className="flex-1 py-1.5 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 transition">{menu.isActive ? 'Nonaktifkan' : 'Aktifkan'}</button>
                    <button onClick={() => handleDelete(menu._id)} className="flex-1 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition">Hapus</button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {filteredMenus.length === 0 && (
            <div className={`col-span-full text-center py-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Tidak ada menu yang ditemukan.
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className={`rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{editingId ? 'Edit Menu' : 'Tambah Menu Baru'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input type="text" placeholder="Nama Menu *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} required />
                <select value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  {iconOptions.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
                </select>
                <input type="text" placeholder="Path (contoh: /dashboard)" value={formData.path} onChange={e => setFormData({...formData, path: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} required />
                <select multiple value={formData.roles} onChange={handleRoleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none h-28 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  {roleOptions.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
                <input type="number" placeholder="Order (urutan tampil)" value={formData.order} onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <textarea placeholder="Deskripsi (opsional)" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} rows="2" />
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4" />
                  <span>Aktif (ditampilkan di sidebar)</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={formData.isFavorite} onChange={e => setFormData({...formData, isFavorite: e.target.checked})} className="w-4 h-4" />
                  <span>Favorit (pin ke atas)</span>
                </label>
                <button type="submit" className="w-full py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition">
                  {editingId ? 'Update Menu' : 'Simpan Menu'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuManagement;