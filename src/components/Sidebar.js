import React, { useState, useEffect, useContext } from 'react';
import {
  FaChevronLeft, FaChevronRight, FaBell,
  FaMoon, FaSun
} from 'react-icons/fa';
import * as Icons from 'react-icons/fa';
import { UserContext } from '../App';
import NotificationsModal from './NotificationsModal';

const Sidebar = () => {
  const {
    currentPage, setCurrentPage, sidebarOpen, setSidebarOpen,
    session, logout, notifications, setShowNotifPanel,
    darkMode, toggleDarkMode
  } = useContext(UserContext);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/menus`);
        if (res.ok) {
          const data = await res.json();
          setMenus(data);
        } else {
          console.error('Gagal mengambil menu');
        }
      } catch (err) {
        console.error('Error fetch menu:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenus();
  }, [API_BASE]);

  // Filter menu berdasarkan role user
  const filteredMenus = menus.filter(menu =>
    menu.isActive && menu.roles && menu.roles.includes(session.role)
  );

  // Render dynamic icon
  const getIcon = (iconName) => {
    if (!iconName) return null;
    const IconComponent = Icons[iconName];
    return IconComponent ? (
      <IconComponent className="text-2xl mr-4 text-orange-400 group-hover:scale-110 transition-transform flex-shrink-0" />
    ) : null;
  };

  if (loading) {
    return (
      <div className="w-64 bg-gray-900 text-white p-4 h-screen">
        Memuat menu...
      </div>
    );
  }

  return (
    <>
      <div className={`bg-gradient-to-b from-gray-900 to-gray-800 dark:from-slate-900 dark:to-slate-950 text-white min-h-screen transition-all duration-300 fixed left-0 top-0 z-40 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-700 dark:border-slate-800 flex justify-between items-center">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white p-2 rounded-lg hover:bg-gray-700 dark:hover:bg-slate-800 transition-colors"
          >
            {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotifPanel(true)}
              className="relative p-2 rounded-lg hover:bg-gray-700 dark:hover:bg-slate-800 transition-colors"
            >
              <FaBell className="text-xl" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-2 -right-1 bg-red-500 text-xs rounded-full h-5 w-5 flex items-center justify-center text-white font-bold">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-700 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {darkMode ? <FaSun className="text-yellow-400 text-xl" /> : <FaMoon className="text-slate-400 text-xl" />}
            </button>
          </div>
        </div>

        {/* Logo & Role */}
        {!isCollapsed && (
          <div className="px-6 py-6 border-b border-gray-700 dark:border-slate-800">
            <h1 className="text-2xl font-black bg-gradient-to-r from-orange-400 to-orange-600 dark:from-orange-300 dark:to-orange-500 bg-clip-text text-transparent mb-2">
              JSMS HSSE
            </h1>
            <p className="text-gray-400 dark:text-gray-500 text-sm">Job Safety System</p>
            {session.role && (
              <p className="text-orange-400 dark:text-orange-300 font-semibold mt-2 text-sm bg-orange-500/20 px-3 py-1 rounded-full inline-block">
                {session.role}
              </p>
            )}
          </div>
        )}

        {/* Menu Items */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-200px)]">
          {filteredMenus.map((menu) => (
            <button
              key={menu._id}
              onClick={() => {
                if (menu.path === '/login') {
                  logout();
                } else {
                  setCurrentPage(menu.path);
                }
                if (sidebarOpen) setSidebarOpen(false);
              }}
              className={`flex items-center p-4 rounded-2xl transition-all duration-300 hover:bg-gray-700 dark:hover:bg-slate-800 hover:shadow-lg hover:translate-x-1 group w-full text-left font-semibold ${
                currentPage === menu.path && menu.path !== '/login'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-400 dark:to-orange-500 shadow-xl border-r-4 border-orange-400 dark:border-orange-300'
                  : ''
              }`}
              title={isCollapsed ? menu.name : undefined}
            >
              {getIcon(menu.icon)}
              {!isCollapsed && <span>{menu.name}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-6 border-t border-gray-700 dark:border-slate-800 text-center text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>v2.2 - Dynamic Menu</p>
            <p className="text-orange-500 dark:text-orange-400">Dark Mode Ready</p>
          </div>
        )}
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <NotificationsModal />
    </>
  );
};

export default Sidebar;