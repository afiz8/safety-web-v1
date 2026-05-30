import React, { useState, useContext } from 'react';
import { UserContext } from '../App';

const FileUpload = ({ 
  onFilesChange, 
  maxFiles = 5, 
  acceptedTypes = '*/*', 
  label = 'Upload Files (Photos/Documents)',
  relatedId = '', // untuk kaitkan ke data tertentu (opsional)
}) => {
  const { session } = useContext(UserContext);
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles) => {
    const remainingSlots = maxFiles - files.length;
    const toAdd = newFiles.slice(0, remainingSlots);
    setFiles(prev => [...prev, ...toAdd]);
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  const uploadAll = async () => {
    if (files.length === 0) {
      alert('Tidak ada file untuk diupload');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('relatedId', relatedId);
    formData.append('uploadedBy', session?.username || 'anonymous');

    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (res.ok) {
        alert(`${result.files.length} file berhasil diupload!`);
        setFiles([]);
        // Panggil callback dengan data file yang sudah diupload
        if (onFilesChange) onFilesChange(result.files);
        // Refresh daftar file yang sudah diupload
        fetchUploadedFiles();
      } else {
        alert('Gagal upload: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengupload file');
    } finally {
      setUploading(false);
    }
  };

  const fetchUploadedFiles = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/files?relatedId=${relatedId}`);
      const data = await res.json();
      setUploadedFiles(data);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteFile = async (fileId) => {
    if (window.confirm('Yakin hapus file ini?')) {
      try {
        await fetch(`${API_BASE}/api/files/${fileId}`, { method: 'DELETE' });
        fetchUploadedFiles();
      } catch (err) {
        alert('Gagal hapus file');
      }
    }
  };

  React.useEffect(() => {
    fetchUploadedFiles();
  }, [relatedId]);

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    return '📎';
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} - Max {maxFiles} files
      </label>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          dragging
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30'
            : 'border-gray-300 hover:border-blue-400 dark:border-gray-600'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <div className="text-4xl mb-4">📎</div>
        <p className="text-lg font-semibold mb-2">Drop files here or click to browse</p>
        <p className="text-sm text-gray-500 mb-4">Supports images, PDFs, docs (up to 10MB each)</p>
        <input
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleChange}
          className="hidden"
          id="file-upload-input"
        />
        <label
          htmlFor="file-upload-input"
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold cursor-pointer transition-colors shadow-lg"
        >
          Choose Files
        </label>
      </div>

      {/* Preview file yang akan diupload */}
      {files.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl">
          <h4 className="font-semibold mb-2">📋 File siap upload ({files.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {files.map((file, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded-lg shadow">
                <span className="truncate text-sm">{file.name}</span>
                <button onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700 text-xl leading-5">×</button>
              </div>
            ))}
          </div>
          <button
            onClick={uploadAll}
            disabled={uploading}
            className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl font-bold disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : `Upload ${files.length} file ke server`}
          </button>
        </div>
      )}

      {/* Daftar file yang sudah diupload */}
      {uploadedFiles.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">📁 File tersimpan ({uploadedFiles.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {uploadedFiles.map((file) => (
              <div key={file._id} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl shadow-sm">
                <div className="text-2xl mb-1">{getFileIcon(file.mimeType)}</div>
                <p className="text-xs font-mono truncate" title={file.originalName}>{file.originalName}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                <div className="flex gap-2 mt-2">
                  <a href={`${API_BASE}${file.url}`} target="_blank" rel="noreferrer" className="text-blue-500 text-xs">Lihat</a>
                  <button onClick={() => deleteFile(file._id)} className="text-red-500 text-xs">Hapus</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;