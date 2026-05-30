import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';

const ReportGenerator = ({ 
  reportType,   // 'users', 'incidents', 'kontraktor', 'apd', 'assessments', 'attendance'
  data: propData, 
  filename = 'jsms-report',
  customFetch   // fungsi async custom untuk mengambil data
}) => {
  const [data, setData] = useState(propData || []);
  const [loading, setLoading] = useState(!propData);
  const [error, setError] = useState('');
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  // Mapping endpoint berdasarkan reportType
  const getEndpoint = (type) => {
    switch(type) {
      case 'users': return '/api/users';
      case 'incidents': return '/api/incidents';
      case 'kontraktor': return '/api/kontraktor';
      case 'apd': return '/api/apd';
      case 'assessments': return '/api/assessments';
      case 'attendance': return '/api/attendance';
      default: return null;
    }
  };

  useEffect(() => {
    // Jika sudah ada data dari prop, gunakan itu
    if (propData) {
      setData(propData);
      setLoading(false);
      return;
    }

    // Jika tidak ada reportType dan tidak ada customFetch, error
    if (!reportType && !customFetch) {
      setError('Tidak ada sumber data (reportType atau customFetch diperlukan)');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        let result;
        if (customFetch) {
          result = await customFetch();
        } else {
          const endpoint = getEndpoint(reportType);
          if (!endpoint) throw new Error(`Tipe laporan "${reportType}" tidak dikenal`);
          const res = await fetch(`${API_BASE}${endpoint}`);
          if (!res.ok) throw new Error(`Gagal mengambil data: ${res.status}`);
          result = await res.json();
        }
        setData(result);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reportType, propData, customFetch, API_BASE]);

  const exportCSV = () => {
    if (!data.length) {
      alert('Tidak ada data untuk diekspor');
      return;
    }
    // Ambil semua keys dari object pertama (hanya level 1)
    const headers = Object.keys(data[0]).join(',');
    const csvRows = data.map(row => {
      return Object.values(row).map(value => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value).replace(/,/g, ';');
        return String(value).replace(/,/g, ';');
      }).join(',');
    });
    const csv = [headers, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}-${reportType || 'data'}.csv`);
  };

  const exportJSON = () => {
    if (!data.length) {
      alert('Tidak ada data untuk diekspor');
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, `${filename}-${reportType || 'data'}.json`);
  };

  if (loading) return <div className="p-4 text-center">Memuat data...</div>;
  if (error) return <div className="p-4 text-red-500 text-center">❌ {error}</div>;

  return (
    <div className="flex gap-3 p-2 flex-wrap">
      <button 
        onClick={exportCSV} 
        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow transition-all flex items-center gap-2"
      >
        📊 Download CSV ({data.length} baris)
      </button>
      <button 
        onClick={exportJSON} 
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow transition-all flex items-center gap-2"
      >
        💾 Download JSON
      </button>
    </div>
  );
};

export default ReportGenerator;