// src/pages/PemadamEvakuasi.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaFire, FaMapMarkerAlt, FaBell, FaWalking, FaPhone, FaAmbulance,
  FaUsers, FaBullhorn, FaClipboardList, FaCheckCircle, FaExclamationTriangle,
  FaCompass, FaLocationArrow, FaRobot, FaVolumeUp, FaWifi, FaBatteryFull,
  FaMoon, FaSun, FaShieldAlt, FaClock, FaChartLine, FaFileAlt
} from 'react-icons/fa';
import { UserContext } from '../App';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Custom emergency icons
const fireIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const safeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const PemadamEvakuasi = () => {
  const { session, darkMode, toggleDarkMode, notifications, setShowNotifPanel } = useContext(UserContext);
  
  // ==================== STATE ====================
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [alertLevel, setAlertLevel] = useState('green'); // green, yellow, red
  const [userLocation, setUserLocation] = useState(null);
  const [evacuationRoutes, setEvacuationRoutes] = useState([]);
  const [nearestExits, setNearestExits] = useState([]);
  const [fireSensors, setFireSensors] = useState([]);
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [evacuationProgress, setEvacuationProgress] = useState({ total: 0, evacuated: 0 });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const [showInstructions, setShowInstructions] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [alertHistory, setAlertHistory] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([
    { name: 'Pemadam Kebakaran', number: '113', icon: FaFire },
    { name: 'Ambulance', number: '118', icon: FaAmbulance },
    { name: 'Polisi', number: '110', icon: FaShieldAlt },
    { name: 'SAR', number: '115', icon: FaUsers }
  ]);

  const role = session?.role;
  const isAdmin = role === 'Admin';
  const isSupervisor = role === 'Supervisor' || role === 'Admin';

  // ==================== FIXED DATA (for offline mode) ====================
  const evacuationPoints = [
    { id: 1, name: 'Pintu Utama', lat: -6.198263, lng: 106.645141, capacity: 200, current: 0 },
    { id: 2, name: 'Pintu Darurat Timur', lat: -6.197800, lng: 106.646000, capacity: 100, current: 0 },
    { id: 3, name: 'Pintu Darurat Barat', lat: -6.198700, lng: 106.644500, capacity: 100, current: 0 },
    { id: 4, name: 'Lapangan Parkir', lat: -6.199000, lng: 106.645500, capacity: 300, current: 0 },
    { id: 5, name: 'Area Kolam', lat: -6.197500, lng: 106.644800, capacity: 150, current: 0 }
  ];

  const fireSensorsData = [
    { id: 1, name: 'Sensor A1', location: 'Gudang Utama', lat: -6.198000, lng: 106.645000, status: 'normal', temperature: 28, smoke: 0 },
    { id: 2, name: 'Sensor A2', location: 'Ruang Produksi', lat: -6.198300, lng: 106.645300, status: 'warning', temperature: 45, smoke: 30 },
    { id: 3, name: 'Sensor A3', location: 'Kantin', lat: -6.197900, lng: 106.644900, status: 'normal', temperature: 26, smoke: 0 },
    { id: 4, name: 'Sensor B1', location: 'Laboratorium', lat: -6.198500, lng: 106.645500, status: 'alert', temperature: 68, smoke: 85 },
    { id: 5, name: 'Sensor B2', location: 'Ruang Server', lat: -6.197700, lng: 106.645200, status: 'normal', temperature: 24, smoke: 0 }
  ];

  // ==================== FUNCTIONS ====================
  const playEmergencySound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio('/emergency-alarm.mp3');
      audio.loop = true;
      audio.volume = 0.7;
      audio.play().catch(e => console.log('Audio play failed:', e));
      return audio;
    } catch (err) {
      console.error('Sound error:', err);
    }
  }, [soundEnabled]);

  const activateEmergency = () => {
    setEmergencyActive(true);
    setAlertLevel('red');
    const audio = playEmergencySound();
    if (audio) {
      // Store audio reference to stop later
      window.emergencyAudio = audio;
    }
    
    // Log aktivasi emergency
    const logData = {
      userId: session?.userId,
      action: 'EMERGENCY_ACTIVATED',
      timestamp: new Date().toISOString(),
      location: userLocation
    };
    
    fetch(`${API_BASE}/api/emergency-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    }).catch(err => console.error('Failed to log:', err));
    
    // Trigger notification ke semua user
    fetch(`${API_BASE}/api/notifications/emergency-broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '🚨 DARURAT KEBAKARAN! Segera evakuasi! 🚨', level: 'red' })
    }).catch(err => console.error('Failed to broadcast:', err));
  };

  const deactivateEmergency = () => {
    setEmergencyActive(false);
    setAlertLevel('green');
    if (window.emergencyAudio) {
      window.emergencyAudio.pause();
      window.emergencyAudio.currentTime = 0;
      window.emergencyAudio = null;
    }
  };

  const getUserLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          findNearestExit(position.coords.latitude, position.coords.longitude);
          setLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Fallback ke lokasi default kantor
          setUserLocation({ lat: -6.198263, lng: 106.645141 });
          findNearestExit(-6.198263, 106.645141);
          setLoading(false);
        }
      );
    } else {
      setUserLocation({ lat: -6.198263, lng: 106.645141 });
      setLoading(false);
    }
  };

  const findNearestExit = (lat, lng) => {
    const distances = evacuationPoints.map(exit => ({
      ...exit,
      distance: Math.hypot(exit.lat - lat, exit.lng - lng) * 111000 // approx meters
    }));
    const nearest = distances.sort((a, b) => a.distance - b.distance).slice(0, 3);
    setNearestExits(nearest);
    
    // Generate AI recommendation
    const aiMsg = nearest[0].distance < 50 
      ? "✅ Pintu evakuasi terdekat hanya berjarak " + Math.round(nearest[0].distance) + " meter. Segera menuju ke sana!"
      : "⚠️ Jarak ke pintu evakuasi terdekat " + Math.round(nearest[0].distance) + " meter. Ikuti jalur yang ditandai.";
    setAiRecommendation(aiMsg);
  };

  const callEmergency = (number) => {
    window.location.href = `tel:${number}`;
  };

  const simulateFireSensor = () => {
    const updated = fireSensorsData.map(sensor => ({
      ...sensor,
      status: Math.random() > 0.7 ? 'alert' : Math.random() > 0.5 ? 'warning' : 'normal',
      temperature: Math.floor(Math.random() * 100) + 20,
      smoke: Math.floor(Math.random() * 100)
    }));
    setFireSensors(updated);
    
    // Auto-activate emergency jika ada sensor alert
    const hasAlert = updated.some(s => s.status === 'alert');
    if (hasAlert && !emergencyActive) {
      activateEmergency();
    }
  };

  // ==================== EFFECTS ====================
  useEffect(() => {
    getUserLocation();
    setFireSensors(fireSensorsData);
    
    // Simulate sensor updates every 10 seconds
    const interval = setInterval(simulateFireSensor, 10000);
    
    // Check online status
    window.addEventListener('online', () => setOfflineMode(false));
    window.addEventListener('offline', () => setOfflineMode(true));
    
    return () => {
      clearInterval(interval);
      if (window.emergencyAudio) {
        window.emergencyAudio.pause();
      }
    };
  }, []);

  // ==================== COMPONENTS ====================
  const LocationMarker = () => {
    const map = useMap();
    useEffect(() => {
      if (userLocation) {
        map.flyTo([userLocation.lat, userLocation.lng], 18);
      }
    }, [userLocation, map]);
    return userLocation ? (
      <Marker position={[userLocation.lat, userLocation.lng]} icon={safeIcon}>
        <Popup>📍 Anda di sini</Popup>
      </Marker>
    ) : null;
  };

  const FireMarkers = () => {
    return fireSensors.filter(s => s.status === 'alert').map(sensor => (
      <Marker key={sensor.id} position={[sensor.lat, sensor.lng]} icon={fireIcon}>
        <Popup>
          🔥 <strong>{sensor.name}</strong><br />
          Suhu: {sensor.temperature}°C<br />
          Asap: {sensor.smoke}%<br />
          <span className="text-red-600 font-bold">BAHAYA!</span>
        </Popup>
      </Marker>
    ));
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${emergencyActive ? 'bg-red-600' : darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      
      {/* EMERGENCY HEADER - MODE DARURAT */}
      {emergencyActive && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-700 text-white p-4 animate-pulse">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FaFire className="text-3xl animate-bounce" />
              <div>
                <h1 className="text-2xl font-black">🚨 DARURAT KEBAKARAN 🚨</h1>
                <p className="text-sm">Segera evakuasi ke titik kumpul terdekat! Jangan gunakan lift!</p>
              </div>
            </div>
            <button onClick={deactivateEmergency} className="bg-white text-red-700 px-4 py-2 rounded-lg font-bold">
              Tandai Selesai
            </button>
          </div>
        </div>
      )}

      {/* OFFLINE MODE NOTIFICATION */}
      {offlineMode && (
        <div className="fixed top-20 right-4 z-40 bg-yellow-500 text-black p-3 rounded-lg shadow-lg flex items-center gap-2">
          <FaWifi className="text-red-500" /> Mode Offline - Data terbatas
        </div>
      )}

      <div className="container mx-auto p-4 lg:p-6">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 pt-16 lg:pt-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${emergencyActive ? 'bg-white text-red-600' : 'bg-red-600 text-white'}`}>
              <FaFire className="text-2xl" />
            </div>
            <div>
              <h1 className={`text-2xl lg:text-3xl font-bold ${emergencyActive ? 'text-white' : darkMode ? 'text-white' : 'text-gray-800'}`}>
                Pemadam & Evakuasi
              </h1>
              <p className={`text-sm ${emergencyActive ? 'text-red-100' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Sistem Darurat & Manajemen Evakuasi
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-2 rounded-xl ${emergencyActive ? 'bg-white/20 text-white' : darkMode ? 'bg-gray-800 text-white' : 'bg-white shadow'}`}>
              {soundEnabled ? <FaVolumeUp /> : <FaVolumeUp className="opacity-50" />}
            </button>
            <button onClick={toggleDarkMode} className={`p-2 rounded-xl ${emergencyActive ? 'bg-white/20 text-white' : darkMode ? 'bg-gray-800 text-white' : 'bg-white shadow'}`}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            <div className={`px-3 py-2 rounded-xl font-bold ${alertLevel === 'red' ? 'bg-red-700 text-white animate-pulse' : alertLevel === 'yellow' ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'}`}>
              {alertLevel === 'red' ? '🔥 DARURAT' : alertLevel === 'yellow' ? '⚠️ SIAGA' : '✅ AMAN'}
            </div>
          </div>
        </div>

        {/* EMERGENCY BUTTON BESAR */}
        {!emergencyActive && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={activateEmergency}
            className="w-full bg-red-600 hover:bg-red-700 text-white p-8 rounded-2xl mb-6 shadow-2xl transition-all"
          >
            <div className="flex items-center justify-center gap-4">
              <FaFire className="text-5xl animate-pulse" />
              <div className="text-left">
                <h2 className="text-3xl lg:text-4xl font-black">TEKAN UNTUK DARURAT!</h2>
                <p className="text-lg opacity-90">Aktifkan alarm evakuasi dan hubungi tim penyelamat</p>
              </div>
            </div>
          </motion.button>
        )}

        {/* STATUS CARD */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className={`rounded-xl p-4 ${emergencyActive ? 'bg-red-800 text-white' : darkMode ? 'bg-gray-800 text-white' : 'bg-white shadow'}`}>
            <FaUsers className="text-2xl mb-2" />
            <p className="text-2xl font-bold">{evacuationProgress.evacuated}/{evacuationProgress.total}</p>
            <p className="text-xs opacity-70">Terevakuasi</p>
          </div>
          <div className={`rounded-xl p-4 ${emergencyActive ? 'bg-red-800 text-white' : darkMode ? 'bg-gray-800 text-white' : 'bg-white shadow'}`}>
            <FaMapMarkerAlt className="text-2xl mb-2" />
            <p className="text-2xl font-bold">{nearestExits[0]?.distance ? Math.round(nearestExits[0].distance) : '?'} m</p>
            <p className="text-xs opacity-70">Ke Pintu Terdekat</p>
          </div>
          <div className={`rounded-xl p-4 ${emergencyActive ? 'bg-red-800 text-white' : darkMode ? 'bg-gray-800 text-white' : 'bg-white shadow'}`}>
            <FaClock className="text-2xl mb-2" />
            <p className="text-2xl font-bold">{new Date().toLocaleTimeString()}</p>
            <p className="text-xs opacity-70">Waktu Kejadian</p>
          </div>
          <div className={`rounded-xl p-4 ${emergencyActive ? 'bg-red-800 text-white' : darkMode ? 'bg-gray-800 text-white' : 'bg-white shadow'}`}>
            <FaRobot className="text-2xl mb-2" />
            <p className="text-sm font-bold truncate">{aiRecommendation || "Menentukan lokasi..."}</p>
            <p className="text-xs opacity-70">AI Rekomendasi</p>
          </div>
        </div>

        {/* MAP SECTION */}
        <div className={`rounded-2xl overflow-hidden shadow-xl mb-6 ${emergencyActive ? 'border-4 border-red-500' : ''}`}>
          <div className="h-96 lg:h-[500px] relative">
            {userLocation ? (
              <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={17} className="h-full w-full" style={{ background: '#1a1a2e' }}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                />
                <LocationMarker />
                <FireMarkers />
                {evacuationPoints.map(exit => (
                  <Marker key={exit.id} position={[exit.lat, exit.lng]} icon={safeIcon}>
                    <Popup>{exit.name} - Kapasitas: {exit.capacity}</Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-800 text-white">
                <FaLocationArrow className="animate-pulse text-3xl mr-2" />
                Mengambil lokasi Anda...
              </div>
            )}
          </div>
          <div className={`p-3 text-center text-sm ${emergencyActive ? 'bg-red-800 text-white' : darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
            🗺️ Peta interaktif - Titik merah: sensor kebakaran | Titik hijau: titik kumpul
          </div>
        </div>

        {/* EVACUATION INSTRUCTIONS - MODE DARURAT */}
        {emergencyActive && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl mb-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">📋 PROSEDUR EVAKUASI DARURAT</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border-l-4 border-red-500 pl-4">
                <p className="font-bold text-lg">1️⃣ Tetap Tenang</p>
                <p className="text-gray-600 dark:text-gray-400">Jangan panik. Ikuti instruksi dengan saksama.</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <p className="font-bold text-lg">2️⃣ Matikan Peralatan</p>
                <p className="text-gray-600 dark:text-gray-400">Matikan listrik dan peralatan di sekitar Anda.</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <p className="font-bold text-lg">3️⃣ Gunakan Tangga Darurat</p>
                <p className="text-gray-600 dark:text-gray-400">JANGAN gunakan lift. Gunakan tangga darurat.</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <p className="font-bold text-lg">4️⃣ Tutup Pintu di Belakang</p>
                <p className="text-gray-600 dark:text-gray-400">Tutup pintu untuk menghambat api.</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <p className="font-bold text-lg">5️⃣ Merunduk Rendah</p>
                <p className="text-gray-600 dark:text-gray-400">Jika berasap, merunduk rendah untuk menghindari asap.</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <p className="font-bold text-lg">6️⃣ Menuju Titik Kumpul</p>
                <p className="text-gray-600 dark:text-gray-400">Kumpul di area yang sudah ditentukan.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* NEAREST EXITS */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className={`rounded-2xl p-5 ${emergencyActive ? 'bg-red-800 text-white' : darkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
            <h3 className="font-bold mb-3 flex items-center gap-2"><FaCompass /> Titik Kumpul Terdekat</h3>
            <div className="space-y-3">
              {nearestExits.map((exit, idx) => (
                <div key={exit.id} className={`p-3 rounded-xl ${idx === 0 ? (emergencyActive ? 'bg-red-700' : 'bg-red-50 dark:bg-red-900/20') : ''}`}>
                  <div className="flex justify-between">
                    <span className="font-semibold">{exit.name}</span>
                    <span className="text-sm">{Math.round(exit.distance)} meter</span>
                  </div>
                  <p className="text-xs opacity-70">Kapasitas: {exit.capacity} orang</p>
                </div>
              ))}
            </div>
          </div>

          {/* EMERGENCY CONTACTS */}
          <div className={`rounded-2xl p-5 ${emergencyActive ? 'bg-red-800 text-white' : darkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
            <h3 className="font-bold mb-3 flex items-center gap-2"><FaPhone /> Kontak Darurat</h3>
            <div className="grid grid-cols-2 gap-3">
              {emergencyContacts.map((contact, idx) => (
                <button
                  key={idx}
                  onClick={() => callEmergency(contact.number)}
                  className={`p-3 rounded-xl text-center transition ${emergencyActive ? 'bg-red-700 hover:bg-red-600' : 'bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30'}`}
                >
                  <contact.icon className="text-2xl mx-auto mb-1" />
                  <p className="font-bold">{contact.number}</p>
                  <p className="text-xs">{contact.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* FIRE SENSORS STATUS */}
          <div className={`rounded-2xl p-5 ${emergencyActive ? 'bg-red-800 text-white' : darkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
            <h3 className="font-bold mb-3 flex items-center gap-2"><FaChartLine /> Status Sensor Kebakaran</h3>
            <div className="space-y-2">
              {fireSensors.map(sensor => (
                <div key={sensor.id} className="flex justify-between items-center">
                  <span className="text-sm">{sensor.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      sensor.status === 'alert' ? 'bg-red-500 animate-pulse' :
                      sensor.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></span>
                    <span className="text-xs">{sensor.temperature}°C</span>
                    <span className="text-xs">{sensor.smoke}%</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={simulateFireSensor} className="mt-3 text-xs text-blue-500 underline">Simulasi Update</button>
          </div>
        </div>

        {/* INSTRUKSI KESELAMATAN */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className={`rounded-2xl p-5 ${emergencyActive ? 'bg-red-800 text-white' : darkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
            <h3 className="font-bold mb-3 flex items-center gap-2">🧯 Cara Menggunakan APAR</h3>
            <div className="space-y-2 text-sm">
              <p><strong>P</strong> - Tarik pin pengaman</p>
              <p><strong>A</strong> - Arahkan ke api (bukan asap)</p>
              <p><strong>S</strong> - Tekan tuas/pegangan</p>
              <p><strong>S</strong> - Sapukan ke sumber api</p>
            </div>
          </div>
          <div className={`rounded-2xl p-5 ${emergencyActive ? 'bg-red-800 text-white' : darkMode ? 'bg-gray-800' : 'bg-white shadow'}`}>
            <h3 className="font-bold mb-3 flex items-center gap-2">⚠️ JANGAN PERNAH!</h3>
            <ul className="space-y-2 text-sm list-disc list-inside">
              <li>Menggunakan lift saat kebakaran</li>
              <li>Kembali ke gedung yang terbakar</li>
              <li>Menyembunyikan diri di kamar mandi</li>
              <li>Memecah kaca tanpa alasan</li>
            </ul>
          </div>
        </div>

        {/* MATERI PELATIHAN (untuk non-emergency) */}
        {!emergencyActive && (
          <div className="mt-6">
            <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>📚 Materi Fire Marshal</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'Peran Petugas Pemadam', desc: 'Tanggung jawab fire marshal dalam evakuasi' },
                { title: 'Kimia Api', desc: 'Segitiga api dan reaksi berantai' },
                { title: 'Penggunaan APAR', desc: 'Teknik PASS yang benar' },
                { title: 'Prosedur Evakuasi', desc: 'Rute dan titik kumpul' },
                { title: 'Koordinasi dengan Damkar', desc: 'Komunikasi dengan pemadam profesional' }
              ].map((item, idx) => (
                <div key={idx} className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white shadow'} cursor-pointer hover:shadow-lg transition`}>
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PemadamEvakuasi;