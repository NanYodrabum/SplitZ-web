import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { Receipt, User, Plus, Search, ArrowLeftRight, Tag, Clock, DollarSign, Trash2, Edit } from 'lucide-react';
import useUserStore from '../stores/userStore';

function BillList() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState(null); // Store bill ID to delete
  const navigate = useNavigate();
  const { token, user } = useUserStore();

  // Define your API base URL - store this in an environment variable in a real application
  const API_BASE_URL = 'http://localhost:8800';

  const fetchBills = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(`${API_BASE_URL}/bills`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.data) {
        setBills(response.data.data);
      } else {
        throw new Error('No bills data received');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching bills:', err);
      setError(err.response?.data?.message || 'Failed to load bills. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBills();
    }
  }, [token]);

  const handleBillClick = (billId) => {
    // Ensure billId is a valid number
    if (billId === undefined || billId === null) {
      console.error("Invalid bill ID:", billId);
      return;
    }
    
    console.log("Navigating to bill detail with ID:", billId);
    navigate(`/dashboard/bills/${billId}`);
  };

  const handleCreateBill = () => {
    navigate('/dashboard/bills');
  };

  const handleEditBill = (e, billId) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    navigate(`/dashboard/bills/edit/${billId}`);
  };

  const handleDeleteBill = async (billId) => {
    try {
      await axios.delete(`${API_BASE_URL}/bills/${billId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Show success message (you could add a toast notification here)
      setDeleteConfirmation(null);
      
      // Refresh the bill list
      fetchBills();
    } catch (err) {
      console.error('Error deleting bill:', err);
      setError(err.response?.data?.error || 'Failed to delete the bill. Please try again.');
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'dining':
        return <Receipt className="text-orange-500" />;
      case 'traveling':
        return <ArrowLeftRight className="text-blue-500" />;
      case 'shopping':
        return <Tag className="text-green-500" />;
      case 'hangout':
        return <User className="text-purple-500" />;
      default:
        return <Receipt className="text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Filter bills based on search term

  // const filteredBills = bills.filter(bill => 
  //   bill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   bill.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   bill.category?.toLowerCase().includes(searchTerm.toLowerCase())
  // );
  // Filter bills based on search term, then sort by date (newest first)
  const filteredBills = bills
    .filter(bill => 
      bill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchBills}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Delete Confirmation Modal */}
      {deleteConfirmation !== null && (
        <div className="fixed inset-0 bg-slate-300 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Delete Bill</h3>
            <p className="mb-6">Are you sure you want to delete this bill? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBill(deleteConfirmation)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Bills</h1>
        <button
          onClick={handleCreateBill}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700"
        >
          <Plus size={16} />
          <span>Create New Bill</span>
        </button>
      </div>

      {/* Search and filter */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search bills by name, description or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 pr-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {filteredBills.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 rounded-lg border">
          <p className="text-gray-600 mb-4">No bills found</p>
          <button
            onClick={handleCreateBill}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg"
          >
            Create Your First Bill
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBills.map((bill) => (
            <div
              key={bill?.id}
              className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3 cursor-pointer" onClick={() => handleBillClick(bill.id)}>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    {getCategoryIcon(bill.category)}
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">{bill.name}</h2>
                    {bill.description && (
                      <p className="text-gray-600 text-sm mb-2 line-clamp-1">{bill.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{formatDate(bill.date || bill.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        <span>{bill.participants?.length || 0} participants</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">${bill.totalAmount?.toFixed(2) || '0.00'}</p>
                  
                  {/* Check if user is creator or not */}
                  {(bill.creator?.id === user?.id || bill.userId === user?.id) && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={(e) => handleEditBill(e, bill?.id)}
                        className="flex items-center gap-1 p-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200"
                        title="Edit Bill"
                      >
                        <Edit size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmation(bill.id);
                        }}
                        className="flex items-center gap-1 p-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200"
                        title="Delete Bill"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BillList;