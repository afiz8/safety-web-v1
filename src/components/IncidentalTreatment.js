import React, { useState, useContext } from "react";
import { UserContext } from "../App";

const IncidentalTreatment = () => {
  const { session } = useContext(UserContext);
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  const [formData, setFormData] = useState({
    tipe: "FIRST-AID",
    jumlahPekerja: "",
    lembur: "",
    jksOrganik: "",
    tkjp: "",
    jksTkjp: "",
    jumlahProject: "",
    lemburProject: "",
    rangkuman: "",
    entitas: "",
    subEntitas: "",
    site: "",
    tanggal: "",
    kronologi: "",
    fileFoto1: null,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [submittedData, setSubmittedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, fileFoto1: e.target.files[0] }));
  };

  const uploadFile = async (file) => {
    if (!file) return '';
    const formDataFile = new FormData();
    formDataFile.append('files', file);
    formDataFile.append('relatedId', 'incidental_temp');
    formDataFile.append('uploadedBy', session?.username || 'anonymous');
    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formDataFile,
      });
      const result = await res.json();
      if (res.ok && result.files && result.files.length > 0) {
        return result.files[0].url;
      }
      return '';
    } catch (err) {
      console.error('Upload file error:', err);
      return '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let fileUrl = '';
      if (formData.fileFoto1) {
        fileUrl = await uploadFile(formData.fileFoto1);
      }

      const payload = {
        tipe: formData.tipe,
        jumlahPekerja: formData.jumlahPekerja,
        lembur: formData.lembur,
        jksOrganik: formData.jksOrganik,
        tkjp: formData.tkjp,
        jksTkjp: formData.jksTkjp,
        jumlahProject: formData.jumlahProject,
        lemburProject: formData.lemburProject,
        rangkuman: formData.rangkuman,
        entitas: formData.entitas,
        subEntitas: formData.subEntitas,
        site: formData.site,
        tanggal: formData.tanggal,
        kronologi: formData.kronologi,
        fileFoto1: fileUrl,
        createdBy: session?.username || 'anonymous'
      };

      const response = await fetch(`${API_BASE}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        setSubmittedData(result);
        alert("Data berhasil disimpan ke server!");
      } else {
        setError(result.error || 'Gagal menyimpan data');
        alert('Gagal menyimpan: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan jaringan');
      alert('Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      tipe: "FIRST-AID",
      jumlahPekerja: "",
      lembur: "",
      jksOrganik: "",
      tkjp: "",
      jksTkjp: "",
      jumlahProject: "",
      lemburProject: "",
      rangkuman: "",
      entitas: "",
      subEntitas: "",
      site: "",
      tanggal: "",
      kronologi: "",
      fileFoto1: null,
    });
    setCurrentPage(1);
    setError('');
  };

  const handlePrefill = () => {
    setFormData({
      tipe: "FIRST-AID",
      jumlahPekerja: "10",
      lembur: "2",
      jksOrganik: "1",
      tkjp: "5",
      jksTkjp: "0",
      jumlahProject: "3",
      lemburProject: "1",
      rangkuman: "Demo rangkuman data organik dan project.",
      entitas: "PT Patra Logistik",
      subEntitas: "Logistik 1",
      site: "Site A",
      tanggal: "2024-10-06",
      kronologi: "Demo kronologi: Pekerja mengalami insiden ringan saat lembur project. First-aid diberikan di site.",
      fileFoto1: null,
    });
    setCurrentPage(1);
  };

  const ProgressBar = () => (
    <div className="w-full bg-gray-200 rounded-full h-2 mb-6 shadow-inner">
      <div className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 h-2 rounded-full shadow-lg transition-all duration-500 ease-in-out" style={{ width: `${(currentPage / 3) * 100}%` }} />
    </div>
  );

  const PageIndicator = () => (
    <div className="flex justify-center space-x-2 mb-6">
      {[1,2,3].map((p) => (
        <div key={p} className={`w-3 h-3 rounded-full transition-all duration-300 ${currentPage === p ? 'bg-orange-500 scale-125 shadow-md' : 'bg-gray-300'}`} />
      ))}
    </div>
  );

  const input = "w-full p-4 text-base border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-2 ring-orange-200 outline-none shadow-sm transition-all placeholder-gray-400";

  const Page1 = () => (
    <div className="space-y-3">
      <h2 className="font-bold">Data Organik</h2>
      <input name="jumlahPekerja" value={formData.jumlahPekerja} onChange={handleChange} placeholder="Jumlah Pekerja" className={input} />
      <input name="lembur" value={formData.lembur} onChange={handleChange} placeholder="Lembur" className={input} />
      <input name="jksOrganik" value={formData.jksOrganik} onChange={handleChange} placeholder="JKS Organik" className={input} />
      <h2 className="font-bold mt-3">Outsource</h2>
      <input name="tkjp" value={formData.tkjp} onChange={handleChange} placeholder="TKJP" className={input} />
      <input name="jksTkjp" value={formData.jksTkjp} onChange={handleChange} placeholder="JKS TKJP" className={input} />
      <h2 className="font-bold mt-3">Project</h2>
      <input name="jumlahProject" value={formData.jumlahProject} onChange={handleChange} placeholder="Jumlah Project" className={input} />
      <input name="lemburProject" value={formData.lemburProject} onChange={handleChange} placeholder="Lembur Project" className={input} />
      <textarea name="rangkuman" value={formData.rangkuman} onChange={handleChange} placeholder="Rangkuman" className={input} />
    </div>
  );

  const Page2 = () => (
    <div className="space-y-3">
      <h2 className="font-bold">FIRST-AID</h2>
      <select name="entitas" value={formData.entitas} onChange={handleChange} className={input}>
        <option value="">Entitas</option>
        <option>PT Patra Logistik</option>
        <option>PT Patra SK</option>
      </select>
      <select name="subEntitas" value={formData.subEntitas} onChange={handleChange} className={input}>
        <option value="">Sub Entitas</option>
        <option>Logistik 1</option>
        <option>Logistik 2</option>
      </select>
      <select name="site" value={formData.site} onChange={handleChange} className={input}>
        <option value="">Site</option>
        <option>Site A</option>
        <option>Site B</option>
      </select>
      <input type="date" name="tanggal" value={formData.tanggal} onChange={handleChange} className={input} />
      <textarea name="kronologi" value={formData.kronologi} onChange={handleChange} placeholder="Kronologi" className={input} />
      <input type="file" onChange={handleFileChange} className="w-full p-2 border rounded" />
    </div>
  );

  const Page3 = () => (
    <div className="space-y-3">
      <h2 className="font-bold">MEDICAL-TREATMENT</h2>
      <select name="entitas" value={formData.entitas} onChange={handleChange} className={input}>
        <option value="">Entitas</option>
        <option>PT Patra Logistik</option>
        <option>PT Patra SK</option>
      </select>
      <select name="subEntitas" value={formData.subEntitas} onChange={handleChange} className={input}>
        <option value="">Sub Entitas</option>
        <option>Logistik 1</option>
        <option>Logistik 2</option>
      </select>
      <select name="site" value={formData.site} onChange={handleChange} className={input}>
        <option value="">Site</option>
        <option>Site A</option>
        <option>Site B</option>
      </select>
      <input type="date" name="tanggal" value={formData.tanggal} onChange={handleChange} className={input} />
      <textarea name="kronologi" value={formData.kronologi} onChange={handleChange} className={input} />
      <input type="file" onChange={handleFileChange} className="w-full p-2 border rounded" />
    </div>
  );

  const ResultsPage = ({ data, onReset }) => (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold text-green-600">✅ Data Submit Berhasil!</h2>
      <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm font-mono max-h-96">
        {JSON.stringify(data, null, 2)}
      </pre>
      <div className="flex gap-3">
        <button type="button" onClick={onReset} className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
          Kembali ke Form
        </button>
        <button type="button" onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          Copy JSON
        </button>
      </div>
    </div>
  );

  if (submittedData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex justify-center items-start p-6 pt-20">
        <div className="bg-white w-full max-w-lg p-8 rounded-3xl shadow-2xl">
          <ResultsPage data={submittedData} onReset={() => setSubmittedData(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-6">
      <div className="bg-white w-full max-w-2xl p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold text-gray-800 mb-3 text-center drop-shadow-sm">📋 Incidental Treatment</h1>
        <p className="text-gray-600 mb-8 text-center text-lg px-4 leading-relaxed">Form laporan insiden K3 yang mudah digunakan</p>
        <ProgressBar />
        <PageIndicator />
        <button
          type="button"
          onClick={handlePrefill}
          className="w-full max-w-md mx-auto block px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all duration-200 text-lg mb-8 border-0"
        >
          ✨ Isi Data Demo - Test Submit Cepat
        </button>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit}>
          {currentPage === 1 && <Page1 />}
          {currentPage === 2 && <Page2 />}
          {currentPage === 3 && <Page3 />}
          <div className="flex justify-between mt-12 pb-24">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base border-0 mr-4"
            >
              ← Previous
            </button>
            <span className="text-xl font-bold text-gray-800 self-center">{currentPage} / 3</span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(3, p + 1))}
              disabled={currentPage === 3}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base ml-4 border-0"
            >
              Next →
            </button>
          </div>
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-1">
            <div className="flex gap-3">
              <button type="button" onClick={handleReset} className="flex-1 py-4 px-6 bg-gradient-to-r from-slate-400 to-slate-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all text-lg border-0">
                🔄 Reset
              </button>
              <button type="submit" disabled={loading} className="flex-1 py-4 px-6 bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all text-lg border-0 disabled:opacity-50">
                {loading ? 'Menyimpan...' : '🚀 Submit'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncidentalTreatment;