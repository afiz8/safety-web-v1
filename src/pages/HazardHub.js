import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../App';
import { 
  FaSearch, FaFilter, FaSortAmountDown, FaSortAmountUp, 
  FaPlus, FaEdit, FaTrash, FaTimes, FaExclamationTriangle,
  FaCheckCircle, FaClock, FaSave, FaRedoAlt, FaSync,
  FaShieldAlt, FaChartLine, FaBell, FaEye
} from 'react-icons/fa';
import ShareButton from '../components/ShareButton';

const HazardHub = () => {
  const { session } = useContext(UserContext);
  
  const [hazards, setHazards] = useState([]);
  const [filteredHazards, setFilteredHazards] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Keselamatan',
    location: '',
    department: '',
    riskLevel: 'Medium',
    status: 'Open',
    description: '',
    mitigation: '',
    reportedDate: new Date().toISOString().split('T')[0],
    reportedBy: session?.userId || '',
    imageUrl: ''
  });
  
  const categories = ['Keselamatan', 'Kesehatan', 'Lingkungan', 'Kebakaran', 'Alat Berat', 'Listrik', 'Kimia'];
  const riskLevels = ['Low', 'Medium', 'High', 'Critical'];
  const statusOptions = ['Open', 'In Progress', 'Mitigated', 'Closed'];
  const departments = ['Produksi', 'Maintenance', 'Logistik', 'Teknik', 'Administrasi', 'Semua Site'];
  
  useEffect(() => {
    const stored = localStorage.getItem('jsms_hazard_register');
    if (stored) {
      setHazards(JSON.parse(stored));
    } else {
      const sampleHazards = [
        { id: 1, name: 'Kebocoran Pipa Gas', category: 'Kimia', location: 'Area Produksi', department: 'Produksi', riskLevel: 'High', status: 'In Progress', description: 'Terdeteksi kebocoran kecil pada pipa gas utama', mitigation: 'Segera perbaiki dan pasang sensor kebocoran', reportedDate: '2025-03-20', reportedBy: 'Admin', imageUrl: '' },
        { id: 2, name: 'APD Tidak Lengkap', category: 'Keselamatan', location: 'Gudang Bahan', department: 'Logistik', riskLevel: 'Medium', status: 'Open', description: 'Beberapa pekerja tidak menggunakan helm dan sepatu safety', mitigation: 'Sosialisasi ulang dan tilang ringan', reportedDate: '2025-04-05', reportedBy: 'Admin', imageUrl: '' },
        { id: 3, name: 'Kebisingan Mesin', category: 'Kesehatan', location: 'Ruang Produksi', department: 'Maintenance', riskLevel: 'Medium', status: 'Mitigated', description: 'Mesin tua menimbulkan kebisingan diatas ambang batas', mitigation: 'Pemasangan peredam suara dan jadwal perawatan rutin', reportedDate: '2025-03-28', reportedBy: 'Admin', imageUrl: '' }
      ];
      setHazards(sampleHazards);
      localStorage.setItem('jsms_hazard_register', JSON.stringify(sampleHazards));
    }
  }, []);
  
  useEffect(() => {
    if (hazards.length > 0) localStorage.setItem('jsms_hazard_register', JSON.stringify(hazards));
    applyFiltersAndSort();
  }, [hazards, filterCategory, filterRisk, filterStatus, searchTerm, sortBy, sortOrder]);
  
  const applyFiltersAndSort = () => {
    let filtered = [...hazards];
    if (filterCategory !== 'all') filtered = filtered.filter(h => h.category === filterCategory);
    if (filterRisk !== 'all') filtered = filtered.filter(h => h.riskLevel === filterRisk);
    if (filterStatus !== 'all') filtered = filtered.filter(h => h.status === filterStatus);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(h => h.name.toLowerCase().includes(term) || h.location.toLowerCase().includes(term) || h.description.toLowerCase().includes(term));
    }
    filtered.sort((a, b) => {
      let valA, valB;
      switch(sortBy) {
        case 'name': valA = a.name; valB = b.name; break;
        case 'risk': const riskOrder = { Low: 1, Medium: 2, High: 3, Critical: 4 }; valA = riskOrder[a.riskLevel]; valB = riskOrder[b.riskLevel]; break;
        case 'date': valA = new Date(a.reportedDate); valB = new Date(b.reportedDate); break;
        default: valA = a.name; valB = b.name;
      }
      return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
    setFilteredHazards(filtered);
  };
  
  const handleInputChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  const resetForm = () => { setFormData({ name: '', category: 'Keselamatan', location: '', department: '', riskLevel: 'Medium', status: 'Open', description: '', mitigation: '', reportedDate: new Date().toISOString().split('T')[0], reportedBy: session?.userId || '', imageUrl: '' }); setEditingId(null); };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.location) { alert('Nama bahaya dan lokasi wajib diisi!'); return; }
    if (editingId) setHazards(hazards.map(h => h.id === editingId ? { ...formData, id: editingId } : h));
    else setHazards([{ ...formData, id: Date.now(), reportedDate: new Date().toISOString().split('T')[0], reportedBy: session?.userId || 'Admin' }, ...hazards]);
    resetForm(); setShowForm(false);
  };
  
  const handleEdit = (hazard) => { setFormData(hazard); setEditingId(hazard.id); setShowForm(true); };
  const handleDelete = (id) => { if (window.confirm('Apakah Anda yakin ingin menghapus data bahaya ini?')) setHazards(hazards.filter(h => h.id !== id)); };
  const toggleSortOrder = () => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  const resetFilters = () => { setFilterCategory('all'); setFilterRisk('all'); setFilterStatus('all'); setSearchTerm(''); setSortBy('date'); setSortOrder('desc'); };
  
  const getRiskBadgeClass = (risk) => ({ Low: 'bg-green-100 text-green-800', Medium: 'bg-yellow-100 text-yellow-800', High: 'bg-orange-100 text-orange-800', Critical: 'bg-red-100 text-red-800' }[risk] || 'bg-gray-100 text-gray-800');
  const getStatusBadgeClass = (status) => ({ Open: 'bg-red-100 text-red-800', 'In Progress': 'bg-blue-100 text-blue-800', Mitigated: 'bg-yellow-100 text-yellow-800', Closed: 'bg-green-100 text-green-800' }[status] || 'bg-gray-100 text-gray-800');
  const getRiskIcon = (risk) => ({ Low: <FaCheckCircle className="text-green-500" />, Medium: <FaClock className="text-yellow-500" />, High: <FaExclamationTriangle className="text-orange-500" />, Critical: <FaExclamationTriangle className="text-red-500" /> }[risk] || <FaExclamationTriangle className="text-gray-500" />);
  
  const shareMessage = `Hazard Hub JSMS\nTotal bahaya: ${hazards.length}\nOpen: ${hazards.filter(h => h.status === 'Open').length}\nHigh Risk: ${hazards.filter(h => h.riskLevel === 'High' || h.riskLevel === 'Critical').length}`;
  const totalOpen = hazards.filter(h => h.status === 'Open').length;
  const totalHighRisk = hazards.filter(h => h.riskLevel === 'High' || h.riskLevel === 'Critical').length;
  const totalMitigated = hazards.filter(h => h.status === 'Mitigated' || h.status === 'Closed').length;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        
        {/* Header Premium */}
        <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-2xl border border-white/50 dark:border-gray-700">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-yellow-500/10 to-red-500/20"></div>
          <div className="relative p-6 lg:p-8">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FaShieldAlt className="text-orange-500 text-2xl" />
                  <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-semibold">SAFETY FIRST</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">⚠️ Hazard Hub</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Kelola dan pantau semua potensi bahaya di lingkungan kerja</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { const stored = localStorage.getItem('jsms_hazard_register'); if(stored) setHazards(JSON.parse(stored)); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl transition flex items-center gap-2"><FaSync /> Refresh</button>
                <ShareButton title="Hazard Hub JSMS" text={shareMessage} buttonText="Bagikan Data" />
                <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-5 py-2 rounded-xl flex items-center gap-2 shadow-lg transition"><FaPlus /> Tambah Bahaya</button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Cards Premium */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-5 border-l-4 border-blue-500">
            <div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Total Bahaya</p><p className="text-3xl font-bold text-gray-800 dark:text-white">{hazards.length}</p></div><div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition"><FaExclamationTriangle className="text-blue-600 text-xl" /></div></div>
          </div>
          <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-5 border-l-4 border-red-500">
            <div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Open</p><p className="text-3xl font-bold text-gray-800 dark:text-white">{totalOpen}</p></div><div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition"><FaEye className="text-red-600 text-xl" /></div></div>
          </div>
          <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-5 border-l-4 border-orange-500">
            <div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">High Risk</p><p className="text-3xl font-bold text-gray-800 dark:text-white">{totalHighRisk}</p></div><div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition"><FaChartLine className="text-orange-600 text-xl" /></div></div>
          </div>
          <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-5 border-l-4 border-green-500">
            <div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Mitigated</p><p className="text-3xl font-bold text-gray-800 dark:text-white">{totalMitigated}</p></div><div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition"><FaCheckCircle className="text-green-600 text-xl" /></div></div>
          </div>
        </div>
        
        {/* Filter & Sort Section Premium */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div className="relative flex-1 max-w-md"><FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Cari bahaya..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent dark:bg-gray-700 dark:text-white transition" /></div>
              <div className="flex gap-2">
                <button onClick={() => setShowFilters(!showFilters)} className="px-5 py-3 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition"><FaFilter /> Filter</button>
                <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2"><select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent focus:outline-none dark:text-white"><option value="date">Tanggal</option><option value="name">Nama</option><option value="risk">Tingkat Risiko</option></select><button onClick={toggleSortOrder} className="p-1">{sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}</button></div>
                <button onClick={resetFilters} className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition"><FaRedoAlt /></button>
              </div>
            </div>
          </div>
          {showFilters && (
            <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kategori</label><select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"><option value="all">Semua Kategori</option>{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tingkat Risiko</label><select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"><option value="all">Semua Risiko</option>{riskLevels.map(risk => <option key={risk} value={risk}>{risk}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label><select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"><option value="all">Semua Status</option>{statusOptions.map(status => <option key={status} value={status}>{status}</option>)}</select></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Hazard Cards Grid Premium */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHazards.map(hazard => (
            <div key={hazard.id} className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden border border-gray-100 dark:border-gray-700">
              <div className="relative h-2 bg-gradient-to-r from-orange-400 to-red-500"></div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 flex-wrap">{getRiskIcon(hazard.riskLevel)}{hazard.name}</h3>
                  <div className="flex gap-1 opacity-70 group-hover:opacity-100 transition">
                    <button onClick={() => handleEdit(hazard)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition"><FaEdit /></button>
                    <button onClick={() => handleDelete(hazard.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition"><FaTrash /></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadgeClass(hazard.riskLevel)}`}>{hazard.riskLevel}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(hazard.status)}`}>{hazard.status}</span>
                  <span className="px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{hazard.category}</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p className="flex items-start gap-2"><span className="font-medium text-gray-700 dark:text-gray-300">📍</span> {hazard.location}</p>
                  <p className="flex items-start gap-2"><span className="font-medium text-gray-700 dark:text-gray-300">🏢</span> {hazard.department}</p>
                  <p className="flex items-start gap-2"><span className="font-medium text-gray-700 dark:text-gray-300">📝</span> {hazard.description?.substring(0, 70)}...</p>
                  <p className="flex items-start gap-2"><span className="font-medium text-gray-700 dark:text-gray-300">🛠️</span> {hazard.mitigation?.substring(0, 50)}...</p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <div className="flex items-center gap-2"><FaBell className="text-gray-400 text-xs" /><span className="text-xs text-gray-500">Dilaporkan: {hazard.reportedDate}</span></div>
                  <span className="text-xs text-gray-400">oleh {hazard.reportedBy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredHazards.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4"><FaExclamationTriangle className="text-4xl text-gray-400" /></div>
            <p className="text-gray-500 text-lg">Tidak ada data bahaya yang ditemukan.</p>
            <button onClick={() => { resetForm(); setShowForm(true); }} className="mt-4 text-orange-600 hover:text-orange-700 font-semibold inline-flex items-center gap-1">Tambah bahaya baru →</button>
          </div>
        )}
        
        {/* Modal Form Premium */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-gray-800 p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div><h2 className="text-2xl font-bold text-gray-800 dark:text-white">{editingId ? 'Edit Bahaya' : 'Tambah Bahaya Baru'}</h2><p className="text-sm text-gray-500 mt-1">Lengkapi data potensi bahaya di lingkungan kerja</p></div>
                <button onClick={() => { setShowForm(false); resetForm(); }} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition"><FaTimes /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nama Bahaya <span className="text-red-500">*</span></label><input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent dark:bg-gray-700 dark:text-white" required /></div>
                  <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Kategori</label><select name="category" value={formData.category} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white">{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                  <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Lokasi <span className="text-red-500">*</span></label><input type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-400 dark:bg-gray-700 dark:text-white" required /></div>
                  <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Departemen</label><select name="department" value={formData.department} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white">{departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}</select></div>
                  <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tingkat Risiko</label><select name="riskLevel" value={formData.riskLevel} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white">{riskLevels.map(risk => <option key={risk} value={risk}>{risk}</option>)}</select></div>
                  <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Status</label><select name="status" value={formData.status} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white">{statusOptions.map(status => <option key={status} value={status}>{status}</option>)}</select></div>
                  <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Deskripsi</label><textarea name="description" value={formData.description} rows={3} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-400 dark:bg-gray-700 dark:text-white" placeholder="Jelaskan potensi bahaya secara detail..."></textarea></div>
                  <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mitigasi / Tindakan</label><textarea name="mitigation" value={formData.mitigation} rows={2} onChange={handleInputChange} className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-400 dark:bg-gray-700 dark:text-white" placeholder="Rencana tindakan untuk mengatasi bahaya..."></textarea></div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition">Batal</button>
                  <button type="submit" className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition"><FaSave /> {editingId ? 'Update' : 'Simpan'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HazardHub;