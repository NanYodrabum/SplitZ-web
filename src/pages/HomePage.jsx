import React, { useState } from 'react'
import {Home, Receipt, CreditCard, User, Menu, X, Plus, DollarSign, ArrowRight, Clock} from 'lucide-react';
import useUserStore from '../stores/userStore';
import Home from "../components/Home"
import Bill from '../components/Bill';
import Payment from '../components/Payment';
import Account from '../components/Account';

function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('Home');
  const user = useUserStore(state=> state.user)

  const navItems = [
    { icon: Home, label: 'Home', active: true },
    { icon: Receipt, label: 'Bills', active: false },
    { icon: CreditCard, label: 'Payments', active: false },
  ];

  const handleNavItemClick = (label) => {
    setActivePage(label);
  };

  const renderPageContent = () => {
    switch (activePage) {
      case 'Home':
        return <Home  />; // Pass user if needed
      case 'Bills':
        return <Bill />;
      case 'Payments':
        return <Payment />;
      case 'Account':
        return <Account/>;
      default:
        return <Home />;
    }
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
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transition-transform duration-300 ease-in-out
        w-64 bg-white border-r border-gray-200 flex flex-col
      `}>
        {/* Logo */}
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-purple-600">SplitZ</h1>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`
                flex items-center gap-3 w-full p-3 rounded-lg
                ${item.active
                  ? 'bg-purple-100 text-purple-600'
                  : 'hover:bg-gray-100 text-gray-600'}
              `}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Account - Bottom */}
        <div className="p-4 border-t">
          <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-100">
            <User size={20} className="text-gray-600" />
            <div className="text-left">
              <p className="font-medium">John Doe</p>
              <p className="text-sm text-gray-500">View Account</p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 lg:pl-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-2">Welcome back, {}</h1>
          <p className="text-gray-600">Here's your expense overview</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button className="flex items-center gap-3 p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <Plus size={24} />
            <span>Add New Bill</span>
          </button>
          <button className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <DollarSign size={24} />
            <span>Record Payment</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border">
            <p className="text-gray-600 mb-2">You are owed</p>
            <p className="text-2xl font-bold text-green-600">$150.25</p>
            <p className="text-sm text-gray-500 mt-1">From 3 people</p>
          </div>
          <div className="bg-white p-6 rounded-xl border">
            <p className="text-gray-600 mb-2">You owe</p>
            <p className="text-2xl font-bold text-red-600">$45.75</p>
            <p className="text-sm text-gray-500 mt-1">To 2 people</p>
          </div>
          <div className="bg-white p-6 rounded-xl border">
            <p className="text-gray-600 mb-2">Total Balance</p>
            <p className="text-2xl font-bold">$104.50</p>
            <p className="text-sm text-gray-500 mt-1">Net balance</p>
          </div>
        </div>

        {/* Recent Activity and Bills */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bills */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Recent Bills</h2>
              <button className="text-purple-600 text-sm">View All</button>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Receipt size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Dinner at Restaurant</p>
                      <p className="text-sm text-gray-500">3 people • Feb 20</p>
                    </div>
                  </div>
                  <span className="font-medium">$45.25</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Activity */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <button className="text-purple-600 text-sm">View All</button>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Clock size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">Sarah paid you</p>
                      <p className="text-sm text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-green-600">+$25.00</span>
                    <ArrowRight size={16} className="text-green-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default HomePage