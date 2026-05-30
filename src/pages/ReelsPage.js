import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHeart, FaRegHeart, FaShare, FaPlusCircle, FaPlay, FaPause,
  FaChartLine, FaTrophy, FaStar, FaMedal, FaClipboardList,
  FaCheckCircle, FaTimesCircle, FaSpinner, FaMoon, FaSun
} from 'react-icons/fa';
import { UserContext } from '../App';
import UploadVideo from '../components/UploadVideo';

const VideoFeed = ({ videos, onLike, onShare, onQuizComplete, userId }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [watchStartTime, setWatchStartTime] = useState(null);
  const videoRefs = useRef([]);
  const API_BASE = 'http://localhost:5000';

  const handleScroll = useCallback((e) => {
    const container = e.target;
    const index = Math.round(container.scrollTop / window.innerHeight);
    if (index !== currentIndex && index >= 0 && index < videos.length) {
      // Save watch duration for previous video
      if (watchStartTime && videos[currentIndex]) {
        const duration = (Date.now() - watchStartTime) / 1000;
        fetch(`${API_BASE}/api/watch-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            videoId: videos[currentIndex]._id,
            completed: false,
            watchDuration: duration
          })
        }).catch(console.error);
      }
      setCurrentIndex(index);
      setShowQuiz(false);
      setSelectedAnswer(null);
      setQuizResult(null);
      setWatchStartTime(Date.now());
      videoRefs.current.forEach((video, i) => {
        if (video) {
          if (i === index) video.play().catch(() => {});
          else video.pause();
        }
      });
      setPlaying(true);
    }
  }, [currentIndex, videos.length, userId, videos, watchStartTime]);

  useEffect(() => {
    const container = document.getElementById('reels-container');
    if (container) {
      container.addEventListener('scroll', handleScroll);
      setWatchStartTime(Date.now());
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    const video = videoRefs.current[currentIndex];
    if (video) {
      video.play().catch(() => {});
      setPlaying(true);
    }
    // Mark as completed after watching full video
    const handleEnded = () => {
      if (videos[currentIndex]?.quiz) {
        setShowQuiz(true);
      } else {
        fetch(`${API_BASE}/api/watch-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            videoId: videos[currentIndex]._id,
            completed: true
          })
        }).catch(console.error);
      }
    };
    if (video) {
      video.addEventListener('ended', handleEnded);
      return () => video.removeEventListener('ended', handleEnded);
    }
  }, [currentIndex, videos]);

  const togglePlay = () => {
    const video = videoRefs.current[currentIndex];
    if (video) {
      if (playing) video.pause();
      else video.play().catch(() => {});
      setPlaying(!playing);
    }
  };

  const handleQuizSubmit = async () => {
    const currentVideo = videos[currentIndex];
    const isCorrect = selectedAnswer === currentVideo.quiz.correctAnswer;
    setQuizResult(isCorrect);
    
    await fetch(`${API_BASE}/api/watch-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        videoId: currentVideo._id,
        completed: true,
        quizScore: isCorrect ? 100 : 0,
        quizPassed: isCorrect
      })
    }).catch(console.error);
    
    onQuizComplete && onQuizComplete(isCorrect);
    setTimeout(() => {
      setShowQuiz(false);
      setSelectedAnswer(null);
      setQuizResult(null);
    }, 2000);
  };

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white text-center p-6">
        <div className="text-6xl mb-4">📱</div>
        <p className="text-2xl font-bold">Belum ada video</p>
        <p className="text-gray-400 mt-2">Klik + untuk upload video</p>
      </div>
    );
  }

  return (
    <div
      id="reels-container"
      className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth"
      style={{ scrollSnapType: 'y mandatory' }}
    >
      {videos.map((video, idx) => (
        <div
          key={video._id}
          className="relative h-screen w-full snap-start bg-black flex items-center justify-center"
        >
          <video
            ref={el => videoRefs.current[idx] = el}
            src={video.url?.startsWith('http') ? video.url : `${API_BASE}${video.url}`}
            className="h-full w-full object-contain"
            loop={false}
            muted={false}
            playsInline
            onClick={togglePlay}
          />
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center text-white bg-black/30 opacity-0 hover:opacity-100 transition"
          >
            {playing ? <FaPause size={48} /> : <FaPlay size={48} />}
          </button>
          
          {/* Video Info Overlay */}
          <div className="absolute bottom-20 left-4 right-20 text-white">
            <h3 className="text-xl font-bold">{video.title}</h3>
            <p className="text-sm text-gray-200">{video.description}</p>
            <div className="flex gap-2 mt-2">
              <span className="px-2 py-0.5 bg-blue-500/80 rounded-full text-xs">{video.category}</span>
              {video.tags?.slice(0, 2).map(tag => <span key={tag} className="px-2 py-0.5 bg-gray-500/80 rounded-full text-xs">{tag}</span>)}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="absolute bottom-20 right-4 flex flex-col items-center gap-6">
            <button onClick={() => onLike(video._id)} className="text-white text-3xl transition-transform hover:scale-110">
              {video.likedByUser ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
            </button>
            <span className="text-white text-sm">{video.likes || 0}</span>
            <button onClick={() => onShare(video)} className="text-white text-3xl hover:scale-110 transition-transform">
              <FaShare />
            </button>
          </div>
          
          {/* View Counter */}
          <div className="absolute top-4 right-4 bg-black/50 rounded-full px-3 py-1 text-xs text-white">
            👁️ {video.views || 0}
          </div>
          
          {/* Quiz Modal */}
          {showQuiz && idx === currentIndex && video.quiz && !quizResult && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-4">📝 Quiz: {video.title}</h3>
                <p className="mb-4">{video.quiz.question}</p>
                <div className="space-y-2 mb-6">
                  {video.quiz.options.map((opt, i) => (
                    <label key={i} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input type="radio" name="quiz" value={i} onChange={() => setSelectedAnswer(i)} className="w-4 h-4" />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
                <button onClick={handleQuizSubmit} disabled={selectedAnswer === null} className="w-full py-2 bg-blue-500 text-white rounded-lg font-semibold disabled:opacity-50">
                  Submit
                </button>
              </div>
            </div>
          )}
          
          {/* Quiz Result */}
          {quizResult !== null && idx === currentIndex && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6">
              <div className={`rounded-2xl p-6 max-w-md w-full text-center ${quizResult ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                {quizResult ? (
                  <>
                    <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">Benar!</h3>
                    <p className="mt-2">{videos[currentIndex]?.quiz?.explanation || 'Pertahankan pengetahuan safety Anda!'}</p>
                    <p className="mt-2 text-sm">🎉 +20 poin!</p>
                  </>
                ) : (
                  <>
                    <FaTimesCircle className="text-6xl text-red-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-red-700 dark:text-red-300">Kurang tepat</h3>
                    <p className="mt-2">Jawaban benar: {video.quiz.options[video.quiz.correctAnswer]}</p>
                    <p className="mt-2 text-sm">📚 Tonton ulang untuk belajar lebih lanjut</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const ReelsPage = () => {
  const { session, darkMode, toggleDarkMode } = useContext(UserContext);
  const [videos, setVideos] = useState([]);
  const [popularVideos, setPopularVideos] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [userStats, setUserStats] = useState({ totalWatched: 0, totalCompleted: 0, totalPoints: 0 });
  const [showUpload, setShowUpload] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const API_BASE = 'http://localhost:5000';
  const userId = session?.userId || 'anonymous';

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const url = `${API_BASE}/api/videos?category=${categoryFilter}&userId=${userId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Gagal fetch video');
      const data = await res.json();
      setVideos(data);
    } catch (err) {
      console.error('Gagal fetch video:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularVideos = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/videos/popular`);
      if (res.ok) {
        const data = await res.json();
        setPopularVideos(data);
      }
    } catch (err) {
      console.error('Gagal fetch popular:', err);
    }
  };

  const fetchRecommendations = async () => {
    if (userId === 'anonymous') return;
    try {
      const res = await fetch(`${API_BASE}/api/videos/recommendations/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } catch (err) {
      console.error('Gagal fetch recommendations:', err);
    }
  };

  const fetchUserBadges = async () => {
    if (userId === 'anonymous') return;
    try {
      const res = await fetch(`${API_BASE}/api/user-badges/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUserBadges(data);
      }
    } catch (err) {
      console.error('Gagal fetch badges:', err);
    }
  };

  const fetchUserStats = async () => {
    if (userId === 'anonymous') return;
    try {
      const res = await fetch(`${API_BASE}/api/user-watch-stats/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUserStats(data);
      }
    } catch (err) {
      console.error('Gagal fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchVideos();
    fetchPopularVideos();
    fetchRecommendations();
    fetchUserBadges();
    fetchUserStats();
  }, [categoryFilter]);

  const handleLike = async (videoId) => {
    try {
      const res = await fetch(`${API_BASE}/api/videos/${videoId}/like`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        const data = await res.json();
        setVideos(prev => prev.map(v => 
          v._id === videoId ? { ...v, likedByUser: data.liked, likes: data.likes } : v
        ));
      }
    } catch (err) {
      console.error('Gagal like:', err);
    }
  };

  const handleShare = (video) => {
    const url = video.url?.startsWith('http') ? video.url : `${API_BASE}${video.url}`;
    navigator.clipboard.writeText(`Tonton video safety: ${video.title}\n${url}`);
    alert('Link video disalin! Bisa dibagikan ke WhatsApp dll.');
  };

  const handleQuizComplete = async (isCorrect) => {
    await fetchUserStats();
    await fetchUserBadges();
  };

  const getBadgeIcon = (type) => {
    switch(type) {
      case 'SafetyMaster': return <FaMedal className="text-yellow-500" />;
      case 'QuizChampion': return <FaStar className="text-purple-500" />;
      case 'ConsistentViewer': return <FaClipboardList className="text-green-500" />;
      case 'TopLearner': return <FaTrophy className="text-orange-500" />;
      default: return <FaStar />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-black">
      {/* Header Buttons */}
      <div className="fixed top-4 left-4 right-4 z-50 flex justify-between">
        <button onClick={() => setShowStats(!showStats)} className="bg-black/50 backdrop-blur-sm p-2 rounded-full text-white">
          <FaChartLine size={20} />
        </button>
        <div className="flex gap-2">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
            <option value="all">Semua</option>
            <option value="Safety">Safety</option>
            <option value="Training">Training</option>
            <option value="Incident">Incident</option>
            <option value="Toolbox">Toolbox</option>
            <option value="Emergency">Emergency</option>
          </select>
          <button onClick={toggleDarkMode} className="bg-black/50 backdrop-blur-sm p-2 rounded-full text-white">
            {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
          </button>
        </div>
      </div>
      
      {/* Stats Panel */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed top-0 left-0 bottom-0 w-80 bg-black/95 backdrop-blur-lg z-50 p-6 overflow-y-auto"
          >
            <button onClick={() => setShowStats(false)} className="absolute top-4 right-4 text-white text-2xl">&times;</button>
            <h2 className="text-xl font-bold text-white mb-6 mt-8">Statistik Anda</h2>
            
            <div className="space-y-6">
              <div className="bg-white/10 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-yellow-500">{userStats.totalPoints}</p>
                <p className="text-sm text-gray-400">Total Poin</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-2xl p-3 text-center">
                  <p className="text-xl font-bold text-white">{userStats.totalWatched}</p>
                  <p className="text-xs text-gray-400">Video Ditonton</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-3 text-center">
                  <p className="text-xl font-bold text-green-400">{userStats.totalCompleted}</p>
                  <p className="text-xs text-gray-400">Selesai</p>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-white mt-4">🏆 Badge Anda</h3>
              <div className="space-y-2">
                {userBadges.length === 0 && <p className="text-gray-400 text-sm">Belum ada badge. Tonton video dan ikuti quiz!</p>}
                {userBadges.map(badge => (
                  <div key={badge._id} className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                    {getBadgeIcon(badge.badgeType)}
                    <div>
                      <p className="font-semibold text-white">{badge.badgeType}</p>
                      <p className="text-xs text-gray-400">+{badge.points} poin</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <h3 className="text-lg font-semibold text-white mt-4">🔥 Trending</h3>
              <div className="space-y-2">
                {popularVideos.slice(0, 5).map(v => (
                  <div key={v._id} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-yellow-500">👁️ {v.views}</span>
                    <span className="truncate">{v.title}</span>
                  </div>
                ))}
              </div>
              
              <h3 className="text-lg font-semibold text-white mt-4">🤖 Rekomendasi</h3>
              <div className="space-y-2">
                {recommendations.slice(0, 3).map(v => (
                  <div key={v._id} className="text-sm text-gray-300 p-2 bg-white/5 rounded-lg">
                    {v.title}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Upload Button */}
      {(session?.role === 'Admin' || session?.role === 'Supervisor') && (
        <button
          onClick={() => setShowUpload(true)}
          className="fixed bottom-24 right-4 z-50 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform"
        >
          <FaPlusCircle size={28} />
        </button>
      )}
      
      {showUpload && (
        <UploadVideo
          onClose={() => setShowUpload(false)}
          onVideoUploaded={(newVideo) => {
            setVideos(prev => [newVideo, ...prev]);
            setShowUpload(false);
            fetchPopularVideos();
          }}
        />
      )}
      
      <VideoFeed 
        videos={videos} 
        onLike={handleLike} 
        onShare={handleShare} 
        onQuizComplete={handleQuizComplete}
        userId={userId}
      />
    </div>
  );
};

export default ReelsPage;