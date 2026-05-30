import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHeart, FaComment, FaShare, FaBookmark, FaVolumeUp, 
  FaVolumeMute, FaPlay, FaPause, FaRobot, FaChartLine,
  FaFire, FaCheckCircle, FaClock, FaMicrophone
} from 'react-icons/fa';

const SafetyReels = ({ user, darkMode }) => {
  const [moments, setMoments] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(null);
  const [aiTip, setAiTip] = useState(null);
  const [showStats, setShowStats] = useState(false);
  
  const videoRef = useRef(null);
  const observerRef = useRef(null);
  
  const API_BASE = 'http://localhost:5000';
  const userId = user?.userId || 'anonymous';
  
  // Fetch safety moments
  const fetchMoments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/safety-moments?limit=20&userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setMoments(data);
      }
    } catch (err) {
      console.error('Gagal fetch moments:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch user progress
  const fetchProgress = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/safety-progress/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProgress(data);
      }
    } catch (err) {
      console.error('Gagal fetch progress:', err);
    }
  };
  
  // Fetch AI tip
  const fetchAITip = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ai-safety-tip`);
      if (res.ok) {
        const data = await res.json();
        setAiTip(data);
      }
    } catch (err) {
      console.error('Gagal fetch AI tip:', err);
    }
  };
  
  useEffect(() => {
    fetchMoments();
    fetchProgress();
    fetchAITip();
  }, []);
  
  // Mark as read when viewing
  const markAsRead = useCallback(async (momentId) => {
    try {
      await fetch(`${API_BASE}/api/safety-moments/${momentId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, timeSpent: 30 })
      });
      fetchProgress();
    } catch (err) {
      console.error('Gagal mark as read:', err);
    }
  }, [userId]);
  
  // Handle like
  const handleLike = async (momentId, index) => {
    try {
      const res = await fetch(`${API_BASE}/api/safety-moments/${momentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        const data = await res.json();
        const newMoments = [...moments];
        newMoments[index].likes = data.likes;
        newMoments[index].liked = data.liked;
        setMoments(newMoments);
      }
    } catch (err) {
      console.error('Gagal like:', err);
    }
  };
  
  // Intersection Observer untuk autoplay video
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5
    };
    
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const videoElement = entry.target.querySelector('video');
        if (entry.isIntersecting && videoElement && playing) {
          videoElement.play().catch(e => console.log('Autoplay prevented:', e));
          setCurrentIndex(parseInt(entry.target.dataset.index));
          markAsRead(moments[parseInt(entry.target.dataset.index)]?._id);
        } else if (videoElement) {
          videoElement.pause();
        }
      });
    }, options);
    
    const slides = document.querySelectorAll('.safety-reel-slide');
    slides.forEach(slide => observerRef.current?.observe(slide));
    
    return () => observerRef.current?.disconnect();
  }, [moments, playing, markAsRead]);
  
  // Handle video play/pause
  const togglePlay = () => {
    const currentVideo = document.querySelector(`.safety-reel-slide[data-index="${currentIndex}"] video`);
    if (currentVideo) {
      if (playing) {
        currentVideo.pause();
      } else {
        currentVideo.play().catch(e => console.log('Play failed:', e));
      }
      setPlaying(!playing);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  return (
    <div className={`h-screen overflow-y-scroll snap-y snap-mandatory ${darkMode ? 'bg-black' : 'bg-gray-900'}`}>
      {/* Header with progress */}
      <div className="fixed top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-white text-xl font-bold">Safety Reels</h1>
            <p className="text-white/70 text-sm">Learn safety in seconds</p>
          </div>
          <div className="flex gap-3">
            {/* Daily streak */}
            <div className="flex items-center gap-1 bg-black/50 rounded-full px-3 py-1">
              <FaFire className="text-orange-500" />
              <span className="text-white text-sm">{progress?.streak || 0} days</span>
            </div>
            {/* Total read */}
            <div className="flex items-center gap-1 bg-black/50 rounded-full px-3 py-1">
              <FaCheckCircle className="text-green-500" />
              <span className="text-white text-sm">{progress?.totalReadCount || 0}</span>
            </div>
            {/* AI Tip Button */}
            <button 
              onClick={() => setShowStats(!showStats)}
              className="bg-black/50 rounded-full p-2"
            >
              <FaRobot className="text-purple-400" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Safety Reels */}
      {moments.map((moment, index) => (
        <div
          key={moment._id}
          data-index={index}
          className="safety-reel-slide relative h-screen snap-start snap-always flex items-center justify-center"
        >
          {/* Background Image/Video */}
          {moment.videoUrl ? (
            <video
              ref={index === currentIndex ? videoRef : null}
              src={moment.videoUrl}
              className="absolute inset-0 w-full h-full object-cover"
              loop
              muted={muted}
              playsInline
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${
              moment.severity === 'Critical' ? 'from-red-900 to-red-700' :
              moment.severity === 'High' ? 'from-orange-900 to-orange-700' :
              'from-green-900 to-green-700'
            }`} />
          )}
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Content */}
          <div className="absolute bottom-24 left-4 right-20 z-10">
            {/* Category Badge */}
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
              moment.severity === 'Critical' ? 'bg-red-500' :
              moment.severity === 'High' ? 'bg-orange-500' :
              'bg-green-500'
            } text-white`}>
              {moment.category}
            </div>
            
            {/* Title */}
            <h2 className="text-white text-2xl font-bold mb-2">{moment.title}</h2>
            
            {/* Message */}
            <p className="text-white/90 text-base leading-relaxed">{moment.message}</p>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-3">
              {moment.tags?.map(tag => (
                <span key={tag} className="bg-white/20 rounded-full px-2 py-1 text-xs text-white">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          
          {/* Right Side Actions */}
          <div className="absolute bottom-24 right-4 z-10 flex flex-col items-center gap-5">
            {/* Like button */}
            <button onClick={() => handleLike(moment._id, index)} className="flex flex-col items-center">
              <div className="bg-black/50 rounded-full p-3">
                <FaHeart className={`text-2xl ${moment.liked ? 'text-red-500' : 'text-white'}`} />
              </div>
              <span className="text-white text-xs mt-1">{moment.likes || 0}</span>
            </button>
            
            {/* Comment button */}
            <button className="flex flex-col items-center">
              <div className="bg-black/50 rounded-full p-3">
                <FaComment className="text-white text-2xl" />
              </div>
              <span className="text-white text-xs mt-1">0</span>
            </button>
            
            {/* Share button */}
            <button className="flex flex-col items-center">
              <div className="bg-black/50 rounded-full p-3">
                <FaShare className="text-white text-2xl" />
              </div>
              <span className="text-white text-xs mt-1">Share</span>
            </button>
            
            {/* Bookmark button */}
            <button className="flex flex-col items-center">
              <div className="bg-black/50 rounded-full p-3">
                <FaBookmark className="text-white text-2xl" />
              </div>
              <span className="text-white text-xs mt-1">Save</span>
            </button>
          </div>
          
          {/* Volume Control */}
          <button 
            onClick={() => setMuted(!muted)}
            className="absolute bottom-24 left-4 bg-black/50 rounded-full p-2 z-10"
          >
            {muted ? <FaVolumeMute className="text-white" /> : <FaVolumeUp className="text-white" />}
          </button>
          
          {/* Play/Pause Overlay */}
          <button 
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            {!playing && (
              <div className="bg-black/50 rounded-full p-4">
                <FaPlay className="text-white text-3xl" />
              </div>
            )}
          </button>
          
          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${(index + 1) / moments.length * 100}%` }}
            />
          </div>
        </div>
      ))}
      
      {/* AI Tips Modal */}
      <AnimatePresence>
        {showStats && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setShowStats(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-900 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-white text-xl font-bold flex items-center gap-2">
                  <FaRobot className="text-purple-400" /> AI Safety Assistant
                </h2>
                <button onClick={() => setShowStats(false)} className="text-gray-400 text-2xl">&times;</button>
              </div>
              
              {/* AI Tip */}
              <div className="bg-purple-900/30 rounded-xl p-4 mb-4 border border-purple-500/30">
                <p className="text-purple-300 text-sm mb-2">💡 Daily Safety Tip</p>
                <p className="text-white">{aiTip?.tip || 'Always prioritize safety in everything you do!'}</p>
              </div>
              
              {/* User Stats */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Safety Read</span>
                  <span className="text-white font-bold">{progress?.totalReadCount || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Current Streak</span>
                  <span className="text-orange-400 font-bold flex items-center gap-1">
                    <FaFire /> {progress?.streak || 0} days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Daily Goal</span>
                  <span className="text-white">{progress?.dailyGoal || 1} / day</span>
                </div>
              </div>
              
              {/* Progress to next badge */}
              <div className="mt-4">
                <p className="text-gray-400 text-sm mb-2">Next Badge: Safety Champion</p>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    style={{ width: `${Math.min(100, ((progress?.totalReadCount || 0) % 50) * 2)}%` }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SafetyReels;