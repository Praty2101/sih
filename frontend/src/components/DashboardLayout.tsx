import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth';
import { useNotifications } from '../context/NotificationContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function NotificationBadge() {
  const { unreadCount } = useNotifications();
  if (unreadCount === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authService.getMe();
        setUser(userData);
      } catch (error) {
        navigate('/login');
      }
    };
    loadUser();
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const getAccountPath = () => {
    if (user?.role === 'FARMER') return '/account/farmer';
    if (user?.role === 'TRANSPORTER') return '/account/transporter';
    if (user?.role === 'RETAILER') return '/account/retailer';
    if (user?.role === 'CONSUMER') return '/account/consumer';
    return '/account';
  };

  const getTrackProductsPath = () => {
    if (user?.role === 'FARMER') return '/dashboard/farmer/track-products';
    if (user?.role === 'TRANSPORTER') return '/dashboard/transporter/track-products';
    if (user?.role === 'RETAILER') return '/dashboard/retailer/track-products';
    if (user?.role === 'CONSUMER') return '/dashboard/consumer/track-products';
    return '/dashboard/track-products';
  };

  const getSuppliesPath = () => {
    if (user?.role === 'FARMER') return '/dashboard/farmer/supplies';
    if (user?.role === 'TRANSPORTER') return '/dashboard/transporter/supplies';
    if (user?.role === 'RETAILER') return '/dashboard/retailer/supplies';
    if (user?.role === 'CONSUMER') return '/dashboard/consumer/supplies';
    return '/dashboard/supplies';
  };

  const getOrderSuppliesPath = () => {
    if (user?.role === 'TRANSPORTER') return '/dashboard/transporter/order-supplies';
    if (user?.role === 'RETAILER') return '/dashboard/retailer/order-supplies';
    if (user?.role === 'CONSUMER') return '/dashboard/consumer/order-supplies';
    return '/dashboard/order-supplies';
  };

  const getRoleLabel = () => {
    const roleMap: Record<string, string> = {
      FARMER: 'Farmer Portal',
      TRANSPORTER: 'Transporter Portal',
      RETAILER: 'Retailer Portal',
      CONSUMER: 'Consumer Portal',
      ADMIN: 'Admin Portal',
    };
    return roleMap[user?.role || ''] || 'Portal';
  };

  const menuItems = [
    { path: '/dashboard/farmer', label: 'Dashboard', roles: ['FARMER'], icon: 'home' },
    { path: '/dashboard/farmer/register-produce', label: 'Register Produce', roles: ['FARMER'], icon: 'plus' },
    { path: '/dashboard/transporter', label: 'Dashboard', roles: ['TRANSPORTER'], icon: 'home' },
    { path: '/dashboard/transporter/transport-log', label: 'Transport Log', roles: ['TRANSPORTER'], icon: 'route' },
    { path: '/dashboard/retailer', label: 'Dashboard', roles: ['RETAILER'], icon: 'home' },
    { path: '/dashboard/retailer/retailer-log', label: 'Retailer Log', roles: ['RETAILER'], icon: 'plus' },
    { path: '/dashboard/consumer', label: 'Dashboard', roles: ['CONSUMER'], icon: 'home' },
    { path: '/admin', label: 'Overview', roles: ['ADMIN'], icon: 'home' },
    { path: '/admin/trust-scores', label: 'Trust Scores', roles: ['ADMIN'], icon: 'ledger' },
    { path: '/admin/anomalies', label: 'Anomalies', roles: ['ADMIN'], icon: 'ledger' },
  ];

  const filteredMenu = menuItems.filter(item => 
    !item.roles.length || (user && item.roles.includes(user.role))
  );

  const getIcon = (iconName: string) => {
    const iconClass = "w-5 h-5";
    switch (iconName) {
      case 'home':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'plus':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      case 'route':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        );
      case 'ledger':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'supplies':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'order':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'user':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'exit':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        );
      default:
        return null;
    }
  };

  const isActive = (path: string) => {
    if (path === '/dashboard/farmer' || path === '/dashboard/transporter' || path === '/dashboard/retailer' || path === '/dashboard/consumer') {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="flex">
        {/* Premium Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white min-h-screen transition-all duration-300 ease-in-out shadow-2xl relative z-10`}>
          {/* Logo Area */}
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center space-x-3">
              {!sidebarCollapsed && (
                <>
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">UNI-CHAIN</h1>
                    <p className="text-xs text-slate-400 mt-0.5">{getRoleLabel()}</p>
                  </div>
                </>
              )}
              {sidebarCollapsed && (
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg mx-auto">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-6 px-3">
            {filteredMenu.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group relative flex items-center space-x-3 px-4 py-3 mb-1 rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 text-white shadow-lg'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-emerald-500 rounded-r-full"></div>
                  )}
                  <div className={`flex-shrink-0 ${active ? 'text-green-400' : 'text-slate-400 group-hover:text-green-400'}`}>
                    {getIcon(item.icon)}
                  </div>
                  {!sidebarCollapsed && (
                    <span className="font-medium text-sm">{item.label}</span>
                  )}
                </Link>
              );
            })}
            
            {/* Track Products */}
            <Link
              to={getTrackProductsPath()}
              className={`group relative flex items-center space-x-3 px-4 py-3 mb-1 rounded-xl transition-all duration-200 ${
                location.pathname === getTrackProductsPath()
                  ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              {location.pathname === getTrackProductsPath() && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-emerald-500 rounded-r-full"></div>
              )}
              <div className={`flex-shrink-0 ${location.pathname === getTrackProductsPath() ? 'text-green-400' : 'text-slate-400 group-hover:text-green-400'}`}>
                {getIcon('route')}
              </div>
              {!sidebarCollapsed && <span className="font-medium text-sm">Track Products</span>}
            </Link>

            {/* My Ledger */}
            <Link
              to="/ledger"
              className={`group relative flex items-center space-x-3 px-4 py-3 mb-1 rounded-xl transition-all duration-200 ${
                location.pathname === '/ledger'
                  ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              {location.pathname === '/ledger' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-emerald-500 rounded-r-full"></div>
              )}
              <div className={`flex-shrink-0 ${location.pathname === '/ledger' ? 'text-green-400' : 'text-slate-400 group-hover:text-green-400'}`}>
                {getIcon('ledger')}
              </div>
              {!sidebarCollapsed && <span className="font-medium text-sm">My Ledger</span>}
            </Link>

            {/* Supplies */}
            <Link
              to={getSuppliesPath()}
              className={`group relative flex items-center space-x-3 px-4 py-3 mb-1 rounded-xl transition-all duration-200 ${
                location.pathname === getSuppliesPath()
                  ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              {location.pathname === getSuppliesPath() && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-emerald-500 rounded-r-full"></div>
              )}
              <div className={`flex-shrink-0 ${location.pathname === getSuppliesPath() ? 'text-green-400' : 'text-slate-400 group-hover:text-green-400'}`}>
                {getIcon('supplies')}
              </div>
              {!sidebarCollapsed && <span className="font-medium text-sm">Supplies</span>}
            </Link>

            {/* Order Supplies - Only for Transporter, Retailer, Consumer */}
            {user?.role && ['TRANSPORTER', 'RETAILER', 'CONSUMER'].includes(user.role) && (
              <Link
                to={getOrderSuppliesPath()}
                className={`group relative flex items-center space-x-3 px-4 py-3 mb-1 rounded-xl transition-all duration-200 ${
                  location.pathname === getOrderSuppliesPath()
                    ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                {location.pathname === getOrderSuppliesPath() && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-emerald-500 rounded-r-full"></div>
                )}
                <div className={`flex-shrink-0 ${location.pathname === getOrderSuppliesPath() ? 'text-green-400' : 'text-slate-400 group-hover:text-green-400'}`}>
                  {getIcon('order')}
                </div>
                {!sidebarCollapsed && <span className="font-medium text-sm">Order Supplies</span>}
              </Link>
            )}

            {/* Account */}
            <Link
              to={getAccountPath()}
              className={`group relative flex items-center space-x-3 px-4 py-3 mb-1 rounded-xl transition-all duration-200 ${
                location.pathname.startsWith('/account')
                  ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              {location.pathname.startsWith('/account') && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-emerald-500 rounded-r-full"></div>
              )}
              <div className={`flex-shrink-0 ${location.pathname.startsWith('/account') ? 'text-green-400' : 'text-slate-400 group-hover:text-green-400'}`}>
                {getIcon('user')}
              </div>
              {!sidebarCollapsed && <span className="font-medium text-sm">Account</span>}
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="group w-full flex items-center space-x-3 px-4 py-3 mb-1 rounded-xl transition-all duration-200 text-slate-300 hover:bg-red-600/20 hover:text-red-400 mt-4"
            >
              <div className="flex-shrink-0 text-slate-400 group-hover:text-red-400">
                {getIcon('exit')}
              </div>
              {!sidebarCollapsed && <span className="font-medium text-sm">Logout</span>}
            </button>
          </nav>

          {/* Status Block */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-slate-800/50 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <span className="text-xs font-medium text-slate-300">Network: Live</span>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="flex justify-center">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
              </div>
            )}
          </div>

          {/* Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-20 w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 z-20"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
            </svg>
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-x-hidden relative">
          {/* Notification Bell Icon - Top Right */}
          <div className="absolute top-0 right-0 z-10">
            <Link
              to="/dashboard/notifications"
              className="relative inline-flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 border-2 border-gray-200"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <NotificationBadge />
            </Link>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
