import React from 'react';
import { Calculator, Users, Receipt, CreditCard, ArrowRight, Check } from 'lucide-react';

function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed w-full bg-white z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold">SplitZ</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 text-gray-600 hover:text-gray-900">
                Login
              </button>
              <button className="px-4 py-2 bg-pink-200 text-black rounded-lg hover:bg-pink-300 transition-colors">
                Register
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
                Split bills easily with friends and family
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Track shared expenses, split bills with individual tax and service charges, and settle up with ease.
              </p>
              <button className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                Get Started <ArrowRight size={20} />
              </button>
            </div>
            <div className="relative">
              <div className="bg-white p-8 rounded-2xl shadow-xl">
                <div className="space-y-6">
                  {/* Example Bill Card */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">Dinner with Friends</h3>
                        <p className="text-gray-500 text-sm">4 people</p>
                      </div>
                      <span className="font-semibold">$120.50</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Your share</span>
                        <span className="font-medium">$30.13</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Status</span>
                        <span className="text-green-600">Paid</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Split Preview */}
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex-1 bg-blue-100 rounded-lg p-3 text-center">
                        <div className="w-8 h-8 bg-blue-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                          {i}
                        </div>
                        <span className="text-sm font-medium text-blue-700">${30.13}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-pink-200 rounded-full opacity-50"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-200 rounded-full opacity-50"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose SplitZ?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Calculator,
                title: "Smart Calculations",
                description: "Automatically handles tax and service charges for accurate splitting"
              },
              {
                icon: Users,
                title: "Share with Anyone",
                description: "Split bills with anyone - no account needed for participants"
              },
              {
                icon: Receipt,
                title: "Detailed History",
                description: "Keep track of all shared expenses and payments in one place"
              }
            ].map((feature, index) => (
              <div key={index} className="p-6 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="text-blue-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: "Create a bill", description: "Enter bill details and items" },
              { step: 2, title: "Add people", description: "Add who's splitting the bill" },
              { step: 3, title: "Split items", description: "Assign items to people" },
              { step: 4, title: "Settle up", description: "Track and settle payments" }
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-gray-200 mb-4">{step.step}</div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start splitting bills fairly?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of people who use SplitZ to manage shared expenses.</p>
          <button className="px-8 py-4 bg-white text-blue-600 rounded-lg text-lg hover:bg-gray-100 transition-colors">
            Create Free Account
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">SplitZ</h3>
              <p className="text-gray-400">Split bills easily with friends and family</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Bill Splitting</li>
                <li>Payment Tracking</li>
                <li>Group Management</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Terms of Service</li>
                <li>FAQ</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};


export default HomePage