import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../App';

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { setCurrentPage } = useContext(UserContext);

  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        // Fetch semua data dari berbagai endpoint
        // Untuk efisiensi, backend sebaiknya mendukung parameter search, tapi di sini kita fetch semua lalu filter di frontend
        const [usersRes, apdRes, kontraktorRes, itemsRes, assessmentsRes] = await Promise.all([
          fetch(`${API_BASE}/api/users`),
          fetch(`${API_BASE}/api/apd`),
          fetch(`${API_BASE}/api/kontraktor`),
          fetch(`${API_BASE}/api/items`),
          fetch(`${API_BASE}/api/assessments`)
        ]);

        const users = usersRes.ok ? await usersRes.json() : [];
        const apd = apdRes.ok ? await apdRes.json() : [];
        const kontraktor = kontraktorRes.ok ? await kontraktorRes.json() : [];
        const items = itemsRes.ok ? await itemsRes.json() : [];
        const assessments = assessmentsRes.ok ? await assessmentsRes.json() : [];

        const allResults = [];

        const matches = (text) => text?.toLowerCase().includes(query.toLowerCase());

        // Users
        users.forEach(user => {
          if (matches(user.name) || matches(user.username)) {
            allResults.push({ type: 'users', item: user, path: '/users', displayName: user.name, subtitle: `👤 ${user.role}` });
          }
        });
        // APD
        apd.forEach(apdItem => {
          if (matches(apdItem.nama)) {
            allResults.push({ type: 'apd', item: apdItem, path: '/manajemen-apd', displayName: apdItem.nama, subtitle: `📦 Stok: ${apdItem.stok}` });
          }
        });
        // Kontraktor
        kontraktor.forEach(kt => {
          if (matches(kt.name) || matches(kt.pic)) {
            allResults.push({ type: 'kontraktor', item: kt, path: '/kontraktor', displayName: kt.name, subtitle: `👔 PIC: ${kt.pic || '-'}` });
          }
        });
        // Items (bisa dianggap sebagai jobs)
        items.forEach(item => {
          if (matches(item.name)) {
            allResults.push({ type: 'jobs', item, path: '/dashboard', displayName: item.name, subtitle: `📂 ${item.category || 'Job'}` });
          }
        });
        // Assessments (fit to work / medical)
        assessments.forEach(ass => {
          if (matches(ass.name)) {
            allResults.push({ type: 'assessments', item: ass, path: '/fit-to-work', displayName: ass.name, subtitle: `📋 ${ass.status || 'Assessment'}` });
          }
        });

        setResults(allResults.slice(0, 15));
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [query, API_BASE]);

  const navigateToResult = (path) => {
    setCurrentPage(path);
    setQuery('');
  };

  const getIcon = (type) => {
    switch(type) {
      case 'users': return '👥';
      case 'apd': return '🪖';
      case 'kontraktor': return '🏢';
      case 'jobs': return '🏗️';
      case 'assessments': return '📋';
      default: return '📄';
    }
  };

  return (
    <div className="sticky top-4 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-4 mb-8">
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 Search users, APD, kontraktor, jobs, assessments..."
            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-lg font-semibold"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); }}
            className="px-6 py-4 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold transition-all"
          >
            Clear
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {results.map((result, idx) => (
            <div
              key={idx}
              className="group flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl hover:shadow-lg transition-all cursor-pointer border hover:border-blue-300 dark:hover:border-blue-500"
              onClick={() => navigateToResult(result.path)}
            >
              <div className="text-2xl">{getIcon(result.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 dark:text-white truncate">{result.displayName}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold">
                    {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                  </span>
                  <span>{result.subtitle}</span>
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">→</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;