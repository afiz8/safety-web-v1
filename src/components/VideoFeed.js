import React, { useEffect, useState, useRef } from 'react';
import { FaHeart, FaRegHeart, FaComment, FaShare, FaTimes, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const VideoFeed = ({ videos, onLike, onShare }) => {
  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-black">
      {videos.map((video) => (
        <VideoItem key={video._id} video={video} onLike={onLike} onShare={onShare} />
      ))}
    </div>
  );
};

const VideoItem = ({ video, onLike, onShare }) => {
  const [showControls, setShowControls] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Ambil komentar dari backend
  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/comments/${video._id}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Gagal fetch komentar:', err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [video._id]);

  // Ekstrak ID YouTube
  const getYouTubeId = (url) => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/shorts\/)([^?&#]+)/,
      /(?:youtu\.be\/)([^?&#]+)/,
      /(?:youtube\.com\/watch\?v=)([^&?#]+)/,
      /(?:youtube\.com\/embed\/)([^?&#]+)/
    ];
    for (let p of patterns) {
      const match = url.match(p);
      if (match) return match[1];
    }
    return null;
  };

  const isYouTube = (url) => url && (url.includes('youtube.com') || url.includes('youtu.be'));
  const videoId = getYouTubeId(video.url);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&rel=0&modestbranding=1` : null;

  // Autoplay video lokal
  useEffect(() => {
    if (isYouTube(video.url) || !videoRef.current) return;
    const el = videoRef.current;
    el.muted = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(e => console.log(e));
          setIsPlaying(true);
        } else {
          el.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (el) el.pause();
    };
  }, [video.url]);

  const togglePlayPause = () => {
    if (!isYouTube(video.url) && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(e => console.log(e));
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (!isYouTube(video.url) && videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video._id,
          text: newComment,
          user: localStorage.getItem('jsms_username') || 'Pengguna JSMS'
        })
      });
      if (res.ok) {
        const savedComment = await res.json();
        setComments(prev => [savedComment, ...prev]);
        setNewComment('');
      } else {
        alert('Gagal menambah komentar');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menambah komentar');
    }
  };

  const videoUrl = video.url?.startsWith('http') ? video.url : `${API_BASE}${video.url}`;

  return (
    <div
      className="relative h-screen w-full snap-start bg-black flex items-center justify-center"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {isYouTube(video.url) && videoId ? (
        <iframe className="h-full w-full object-contain" src={embedUrl} title={video.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
      ) : (
        <video ref={videoRef} src={videoUrl} className="h-full w-full object-contain" loop playsInline preload="metadata" onClick={togglePlayPause} onError={e => console.error(e)} />
      )}

      {/* Overlay teks */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
        <h3 className="text-xl font-bold">{video.title}</h3>
        <p className="text-sm opacity-90 mt-1">{video.description}</p>
      </div>

      {/* Tombol interaksi kanan */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center">
        <button onClick={() => onLike(video._id)} className="flex flex-col items-center group">
          {video.liked ? <FaHeart className="text-red-500 text-3xl" /> : <FaRegHeart className="text-white text-3xl group-hover:scale-110 transition" />}
          <span className="text-xs text-white mt-1">{video.likesCount || 0}</span>
        </button>
        <button onClick={() => setShowCommentModal(true)} className="flex flex-col items-center group">
          <FaComment className="text-white text-3xl group-hover:scale-110 transition" />
          <span className="text-xs text-white mt-1">{comments.length}</span>
        </button>
        <button onClick={() => onShare(video)} className="flex flex-col items-center group">
          <FaShare className="text-white text-3xl group-hover:scale-110 transition" />
          <span className="text-xs text-white mt-1">Share</span>
        </button>
      </div>

      {/* Tombol mute/unmute */}
      {!isYouTube(video.url) && videoRef.current && (
        <button onClick={toggleMute} className="absolute bottom-32 right-4 bg-black/50 rounded-full p-2 text-white hover:bg-black/70">
          {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
        </button>
      )}

      {/* Tombol play/pause */}
      {!isYouTube(video.url) && (!isPlaying || showControls) && (
        <button onClick={togglePlayPause} className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full w-16 h-16 m-auto backdrop-blur-sm">
          {isPlaying ? '⏸️' : '▶️'}
        </button>
      )}

      {/* Modal Komentar */}
      {showCommentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowCommentModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Komentar</h3>
              <button onClick={() => setShowCommentModal(false)} className="text-gray-500"><FaTimes /></button>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
              {comments.length === 0 ? <p className="text-gray-500 text-center">Belum ada komentar.</p> : comments.map(c => (
                <div key={c._id} className="border-b pb-2">
                  <p className="font-semibold">{c.user}</p>
                  <p className="text-gray-700">{c.text}</p>
                  <p className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Tulis komentar..." value={newComment} onChange={e => setNewComment(e.target.value)} className="flex-1 border rounded-xl p-2" />
              <button onClick={addComment} className="bg-blue-600 text-white px-4 py-2 rounded-xl">Kirim</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoFeed;