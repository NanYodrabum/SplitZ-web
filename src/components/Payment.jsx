import React, { useState, useEffect } from 'react';
import { Receipt, User, Clock, ChevronDown, ChevronUp, Check, DollarSign, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router';
import useUserStore from '../stores/userStore';

function Payment() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedBill, setExpandedBill] = useState(null);
  const [loadingBillDetails, setLoadingBillDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [successMessage, setSuccessMessage] = useState('');
  const [processingPayments, setProcessingPayments] = useState([]);

  const { token, user } = useUserStore();
  const navigate = useNavigate();

  // Define API base URL
  const API_BASE_URL = 'http://localhost:8800';

  // Fetch all bills for the current user
  useEffect(() => {
    fetchBills();
  }, [token]);

  // Fetch bills function (separate so we can call it after updates too)
  const fetchBills = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError('');

      console.log('Fetching bills from API...');
      const response = await axios.get(`${API_BASE_URL}/bills`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Bills response:', response.data);
      if (response.data && response.data.data) {
        setBills(response.data.data);
      } else if (response.data) {
        // Handle case where data is directly in response
        setBills(response.data);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching bills:', err);
      setError(`Failed to load bills: ${err.response?.data?.message || err.message}`);
      setLoading(false);
    }
  };

  // Toggle bill expansion and load payment details
  const toggleBillExpansion = async (billId) => {
    if (expandedBill === billId) {
      setExpandedBill(null);
      return;
    }

    setExpandedBill(billId);
    
    // Check if we already have detailed payment data
    const bill = bills.find(b => b.id === billId);
    if (bill && !bill.detailedItemsLoaded) {
      setLoadingBillDetails(true);
      
      try {
        console.log(`Fetching details for bill ${billId}...`);
        const response = await axios.get(`${API_BASE_URL}/bills/${billId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`Bill details response for ${billId}:`, response.data);
        if (response.data) {
          // Update our bills array with the detailed information
          setBills(prevBills => 
            prevBills.map(b => 
              b.id === billId ? { 
                ...b, 
                ...response.data, 
                detailedItemsLoaded: true 
              } : b
            )
          );
        }
        setLoadingBillDetails(false);
      } catch (err) {
        console.error(`Error fetching bill details:`, err);
        setError(`Failed to load payment details: ${err.response?.data?.message || err.message}`);
        setLoadingBillDetails(false);
      }
    }
  };

  // Calculate participant totals and status
  const getParticipantSummary = (bill) => {
    if (!bill.items || !bill.participants) return [];
    
    const participantSummary = {};
    
    // Initialize summary for each participant
    bill.participants.forEach(participant => {
      participantSummary[participant.id] = {
        participant: participant,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        paymentStatus: 'completed', // Will be set to 'pending' if any splits are pending
        splitIds: [] // Keep track of all split IDs for this participant
      };
    });
    
    // Calculate amounts from item splits
    bill.items.forEach(item => {
      if (!item.splits) return;
      
      item.splits.forEach(split => {
        const participantId = split.billParticipantId;
        if (!participantSummary[participantId]) return;
        
        const summary = participantSummary[participantId];
        summary.totalAmount += split.shareAmount || 0;
        
        if (split.paymentStatus === 'completed') {
          summary.paidAmount += split.shareAmount || 0;
        } else {
          summary.pendingAmount += split.shareAmount || 0;
          summary.paymentStatus = 'pending'; // Mark as pending if any split is pending
        }
        
        // Store split ID for later status updates
        summary.splitIds.push(split.id);
      });
    });
    
    return Object.values(participantSummary);
  };

  // Update payment status for all splits of a participant
  const updateParticipantPaymentStatus = async (participantSummary, newStatus) => {
    if (!participantSummary.splitIds || participantSummary.splitIds.length === 0) {
      setError('No payment items found for this participant');
      return;
    }
    
    // Add to processing array to show loading state
    setProcessingPayments(prev => [...prev, ...participantSummary.splitIds]);
    
    try {
      setError('');
      
      console.log('Updating payment status with data:', {
        splitIds: participantSummary.splitIds,
        paymentStatus: newStatus
      });
      
      // Call API to update all split statuses for this participant
      await axios.patch(`${API_BASE_URL}/payment`, {
        splitIds: participantSummary.splitIds,
        paymentStatus: newStatus
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Payment status updated successfully');

      // Refresh bill data to get the latest status from the database
      await fetchBills();
      
      // If the bill was expanded, keep it expanded after refresh
      const currentExpandedBill = expandedBill;
      if (currentExpandedBill) {
        setTimeout(() => {
          toggleBillExpansion(currentExpandedBill);
        }, 100);
      }

      // Show success message
      setSuccessMessage(`Payment status for ${participantSummary.participant.name} updated successfully to ${newStatus === 'completed' ? 'Paid' : 'Pending'}`);
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err) {
      console.error('Error updating payment status:', err);
      setError(`Failed to update payment status: ${err.response?.data?.message || err.message}`);
    } finally {
      // Remove from processing array
      setProcessingPayments(prev => prev.filter(id => !participantSummary.splitIds.includes(id)));
    }
  };

  // Navigate to bill detail page
  const handleViewBillDetails = (billId) => {
    navigate(`/dashboard/bills/${billId}`);
  };

  // Filter bills based on search term and filter type
  const filteredBills = bills.filter(bill => {
    // Filter by search term
    if (searchTerm && !bill.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filter by type
    if (filterType === 'owed') {
      return bill.userId === user.id; // Bills where user is creator (is owed money)
    } else if (filterType === 'owing') {
      return bill.userId !== user.id; // Bills where user is not creator (owes money)
    }
    
    return true; // Show all bills
  });

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return `${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  };

  // Check if all a participant's splits are being processed
  const isParticipantProcessing = (participantSummary) => {
    return participantSummary.splitIds.some(id => processingPayments.includes(id));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Payment Management</h1>
      
      {/* Search and Filter */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg ${
                filterType === 'all' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('owed')}
              className={`px-4 py-2 rounded-lg ${
                filterType === 'owed' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Money Owed to Me
            </button>
            <button
              onClick={() => setFilterType('owing')}
              className={`px-4 py-2 rounded-lg ${
                filterType === 'owing' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Money I Owe
            </button>
          </div>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700 flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}
      
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg text-green-700 flex items-center gap-3">
          <Check size={20} className="flex-shrink-0" />
          <div>{successMessage}</div>
        </div>
      )}
      
      {/* Bills List */}
      {filteredBills.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 rounded-lg border">
          <p className="text-gray-600">No bills found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBills.map((bill) => (
            <div key={bill.id} className="border rounded-lg overflow-hidden">
              {/* Bill Header */}
              <div 
                className="p-4 bg-white flex justify-between items-center cursor-pointer"
                onClick={() => toggleBillExpansion(bill.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Receipt size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">{bill.name}</h2>
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                        {bill.userId === user.id ? 'You are owed' : 'You owe'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      with {bill.participants?.find(p => p.userId !== user.id)?.name || 'Others'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
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
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-lg">${bill.totalAmount?.toFixed(2) || '0.00'}</p>
                    {expandedBill === bill.id ? (
                      <ChevronUp size={20} className="ml-auto text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="ml-auto text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Expanded Bill Details - Participant-focused view */}
              {expandedBill === bill.id && (
                <div className="border-t bg-white p-4">
                  {loadingBillDetails ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Participants and their payment statuses */}
                      <h3 className="font-medium mb-3">Participants</h3>
                      
                      <div className="space-y-3">
                        {getParticipantSummary(bill).map((participantSummary) => (
                          <div 
                            key={participantSummary.participant.id}
                            className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <User size={20} className="text-gray-600" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {participantSummary.participant.name}
                                  {participantSummary.participant.userId === user.id && 
                                    <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">You</span>
                                  }
                                  {participantSummary.participant.isCreator && 
                                    <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">Creator</span>
                                  }
                                </p>
                                <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                                  <span className="flex items-center gap-1">
                                    <DollarSign size={14} className={participantSummary.pendingAmount > 0 ? "text-orange-500" : "text-green-500"} />
                                    <span>Total: ${participantSummary.totalAmount.toFixed(2)}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              <div className="text-right flex flex-col items-end">
                                {participantSummary.pendingAmount > 0 && (
                                  <span className="text-sm text-orange-600">
                                    ${participantSummary.pendingAmount.toFixed(2)} pending
                                  </span>
                                )}
                                {participantSummary.paidAmount > 0 && (
                                  <span className="text-sm text-green-600">
                                    ${participantSummary.paidAmount.toFixed(2)} paid
                                  </span>
                                )}
                              </div>

                              <div>
                                {isParticipantProcessing(participantSummary) ? (
                                  <div className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                                    <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-purple-500 rounded-full mr-1"></div>
                                    Processing...
                                  </div>
                                ) : participantSummary.paymentStatus === 'completed' ? (
                                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full">
                                    <Check size={16} />
                                    Paid
                                  </span>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateParticipantPaymentStatus(participantSummary, 'completed');
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full"
                                  >
                                    Mark as Paid
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewBillDetails(bill.id);
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                          View Bill Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Payment;