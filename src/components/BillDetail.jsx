import React, { useState, useEffect } from 'react';
import { Receipt, User, ArrowLeftRight, Tag } from 'lucide-react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router';
import useUserStore from '../stores/userStore';

// Import BillDetail Components
import DeleteConfirmationModal from './billdetail/DeleteConfirmationModal';
import BackButton from './billdetail/BackButton';
import BillHeader from './billdetail/BillHeader';
import BillSummary from './billdetail/BillSummary';
import BillItems from './billdetail/BillItems';
import ErrorState from './billdetail/ErrorState';
import NotFoundState from './billdetail/NotFoundState';

function BillDetail() {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useUserStore();

  // Define your API base URL - store this in an environment variable in a real application
  const API_BASE_URL = 'http://localhost:8800';

  useEffect(() => {
    // Debug the ID parameter
    console.log("BillDetail - Raw ID param:", id);
    
    if (id) {
      // Check if ID is a valid number
      const numericId = Number(id);
      console.log("BillDetail - Converted ID:", numericId, "Is valid number:", !isNaN(numericId));
    }
    
    if (id && token) {
      fetchBillDetails();
    } else if (!id) {
      setError('Bill ID is missing. Please select a valid bill.');
      setLoading(false);
    }
  }, [id, token]);
  
  const fetchBillDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if billId is defined before making the request
      if (!id) {
        throw new Error('Bill ID is missing');
      }
      
      console.log(`Making API request for bill ID: ${id}`);
      
      // Get the bill details
      const billResponse = await axios.get(`${API_BASE_URL}/bills/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!billResponse.data) {
        throw new Error('No bill data received');
      }
      
      console.log("Bill data received:", billResponse.data);
      
      // Add debugging for data structure
      console.log("Bill items:", billResponse.data.items);
      if (billResponse.data.items && billResponse.data.items.length > 0) {
        console.log("First item details:", billResponse.data.items[0]);
        console.log("First item splits:", billResponse.data.items[0].splits);
      }
      console.log("Bill participants:", billResponse.data.participants);
      
      setBill(billResponse.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching bill details:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load bill details. Please try again.');
      setLoading(false);
    }
  };

  // Function to handle bill deletion
  const handleDeleteBill = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/bills/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Redirect to bills list after successful deletion
      navigate('/dashboard/billlist');
    } catch (err) {
      console.error('Error deleting bill:', err);
      setError(err.response?.data?.message || 'Failed to delete the bill. Please try again.');
    }
  };

  // Function to handle bill editing
  const handleEditBill = () => {
    navigate(`/dashboard/bills/edit/${id}`);
  };

  const handleGoBack = () => {
    navigate("/dashboard/billlist");
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return <ErrorState errorMessage={error} onGoBack={handleGoBack} onTryAgain={fetchBillDetails} />;
  }

  if (!bill) {
    return <NotFoundState onGoBack={handleGoBack} />;
  }

  // Check if user is creator
  const isCreator = (bill.creator?.id === user.id) || (bill.userId === user.id);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <DeleteConfirmationModal 
          onCancel={() => setDeleteConfirmation(false)} 
          onConfirm={handleDeleteBill} 
        />
      )}

      {/* Back Button */}
      <BackButton onClick={handleGoBack} />

      {/* Bill Header */}
      <BillHeader 
        bill={bill}
        formatDate={formatDate}
        getCategoryIcon={getCategoryIcon}
        isCreator={isCreator}
        onEditBill={handleEditBill}
        onDeleteBill={() => setDeleteConfirmation(true)}
      />

      {/* Bill Summary */}
      <BillSummary bill={bill} />

      {/* Bill Items */}
      <BillItems bill={bill} />
    </div>
  );
}

export default BillDetail;