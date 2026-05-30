// src/TestFirebase.js
import { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export default function TestFirebase() {
  const [status, setStatus] = useState('⏳ Mengecek...');
  const [data, setData] = useState([]);

  useEffect(() => {
    const cekKoneksi = async () => {
      try {
        // Coba buat collection sementara jika belum ada
        const testRef = collection(db, 'test_connection');
        const snapshot = await getDocs(testRef);
        setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setStatus('✅ Firebase KONEK! Bisa baca collection test_connection');
      } catch (err) {
        setStatus(`❌ Gagal: ${err.message}`);
        console.error(err);
      }
    };
    cekKoneksi();
  }, []);

  const tambahData = async () => {
    try {
      const testRef = collection(db, 'test_connection');
      await addDoc(testRef, {
        pesan: 'Test koneksi berhasil',
        waktu: serverTimestamp(),
      });
      setStatus('✅ Berhasil menambah data! Refresh...');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setStatus(`❌ Gagal tambah data: ${err.message}`);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-md m-4">
      <h2 className="text-lg font-bold">🔌 Test Firebase</h2>
      <p className="my-2">{status}</p>
      <button onClick={tambahData} className="bg-green-600 text-white px-3 py-1 rounded">
        Tambah Data Test
      </button>
      {data.length > 0 && (
        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}