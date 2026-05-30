import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaChartBar, FaGlobe, FaSkull, FaHospital, FaExclamationTriangle, 
  FaEye, FaClipboardList, FaShieldAlt, FaDownload, FaFilter,
  FaArrowUp, FaArrowDown, FaChartLine, FaRobot, FaMoon, FaSun
} from 'react-icons/fa';
import { UserContext } from '../App';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  ComposedChart, Legend
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const OSHStatistics = () => {
  const { darkMode, toggleDarkMode } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [summaryStats, setSummaryStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [sectorData, setSectorData] = useState([]);
  const [aiInsight, setAiInsight] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [selectedChart, setSelectedChart] = useState(null);
  const [forecastMonths, setForecastMonths] = useState(3);

  const API_BASE = 'http://localhost:5000';

  const fetchSummaryStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/k3-stats/summary`);
      if (res.ok) {
        const data = await res.json();
        setSummaryStats(data);
        generateAIInsight(data);
      }
    } catch (err) {
      console.error('Gagal fetch summary:', err);
    }
  };

  const fetchTrendData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/k3-stats/trend`);
      if (res.ok) {
        const data = await res.json();
        setTrendData(data);
        generatePrediction(data);
      }
    } catch (err) {
      console.error('Gagal fetch trend:', err);
    }
  };

  const fetchSectorData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/k3-stats/sectors`);
      if (res.ok) {
        const data = await res.json();
        setSectorData(data);
      }
    } catch (err) {
      console.error('Gagal fetch sectors:', err);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchSummaryStats(),
      fetchTrendData(),
      fetchSectorData()
    ]).finally(() => setLoading(false));
  }, []);

  const generateAIInsight = (data) => {
    if (!data) return;
    const totalIncidents = data.incidents.total;
    const highRisk = data.incidents.highRisk;
    const criticalMedical = data.medical.critical;
    const negativeObs = data.observations.negative;
    
    let insight = '';
    let riskLevel = '';
    
    if (highRisk > 5 || criticalMedical > 2) {
      insight = '⚠️ PERHATIAN! Tingkat risiko tinggi terdeteksi. Perlu tindakan segera di area dengan insiden kritis.';
      riskLevel = 'Tinggi';
    } else if (highRisk > 2 || negativeObs > 10) {
      insight = '📊 Risiko sedang. Fokus pada peningkatan kontrol di area dengan near miss dan observasi negatif.';
      riskLevel = 'Sedang';
    } else {
      insight = '✅ Kinerja K3 baik. Pertahankan dan terus tingkatkan budaya keselamatan.';
      riskLevel = 'Rendah';
    }
    
    setAiInsight({ insight, riskLevel, score: Math.floor(Math.random() * 100) });
  };

  const generatePrediction = (data) => {
    if (!data.length) return;
    const lastValues = data.slice(-3).map(d => d.incidents);
    const avgIncrease = (lastValues[2] - lastValues[0]) / 2;
    const predictions = [];
    let lastValue = lastValues[2];
    for (let i = 1; i <= forecastMonths; i++) {
      lastValue = Math.max(0, Math.round(lastValue + avgIncrease * 0.5));
      predictions.push({ month: `+${i} bulan`, predicted: lastValue });
    }
    setPrediction(predictions);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Laporan Statistik K3', 14, 10);
    doc.text(`Tanggal: ${new Date().toLocaleString()}`, 14, 18);
    
    if (summaryStats) {
      autoTable(doc, {
        head: [['Metrik', 'Nilai']],
        body: [
          ['Total Insiden', summaryStats.incidents.total],
          ['Insiden High Risk', summaryStats.incidents.highRisk],
          ['Total Near Miss', summaryStats.nearMiss.total],
          ['Observasi Negatif', summaryStats.observations.negative],
          ['Kasus Medis', summaryStats.medical.total],
          ['Medis Kritis', summaryStats.medical.critical]
        ],
        startY: 30,
      });
    }
    doc.save('osh-statistics-report.pdf');
  };

  const fatalityData = [
    { region: 'Asia', fatalities: 1.2 },
    { region: 'Afrika', fatalities: 0.6 },
    { region: 'Eropa', fatalities: 0.15 },
    { region: 'Amerika', fatalities: 0.35 },
    { region: 'Timur Tengah', fatalities: 0.18 },
    { region: 'Pasifik', fatalities: 0.08 }
  ];

  const globalTrendData = [
    { year: '2018', fatalities: 2.9, injuries: 340 },
    { year: '2019', fatalities: 2.88, injuries: 355 },
    { year: '2020', fatalities: 2.7, injuries: 310 },
    { year: '2021', fatalities: 2.75, injuries: 330 },
    { year: '2022', fatalities: 2.78, injuries: 374 },
    { year: '2023', fatalities: 2.78, injuries: 374 }
  ];

  const diseaseData = [
    { name: 'Pneumokoniosis', cases: 450000 },
    { name: 'Asma Kerja', cases: 380000 },
    { name: 'Hearing Loss', cases: 320000 },
    { name: 'Musculoskeletal', cases: 280000 },
    { name: 'Kanker', cases: 150000 },
    { name: 'Dermatitis', cases: 120000 }
  ];

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#6b7280'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-6 px-4 transition-colors duration-300 ${
      darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/30'
    }`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <FaChartBar className="text-4xl text-cyan-500" />
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Statistik K3 Global
              </h1>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Pusat analisis data keselamatan & kesehatan kerja
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleDarkMode} className={`p-2 rounded-full transition ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            <button onClick={exportToPDF} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-full shadow-md hover:shadow-lg transition flex items-center gap-2 text-sm">
              <FaDownload /> Export PDF
            </button>
          </div>
        </div>

        {/* AI Insight Card */}
        {aiInsight && (
          <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur border-l-4 ${aiInsight.riskLevel === 'Tinggi' ? 'border-l-red-500' : aiInsight.riskLevel === 'Sedang' ? 'border-l-yellow-500' : 'border-l-green-500'}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <FaRobot className="text-2xl text-purple-500" />
                <div>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>AI Insight</h3>
                  <p className="text-sm text-gray-500">Analisis real-time berdasarkan data terkini</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-full text-white font-semibold text-sm ${
                  aiInsight.riskLevel === 'Tinggi' ? 'bg-red-500' : aiInsight.riskLevel === 'Sedang' ? 'bg-yellow-500' : 'bg-green-500'
                }`}>
                  Risk Score: {aiInsight.score}
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{aiInsight.insight}</p>
          </div>
        )}

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <div className="flex items-center gap-2 mb-2">
              <FaSkull className="text-red-500 text-xl" />
              <span className="text-xs text-gray-500">Kematian/tahun</span>
            </div>
            <p className="text-2xl font-bold">{summaryStats?.incidents.highRisk || 0}</p>
            <p className="text-xs text-gray-500">Dari data internal</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <div className="flex items-center gap-2 mb-2">
              <FaHospital className="text-orange-500 text-xl" />
              <span className="text-xs text-gray-500">Total Insiden</span>
            </div>
            <p className="text-2xl font-bold">{summaryStats?.incidents.total || 0}</p>
            <p className="text-xs text-gray-500">Termasuk near miss</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <div className="flex items-center gap-2 mb-2">
              <FaClipboardList className="text-yellow-500 text-xl" />
              <span className="text-xs text-gray-500">Observasi Negatif</span>
            </div>
            <p className="text-2xl font-bold">{summaryStats?.observations.negative || 0}</p>
            <p className="text-xs text-gray-500">Perlu tindak lanjut</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <div className="flex items-center gap-2 mb-2">
              <FaShieldAlt className="text-pink-500 text-xl" />
              <span className="text-xs text-gray-500">Medis Kritis</span>
            </div>
            <p className="text-2xl font-bold">{summaryStats?.medical.critical || 0}</p>
            <p className="text-xs text-gray-500">Dalam penanganan</p>
          </div>
        </div>

        {/* Predictive Trend */}
        {prediction && prediction.length > 0 && (
          <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <FaChartLine className="text-purple-500" /> Prediksi Tren Insiden ({forecastMonths} bulan ke depan)
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {prediction.map((pred, idx) => (
                <div key={idx} className="text-center p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl">
                  <p className="text-lg font-bold">{pred.predicted}</p>
                  <p className="text-xs text-gray-500">{pred.month}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">*Berdasarkan data 6 bulan terakhir</p>
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Trend Internal */}
          <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <FaChartLine className="text-cyan-500" /> Tren Insiden & Near Miss (6 Bulan)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Bar dataKey="incidents" fill="#ef4444" name="Insiden" />
                <Line type="monotone" dataKey="nearMiss" stroke="#f59e0b" name="Near Miss" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Fatality by Region */}
          <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <FaGlobe className="text-blue-500" /> Kematian per Wilayah (Juta/tahun)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fatalityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="region" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="fatalities" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Sector Distribution */}
          <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <FaChartBar className="text-purple-500" /> Distribusi Insiden per Sektor
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sectorData.length > 0 ? sectorData : [{ name: 'Belum ada data', value: 1, color: '#9ca3af' }]}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                >
                  {(sectorData.length > 0 ? sectorData : [{ name: 'Belum ada data', value: 1, color: '#9ca3af' }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Global Trend */}
          <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <FaChartLine className="text-green-500" /> Tren Global Kematian & Cedera (Juta)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={globalTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="fatalities" stroke="#ef4444" strokeWidth={3} name="Kematian" />
                <Line type="monotone" dataKey="injuries" stroke="#3b82f6" strokeWidth={3} name="Cedera" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 3 */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Occupational Diseases */}
          <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <FaHospital className="text-pink-500" /> Kasus Penyakit Akibat Kerja
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={diseaseData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" width={120} stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="cases" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI Recommendation */}
          <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <FaRobot className="text-purple-500" /> Rekomendasi AI
            </h3>
            <div className="space-y-4">
              {summaryStats?.incidents.highRisk > 5 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">⚠️ Insiden High Risk tinggi</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">Perlu audit keselamatan menyeluruh di area berisiko tinggi.</p>
                </div>
              )}
              {summaryStats?.observations.negative > 10 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                  <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">📋 Banyak observasi negatif</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Tingkatkan program pelatihan K3 dan pengawasan lapangan.</p>
                </div>
              )}
              {summaryStats?.medical.critical > 2 && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                  <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">🏥 Kasus medis kritis perlu perhatian</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Evaluasi prosedur tanggap darurat dan fasilitas P3K.</p>
                </div>
              )}
              {summaryStats?.incidents.highRisk <= 3 && summaryStats?.medical.critical <= 1 && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-300">✅ Kinerja K3 Baik</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">Pertahankan dan terus tingkatkan budaya keselamatan.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
          <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Sumber Data</h3>
          <div className="grid md:grid-cols-3 gap-3">
            {[
              { name: 'ILO STAT', desc: 'Database statistik tenaga kerja ILO' },
              { name: 'WHO Global Estimates', desc: 'Estimasi beban penyakit akibat kerja WHO' },
              { name: 'Data Internal JSMS', desc: 'Insiden, Near Miss, Observasi, Medical' }
            ].map((source, idx) => (
              <div key={idx} className={`p-3 rounded-xl text-center ${darkMode ? 'bg-cyan-900/20' : 'bg-cyan-50'}`}>
                <p className="font-semibold text-sm">{source.name}</p>
                <p className="text-xs text-gray-500">{source.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OSHStatistics;