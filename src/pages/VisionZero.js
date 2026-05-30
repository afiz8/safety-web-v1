import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBullseye, FaCheckCircle, FaUsers, FaLightbulb, FaHandshake, 
  FaChartLine, FaShieldAlt, FaShare, FaPlay, FaPause, FaHeart,
  FaTrophy, FaMedal, FaStar, FaFire, FaCalendarAlt, FaClock,
  FaRobot, FaArrowLeft, FaArrowRight, FaTimes
} from 'react-icons/fa';

const VisionZero = ({ user, darkMode }) => {
  const [rules, setRules] = useState([]);
  const [commitments, setCommitments] = useState([]);
  const [progress, setProgress] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [quizState, setQuizState] = useState({ currentQuestion: 0, answers: [], score: null, passed: null });
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  
  const touchStartX = useRef(0);
  const autoPlayTimer = useRef(null);
  
  const API_BASE = 'http://localhost:5000';
  const userId = user?.userId || 'anonymous';
  const userName = user?.name || 'User';
  
  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, commitmentsRes, progressRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/vision/rules`),
        fetch(`${API_BASE}/api/vision/commitments`),
        fetch(`${API_BASE}/api/vision/progress/${userId}`),
        fetch(`${API_BASE}/api/vision/dashboard-stats`)
      ]);
      
      if (rulesRes.ok) setRules(await rulesRes.json());
      if (commitmentsRes.ok) setCommitments(await commitmentsRes.json());
      if (progressRes.ok) setProgress(await progressRes.json());
      if (statsRes.ok) setDashboardStats(await statsRes.json());
    } catch (err) {
      console.error('Gagal fetch data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Mark rule as viewed
  const markAsViewed = useCallback(async (ruleId) => {
    try {
      const res = await fetch(`${API_BASE}/api/vision/rules/${ruleId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userName })
      });
      if (res.ok) {
        const data = await res.json();
        setProgress(prev => ({
          ...prev,
          dailyStreak: data.streak,
          viewedRules: [...(prev?.viewedRules || []), { ruleId, viewedAt: new Date() }]
        }));
      }
    } catch (err) {
      console.error('Gagal mark viewed:', err);
    }
  }, [userId, userName]);
  
  // Share progress
  const shareProgress = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/vision/share/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'whatsapp' })
      });
      if (res.ok) {
        const data = await res.json();
        setProgress(prev => ({ ...prev, shareCount: data.shareCount }));
        setShowShareTooltip(true);
        setTimeout(() => setShowShareTooltip(false), 3000);
        
        // Share ke WhatsApp
        const message = `🎯 Saya sudah belajar Vision Zero! Safety Score: ${progress?.safetyScore || 0} | Streak: ${progress?.dailyStreak || 0} days. Ayo safety first! #VisionZero #SafetyFirst`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
      }
    } catch (err) {
      console.error('Gagal share:', err);
    }
  };
  
  // Auto advance slide
  useEffect(() => {
    if (autoPlay && rules.length > 0 && !showQuiz && !showDashboard) {
      autoPlayTimer.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % rules.length);
      }, 5000);
    }
    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    };
  }, [autoPlay, rules.length, showQuiz, showDashboard]);
  
  // Mark rule viewed when slide changes
  useEffect(() => {
    if (rules[currentIndex] && !showQuiz && !showDashboard) {
      markAsViewed(rules[currentIndex]._id);
    }
  }, [currentIndex, rules, markAsViewed, showQuiz, showDashboard]);
  
  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < rules.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    }
  };
  
  // Start quiz
  const startQuiz = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/vision/quizzes`);
      if (res.ok) {
        const quizzes = await res.json();
        if (quizzes.length > 0) {
          setCurrentQuiz(quizzes[0]);
          setQuizState({ currentQuestion: 0, answers: [], score: null, passed: null });
          setShowQuiz(true);
          setAutoPlay(false);
        }
      }
    } catch (err) {
      console.error('Gagal load quiz:', err);
    }
  };
  
  // Submit answer
  const submitAnswer = (answerIndex) => {
    const newAnswers = [...quizState.answers];
    newAnswers[quizState.currentQuestion] = answerIndex;
    setQuizState(prev => ({ ...prev, answers: newAnswers }));
    
    if (quizState.currentQuestion + 1 < currentQuiz.questions.length) {
      setQuizState(prev => ({ ...prev, currentQuestion: prev.currentQuestion + 1 }));
    } else {
      submitQuiz(newAnswers);
    }
  };
  
  // Submit quiz
  const submitQuiz = async (answers) => {
    try {
      const res = await fetch(`${API_BASE}/api/vision/quizzes/${currentQuiz._id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userName, answers, timeSpent: 0 })
      });
      if (res.ok) {
        const data = await res.json();
        setQuizState(prev => ({ ...prev, score: data.score, passed: data.passed }));
        fetchData();
      }
    } catch (err) {
      console.error('Gagal submit quiz:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  return (
    <div 
      className={`h-screen overflow-hidden transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-slate-50'
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <FaBullseye className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-white font-bold">Vision Zero</h1>
              <p className="text-white/70 text-xs">7 Golden Rules</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDashboard(!showDashboard)}
              className="bg-black/50 rounded-full p-2"
            >
              <FaChartLine className="text-white" />
            </button>
            <button
              onClick={startQuiz}
              className="bg-black/50 rounded-full p-2"
            >
              <FaMedal className="text-yellow-400" />
            </button>
            <button
              onClick={shareProgress}
              className="bg-black/50 rounded-full p-2 relative"
            >
              <FaShare className="text-white" />
              {showShareTooltip && (
                <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-green-500 text-white text-xs rounded whitespace-nowrap">
                  Shared! +Badge progress
                </div>
              )}
            </button>
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className="bg-black/50 rounded-full p-2"
            >
              {autoPlay ? <FaPause className="text-white" /> : <FaPlay className="text-white" />}
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="flex gap-1 mt-4">
          {rules.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-all ${
                idx <= currentIndex ? 'bg-green-500' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Story Slides */}
      <AnimatePresence mode="wait">
        {!showQuiz && !showDashboard && rules[currentIndex] && (
          <motion.div
            key={currentIndex}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative h-full flex flex-col items-center justify-center p-8"
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${rules[currentIndex].color} opacity-90`} />
            
            {/* Content */}
            <div className="relative z-10 text-center text-white max-w-md mx-auto">
              <div className="text-8xl mb-8">
                {React.createElement(
                  require('react-icons/fa')[rules[currentIndex].iconType] || FaBullseye,
                  { className: "mx-auto" }
                )}
              </div>
              <div className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm mb-4">
                Golden Rule {currentIndex + 1} of {rules.length}
              </div>
              <h2 className="text-4xl font-bold mb-6">{rules[currentIndex].title}</h2>
              <p className="text-lg leading-relaxed mb-8 opacity-95">
                {rules[currentIndex].longDesc}
              </p>
              
              {/* Actions */}
              <div className="space-y-3 text-left">
                <p className="font-semibold text-sm opacity-80 mb-2">🎯 Key Actions:</p>
                {rules[currentIndex].actions?.map((action, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                    <FaCheckCircle className="text-green-400 flex-shrink-0" />
                    <span className="text-sm">{action.title}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Navigation arrows */}
            <button
              onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 rounded-full p-2"
            >
              <FaArrowLeft className="text-white" />
            </button>
            <button
              onClick={() => currentIndex < rules.length - 1 && setCurrentIndex(currentIndex + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 rounded-full p-2"
            >
              <FaArrowRight className="text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Dashboard Modal */}
      <AnimatePresence>
        {showDashboard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setShowDashboard(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold dark:text-white">Zero Accident Dashboard</h2>
                <button onClick={() => setShowDashboard(false)} className="text-gray-400">
                  <FaTimes />
                </button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-100 dark:bg-green-900/30 rounded-xl p-3 text-center">
                  <FaTrophy className="text-yellow-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{progress?.safetyScore || 0}%</p>
                  <p className="text-xs text-gray-500">Safety Score</p>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900/30 rounded-xl p-3 text-center">
                  <FaFire className="text-orange-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{progress?.dailyStreak || 0}</p>
                  <p className="text-xs text-gray-500">Day Streak</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-xl p-3 text-center">
                  <FaMedal className="text-blue-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{progress?.earnedBadges?.length || 0}</p>
                  <p className="text-xs text-gray-500">Badges Earned</p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 rounded-xl p-3 text-center">
                  <FaCheckCircle className="text-purple-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{progress?.viewedRules?.length || 0}/{rules.length}</p>
                  <p className="text-xs text-gray-500">Rules Learned</p>
                </div>
              </div>
              
              {/* Global Stats */}
              {dashboardStats && (
                <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                  <h3 className="font-semibold text-sm mb-2">🌍 Global Vision Zero Stats</h3>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="font-bold">{dashboardStats.totalUsers}</p>
                      <p className="text-gray-500">Participants</p>
                    </div>
                    <div>
                      <p className="font-bold">{dashboardStats.totalQuizAttempts}</p>
                      <p className="text-gray-500">Quiz Attempts</p>
                    </div>
                    <div>
                      <p className="font-bold">{dashboardStats.averageScore}%</p>
                      <p className="text-gray-500">Avg Score</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Badges */}
              {progress?.earnedBadges?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">🏆 Your Badges</h3>
                  <div className="flex flex-wrap gap-2">
                    {progress.earnedBadges.map((badge, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full px-3 py-1">
                        <span className="text-lg">{badge.icon || '🏅'}</span>
                        <span className="text-xs font-semibold">{badge.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Commitments */}
              <div className="mt-4">
                <h3 className="font-semibold text-sm mb-2">🎯 Vision Zero Commitments</h3>
                {commitments.map((c, idx) => (
                  <div key={idx} className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{c.icon} {c.title}</span>
                      <span>{c.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${c.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Quiz Modal */}
      <AnimatePresence>
        {showQuiz && currentQuiz && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/90 flex items-center justify-center p-4"
            onClick={() => { setShowQuiz(false); setAutoPlay(true); }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {quizState.score !== null ? (
                // Quiz Result
                <div className="text-center">
                  {quizState.passed ? (
                    <div className="text-6xl mb-4">🎉</div>
                  ) : (
                    <div className="text-6xl mb-4">📚</div>
                  )}
                  <h2 className="text-2xl font-bold mb-2">
                    {quizState.passed ? 'Congratulations!' : 'Keep Learning!'}
                  </h2>
                  <p className="text-4xl font-bold text-green-500 mb-4">{quizState.score}%</p>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {quizState.passed 
                      ? 'You passed the Vision Zero quiz! 🎯'
                      : 'Try again to earn your Safety Champion badge!'}
                  </p>
                  <button
                    onClick={() => { setShowQuiz(false); setAutoPlay(true); }}
                    className="w-full py-2 bg-green-500 text-white rounded-lg font-semibold"
                  >
                    Continue Learning
                  </button>
                </div>
              ) : (
                // Quiz Questions
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold dark:text-white">Safety Quiz</h2>
                    <div className="text-sm text-gray-500">
                      Question {quizState.currentQuestion + 1}/{currentQuiz.questions.length}
                    </div>
                  </div>
                  <div className="mb-6">
                    <p className="text-lg font-semibold mb-4 dark:text-white">
                      {currentQuiz.questions[quizState.currentQuestion].question}
                    </p>
                    <div className="space-y-3">
                      {currentQuiz.questions[quizState.currentQuestion].options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => submitAnswer(idx)}
                          className="w-full text-left p-3 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition"
                        >
                          {String.fromCharCode(65 + idx)}. {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${((quizState.currentQuestion + 1) / currentQuiz.questions.length) * 100}%` }}
                    />
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Bottom Indicator */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
        {progress?.dailyStreak > 0 && (
          <div className="bg-black/50 rounded-full px-3 py-1 text-white text-xs flex items-center gap-1">
            <FaFire className="text-orange-400" /> {progress.dailyStreak} day streak
          </div>
        )}
        {progress?.safetyScore > 0 && (
          <div className="bg-black/50 rounded-full px-3 py-1 text-white text-xs flex items-center gap-1">
            <FaStar className="text-yellow-400" /> Safety Score: {progress.safetyScore}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisionZero;