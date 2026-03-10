import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';

const Header = () => {
  const { user, logout, isAuthenticated, isCandidate, isEmployer, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadNotifications();
      const interval = setInterval(fetchUnreadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadNotifications = async () => {
    try {
      const [unreadData, countData] = await Promise.all([
        notificationService.getUnreadNotifications(),
        notificationService.getUnreadCount()
      ]);
      setNotifications(unreadData);
      setUnreadCount(countData.count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NEW_APPLICATION': return '📝';
      case 'APPLICATION_STATUS': return '📋';
      default: return '🔔';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      className={`relative px-3 py-2 text-sm font-medium transition-colors duration-300 ${isActive(to) ? 'text-white' : 'text-gray-400 hover:text-white'
        }`}
    >
      {children}
      {isActive(to) && (
        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
      )}
    </Link>
  );

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass shadow-lg py-3' : 'bg-transparent py-5'
        }`}
    >
      <nav className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gradient">
              HireSense
            </span>
          </Link>

          <div className="flex items-center space-x-2">
            <div className="hidden md:flex items-center space-x-1 mr-6 bg-slate-800/50 rounded-full px-4 py-1.5 border border-white/5 backdrop-blur-sm">
              <NavLink to="/jobs">Browse Jobs</NavLink>
              <NavLink to="/companies">Companies</NavLink>

              {isAuthenticated && (
                <>
                  <NavLink to="/dashboard">Dashboard</NavLink>
                  {isCandidate && <NavLink to="/my-applications">Applications</NavLink>}
                  {isEmployer && (
                    <>
                      <NavLink to="/my-jobs">My Jobs</NavLink>
                      <NavLink to="/post-job">Post Job</NavLink>
                    </>
                  )}
                  {isAdmin && <NavLink to="/admin">Admin</NavLink>}
                </>
              )}
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-400 hover:text-white transition-colors focus:outline-none"
                  >
                    <div className="absolute inset-0 bg-white/5 rounded-full scale-0 hover:scale-100 transition-transform duration-300" />
                    <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 top-full mt-4 w-80 glass-card rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-slate-800/50">
                        <h3 className="font-semibold text-white">Notifications</h3>
                        {notifications.length > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-sm">No new notifications</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className="px-4 py-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                                <div className="flex-1">
                                  <p className="text-sm text-gray-200">{notification.message}</p>
                                  <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(notification.createdAt)}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="px-4 py-2 border-t border-white/10 bg-slate-800/50">
                        <Link
                          to="/notifications"
                          className="block text-center text-sm text-blue-400 hover:text-blue-300 py-1"
                          onClick={() => setShowNotifications(false)}
                        >
                          View all notifications
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-white/5 transition-all duration-300">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-[2px]">
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {user?.user?.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <div className="absolute right-0 top-full mt-2 w-56 glass-card rounded-xl shadow-xl py-2 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-white/10 mb-2">
                      <p className="text-sm font-semibold text-white truncate">{user?.user?.email}</p>
                      <p className="text-xs text-blue-400 mt-0.5 font-medium">{user?.user?.role}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary px-5 py-2 rounded-full font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
