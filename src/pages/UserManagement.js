import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUsers, FaUserPlus, FaEdit, FaTrash, FaSearch, FaFilter,
  FaChartLine, FaUserCheck, FaUserClock, FaUserSlash, FaShieldAlt,
  FaRobot, FaCrown, FaUserTie, FaHardHat, FaFlask, FaBuilding,
  FaEye, FaHistory, FaSync, FaCheckCircle, FaTimesCircle,
  FaSpinner, FaDownload, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';

const ROLES = {
  ADMIN: 'Admin',
  SUPERVISOR: 'Supervisor',
  KARYAWAN: 'Karyawan',
  MANAGER: 'Manager',
  HSE_OFFICER: 'HSE Officer'
};

const UserManagement = ({ darkMode }) => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [formData, setFormData] = useState({
    name: '', username: '', email: '', password: '', 
    role: ROLES.KARYAWAN, department: '', position: '', phoneNumber: ''
  });
  
  const API_BASE = 'http://localhost:5000';
  const token = localStorage.getItem('token');
  
  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/users?page=${pagination.page}&limit=10&search=${search}&role=${roleFilter}&status=${statusFilter}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setPagination(prev => ({ ...prev, total: data.pagination.total, totalPages: data.pagination.totalPages }));
      }
    } catch (err) {
      console.error('Gagal fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, roleFilter, statusFilter, token]);
  
  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Gagal fetch stats:', err);
    }
  };
  
  // Fetch activity logs
  const fetchActivityLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user-activity-logs?limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data.logs);
      }
    } catch (err) {
      console.error('Gagal fetch logs:', err);
    }
  };
  
  // Get AI role suggestion
  const getAISuggestion = async () => {
    setShowAISuggestion(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/role-suggestion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          department: formData.department,
          position: formData.position,
          skills: []
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiSuggestion(data);
        if (!editingUser && !formData.role) {
          setFormData(prev => ({ ...prev, role: data.suggestion }));
        }
      }
    } catch (err) {
      console.error('Gagal get AI suggestion:', err);
    }
  };
  
  // Submit user
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingUser 
        ? `${API_BASE}/api/users/${editingUser.id}`
        : `${API_BASE}/api/users`;
      const method = editingUser ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        await fetchUsers();
        await fetchStats();
        await fetchActivityLogs();
        setShowForm(false);
        setEditingUser(null);
        setFormData({ name: '', username: '', email: '', password: '', role: ROLES.KARYAWAN, department: '', position: '', phoneNumber: '' });
      } else {
        const error = await res.json();
        alert(error.error || 'Gagal menyimpan user');
      }
    } catch (err) {
      console.error('Gagal submit:', err);
    }
  };
  
  // Delete user
  const handleDelete = async (user) => {
    if (!window.confirm(`Hapus user ${user.name}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchUsers();
        await fetchStats();
        await fetchActivityLogs();
      }
    } catch (err) {
      console.error('Gagal delete:', err);
    }
  };
  
  // Edit user
  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      email: user.email || '',
      password: '',
      role: user.role,
      department: user.department || '',
      position: user.position || '',
      phoneNumber: user.phoneNumber || ''
    });
    setShowForm(true);
  };
  
  useEffect(() => {
    fetchUsers();
    fetchStats();
    fetchActivityLogs();
  }, [fetchUsers]);
  
  const getRoleColor = (role) => {
    const colors = {
      [ROLES.ADMIN]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      [ROLES.MANAGER]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      [ROLES.SUPERVISOR]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      [ROLES.HSE_OFFICER]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      [ROLES.KARYAWAN]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[role] || colors[ROLES.KARYAWAN];
  };
  
  const getRoleIcon = (role) => {
    const icons = {
      [ROLES.ADMIN]: <FaCrown className="text-purple-500" />,
      [ROLES.MANAGER]: <FaUserTie className="text-blue-500" />,
      [ROLES.SUPERVISOR]: <FaShieldAlt className="text-orange-500" />,
      [ROLES.HSE_OFFICER]: <FaFlask className="text-green-500" />,
      [ROLES.KARYAWAN]: <FaHardHat className="text-gray-500" />
    };
    return icons[role] || icons[ROLES.KARYAWAN];
  };
  
  const getActionIcon = (action) => {
    const icons = {
      login: <FaUserCheck className="text-green-500" />,
      logout: <FaUserClock className="text-yellow-500" />,
      create: <FaUserPlus className="text-blue-500" />,
      update: <FaEdit className="text-orange-500" />,
      delete: <FaTrash className="text-red-500" />
    };
    return icons[action] || <FaEye className="text-gray-500" />;
  };
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900' : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30'
    }`}>
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className={`text-4xl lg:text-5xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent`}>
              👥 User Management
            </h1>
            <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Kelola pengguna, hak akses, dan aktivitas sistem
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowActivityLog(!showActivityLog); fetchActivityLogs(); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${
                showActivityLog 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border dark:border-gray-700'
              }`}
            >
              <FaHistory /> Activity Log
            </button>
            <button
              onClick={() => { setEditingUser(null); setFormData({ name: '', username: '', email: '', password: '', role: ROLES.KARYAWAN, department: '', position: '', phoneNumber: '' }); setShowForm(true); }}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2 rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2"
            >
              <FaUserPlus /> Tambah User
            </button>
          </div>
        </div>
        
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
              <div className="flex items-center gap-2 mb-1">
                <FaUsers className="text-blue-500" />
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.totalUsers}</p>
              </div>
              <p className="text-xs text-gray-500">Total Users</p>
            </div>
            <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
              <div className="flex items-center gap-2 mb-1">
                <FaUserCheck className="text-green-500" />
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.activeUsers}</p>
              </div>
              <p className="text-xs text-gray-500">Active</p>
            </div>
            <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
              <div className="flex items-center gap-2 mb-1">
                <FaUserClock className="text-yellow-500" />
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.todayActive || 0}</p>
              </div>
              <p className="text-xs text-gray-500">Active Today</p>
            </div>
            <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
              <div className="flex items-center gap-2 mb-1">
                <FaUserSlash className="text-red-500" />
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.inactiveUsers + stats.suspendedUsers}</p>
              </div>
              <p className="text-xs text-gray-500">Inactive</p>
            </div>
            <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
              <div className="flex items-center gap-2 mb-1">
                <FaShieldAlt className="text-purple-500" />
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.roleStats?.Admin || 0}</p>
              </div>
              <p className="text-xs text-gray-500">Admins</p>
            </div>
            <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
              <div className="flex items-center gap-2 mb-1">
                <FaChartLine className="text-indigo-500" />
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.roleStats?.['HSE Officer'] || 0}</p>
              </div>
              <p className="text-xs text-gray-500">HSE Officers</p>
            </div>
          </div>
        )}
        
        {/* Search & Filter */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`} />
            <input
              type="text"
              placeholder="Cari user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-300 outline-none transition ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={`px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}
          >
            <option value="all">Semua Role</option>
            {Object.values(ROLES).map(role => <option key={role} value={role}>{role}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}
          >
            <option value="all">Semua Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>
          <button
            onClick={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); setPagination(prev => ({ ...prev, page: 1 })); }}
            className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition"
          >
            Reset
          </button>
        </div>
        
        {/* Users Table */}
        <div className={`rounded-2xl shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
                <tr>
                  <th className="p-4 text-left">User</th>
                  <th className="p-4 text-left">Username</th>
                  <th className="p-4 text-left">Role</th>
                  <th className="p-4 text-left">Department</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Last Login</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12">
                      <FaSpinner className="animate-spin mx-auto text-2xl text-blue-500" />
                    </td>
                  </tr>
                ) : users.map(user => (
                  <tr key={user.id} className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} hover:bg-gray-50 dark:hover:bg-gray-700/50`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs">{user.username}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">{user.department || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.status === 'Active' ? 'bg-green-100 text-green-700' :
                        user.status === 'Inactive' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => handleEdit(user)} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDelete(user)} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t dark:border-gray-700">
              <p className="text-sm text-gray-500">Total {pagination.total} users</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="p-2 border rounded-lg disabled:opacity-50"
                >
                  <FaChevronLeft />
                </button>
                <span className="px-4 py-2 bg-blue-500 text-white rounded-lg">{pagination.page}</span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 border rounded-lg disabled:opacity-50"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Activity Log Panel */}
        <AnimatePresence>
          {showActivityLog && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`rounded-2xl shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur overflow-hidden`}
            >
              <div className="p-4 border-b dark:border-gray-700">
                <h3 className="font-bold flex items-center gap-2">
                  <FaHistory /> Recent Activity Logs
                </h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {activityLogs.map(log => (
                  <div key={log._id} className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex items-start gap-3`}>
                    {getActionIcon(log.action)}
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">{log.userName || log.userId}</span>
                        {' '}{log.action} {log.module}
                      </p>
                      {log.description && <p className="text-xs text-gray-500 mt-1">{log.description}</p>}
                    </div>
                    <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* User Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {editingUser ? 'Edit User' : 'Tambah User Baru'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <FaTimesCircle />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Nama Lengkap *"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  required
                />
                <input
                  type="text"
                  placeholder="Username *"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
                <input
                  type="password"
                  placeholder={editingUser ? "Password (kosongkan jika tidak diubah)" : "Password *"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  required={!editingUser}
                />
                
                <div className="flex gap-2">
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  >
                    {Object.values(ROLES).map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={getAISuggestion}
                    className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition flex items-center gap-2"
                  >
                    <FaRobot /> AI Suggest
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Department"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                  <input
                    type="text"
                    placeholder="Position"
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
                
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
                
                {/* AI Suggestion Panel */}
                {showAISuggestion && aiSuggestion && (
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FaRobot className="text-purple-600" />
                      <span className="font-semibold text-purple-800 dark:text-purple-300">AI Role Suggestion</span>
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Rekomendasi role: <strong>{aiSuggestion.suggestion}</strong>
                    </p>
                    {aiSuggestion.reasons?.map((reason, i) => (
                      <p key={i} className="text-xs text-purple-600 dark:text-purple-400 mt-1">• {reason}</p>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, role: aiSuggestion.suggestion})}
                      className="mt-2 text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600"
                    >
                      Gunakan Suggestion
                    </button>
                  </div>
                )}
                
                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition"
                >
                  {editingUser ? 'Update User' : 'Tambah User'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;