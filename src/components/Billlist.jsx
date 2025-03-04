import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import useUserStore from '../stores/userStore';

// Import BillList Components
import BillListHeader from './billlist/BillListHeader';
import SearchBar from './billlist/SearchBar';
import DeleteConfirmationModal from './billlist/DeleteConfirmationModal';
import EmptyBillState from './billlist/EmptyBillState';
import BillItem from './billlist/BillItem';

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

  useEffect(() => {
    if (token) {
      fetchBills();
    }
  }, [token]);
  
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

  const handleEditBill = (billId) => {
    navigate(`/dashboard/bills/edit/${billId}`);
  };

  const handleDeleteConfirmation = (billId) => {
    setDeleteConfirmation(billId);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const handleDeleteBill = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/bills/${deleteConfirmation}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Clear the confirmation state
      setDeleteConfirmation(null);
      
      // Refresh the bill list
      fetchBills();
    } catch (err) {
      console.error('Error deleting bill:', err);
      setError(err.response?.data?.error || 'Failed to delete the bill. Please try again.');
    }
  };

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
        <DeleteConfirmationModal 
          onCancel={handleCancelDelete}
          onConfirm={handleDeleteBill}
        />
      )}

      {/* Header with Title and Create Button */}
      <BillListHeader onCreateBill={handleCreateBill} />

      {/* Search Input */}
      <SearchBar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Bills List */}
      {filteredBills.length === 0 ? (
        <EmptyBillState onCreateBill={handleCreateBill} />
      ) : (
        <div className="space-y-4">
          {filteredBills.map((bill) => (
            <BillItem 
              key={bill.id}
              bill={bill}
              userId={user.id}
              onViewBill={handleBillClick}
              onEditBill={handleEditBill}
              onDeleteBill={handleDeleteConfirmation}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default BillList;
