import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../App';

const NotificationsModal = () => {
  const { 
    notifications, 
    setNotifications, 
    setShowNotifPanel, 
    showNotifPanel,
    session 
  } = useContext(UserContext);
  
  const [filter, setFilter] = useState('unread');
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  const unreadCount = notifications.filter(n => !n.read).length;

  // Mark as read via API
  const markRead = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? {...n, read: true} : n));
      } else {
        console.error('Gagal mark read');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Clear all notifications (delete one by one)
  const clearAll = async () => {
    for (const notif of notifications) {
      try {
        await fetch(`${API_BASE}/api/notifications/${notif._id}`, { method: 'DELETE' });
      } catch (err) {
        console.error(err);
      }
    }
    setNotifications([]);
  };

  const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setShowNotifPanel(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [setShowNotifPanel]);

  if (!showNotifPanel) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={() => setShowNotifPanel(false)}
      />
      
      {/* Modal */}
      <div className="fixed right-4 top-4 w-96 h-[90vh] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              🔔 Notifications
            </h3>
            <button 
              onClick={() => setShowNotifPanel(false)}
              className="p-2 hover:bg-gray-200 rounded-2xl transition-all text-gray-600 hover:text-gray-900"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${
                filter === 'all' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button 
              onClick={() => setFilter('unread')}
              className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${
                filter === 'unread' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 h-[calc(90vh-120px)] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-lg font-semibold">No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.slice(0, 15).map((notif) => (
                <div 
                  key={notif._id}
                  className={`p-4 rounded-2xl transition-all cursor-pointer group hover:shadow-md border ${
                    notif.read 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-gradient-to-r from-orange-100 to-red-100 border-orange-300 shadow-sm'
                  }`}
                  onClick={() => !notif.read && markRead(notif._id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                      notif.read ? 'bg-gray-400' : 'bg-orange-500 animate-pulse'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg truncate">{notif.message.split(' ')[0]}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(notif.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed truncate">{notif.message}</p>
                      {!notif.read && (
                        <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <div className="w-2 h-2 bg-orange-400 rounded-full animate-ping" />
                          <span className="text-xs font-bold text-orange-600">New</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button 
              onClick={clearAll}
              className="w-full py-3 px-6 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all"
            >
              Clear All ({notifications.length})
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationsModal;