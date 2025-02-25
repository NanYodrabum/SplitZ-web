import React from 'react';
import {Plus, DollarSign, Receipt, ArrowRight, Clock} from 'lucide-react';

function Home() {
  return (
    <div>
      {/* Main Content */}
      <div className="flex-1 p-8 lg:pl-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-2">Welcome back, Nhan</h1>
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
                      <p className="font-medium">Bam paid you</p>
                      {/* <p className="text-sm text-gray-500">2 hours ago</p> */}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-green-600">+$23.00</span>
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
}

export default Home;