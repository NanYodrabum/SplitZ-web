import React, { useState } from 'react';
import { Home, Receipt, CreditCard, User, Menu, X, LogOut } from 'lucide-react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router';
import useUserStore from '../stores/userStore';


function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Receipt, label: 'Bills', path: '/dashboard/bills' },
    { icon: Receipt, label: 'Bill Detail', path: '/dashboard/bill-detail/' },
    { icon: Receipt, label: 'Bill list', path: '/dashboard/billlist' },
    { icon: CreditCard, label: 'Payments', path: '/dashboard/payments' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Function to check if a navItem is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Toggle Button for Mobile */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-white border-r border-gray-200 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-purple-600">SplitZ</h1>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 w-full p-3 rounded-lg ${
                isActive(item.path)
                  ? 'bg-purple-100 text-purple-600'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Account - Bottom */}
        <div className="p-4 border-t">
          <Link
            to="/dashboard/account"
            className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-100"
          >
            <User size={20} className="text-gray-600" />
            <div className="text-left">
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-gray-500">View Account</p>
            </div>
          </Link>
          {/* Logout Button */}
          <button
            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100"
            onClick={handleLogout}
          >
            <LogOut size={20} className="text-gray-600" />
            <div className="text-left">
              <p className="font-medium">Log out</p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 lg:pl-8">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;