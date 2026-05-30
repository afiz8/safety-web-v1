import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../App';

const AuditLogs = () => {
  const { session } = useContext(UserContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  // Fetch audit logs dari backend
  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/audit-logs?limit=500`;
      if (filter !== 'all') url += `&type=${filter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        setTotalCount(data.length);
      } else {
        console.error('Gagal fetch audit logs');
      }
    } catch (err) {
      console.error('Error fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session.role === 'Admin') {
      fetchAuditLogs();
    }
  }, [filter, search, session.role]);

  // Fungsi untuk menambah audit log (dapat dipanggil dari komponen lain)
  const addAuditLog = async (logData) => {
    try {
      const res = await fetch(`${API_BASE}/api/audit-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });
      if (res.ok) {
        // Refresh logs jika perlu
        fetchAuditLogs();
      }
    } catch (err) {
      console.error('Gagal simpan audit log:', err);
    }
  };

  const exportAudit = () => {
    const csv = 'Timestamp,User,Role,Module,Action,Description\n' + 
      logs.map(log => 
        `"${new Date(log.timestamp).toLocaleString()}","${log.user}","${log.role}","${log.module}","${log.type}","${log.description.replace(/"/g, '""')}"`
      ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jsms-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Hanya Admin yang bisa melihat audit logs
  if (session.role !== 'Admin') {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-red-600">Akses Ditolak</h1>
        <p className="text-gray-600 mt-2">Halaman ini hanya dapat diakses oleh Admin.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            📋 Audit Logs & Compliance Trail
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Complete activity tracking for regulatory compliance ({totalCount} records shown)
          </p>
        </div>
        <button
          onClick={exportAudit}
          disabled={logs.length === 0}
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-3 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50"
        >
          📊 Export CSV
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 items-center mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl">
          <div className="flex gap-2">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="approval">Approval</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Search logs (user, module, description)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => { setFilter('all'); setSearch(''); }}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-xl hover:bg-gray-300 transition"
          >
            Reset
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Memuat audit logs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b-2 border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="p-4 text-left font-bold text-gray-900 dark:text-white">Timestamp</th>
                  <th className="p-4 text-left font-bold text-gray-900 dark:text-white">User</th>
                  <th className="p-4 text-left font-bold text-gray-900 dark:text-white">Module</th>
                  <th className="p-4 text-left font-bold text-gray-900 dark:text-white">Action</th>
                  <th className="p-4 text-left font-bold text-gray-900 dark:text-white">Description</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={log._id || idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="p-4 font-mono text-sm text-gray-600 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 font-semibold">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        log.role === 'Admin' ? 'bg-orange-100 text-orange-800' :
                        log.role === 'Supervisor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {log.user}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-gray-900 dark:text-white">{log.module}</td>
                    <td>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        log.type === 'create' ? 'bg-green-100 text-green-800' :
                        log.type === 'update' ? 'bg-blue-100 text-blue-800' :
                        log.type === 'delete' ? 'bg-red-100 text-red-800' :
                        log.type === 'login' ? 'bg-purple-100 text-purple-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {log.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-gray-700 dark:text-gray-300 max-w-md truncate" title={log.description}>
                      {log.description}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="text-4xl mb-4">📊</div>
                      No audit logs match your filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Showing {logs.length} logs (recent 500 shown)
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;