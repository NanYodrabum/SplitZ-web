import React, { useState, useEffect } from 'react';
import { Receipt, User, ArrowRight, DollarSign, Tag, Clock, ArrowLeftRight, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router';
import useUserStore from '../stores/userStore';

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

  // Function to calculate what a participant owes (pending payments)
  const calculateParticipantOwes = (participantId) => {
    if (!bill || !bill.items) return 0;
    
    return bill.items.reduce((total, item) => {
      const participantSplits = item.splits?.filter(
        split => split.billParticipantId === participantId && split.paymentStatus === "pending"
      ) || [];
      
      return total + participantSplits.reduce((splitTotal, split) => splitTotal + parseFloat(split.shareAmount || 0), 0);
    }, 0);
  };

  // Function to calculate what a participant has paid
  const calculateParticipantPaid = (participantId) => {
    if (!bill || !bill.items) return 0;
    
    return bill.items.reduce((total, item) => {
      const participantSplits = item.splits?.filter(
        split => split.billParticipantId === participantId && split.paymentStatus === "completed"
      ) || [];
      
      return total + participantSplits.reduce((splitTotal, split) => splitTotal + parseFloat(split.shareAmount || 0), 0);
    }, 0);
  };

  // Calculate total amount that is pending
  const calculateTotalPending = () => {
    if (!bill || !bill.participants) return 0;
    
    return bill.participants.reduce((total, participant) => {
      return total + calculateParticipantOwes(participant.id);
    }, 0);
  };

  // Calculate total amount that is paid
  const calculateTotalPaid = () => {
    if (!bill || !bill.participants) return 0;
    
    return bill.participants.reduce((total, participant) => {
      return total + calculateParticipantPaid(participant.id);
    }, 0);
  };

  // Calculate participant summary for "Each Person Pays" section
  const getParticipantSummary = () => {
    if (!bill || !bill.participants) {
      return [];
    }
    
    // Initialize summary for each participant
    const summary = {};
    bill.participants.forEach(participant => {
      summary[participant.id] = {
        name: participant.name || `Person ${participant.id}`,
        amount: 0,
        isCreator: participant.isCreator
      };
    });
    
    // If no items data, divide total bill amount evenly
    if (!bill.items || bill.items.length === 0) {
      const evenShareAmount = bill.totalAmount / bill.participants.length;
      bill.participants.forEach(participant => {
        summary[participant.id].amount = Math.round(evenShareAmount);
      });
      return Object.values(summary);
    }
    
    // Calculate each participant's share from item splits
    bill.items.forEach(item => {
      // If no splits data for this item or empty splits array
      if (!item.splits || item.splits.length === 0) {
        // Divide item amount evenly among all participants
        const evenShareAmount = item.totalAmount / bill.participants.length;
        bill.participants.forEach(participant => {
          summary[participant.id].amount += Math.round(evenShareAmount);
        });
      } else {
        // Process each split
        item.splits.forEach(split => {
          // First try billParticipantId
          let participantId = split.billParticipantId;
          
          // If that doesn't exist, try participant.id
          if (participantId === undefined && split.participant) {
            participantId = split.participant.id;
          }
          
          // If still undefined, check for other possible property names
          if (participantId === undefined && split.participantId) {
            participantId = split.participantId;
          }
          
          if (participantId !== undefined && summary[participantId]) {
            const amount = parseFloat(split.shareAmount) || 0;
            summary[participantId].amount += Math.round(amount);
          }
        });
      }
    });
    
    return Object.values(summary);
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
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
        <div className="mt-4 flex justify-center gap-3">
          <button onClick={handleGoBack} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            Go Back
          </button>
          <button onClick={fetchBillDetails} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border text-center">
        <h2 className="text-xl font-semibold mb-2">Bill Not Found</h2>
        <p className="text-gray-600">The bill you're looking for doesn't exist or you may not have access to it.</p>
        <button onClick={handleGoBack} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg">Go Back</button>
      </div>
    );
  }

  // Check if user is creator
  const isCreator = (bill.creator?.id === user.id) || (bill.userId === user.id);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-slate-300 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this bill? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteConfirmation(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBill}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={handleGoBack}
        className="mb-6 flex items-center text-gray-600 hover:text-purple-600"
      >
        <ArrowRight className="rotate-180 mr-2" size={16} />
        <span>Back to Bills</span>
      </button>

      {/* Bill Header */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {getCategoryIcon(bill.category)}
              <h1 className="text-2xl font-bold">{bill.name}</h1>
            </div>
            {bill.description && (
              <p className="text-gray-600 mb-3">{bill.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span>{formatDate(bill.date || bill.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <User size={16} />
                <span>Created by {bill.creator?.name || 'Unknown'}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-sm">Total Amount</p>
            <p className="text-3xl font-bold">${Math.round(parseFloat(bill.totalAmount || 0))}</p>
          </div>
        </div>

        {/* Action buttons - Only show if user is creator */}
        {isCreator && (
          <div className="flex gap-3 mt-4 justify-end">
            <button
              onClick={handleEditBill}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit size={16} />
              Edit Bill
            </button>
            <button
              onClick={() => setDeleteConfirmation(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 size={16} />
              Delete Bill
            </button>
          </div>
        )}
      </div>

      {/* Bill Summary (Expanded - Now full width) */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Bill Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Bill Breakdown */}
          <div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base Total</span>
                <span className="font-medium">
                  ${bill.items?.reduce((sum, item) => sum + (item.basePrice || 0), 0) || '0'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax Total</span>
                <span className="font-medium">
                  ${bill.items?.reduce((sum, item) => sum + (item.taxAmount || 0), 0) || '0'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Service Total</span>
                <span className="font-medium">
                  ${bill.items?.reduce((sum, item) => sum + (item.serviceAmount || 0), 0) || '0'}
                </span>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex justify-between font-semibold">
                <span>Grand Total</span>
                <span>${bill.totalAmount || '0'}</span>
              </div>
            </div>
            
            {/* Custom breakdown section to show total calculations */}
            <div className="mt-4 pt-6 border-t">
              <h3 className="font-medium mb-2">Bill Total Details</h3>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Total Bill Amount</span>
                <span className="font-medium">${Math.round(parseFloat(bill.totalAmount || 0))}</span>
              </div>
              <p className="text-xs text-blue-600 mb-4">
                * Total amounts are calculated based on the bill's total value
              </p>
            </div>
          </div>
          
          {/* Right Column - Each Person Pays */}
          <div>
            <h3 className="font-medium mb-3">Each Person Pays</h3>
            <div className="space-y-3">
              {getParticipantSummary().map((summary) => (
                <div key={summary.name} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <User size={16} className="text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{summary.name}</span>
                          {summary.isCreator && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">
                              Creator
                            </span>
                          )}
                        </div>
                        
                        {/* Show payment status indicator */}
                        {summary.isCreator ? (
                          <span className="text-xs text-green-600">Paid</span>
                        ) : (
                          <span className="text-xs text-orange-600">Pending</span>
                        )}
                      </div>
                    </div>
                    <span className="font-semibold">${Math.round(summary.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bill Items */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Bill Items</h2>
        
        <div className="space-y-6">
          {bill.items?.map(item => (
            <div key={item.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <div className="flex gap-3 text-sm text-gray-500 mt-1">
                    <span>Base: ${item.basePrice?.toFixed(2) || '0.00'}</span>
                    <span>•</span>
                    <span>Tax: {item.taxPercent || 0}% (${Math.round(parseFloat(item.taxAmount || 0))})</span>
                    <span>•</span>
                    <span>Service: {item.servicePercent || 0}% (${Math.round(parseFloat(item.serviceAmount || 0))})</span>
                  </div>
                </div>
                <span className="font-bold">${Math.round(parseFloat(item.totalAmount || 0))}</span>
              </div>
              
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600 mb-2">Split Between: ({item.splits?.length || 0} participants)</p>
                <div className="flex flex-wrap gap-2">
                                      {item.splits?.map((split, index) => {
                    // Find participant using various possible ID structures
                    let participantId = split.billParticipantId;
                    
                    // Try different properties if billParticipantId is undefined
                    if (participantId === undefined && split.participant) {
                      participantId = split.participant.id;
                    }
                    if (participantId === undefined && split.participantId) {
                      participantId = split.participantId;
                    }
                    
                    const participant = bill.participants?.find(p => p.id === participantId);
                    
                    // Determine if this participant is the creator
                    const isCreator = participant && participant.isCreator;
                    
                    // Override payment status to "completed" if participant is the bill creator
                    const displayStatus = isCreator ? "completed" : split.paymentStatus;
                    
                    return (
                      <div 
                        key={index}
                        className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                          displayStatus === "completed"
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        <span>{participant?.name || 'Unknown'}</span>
                        <span>${Math.round(parseFloat(split.shareAmount || 0))}</span>
                        {displayStatus === "completed" && (
                          <span className="text-xs ml-1">(Paid)</span>
                        )}
                        {displayStatus === "pending" && (
                          <span className="text-xs ml-1">(Pending)</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BillDetail;
