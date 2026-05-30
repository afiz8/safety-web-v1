import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserContext } from '../App';

const JSAHistory = () => {
  const { session } = useContext(UserContext);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [selectedJSA, setSelectedJSA] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const containerRef = useRef(null);
  const touchStartY = useRef(0);

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:5000/backend-kuzu');
      if (!res.ok) throw new Error('Gagal fetch');
      const data = await res.json();
      setList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e) => {
    if (loading || refreshing) return;
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop === 0) {
      const deltaY = e.touches[0].clientY - touchStartY.current;
      if (deltaY > 60) {
        e.preventDefault();
        setRefreshing(true);
        fetchData();
      }
    }
  };

  const toggleDetail = (id) => {
    setSelectedId(selectedId === id ? null : id);
  };

  const openBottomSheet = (jsa) => {
    setSelectedJSA(jsa);
    setBottomSheetOpen(true);
  };

  const updateApproval = async (newStatus) => {
    if (!selectedJSA) return;
    try {
      const res = await fetch(`http://localhost:5000/backend-kuzu/${selectedJSA._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supervisorApproval: session?.name || 'Supervisor',
          status: newStatus
        })
      });
      if (!res.ok) throw new Error('Gagal update');
      const result = await res.json();
      setList(prev => prev.map(item => item._id === selectedJSA._id ? result.data : item));
      setBottomSheetOpen(false);
      setSelectedJSA(null);
    } catch (err) {
      console.error(err);
      alert('Gagal mengubah status');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/backend-kuzu/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Gagal hapus');
      setList(prev => prev.filter(item => item._id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus data');
    }
  };

  const canApprove = session?.role === 'Supervisor' || session?.role === 'Admin';
  const canDelete = session?.role === 'Admin'; // hanya Admin yang boleh hapus (bisa disesuaikan)

  const SkeletonCard = () => (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 shadow-md animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-16">
      <div className="text-7xl mb-4">📋</div>
      <h3 className="text-xl font-semibold text-gray-700">Belum ada data JSA</h3>
      <p className="text-gray-500 mt-2">Silakan buat Job Safety Analysis pertama Anda</p>
      <button onClick={() => window.location.href = '/jsa-form'} className="mt-6 px-6 py-2.5 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition active:scale-95">+ Buat JSA</button>
    </div>
  );

  const StatusChip = ({ status, supervisorName }) => {
    if (status === 'Approved') {
      return (
        <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          Disetujui oleh {supervisorName || '-'}
        </div>
      );
    }
    if (status === 'Rejected') {
      return (
        <div className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          Ditolak
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold">
        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
        Belum disetujui
      </div>
    );
  };

  const JSACard = ({ jsa }) => {
    const isOpen = selectedId === jsa._id;
    const riskColor = {
      Low: 'bg-green-100 text-green-700',
      Medium: 'bg-yellow-100 text-yellow-700',
      High: 'bg-red-100 text-red-700'
    }[jsa.overallRisk] || 'bg-gray-100 text-gray-700';

    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden border border-white/40 p-5">
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800">{jsa.jobTitle}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{jsa.location} • {jsa.date}</p>
          </div>
          <div className="flex gap-2 items-center">
            <div className={`px-2 py-1 rounded-full text-xs font-semibold ${riskColor}`}>
              {jsa.overallRisk === 'Low' ? '🟢 Rendah' : jsa.overallRisk === 'Medium' ? '🟡 Sedang' : '🔴 Tinggi'}
            </div>
            {canDelete && (
              <button
                onClick={() => setConfirmDeleteId(jsa._id)}
                className="text-gray-400 hover:text-red-500 transition p-1"
                title="Hapus"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <StatusChip status={jsa.status} supervisorName={jsa.supervisorApproval} />
          {canApprove && (!jsa.status || jsa.status === 'Pending') && (
            <button
              onClick={() => openBottomSheet(jsa)}
              className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition active:scale-95"
            >
              ✍️ Beri Persetujuan
            </button>
          )}
        </div>

        <button onClick={() => toggleDetail(jsa._id)} className="mt-3 text-blue-500 text-sm flex items-center gap-1 focus:outline-none transition-all active:scale-95">
          {isOpen ? 'Sembunyikan detail ▲' : 'Lihat detail ▼'}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 pt-3 border-t border-gray-200/50"
            >
              <p className="text-sm text-gray-700"><span className="font-semibold">Jumlah bahaya:</span> {jsa.hazards?.length || 0}</p>
              <p className="text-sm text-gray-700 mt-1"><span className="font-semibold">Tim:</span> {jsa.teamMembers || '-'}</p>
              {jsa.additionalNotes && <p className="text-sm text-gray-700 mt-1"><span className="font-semibold">Catatan:</span> {jsa.additionalNotes}</p>}
              <p className="text-xs text-gray-400 mt-2">ID: {jsa._id}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const BottomSheet = () => {
    if (!bottomSheetOpen) return null;
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setBottomSheetOpen(false)} />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-t-3xl shadow-2xl p-6 pb-8"
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-center">Persetujuan JSA</h3>
            <p className="text-center text-gray-500 text-sm mt-1">{selectedJSA?.jobTitle}</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => updateApproval('Approved')} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold shadow-md hover:bg-green-600 transition active:scale-95">✓ Setujui</button>
              <button onClick={() => updateApproval('Rejected')} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold shadow-md hover:bg-red-600 transition active:scale-95">✗ Tolak</button>
            </div>
            <button onClick={() => setBottomSheetOpen(false)} className="w-full mt-3 py-2 text-gray-500 text-sm hover:text-gray-700 transition">Batal</button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const ConfirmDeleteModal = () => {
    if (!confirmDeleteId) return null;
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDeleteId(null)} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6"
          >
            <h3 className="text-xl font-bold text-gray-800">Hapus Data</h3>
            <p className="text-gray-600 mt-2">Apakah Anda yakin ingin menghapus JSA ini? Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2 rounded-full border border-gray-300 text-gray-700">Batal</button>
              <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 py-2 rounded-full bg-red-500 text-white font-semibold">Hapus</button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <>
      <div ref={containerRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} className="min-h-screen bg-gradient-to-br from-blue-50/60 via-white/40 to-indigo-50/60 py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/50 backdrop-blur-md rounded-3xl p-5 mb-6 shadow-sm border border-white/40">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">📋 Riwayat JSA</h1>
            <p className="text-gray-500 text-sm mt-1">Semua Job Safety Analysis yang telah dibuat</p>
          </div>

          {refreshing && <div className="text-center py-2 text-blue-500 text-sm flex justify-center items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> Menyegarkan...</div>}

          {loading ? (
            <div className="space-y-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
          ) : list.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">{list.map(jsa => <JSACard key={jsa._id} jsa={jsa} />)}</div>
          )}
        </div>
      </div>
      <BottomSheet />
      <ConfirmDeleteModal />
    </>
  );
};

export default JSAHistory;