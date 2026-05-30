import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';

const FaceAttendance = ({ userId, userName, onSuccess }) => {
  const webcamRef = useRef(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState(null);

  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  // 1. Load model AI dari CDN
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        setIsModelLoaded(true);
        setMessage('Model siap. Silakan verifikasi wajah.');
      } catch (err) {
        console.error('Gagal load model:', err);
        setMessage('Gagal memuat model AI. Periksa koneksi internet.');
      }
    };
    loadModels();
  }, []);

  // 2. Ambil lokasi GPS
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => console.error('Gagal dapat lokasi:', err)
      );
    }
  }, []);

  // 3. Verifikasi wajah dan simpan ke MongoDB
  const handleCheck = async () => {
    if (!isModelLoaded) {
      setMessage('Model AI wajah belum siap. Tunggu sebentar...');
      return;
    }
    if (!location) {
      setMessage('Lokasi belum terdeteksi. Pastikan GPS aktif.');
      return;
    }
    setIsChecking(true);
    setMessage('Memproses wajah...');

    const video = webcamRef.current?.video;
    if (!video) {
      setMessage('Kamera tidak tersedia.');
      setIsChecking(false);
      return;
    }

    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setMessage('Wajah tidak terdeteksi. Coba perbaiki pencahayaan dan posisi.');
        setIsChecking(false);
        return;
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const today = now.toISOString().split('T')[0];

      // Kirim ke backend
      const response = await fetch(`${API_BASE}/api/attendance/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userName,
          date: today,
          checkIn: timeStr,
          status: 'Hadir',
          note: `via face-recognition | lokasi: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
          method: 'face-recognition',
          location: {
            lat: location.lat,
            lng: location.lng,
            accuracy: location.accuracy
          }
        })
      });

      const result = await response.json();
      if (response.ok) {
        setMessage(`✅ Verifikasi berhasil, ${userName}! (Check-in: ${timeStr})`);
        if (onSuccess) onSuccess(result);
      } else {
        setMessage(`❌ Gagal: ${result.error || 'Sudah check-in hari ini?'}`);
      }
    } catch (err) {
      console.error(err);
      setMessage('Terjadi kesalahan saat verifikasi wajah.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md mt-6">
      <h3 className="text-xl font-bold mb-4">📸 Absensi Wajah + GPS</h3>
      <div className="flex flex-col items-center">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: 'user' }}
          className="rounded-xl border-2 border-gray-300 w-full max-w-md"
        />
        <button
          onClick={handleCheck}
          disabled={isChecking}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isChecking ? 'Memverifikasi...' : 'Verifikasi Wajah & Check-in'}
        </button>
        {message && <p className="mt-3 text-center font-semibold">{message}</p>}
        {location && (
          <p className="text-xs text-gray-500 mt-2">
            📍 Lokasi: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </p>
        )}
      </div>
    </div>
  );
};

export default FaceAttendance;