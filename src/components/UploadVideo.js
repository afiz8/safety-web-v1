import React, { useState, useCallback, useContext } from 'react';
import { FaCloudUploadAlt, FaTimes } from 'react-icons/fa';
import { UserContext } from '../App';

const UploadVideo = ({ onClose, onVideoUploaded }) => {
  const { session } = useContext(UserContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  const handleFile = (file) => {
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      alert('Hanya file video yang diperbolehkan');
    }
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, []);

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);

  const handleSubmit = async () => {
    if (!title || !videoFile) {
      alert('Judul dan file video harus diisi');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('video', videoFile);
    formData.append('uploadedBy', session?.username || 'anonymous');

    try {
      const res = await fetch(`${API_BASE}/api/videos`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const newVideo = await res.json();
        if (onVideoUploaded) onVideoUploaded(newVideo);
        onClose();
      } else {
        const err = await res.json();
        alert('Gagal upload: ' + (err.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Gagal terhubung ke server');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Upload Video Baru
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <FaTimes size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <input
            type="text"
            placeholder="Judul Video"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
          />
          <textarea
            placeholder="Deskripsi (opsional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            className="w-full p-3 border rounded-xl"
          />

          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${
              isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
            }`}
          >
            {preview ? (
              <video src={preview} controls className="max-h-64 mx-auto rounded-lg" />
            ) : (
              <>
                <FaCloudUploadAlt className="text-5xl text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Seret & lepas video di sini, atau</p>
                <label className="mt-2 inline-block bg-purple-600 text-white px-6 py-2 rounded-full cursor-pointer hover:bg-purple-700">
                  Pilih dari komputer
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                </label>
              </>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadVideo;