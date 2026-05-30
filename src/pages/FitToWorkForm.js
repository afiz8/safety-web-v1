import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../App';
import {
  FaBriefcase,
  FaClipboardList,
  FaEdit,
  FaTrash,
  FaSearch,
  FaCheckCircle,
  FaUpload,
  FaHeartbeat,
  FaStethoscope,
  FaTools,
  FaUserMd,
  FaSync,
  FaCrown,
  FaGem,
  FaDiamond,
  FaStar,
  FaShieldAlt,
  FaChartLine,
  FaAward,
  FaRocket
} from 'react-icons/fa';

const FitToWorkForm = () => {
  const { session, setNotifications, notifications } = useContext(UserContext);

  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  const k3AssessmentOptions = [
    { value: '', label: 'Pilih' },
    { value: 'Low', label: 'Low (Lanjut)' },
    { value: 'Medium', label: 'Medium (Review)' },
    { value: 'High', label: 'High (Stop & Mitigasi)' },
  ];

  const apdWajibOptions = [
    { value: '', label: 'Pilih APD' },
    { value: 'Lengkap', label: 'Lengkap (Sesuai Ketentuan)' },
    { value: 'Sebagian', label: 'Sebagian / Belum Lengkap' },
    { value: 'Tidak Siap', label: 'Tidak Siap (Perlu Perbaikan)' },
  ];

  const peralatanOptions = [
    { value: '', label: 'Pilih Peralatan' },
    { value: 'Lengkap', label: 'Lengkap & Siap Dipakai' },
    { value: 'Sebagian', label: 'Sebagian (Kurang 1-2)' },
    { value: 'Tidak Siap', label: 'Tidak Siap (Perlu Mitigasi)' },
  ];

  const tekananDarahOptions = [
    { value: '', label: 'Pilih' },
    { value: 'Normal', label: 'Normal' },
    { value: 'Tidak Normal', label: 'Tidak Normal' },
  ];

  const [form, setForm] = useState({
    id: null,
    name: '',
    lokasiKerja: '',
    hasilAssessmentK3: '',
    apdWajib: '',
    daftarPeralatan: '',
    dokumenJSA: '',
    dokumenJSAName: '',
    sertifikatKerja: '',
    sertifikatKerjaName: '',
    checklistSehat: false,
    checklistTekananNormal: false,
    checklistApdLengkap: false,
    checklistPeralatanSiap: false,
    checklistMemahamiJSA: false,
    checklistSertifikatBerlaku: false,
    checklistPeralatanTersedia: false,
    checklistPeralatanBaik: false,
    checklistPeralatanDiperiksa: false,
    checklistPeralatanAman: false,
    checklistPeralatanLengkap: false,
    tekananDarah: '',
    kondisiKesehatan: '',
    riskScale: 'Medium',
    healthPhysical: 'Yes',
    healthMental: 'Yes',
    apdComplete: false,
    toolsOk: false,
    certValid: false,
    hasJantungDisease: false,
    hasMenularDisease: false,
  });

  const [assessments, setAssessments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/assessments`);
      if (res.ok) {
        const data = await res.json();
        setAssessments(data);
      }
    } catch (err) {
      console.error('Gagal load assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setDecision(null);
    setForm({
      id: null,
      name: '',
      lokasiKerja: '',
      hasilAssessmentK3: '',
      apdWajib: '',
      daftarPeralatan: '',
      dokumenJSA: '',
      dokumenJSAName: '',
      sertifikatKerja: '',
      sertifikatKerjaName: '',
      checklistSehat: false,
      checklistTekananNormal: false,
      checklistApdLengkap: false,
      checklistPeralatanSiap: false,
      checklistMemahamiJSA: false,
      checklistSertifikatBerlaku: false,
      checklistPeralatanTersedia: false,
      checklistPeralatanBaik: false,
      checklistPeralatanDiperiksa: false,
      checklistPeralatanAman: false,
      checklistPeralatanLengkap: false,
      tekananDarah: '',
      kondisiKesehatan: '',
      riskScale: 'Medium',
      healthPhysical: 'Yes',
      healthMental: 'Yes',
      apdComplete: false,
      toolsOk: false,
      certValid: false,
      hasJantungDisease: false,
      hasMenularDisease: false,
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileUpload = (e, fieldName, fieldNameLabel) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        [fieldName]: reader.result,
        [fieldNameLabel]: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const evaluateFitToWork = () => {
    const semuaPeralatanValid =
      form.checklistPeralatanTersedia &&
      form.checklistPeralatanBaik &&
      form.checklistPeralatanDiperiksa &&
      form.checklistPeralatanAman &&
      form.checklistPeralatanLengkap;

    if (!semuaPeralatanValid) {
      return {
        status: 'Unfit',
        message: '❌ NOT FIT TO WORK\nPeralatan kerja tidak memenuhi persyaratan (tidak lengkap atau tidak layak). Harap dilakukan pengecekan dan perbaikan sebelum bekerja.',
      };
    }

    if (form.tekananDarah === 'Tidak Normal') {
      return {
        status: 'Unfit',
        message: '❌ NOT FIT TO WORK\nTekanan darah tidak normal. Harap konsultasi dengan medis sebelum bekerja.',
      };
    }

    const semuaChecklistUmum =
      form.checklistSehat &&
      form.checklistTekananNormal &&
      form.checklistApdLengkap &&
      form.checklistPeralatanSiap &&
      form.checklistMemahamiJSA &&
      form.checklistSertifikatBerlaku;

    if (!semuaChecklistUmum) {
      return {
        status: 'Unfit',
        message: '❌ NOT FIT TO WORK\nTerdapat persyaratan yang belum terpenuhi (kesehatan, APD, dokumen, atau pemahaman JSA). Harap lengkapi terlebih dahulu.',
      };
    }

    const managerDataLengkap =
      form.lokasiKerja &&
      form.hasilAssessmentK3 &&
      form.apdWajib &&
      form.daftarPeralatan;

    if (!managerDataLengkap) {
      return {
        status: 'Unfit',
        message: '❌ NOT FIT TO WORK\nData pekerjaan dari manager belum lengkap (lokasi, hasil assessment, APD, peralatan). Harap lengkapi terlebih dahulu.',
      };
    }

    return {
      status: 'Fit',
      message: '✅ FIT TO WORK\nPeralatan kerja dinyatakan lengkap dan layak digunakan. Seluruh persyaratan K3 telah terpenuhi. Silakan melanjutkan pekerjaan dengan aman.',
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return alert('Nama karyawan harus diisi');

    const { status, message } = evaluateFitToWork();

    const assessmentData = {
      ...form,
      status,
      decisionMessage: message,
      date: new Date().toISOString(),
      createdBy: session?.username || 'anonymous',
    };

    try {
      if (editingId) {
        await fetch(`${API_BASE}/api/assessments/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assessmentData),
        });
      } else {
        const res = await fetch(`${API_BASE}/api/assessments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assessmentData),
        });
        if (res.ok) {
          const newAss = await res.json();
          setNotifications([
            {
              _id: Date.now(),
              message: `📋 Karyawan ${form.name} dinyatakan ${status} untuk bekerja`,
              date: new Date().toISOString(),
              read: false,
            },
            ...notifications,
          ]);
        }
      }
      await loadAssessments();
      resetForm();
      setDecision({ status, message });
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan assessment');
    }
  };

  const handleEdit = (item) => {
    setForm({
      ...item,
      id: item._id,
    });
    setEditingId(item._id);
    setDecision({ status: item.status, message: item.decisionMessage });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus assessment ini?')) {
      try {
        await fetch(`${API_BASE}/api/assessments/${id}`, { method: 'DELETE' });
        await loadAssessments();
      } catch (err) {
        console.error(err);
        alert('Gagal hapus assessment');
      }
    }
  };

  const filteredAssessments = assessments.filter((item) =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAssessments = assessments.length;
  const fitCount = assessments.filter((a) => a.status === 'Fit').length;
  const fitWithNoteCount = assessments.filter((a) => a.status === 'Fit with Note').length;
  const unfitCount = assessments.filter((a) => a.status === 'Unfit').length;
  const fitPercentage = totalAssessments ? Math.round((fitCount / totalAssessments) * 100) : 0;

  const getStatusBadge = (status) => {
    if (status === 'Fit') return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg';
    if (status === 'Fit with Note') return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg';
    return 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-blue-500 animate-spin animation-delay-150"></div>
            <div className="absolute inset-4 rounded-full border-4 border-transparent border-t-purple-500 animate-spin animation-delay-300"></div>
            <FaGem className="absolute inset-0 m-auto text-4xl text-white" />
          </div>
          <p className="text-white text-xl mt-8 font-light tracking-wider">LOADING PREMIUM ASSESSMENT...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
      </div>

      <div className="relative z-10 p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header Premium */}
        <div className="relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-transparent to-purple-500/20"></div>
          <div className="relative p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                    <FaCrown className="text-white text-2xl" />
                  </div>
                  <span className="px-4 py-2 bg-white/10 backdrop-blur rounded-full text-emerald-300 text-sm font-semibold tracking-wider">
                    PREMIUM ASSESSMENT • REAL-TIME
                  </span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-black text-white mb-3">
                  Fit to Work <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">Assessment</span>
                </h1>
                <p className="text-gray-300 text-lg">Enterprise-grade worker safety evaluation system with real-time analytics</p>
                {session?.role && (
                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shadow-xl">
                      <span className="text-white">👑</span>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Welcome back,</p>
                      <p className="text-white font-bold">{session.role}</p>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={loadAssessments} className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur rounded-xl text-white hover:bg-white/20 transition-all">
                <FaSync /> Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Statistic Cards Grid Premium */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                  <FaClipboardList className="text-white text-xl" />
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-1">Total Assessment</p>
              <p className="text-3xl font-bold text-white">{totalAssessments}</p>
              <div className="mt-3 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                  <FaUserMd className="text-white text-xl" />
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-1">Fit</p>
              <p className="text-3xl font-bold text-white">{fitCount}</p>
              <div className="mt-3 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"></div>
              </div>
              <p className="text-emerald-400 text-sm mt-2">{fitPercentage}% dari total</p>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-amber-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
                  <FaStethoscope className="text-white text-xl" />
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-1">Fit with Note</p>
              <p className="text-3xl font-bold text-white">{fitWithNoteCount}</p>
              <div className="mt-3 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 to-rose-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg">
                  <FaHeartbeat className="text-white text-xl" />
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-1">Unfit</p>
              <p className="text-3xl font-bold text-white">{unfitCount}</p>
              <div className="mt-3 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-1/4 bg-gradient-to-r from-rose-500 to-rose-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* FORM UTAMA - Bagian 1 */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white/5 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 p-6 lg:p-8 hover:border-white/20 transition-all">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
              <FaBriefcase className="text-emerald-400" /> Input Data Pekerjaan dan Persyaratan K3
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 font-semibold mb-2">Lokasi Kerja</label>
                <input type="text" name="lokasiKerja" value={form.lokasiKerja} onChange={handleChange} className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
              </div>
              <div>
                <label className="block text-gray-300 font-semibold mb-2">Hasil Assessment K3</label>
                <select name="hasilAssessmentK3" value={form.hasilAssessmentK3} onChange={handleChange} className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" required>
                  {k3AssessmentOptions.map((opt) => (<option key={opt.value} value={opt.value} className="bg-gray-800">{opt.label}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 font-semibold mb-2">APD Wajib</label>
                <select name="apdWajib" value={form.apdWajib} onChange={handleChange} className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" required>
                  {apdWajibOptions.map((opt) => (<option key={opt.value} value={opt.value} className="bg-gray-800">{opt.label}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 font-semibold mb-2">Daftar Peralatan Kerja</label>
                <select name="daftarPeralatan" value={form.daftarPeralatan} onChange={handleChange} className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" required>
                  {peralatanOptions.map((opt) => (<option key={opt.value} value={opt.value} className="bg-gray-800">{opt.label}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 font-semibold mb-2">Upload Dokumen JSA</label>
                <div className="flex gap-2">
                  <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={(e) => handleFileUpload(e, 'dokumenJSA', 'dokumenJSAName')} className="hidden" id="jsa-upload" />
                  <button type="button" onClick={() => document.getElementById('jsa-upload').click()} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-xl flex items-center gap-2 transition-all"><FaUpload /> Pilih File</button>
                  {form.dokumenJSAName && <span className="text-sm text-gray-400 truncate self-center">{form.dokumenJSAName}</span>}
                </div>
              </div>
              <div>
                <label className="block text-gray-300 font-semibold mb-2">Upload Sertifikat Kerja</label>
                <div className="flex gap-2">
                  <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={(e) => handleFileUpload(e, 'sertifikatKerja', 'sertifikatKerjaName')} className="hidden" id="cert-upload" />
                  <button type="button" onClick={() => document.getElementById('cert-upload').click()} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl flex items-center gap-2 transition-all"><FaUpload /> Pilih File</button>
                  {form.sertifikatKerjaName && <span className="text-sm text-gray-400 truncate self-center">{form.sertifikatKerjaName}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Bagian 2: Checklist Umum Teknisi */}
          <div className="bg-white/5 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 p-6 lg:p-8 hover:border-white/20 transition-all">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
              <FaClipboardList className="text-emerald-400" /> Checklist Kelayakan Kerja
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 text-gray-300"><input type="checkbox" name="checklistSehat" checked={form.checklistSehat} onChange={handleChange} className="w-5 h-5" /> Saya dalam kondisi sehat dan siap bekerja</label>
              <label className="flex items-center gap-3 text-gray-300"><input type="checkbox" name="checklistTekananNormal" checked={form.checklistTekananNormal} onChange={handleChange} className="w-5 h-5" /> Tekanan darah saya dalam batas normal</label>
              <label className="flex items-center gap-3 text-gray-300"><input type="checkbox" name="checklistApdLengkap" checked={form.checklistApdLengkap} onChange={handleChange} className="w-5 h-5" /> Saya telah menggunakan APD lengkap</label>
              <label className="flex items-center gap-3 text-gray-300"><input type="checkbox" name="checklistPeralatanSiap" checked={form.checklistPeralatanSiap} onChange={handleChange} className="w-5 h-5" /> Peralatan kerja telah tersedia</label>
              <label className="flex items-center gap-3 text-gray-300"><input type="checkbox" name="checklistMemahamiJSA" checked={form.checklistMemahamiJSA} onChange={handleChange} className="w-5 h-5" /> Saya telah membaca dan memahami JSA</label>
              <label className="flex items-center gap-3 text-gray-300"><input type="checkbox" name="checklistSertifikatBerlaku" checked={form.checklistSertifikatBerlaku} onChange={handleChange} className="w-5 h-5" /> Saya memiliki sertifikat kerja yang masih berlaku</label>
            </div>
          </div>

          {/* Bagian 3: Pemeriksaan Peralatan Kerja */}
          <div className="bg-white/5 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 p-6 lg:p-8 hover:border-white/20 transition-all">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
              <FaTools className="text-emerald-400" /> Pemeriksaan Peralatan Kerja
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 text-gray-300"><input type="checkbox" name="checklistPeralatanTersedia" checked={form.checklistPeralatanTersedia} onChange={handleChange} className="w-5 h-5" /> Peralatan kerja tersedia sesuai kebutuhan</label>
              <label className="flex items-center gap-3 text-gray-300"><input type="checkbox" name="checklistPeralatanBaik" checked={form.checklistPeralatanBaik} onChange={handleChange} className="w-5 h-5" /> Peralatan dalam kondisi baik</label>
              <label className="flex items-center gap-3 text-gray-300"><input type="checkbox" name="checklistPeralatanDiperiksa" checked={form.checklistPeralatanDiperiksa} onChange={handleChange} className="w-5 h-5" /> Peralatan telah diperiksa sebelum digunakan</label>
              <label className="flex items-center gap-3 text-gray-300"><input type="checkbox" name="checklistPeralatanAman" checked={form.checklistPeralatanAman} onChange={handleChange} className="w-5 h-5" /> Peralatan aman digunakan</label>
              <label className="flex items-center gap-3 text-gray-300"><input type="checkbox" name="checklistPeralatanLengkap" checked={form.checklistPeralatanLengkap} onChange={handleChange} className="w-5 h-5" /> Tidak ada alat yang kurang</label>
            </div>
          </div>

          {/* Bagian 4: Data Kesehatan */}
          <div className="bg-white/5 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 p-6 lg:p-8 hover:border-white/20 transition-all">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
              <FaHeartbeat className="text-emerald-400" /> Data Kesehatan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-gray-300 font-semibold mb-2">Nama Karyawan</label><input type="text" name="name" value={form.name} onChange={handleChange} className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" required /></div>
              <div><label className="block text-gray-300 font-semibold mb-2">Tekanan Darah</label><select name="tekananDarah" value={form.tekananDarah} onChange={handleChange} className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">{tekananDarahOptions.map((opt) => (<option key={opt.value} value={opt.value} className="bg-gray-800">{opt.label}</option>))}</select></div>
              <div className="md:col-span-2"><label className="block text-gray-300 font-semibold mb-2">Kondisi Kesehatan Saat Ini</label><textarea name="kondisiKesehatan" value={form.kondisiKesehatan} onChange={handleChange} rows="2" className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Isi kondisi kesehatan Anda saat ini..." /></div>
            </div>
          </div>

          {/* Tombol Submit */}
          <div className="flex gap-4">
            <button type="submit" className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
              {editingId ? 'Update Assessment' : 'Submit Assessment'}
            </button>
            {editingId && (<button type="button" onClick={resetForm} className="bg-gray-600/50 hover:bg-gray-600 text-white px-8 py-4 rounded-xl font-bold transition-all">Batal</button>)}
          </div>
        </form>

        {/* Output Decision */}
        {decision && (
          <div className={`rounded-3xl p-8 shadow-2xl border-2 ${decision.status === 'Fit' ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border-emerald-500/50' : 'bg-gradient-to-r from-rose-500/20 to-rose-600/20 border-rose-500/50'} backdrop-blur`}>
            <div className="flex items-center gap-4">
              {decision.status === 'Fit' ? <FaCheckCircle className="text-emerald-400 text-4xl" /> : <FaTools className="text-rose-400 text-4xl" />}
              <h3 className="text-3xl font-bold text-white">{decision.status === 'Fit' ? '✅ FIT TO WORK' : '❌ NOT FIT TO WORK'}</h3>
            </div>
            <p className="mt-4 text-gray-300 whitespace-pre-line text-lg">{decision.message}</p>
          </div>
        )}

        {/* Tabel Riwayat Assessment Premium */}
        <div className="bg-white/5 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 p-6 lg:p-8 hover:border-white/20 transition-all">
          <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2"><FaClipboardList className="text-emerald-400" /> Riwayat Assessment</h2>
            <div className="relative"><FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Cari nama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64" /></div>
          </div>
          {filteredAssessments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Belum ada data assessment.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/10 rounded-xl">
                  <tr className="text-gray-300">
                    <th className="p-4 text-left">Nama</th>
                    <th className="p-4 text-left">Tanggal</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssessments.map((item) => (
                    <tr key={item._id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-white font-medium">{item.name}</td>
                      <td className="p-4 text-gray-400">{new Date(item.date).toLocaleDateString('id-ID')}</td>
                      <td className="p-4"><span className={`px-4 py-2 rounded-full text-xs font-bold ${getStatusBadge(item.status)}`}>{item.status}</span></td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleEdit(item)} className="text-emerald-400 hover:text-emerald-300 mr-4 transition"><FaEdit size={20} /></button>
                        <button onClick={() => handleDelete(item._id)} className="text-rose-400 hover:text-rose-300 transition"><FaTrash size={20} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">© 2024 JSMS HSSE - Enterprise Safety Management Platform</p>
          <p className="text-gray-600 text-xs mt-2">Powered by MongoDB Atlas | Real-time Data Sync</p>
        </div>
      </div>
    </div>
  );
};

export default FitToWorkForm;