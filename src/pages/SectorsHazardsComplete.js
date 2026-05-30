import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaIndustry, FaHardHat, FaExclamationTriangle, FaShieldAlt, 
  FaMapMarkerAlt, FaCamera, FaMicrophone, FaRobot, FaChartLine,
  FaTools, FaCheckCircle, FaTimes, FaSpinner, FaLocationArrow,
  FaRuler, FaFire, FaTint, FaSkull, FaBug, FaBolt, FaTruck
} from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom hazard marker
const getHazardIcon = (level) => {
  const colors = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#22c55e'
  };
  return L.divIcon({
    html: `<div style="background-color: ${colors[level] || '#ef4444'}; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"><span style="color: white; font-size: 12px;">⚠️</span></div>`,
    className: 'custom-hazard-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const SectorsHazards = () => {
  const [sectors, setSectors] = useState([]);
  const [activeSector, setActiveSector] = useState('construction');
  const [currentSector, setCurrentSector] = useState(null);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyHazards, setNearbyHazards] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reportForm, setReportForm] = useState({
    location: '',
    hazardType: '',
    description: '',
    severity: 'Medium'
  });
  const [cameraImage, setCameraImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const API_BASE = 'http://localhost:5000';
  
  // Fetch sectors
  const fetchSectors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/sectors`);
      if (res.ok) {
        const data = await res.json();
        setSectors(data);
        const active = data.find(s => s.id === activeSector) || data[0];
        setCurrentSector(active);
      }
    } catch (err) {
      console.error('Gagal fetch sectors:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/sector-stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Gagal fetch stats:', err);
    }
  };
  
  // Get user location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          fetchNearbyHazards(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Gagal dapat lokasi:', error);
          alert('Aktifkan GPS untuk fitur location-based hazard');
        }
      );
    }
  };
  
  // Fetch nearby hazards
  const fetchNearbyHazards = async (lat, lng) => {
    try {
      const res = await fetch(`${API_BASE}/api/location-hazards?lat=${lat}&lng=${lng}&radius=500`);
      if (res.ok) {
        const data = await res.json();
        setNearbyHazards(data);
      }
    } catch (err) {
      console.error('Gagal fetch nearby hazards:', err);
    }
  };
  
  // Open camera for AI detection
  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Gagal buka kamera:', err);
      alert('Tidak dapat mengakses kamera');
    }
  };
  
  // Capture photo and analyze
  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    
    const imageData = canvasRef.current.toDataURL('image/jpeg');
    setCameraImage(imageData);
    setIsAnalyzing(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/ai-detect-hazard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: imageData, location: userLocation })
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data);
        setReportForm(prev => ({
          ...prev,
          hazardType: data.detected.name,
          description: data.detected.name
        }));
      }
    } catch (err) {
      console.error('Gagal analisa AI:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Submit hazard report
  const submitReport = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/hazard-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectorId: currentSector?._id,
          sectorName: currentSector?.name,
          location: reportForm.location,
          coordinates: userLocation,
          hazardType: reportForm.hazardType,
          description: reportForm.description,
          severity: reportForm.severity,
          reporter: 'User',
          reporterId: 'user123',
          aiAnalysis: aiAnalysis ? {
            detectedHazards: [aiAnalysis.detected.name],
            recommendedApd: aiAnalysis.detected.apd,
            confidence: aiAnalysis.detected.confidence,
            analyzedAt: new Date()
          } : null
        })
      });
      if (res.ok) {
        alert('Laporan hazard berhasil dikirim!');
        setShowReportForm(false);
        setShowCamera(false);
        setCameraImage(null);
        setAiAnalysis(null);
        setReportForm({ location: '', hazardType: '', description: '', severity: 'Medium' });
        fetchStats();
      }
    } catch (err) {
      console.error('Gagal submit report:', err);
    }
  };
  
  const getLevelColor = (level) => {
    const colors = {
      'Critical': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'High': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'Medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'Low': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };
  
  useEffect(() => {
    fetchSectors();
    fetchStats();
    getUserLocation();
  }, []);
  
  useEffect(() => {
    const sector = sectors.find(s => s.id === activeSector);
    if (sector) setCurrentSector(sector);
  }, [activeSector, sectors]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/20 to-orange-50 dark:from-slate-900 dark:via-slate-900 dark:to-red-950/20">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-sm font-semibold">
            <FaIndustry /> Sektor & Bahaya Spesifik
          </div>
          <h1 className="text-4xl lg:text-6xl font-black bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">
            Sektor & Bahaya Spesifik
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Setiap sektor industri memiliki karakteristik bahaya yang unik. 
            Memahami bahaya spesifik sektor adalah kunci untuk pencegahan yang efektif.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <button
              onClick={() => setShowReportForm(true)}
              className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition shadow-lg"
            >
              <FaExclamationTriangle /> Laporkan Hazard
            </button>
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition shadow-lg"
            >
              <FaCamera /> AI Deteksi Bahaya
            </button>
            <button
              onClick={() => setShowLocationMap(true)}
              className="flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition shadow-lg"
            >
              <FaMapMarkerAlt /> Peta Bahaya Lokasi
            </button>
          </div>
        </div>
        
        {/* Nearby Hazards Alert */}
        {nearbyHazards.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="text-yellow-600 text-xl mt-0.5" />
              <div>
                <h3 className="font-bold text-yellow-800 dark:text-yellow-300">Peringatan Hazard di Sekitar Anda!</h3>
                <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">
                  Terdapat {nearbyHazards.length} area hazard dalam radius 500 meter dari lokasi Anda.
                </p>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Dashboard Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaChartLine className="text-blue-500" /> Dashboard Risiko per Sektor
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map(stat => (
              <div key={stat.sectorId} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold">{stat.sectorName}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    stat.riskScore > 70 ? 'bg-red-100 text-red-700' :
                    stat.riskScore > 50 ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    Risk Score: {stat.riskScore}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>📊 Total Laporan: {stat.totalReports}</p>
                  <p>⚠️ Critical: {stat.criticalReports}</p>
                  <p>🔄 Open: {stat.openReports}</p>
                  <p>🔥 Top Hazards: {stat.topHazards.join(', ') || '-'}</p>
                </div>
                <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                    style={{ width: `${stat.riskScore}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Sector Selector */}
        <div className="flex flex-wrap justify-center gap-3">
          {sectors.map(sector => (
            <motion.button
              key={sector.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveSector(sector.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
                activeSector === sector.id
                  ? `bg-gradient-to-r ${sector.color} text-white shadow-lg scale-105`
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{sector.icon}</span>
              {sector.name}
            </motion.button>
          ))}
        </div>
        
        {/* Sector Detail */}
        <AnimatePresence mode="wait">
          {currentSector && (
            <motion.div
              key={currentSector.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              {/* Sector Header */}
              <div className={`bg-gradient-to-r ${currentSector.color} p-8 text-white`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-5xl">{currentSector.icon}</span>
                    <div>
                      <h2 className="text-3xl font-bold">{currentSector.name}</h2>
                      <p className="opacity-90">Tingkat Risiko: {currentSector.riskLevel}</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-black">{currentSector.stats?.fatalities || '0%'}</p>
                      <p className="text-xs opacity-80">Kematian Global</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black">{currentSector.stats?.injuries || '0%'}</p>
                      <p className="text-xs opacity-80">Cedera Global</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black">{currentSector.stats?.workers || '0'}</p>
                      <p className="text-xs opacity-80">Pekerja</p>
                    </div>
                    {currentSector.stats?.ltiRate && (
                      <div className="text-center">
                        <p className="text-2xl font-black">{currentSector.stats.ltiRate}</p>
                        <p className="text-xs opacity-80">LTI Rate</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                {/* Interactive Map for sector locations */}
                {currentSector.locations && currentSector.locations.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <FaMapMarkerAlt className="text-green-500" /> Peta Hazard {currentSector.name}
                    </h3>
                    <div className="h-64 rounded-xl overflow-hidden">
                      <MapContainer 
                        center={[-6.200000, 106.816666]} 
                        zoom={13} 
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        {currentSector.locations.map((loc, idx) => (
                          <Marker 
                            key={idx} 
                            position={[loc.coordinates.lat, loc.coordinates.lng]}
                            icon={getHazardIcon(loc.hazardLevel)}
                          >
                            <Popup>
                              <div className="p-2">
                                <h4 className="font-bold">{loc.name}</h4>
                                <p className="text-sm text-red-600">Level: {loc.hazardLevel}</p>
                                <p className="text-xs text-gray-600">Hazards: {loc.hazards.join(', ')}</p>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </MapContainer>
                    </div>
                  </div>
                )}
                
                {/* Hazards List */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <FaExclamationTriangle className="text-red-500" /> Bahaya Utama
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {currentSector.hazards?.map((hazard, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{hazard.icon || '⚠️'}</span>
                          <h4 className="font-bold text-gray-900 dark:text-white">{hazard.name}</h4>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getLevelColor(hazard.level)}`}>
                          {hazard.level}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{hazard.description}</p>
                    </motion.div>
                  ))}
                </div>
                
                {/* Controls */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <FaShieldAlt className="text-green-500" /> Pengendalian Rekomendasi
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentSector.controls?.map((control, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800/30">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          control.priority === 'High' ? 'bg-red-500' : 'bg-green-500'
                        }`}>
                          <span className="text-white text-sm font-bold">{idx + 1}</span>
                        </div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-200">{control.name}</h4>
                      </div>
                      {control.steps && (
                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 ml-2">
                          {control.steps.map((step, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <FaCheckCircle className="text-green-500 text-xs" /> {step}
                            </li>
                          ))}
                        </ul>
                      )}
                      {control.apdRequired && control.apdRequired.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {control.apdRequired.map((apd, i) => (
                            <span key={i} className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 text-xs rounded-full">
                              {apd}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Global Stats */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl p-8 lg:p-12 text-white">
          <h2 className="text-3xl font-bold mb-8 text-center">Statistik Global K3 per Sektor</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
              <p className="text-4xl font-black mb-2">2.78 Juta</p>
              <p className="text-sm opacity-90">Kematian per Tahun</p>
              <p className="text-xs opacity-70 mt-2">Konstruksi & Pertambangan tertinggi</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
              <p className="text-4xl font-black mb-2">374 Juta</p>
              <p className="text-sm opacity-90">Cedera Non-Fatal</p>
              <p className="text-xs opacity-70 mt-2">Manufaktur & Pertanian terbanyak</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
              <p className="text-4xl font-black mb-2">$3.9 Triliun</p>
              <p className="text-sm opacity-90">Biaya Ekonomi</p>
              <p className="text-xs opacity-70 mt-2">4% PDB global hilang per tahun</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Report Hazard Modal */}
      <AnimatePresence>
        {showReportForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowReportForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold dark:text-white">Laporkan Hazard</h2>
                <button onClick={() => setShowReportForm(false)} className="text-gray-400 hover:text-gray-600">
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={submitReport} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Lokasi</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={reportForm.location}
                      onChange={(e) => setReportForm({...reportForm, location: e.target.value})}
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-300 outline-none dark:bg-gray-700 dark:border-gray-600"
                      placeholder="Area/Worksite"
                      required
                    />
                    <button type="button" onClick={getUserLocation} className="px-3 py-2 bg-blue-500 text-white rounded-lg">
                      <FaLocationArrow />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Jenis Hazard</label>
                  <input
                    type="text"
                    value={reportForm.hazardType}
                    onChange={(e) => setReportForm({...reportForm, hazardType: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-300 outline-none dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Severity</label>
                  <select
                    value={reportForm.severity}
                    onChange={(e) => setReportForm({...reportForm, severity: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-300 outline-none dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Deskripsi</label>
                  <textarea
                    value={reportForm.description}
                    onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-300 outline-none dark:bg-gray-700 dark:border-gray-600"
                    rows="3"
                    required
                  />
                </div>
                {aiAnalysis && (
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FaRobot className="text-purple-600" />
                      <span className="font-semibold text-purple-800 dark:text-purple-300">AI Analysis</span>
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-300">{aiAnalysis.recommendation}</p>
                  </div>
                )}
                <button type="submit" className="w-full py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition">
                  Kirim Laporan
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Camera Modal for AI Detection */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => {
              setShowCamera(false);
              if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-black rounded-2xl p-4 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">AI Hazard Detection</h2>
                <button onClick={() => {
                  setShowCamera(false);
                  if (videoRef.current?.srcObject) {
                    videoRef.current.srcObject.getTracks().forEach(track => track.stop());
                  }
                }} className="text-gray-400 text-2xl">&times;</button>
              </div>
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              {isAnalyzing ? (
                <div className="flex items-center justify-center gap-2 mt-4 py-3">
                  <FaSpinner className="animate-spin text-purple-400" />
                  <span className="text-white">Menganalisa hazard...</span>
                </div>
              ) : cameraImage ? (
                <div className="mt-4">
                  <img src={cameraImage} alt="Captured" className="w-full rounded-lg mb-3" />
                  {aiAnalysis && (
                    <div className="bg-purple-900/50 rounded-lg p-3 mb-3">
                      <p className="text-purple-300 text-sm">{aiAnalysis.recommendation}</p>
                    </div>
                  )}
                  <button
                    onClick={() => setShowReportForm(true)}
                    className="w-full py-2 bg-red-600 text-white rounded-lg font-semibold"
                  >
                    Laporkan Hazard Ini
                  </button>
                </div>
              ) : (
                <button
                  onClick={captureAndAnalyze}
                  className="w-full mt-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  <FaCamera className="inline mr-2" /> Capture & Analyze
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SectorsHazards;