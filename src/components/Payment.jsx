import React, { useState, useEffect, useRef } from 'react';
import { Receipt, User, Clock, ChevronDown, ChevronUp, Check, DollarSign, Tag, ArrowLeftRight, Search } from 'lucide-react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router';
import useUserStore from '../stores/userStore';

function Payment() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedBill, setExpandedBill] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingPayment, setUpdatingPayment] = useState(null);
  const [updatingSuccess, setUpdatingSuccess] = useState('');
  const [initialBillId, setInitialBillId] = useState(null);

  const { token, user } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();

  const API_BASE_URL = 'http://localhost:8800';

  // Fetch bills on component mount and handle hash navigation
  useEffect(() => {
    fetchBills();
    
    // Check if there's a hash in the URL
    if (location.hash) {
      // Extract the bill ID from the hash (format: #bill-123)
      const hashBillId = location.hash.replace('#bill-', '');
      if (!isNaN(parseInt(hashBillId))) {
        setInitialBillId(parseInt(hashBillId));
      }
    }
  }, [token, location.hash]);
  
  // Handle scrolling to and expanding the specific bill
  useEffect(() => {
    if (initialBillId && bills.length > 0) {
      // Find the bill with the matching ID
      const targetBill = bills.find(bill => bill.id === initialBillId);
      
      if (targetBill) {
        // Expand this bill
        setExpandedBill(initialBillId);
        
        // Scroll to the bill element with a slight delay to ensure rendering is complete
        setTimeout(() => {
          const element = document.getElementById(`bill-${initialBillId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      }
    }
  }, [initialBillId, bills]);

  // Function to fetch bills (so we can call it after updates too)
  const fetchBills = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError('');

      // Get all bills
      const billsResponse = await axios.get(`${API_BASE_URL}/bills`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Process bills data
      let billsData = [];
      if (billsResponse.data && billsResponse.data.data) {
        billsData = billsResponse.data.data;
      } else if (billsResponse.data) {
        billsData = billsResponse.data;
      }

      // Fetch basic payment status for all bills
      const billsWithStatus = await Promise.all(
        billsData.map(async (bill) => {
          try {
            // Get detailed bill information with participants and items
            const response = await axios.get(`${API_BASE_URL}/bills/${bill.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data) {
              // Calculate payment summary
              let totalPaid = 0;
              let totalPending = 0;

              if (response.data.participants) {
                response.data.participants.forEach(participant => {
                  // Skip creator in calculations as they're always marked as paid
                  if (!participant.isCreator) {
                    totalPaid += Math.round((participant.totalAmount || 0) - (participant.pendingAmount || 0));
                    totalPending += Math.round(participant.pendingAmount || 0);
                  }
                });
              }

              return {
                ...bill,
                paymentSummary: {
                  paid: totalPaid,
                  pending: totalPending,
                  totalPaid: totalPaid,
                  totalPending: totalPending,
                  status: totalPending > 0 ? 'partial' : 'paid',
                  participants: response.data.participants,
                  items: response.data.items
                }
              };
            }
            return bill;
          } catch (error) {
            console.error(`Error fetching details for bill ${bill.id}:`, error);
            return bill;
          }
        })
      );

      setBills(billsWithStatus);
      setLoading(false);

      // If we had a success message, clear it after 3 seconds
      if (updatingSuccess) {
        setTimeout(() => {
          setUpdatingSuccess('');
        }, 3000);
      }
    } catch (err) {
      console.error('Error fetching bills:', err);
      setError(`Failed to load payment data: ${err.response?.data?.message || err.message}`);
      setLoading(false);
    }
  };

  // Load bill details when expanded
  const toggleBillExpansion = async (billId) => {
    if (expandedBill === billId) {
      setExpandedBill(null);
      return;
    }

    setExpandedBill(billId);

    try {
      // Check if we already have detailed data
      const bill = bills.find(b => b.id === billId);
      if (bill && bill.paymentSummary && bill.paymentSummary.participants && bill.paymentSummary.items) {
        // We already have the details, no need to fetch again
        return;
      }

      // Get detailed bill information with participants and items
      const response = await axios.get(`${API_BASE_URL}/bills/${billId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        // Update the bill with details
        setBills(prevBills =>
          prevBills.map(bill =>
            bill.id === billId ? {
              ...bill,
              paymentSummary: {
                ...bill.paymentSummary,
                participants: response.data.participants,
                items: response.data.items
              }
            } : bill
          )
        );
      }
    } catch (err) {
      console.error('Error fetching bill details:', err);
      setError(`Failed to load payment details: ${err.response?.data?.message || err.message}`);
    }
  };

  // Update payment status
  const updatePaymentStatus = async (splitIds, newStatus) => {
    try {
      if (!splitIds || splitIds.length === 0) {
        console.error('No split IDs provided for payment update');
        return;
      }

      setUpdatingPayment(splitIds);

      await axios.patch(`${API_BASE_URL}/payment`, {
        splitIds: splitIds,
        paymentStatus: newStatus
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Show success indicator with appropriate message
      setUpdatingSuccess(newStatus === 'completed' ? 'marked as paid' : 'marked as unpaid');

      // Refresh bill data to show updated payment status
      await fetchBills();

    } catch (err) {
      console.error('Error updating payment status:', err);
      setError(`Failed to update payment: ${err.response?.data?.message || err.message}`);
    } finally {
      setUpdatingPayment(null);
    }
  };

  // Navigate to bill details
  const handleViewBillDetails = (billId) => {
    navigate(`/dashboard/bills/${billId}`);
  };

  // Filter bills based on search term - Enhanced to match BillList
  const filteredBills = bills.filter(bill => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    
    // Search by name
    if (bill.name?.toLowerCase().includes(term)) return true;
    
    // Search by description
    if (bill.description?.toLowerCase().includes(term)) return true;
    
    // Search by category
    if (bill.category?.toLowerCase().includes(term)) return true;
    
    // No match found
    return false;
  });

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    return `${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  };

  // Get the appropriate icon for the bill category
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

  // Render payment status pill
  const PaymentStatusPill = ({ status, onClick, onUndo, isProcessing, isCreator }) => {
    // If this is a creator's payment, it's always paid and unchangeable
    if (isCreator) {
      return (
        <div className="bg-green-100 px-4 py-1 rounded-full text-green-700 flex items-center gap-1">
          <Check size={16} />
          Paid
        </div>
      );
    }

    if (isProcessing) {
      return (
        <div className="bg-gray-100 px-4 py-1 rounded-full text-gray-700 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
          Updating...
        </div>
      );
    }

    // For completed payments, offer option to mark as unpaid
    if (status === 'completed') {
      return (
        <button
          onClick={onUndo}
          className="bg-green-100 hover:bg-green-200 px-4 py-1 rounded-full text-green-700 flex items-center gap-1 group"
        >
          <Check size={16} />
          <span>Paid</span>
          <span className="hidden group-hover:inline ml-1 text-xs">(Undo)</span>
        </button>
      );
    }

    // For pending payments, offer option to mark as paid
    return (
      <button
        onClick={onClick}
        className="bg-orange-100 hover:bg-orange-200 px-4 py-1 rounded-full text-orange-700 flex items-center gap-1"
      >
        Mark as Paid
      </button>
    );
  };

  // Calculate participant summary for "Each Person Pays" section
  const getParticipantSummary = (bill) => {
    if (!bill || !bill.paymentSummary || !bill.paymentSummary.participants) {
      return [];
    }

    return bill.paymentSummary.participants.map(participant => {
      // If this participant is the creator, always mark them as fully paid
      // by setting pendingAmount to 0
      if (participant.isCreator) {
        return {
          id: participant.id,
          name: participant.name,
          totalAmount: Math.round(participant.totalAmount || 0),
          pendingAmount: 0, // Force to 0 for creators
          paidAmount: Math.round(participant.totalAmount || 0), // Full amount is paid
          isCreator: true
        };
      } else {
        // For non-creators, use the actual pending amount
        return {
          id: participant.id,
          name: participant.name,
          totalAmount: Math.round(participant.totalAmount || 0),
          pendingAmount: Math.round(participant.pendingAmount || 0),
          paidAmount: Math.round((participant.totalAmount || 0) - (participant.pendingAmount || 0)),
          isCreator: false
        };
      }
    });
  };

  // Get payment status badge for a bill
  const getPaymentStatusBadge = (bill) => {
    if (!bill.paymentSummary) {
      return null;
    }

    if (bill.paymentSummary.status === 'paid') {
      return (
        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center">
          <Check size={12} className="mr-1" />
          Fully Paid
        </span>
      );
    } else if (bill.paymentSummary.totalPaid > 0) {
      return (
        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full flex items-center">
          <DollarSign size={12} className="mr-1" />
          Partially Paid
        </span>
      );
    } else {
      return (
        <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full flex items-center">
          <DollarSign size={12} className="mr-1" />
          Unpaid
        </span>
      );
    }
  };

  if (loading && bills.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Payment Management</h1>

      {/* Success Message */}
      {updatingSuccess && (
        <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg text-green-700 flex items-center">
          <Check size={20} className="mr-2" />
          Payment successfully {updatingSuccess}!
        </div>
      )}

      {/* Search Input with Icon - Updated to match BillList */}
      <div className="rounded-lg pb-6">
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

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
          {error}
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
            <div key={bill.id} className="border rounded-lg overflow-hidden" id={`bill-${bill.id}`}>
              {/* Bill Header */}
              <div
                className="p-4 bg-white flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={() => toggleBillExpansion(bill.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    {getCategoryIcon(bill.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">{bill.name}</h2>
                      {bill.paymentSummary && getPaymentStatusBadge(bill)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {bill.description || `with ${bill.participants?.find(p => p.userId !== user.id)?.name || 'friends'}`}
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
                <div className="flex flex-col items-end gap-2">
                  <p className="font-bold text-lg">${Math.round(bill.totalAmount || 0)}</p>

                  {/* Payment summary */}
                  {bill.paymentSummary && (
                    <div className="flex flex-col items-end text-xs">
                      {bill.paymentSummary.totalPaid > 0 && (
                        <div className="flex items-center gap-1 text-green-600">
                          <DollarSign size={12} />
                          <span>${bill.paymentSummary.totalPaid || 0} paid</span>
                        </div>
                      )}
                      {bill.paymentSummary.totalPending > 0 && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <DollarSign size={12} />
                          <span>${bill.paymentSummary.totalPending} pending</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    {expandedBill === bill.id ? (
                      <ChevronUp size={20} className="ml-auto text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="ml-auto text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Bill Details */}
              {expandedBill === bill.id && (
                <div className="border-t bg-white">
                  {/* Bill Summary Section */}
                  <div className="p-4">
                    <h3 className="text-lg font-medium mb-4">Bill Summary</h3>

                    {bill.paymentSummary?.items && (
                      <div className="space-y-4 mb-4">
                        {/* Items Summary */}
                        <div className="bg-white rounded-lg border p-4">
                          <h4 className="font-medium mb-3">Items</h4>
                          <div className="space-y-2 mb-4">
                            {bill.paymentSummary.items.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span>{item.name}</span>
                                <span className="font-medium">${Math.round(item.totalAmount || 0)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-4 border-t">
                            <div className="flex justify-between font-medium">
                              <span>Total Amount</span>
                              <span>${Math.round(bill.totalAmount || 0)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Each Person Pays Section */}
                        <div className="bg-white rounded-lg border p-4">
                          <h4 className="font-medium mb-3">Each Person Pays</h4>
                          <div className="space-y-3">
                            {getParticipantSummary(bill).map((summary) => (
                              <div key={summary.id} className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">                  
                                    <User size={16} className="text-gray-600" />                      
                                  </div>
                                  <div>
                                    <span className="font-medium">{summary.name}</span>
                                    {summary.isCreator && (
                                      <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">
                                        Creator
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">${summary.totalAmount}</div>
                                  <div className="text-xs">
                                    {summary.isCreator ? (
                                      <span className="text-green-600">Fully paid</span>
                                    ) : summary.pendingAmount > 0 ? (
                                      <span className="text-orange-600">${summary.pendingAmount} pending</span>
                                    ) : (
                                      <span className="text-green-600">Fully paid</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  
                    <h3 className="text-lg font-medium mb-4">Payment Details</h3>

                    {bill.paymentSummary ? (
                      <div className="space-y-4 mb-4">
                        {bill.paymentSummary.participants?.map((participant) => {
                          // Skip showing the creator if they are the current user
                          if (participant.isCreator && participant.userId === user.id) {
                            return null;
                          }

                          // Determine if we're processing this participant's payment
                          const isProcessing = updatingPayment !== null;

                          // Get all pending split IDs for this participant
                          const pendingSplitIds = [];
                          bill.paymentSummary.items?.forEach(item => {
                            item.splits?.forEach(split => {
                              if (split.participant?.id === participant.id &&
                                split.paymentStatus === 'pending') {
                                pendingSplitIds.push(split.id);
                              }
                            });
                          });

                          return (
                            <div
                              key={participant.id}
                              className="border rounded-lg p-4"
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center'>
                                  <User size={20} className="text-gray-600" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{participant.name}</span>
                                      {participant.isCreator && (
                                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">Creator</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="text-right mr-3">
                                    <div className="font-medium">
                                      ${Math.round(participant.totalAmount || 0)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {participant.isCreator ? (
                                        <span className="text-green-600">Fully paid</span>
                                      ) : participant.pendingAmount > 0 ? (
                                        <span className="text-orange-600">
                                          ${Math.round(participant.pendingAmount)} pending
                                        </span>
                                      ) : (
                                        <span className="text-green-600">Fully paid</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Use PaymentStatusPill component here */}
                                  {participant.isCreator ? (
                                    <PaymentStatusPill
                                      status="completed"
                                      isCreator={true}
                                    />
                                  ) : (
                                    <PaymentStatusPill
                                      status={participant.pendingAmount > 0 ? "pending" : "completed"}
                                      isProcessing={isProcessing}
                                      isCreator={false}
                                      onClick={() => updatePaymentStatus(pendingSplitIds, 'completed')}
                                      onUndo={() => {
                                        // Find all completed split IDs for this participant
                                        const completedSplitIds = [];
                                        bill.paymentSummary.items?.forEach(item => {
                                          item.splits?.forEach(split => {
                                            if (split.participant?.id === participant.id &&
                                              split.paymentStatus === 'completed') {
                                              completedSplitIds.push(split.id);
                                            }
                                          });
                                        });
                                        // Mark them as pending
                                        updatePaymentStatus(completedSplitIds, 'pending');
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 text-center">Loading payment details...</p>
                      </div>
                    )}

                    <div className="flex justify-end mt-6">
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

// import React, { useState, useEffect, useRef } from 'react';
// import { Receipt, User, Clock, ChevronDown, ChevronUp, Check, DollarSign, Tag, ArrowLeftRight } from 'lucide-react';
// import axios from 'axios';
// import { useNavigate, useLocation } from 'react-router';
// import useUserStore from '../stores/userStore';

// function Payment() {
//   const [bills, setBills] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [expandedBill, setExpandedBill] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [updatingPayment, setUpdatingPayment] = useState(null);
//   const [updatingSuccess, setUpdatingSuccess] = useState('');
//   const [initialBillId, setInitialBillId] = useState(null);

//   const { token, user } = useUserStore();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const API_BASE_URL = 'http://localhost:8800';

//   // Fetch bills on component mount and handle hash navigation
//   useEffect(() => {
//     fetchBills();
    
//     // Check if there's a hash in the URL
//     if (location.hash) {
//       // Extract the bill ID from the hash (format: #bill-123)
//       const hashBillId = location.hash.replace('#bill-', '');
//       if (!isNaN(parseInt(hashBillId))) {
//         setInitialBillId(parseInt(hashBillId));
//       }
//     }
//   }, [token, location.hash]);
  
//   // Handle scrolling to and expanding the specific bill
//   useEffect(() => {
//     if (initialBillId && bills.length > 0) {
//       // Find the bill with the matching ID
//       const targetBill = bills.find(bill => bill.id === initialBillId);
      
//       if (targetBill) {
//         // Expand this bill
//         setExpandedBill(initialBillId);
        
//         // Scroll to the bill element with a slight delay to ensure rendering is complete
//         setTimeout(() => {
//           const element = document.getElementById(`bill-${initialBillId}`);
//           if (element) {
//             element.scrollIntoView({ behavior: 'smooth', block: 'start' });
//           }
//         }, 300);
//       }
//     }
//   }, [initialBillId, bills]);

//   // Function to fetch bills (so we can call it after updates too)
//   const fetchBills = async () => {
//     if (!token) return;

//     try {
//       setLoading(true);
//       setError('');

//       // Get all bills
//       const billsResponse = await axios.get(`${API_BASE_URL}/bills`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });

//       // Process bills data
//       let billsData = [];
//       if (billsResponse.data && billsResponse.data.data) {
//         billsData = billsResponse.data.data;
//       } else if (billsResponse.data) {
//         billsData = billsResponse.data;
//       }

//       // Fetch basic payment status for all bills
//       const billsWithStatus = await Promise.all(
//         billsData.map(async (bill) => {
//           try {
//             // Get detailed bill information with participants and items
//             const response = await axios.get(`${API_BASE_URL}/bills/${bill.id}`, {
//               headers: { Authorization: `Bearer ${token}` }
//             });

//             if (response.data) {
//               // Calculate payment summary
//               let totalPaid = 0;
//               let totalPending = 0;

//               if (response.data.participants) {
//                 response.data.participants.forEach(participant => {
//                   // Skip creator in calculations as they're always marked as paid
//                   if (!participant.isCreator) {
//                     totalPaid += Math.round((participant.totalAmount || 0) - (participant.pendingAmount || 0));
//                     totalPending += Math.round(participant.pendingAmount || 0);
//                   }
//                 });
//               }

//               return {
//                 ...bill,
//                 paymentSummary: {
//                   paid: totalPaid,
//                   pending: totalPending,
//                   totalPaid: totalPaid,
//                   totalPending: totalPending,
//                   status: totalPending > 0 ? 'partial' : 'paid',
//                   participants: response.data.participants,
//                   items: response.data.items
//                 }
//               };
//             }
//             return bill;
//           } catch (error) {
//             console.error(`Error fetching details for bill ${bill.id}:`, error);
//             return bill;
//           }
//         })
//       );

//       setBills(billsWithStatus);
//       setLoading(false);

//       // If we had a success message, clear it after 3 seconds
//       if (updatingSuccess) {
//         setTimeout(() => {
//           setUpdatingSuccess('');
//         }, 3000);
//       }
//     } catch (err) {
//       console.error('Error fetching bills:', err);
//       setError(`Failed to load payment data: ${err.response?.data?.message || err.message}`);
//       setLoading(false);
//     }
//   };

//   // Load bill details when expanded
//   const toggleBillExpansion = async (billId) => {
//     if (expandedBill === billId) {
//       setExpandedBill(null);
//       return;
//     }

//     setExpandedBill(billId);

//     try {
//       // Check if we already have detailed data
//       const bill = bills.find(b => b.id === billId);
//       if (bill && bill.paymentSummary && bill.paymentSummary.participants && bill.paymentSummary.items) {
//         // We already have the details, no need to fetch again
//         return;
//       }

//       // Get detailed bill information with participants and items
//       const response = await axios.get(`${API_BASE_URL}/bills/${billId}`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });

//       if (response.data) {
//         // Update the bill with details
//         setBills(prevBills =>
//           prevBills.map(bill =>
//             bill.id === billId ? {
//               ...bill,
//               paymentSummary: {
//                 ...bill.paymentSummary,
//                 participants: response.data.participants,
//                 items: response.data.items
//               }
//             } : bill
//           )
//         );
//       }
//     } catch (err) {
//       console.error('Error fetching bill details:', err);
//       setError(`Failed to load payment details: ${err.response?.data?.message || err.message}`);
//     }
//   };

//   // Update payment status
//   const updatePaymentStatus = async (splitIds, newStatus) => {
//     try {
//       if (!splitIds || splitIds.length === 0) {
//         console.error('No split IDs provided for payment update');
//         return;
//       }

//       setUpdatingPayment(splitIds);

//       await axios.patch(`${API_BASE_URL}/payment`, {
//         splitIds: splitIds,
//         paymentStatus: newStatus
//       }, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       // Show success indicator with appropriate message
//       setUpdatingSuccess(newStatus === 'completed' ? 'marked as paid' : 'marked as unpaid');

//       // Refresh bill data to show updated payment status
//       await fetchBills();

//     } catch (err) {
//       console.error('Error updating payment status:', err);
//       setError(`Failed to update payment: ${err.response?.data?.message || err.message}`);
//     } finally {
//       setUpdatingPayment(null);
//     }
//   };

//   // Navigate to bill details
//   const handleViewBillDetails = (billId) => {
//     navigate(`/dashboard/bills/${billId}`);
//   };

//   // Filter bills based on search term
//   const filteredBills = bills.filter(bill => {
//     // Filter by search term
//     if (searchTerm && !bill.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
//       return false;
//     }
//     return true;
//   });

//   // Format date string
//   const formatDate = (dateString) => {
//     if (!dateString) return '';

//     const date = new Date(dateString);
//     return `${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
//   };

//   // Get the appropriate icon for the bill category
//   const getCategoryIcon = (category) => {
//     switch (category) {
//       case 'dining':
//         return <Receipt className="text-orange-500" />;
//       case 'traveling':
//         return <ArrowLeftRight className="text-blue-500" />;
//       case 'shopping':
//         return <Tag className="text-green-500" />;
//       case 'hangout':
//         return <User className="text-purple-500" />;
//       default:
//         return <Receipt className="text-gray-500" />;
//     }
//   };

//   // Render payment status pill
//   const PaymentStatusPill = ({ status, onClick, onUndo, isProcessing, isCreator }) => {
//     // If this is a creator's payment, it's always paid and unchangeable
//     if (isCreator) {
//       return (
//         <div className="bg-green-100 px-4 py-1 rounded-full text-green-700 flex items-center gap-1">
//           <Check size={16} />
//           Paid
//         </div>
//       );
//     }

//     if (isProcessing) {
//       return (
//         <div className="bg-gray-100 px-4 py-1 rounded-full text-gray-700 flex items-center gap-2">
//           <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
//           Updating...
//         </div>
//       );
//     }

//     // For completed payments, offer option to mark as unpaid
//     if (status === 'completed') {
//       return (
//         <button
//           onClick={onUndo}
//           className="bg-green-100 hover:bg-green-200 px-4 py-1 rounded-full text-green-700 flex items-center gap-1 group"
//         >
//           <Check size={16} />
//           <span>Paid</span>
//           <span className="hidden group-hover:inline ml-1 text-xs">(Undo)</span>
//         </button>
//       );
//     }

//     // For pending payments, offer option to mark as paid
//     return (
//       <button
//         onClick={onClick}
//         className="bg-orange-100 hover:bg-orange-200 px-4 py-1 rounded-full text-orange-700 flex items-center gap-1"
//       >
//         Mark as Paid
//       </button>
//     );
//   };

//   // Calculate participant summary for "Each Person Pays" section
//   const getParticipantSummary = (bill) => {
//     if (!bill || !bill.paymentSummary || !bill.paymentSummary.participants) {
//       return [];
//     }

//     return bill.paymentSummary.participants.map(participant => {
//       // If this participant is the creator, always mark them as fully paid
//       // by setting pendingAmount to 0
//       if (participant.isCreator) {
//         return {
//           id: participant.id,
//           name: participant.name,
//           totalAmount: Math.round(participant.totalAmount || 0),
//           pendingAmount: 0, // Force to 0 for creators
//           paidAmount: Math.round(participant.totalAmount || 0), // Full amount is paid
//           isCreator: true
//         };
//       } else {
//         // For non-creators, use the actual pending amount
//         return {
//           id: participant.id,
//           name: participant.name,
//           totalAmount: Math.round(participant.totalAmount || 0),
//           pendingAmount: Math.round(participant.pendingAmount || 0),
//           paidAmount: Math.round((participant.totalAmount || 0) - (participant.pendingAmount || 0)),
//           isCreator: false
//         };
//       }
//     });
//   };

//   // Get payment status badge for a bill
//   const getPaymentStatusBadge = (bill) => {
//     if (!bill.paymentSummary) {
//       return null;
//     }

//     if (bill.paymentSummary.status === 'paid') {
//       return (
//         <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center">
//           <Check size={12} className="mr-1" />
//           Fully Paid
//         </span>
//       );
//     } else if (bill.paymentSummary.totalPaid > 0) {
//       return (
//         <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full flex items-center">
//           <DollarSign size={12} className="mr-1" />
//           Partially Paid
//         </span>
//       );
//     } else {
//       return (
//         <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full flex items-center">
//           <DollarSign size={12} className="mr-1" />
//           Unpaid
//         </span>
//       );
//     }
//   };

//   if (loading && bills.length === 0) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-5xl mx-auto px-4 py-6">
//       <h1 className="text-2xl font-bold mb-6">Payment Management</h1>

//       {/* Success Message */}
//       {updatingSuccess && (
//         <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg text-green-700 flex items-center">
//           <Check size={20} className="mr-2" />
//           Payment successfully {updatingSuccess}!
//         </div>
//       )}

//       {/* Search Input Only */}
//       <div className="bg-white rounded-lg border p-6 mb-6">
//         <div className="flex flex-col md:flex-row gap-4">
//           <div className="flex-1">
//             <input
//               type="text"
//               placeholder="Search bills..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full px-4 py-2 border rounded-lg"
//             />
//           </div>
//         </div>
//       </div>

//       {/* Error Message */}
//       {error && (
//         <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
//           {error}
//         </div>
//       )}

//       {/* Bills List */}
//       {filteredBills.length === 0 ? (
//         <div className="text-center p-10 bg-gray-50 rounded-lg border">
//           <p className="text-gray-600">No bills found</p>
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {filteredBills.map((bill) => (
//             <div key={bill.id} className="border rounded-lg overflow-hidden" id={`bill-${bill.id}`}>
//               {/* Bill Header */}
//               <div
//                 className="p-4 bg-white flex justify-between items-center cursor-pointer hover:bg-gray-50"
//                 onClick={() => toggleBillExpansion(bill.id)}
//               >
//                 <div className="flex items-start gap-3">
//                   <div className="p-2 bg-gray-100 rounded-lg">
//                     {getCategoryIcon(bill.category)}
//                   </div>
//                   <div>
//                     <div className="flex items-center gap-2">
//                       <h2 className="font-semibold">{bill.name}</h2>
//                       {bill.paymentSummary && getPaymentStatusBadge(bill)}
//                     </div>
//                     <p className="text-sm text-gray-500">
//                       {bill.description || `with ${bill.participants?.find(p => p.userId !== user.id)?.name || 'friends'}`}
//                     </p>
//                     <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
//                       <div className="flex items-center gap-1">
//                         <Clock size={14} />
//                         <span>{formatDate(bill.date || bill.createdAt)}</span>
//                       </div>
//                       <div className="flex items-center gap-1">
//                         <User size={14} />
//                         <span>{bill.participants?.length || 0} participants</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="flex flex-col items-end gap-2">
//                   <p className="font-bold text-lg">${Math.round(bill.totalAmount || 0)}</p>

//                   {/* Payment summary */}
//                   {bill.paymentSummary && (
//                     <div className="flex flex-col items-end text-xs">
//                       {bill.paymentSummary.totalPaid > 0 && (
//                         <div className="flex items-center gap-1 text-green-600">
//                           <DollarSign size={12} />
//                           <span>${bill.paymentSummary.totalPaid || 0} paid</span>
//                         </div>
//                       )}
//                       {bill.paymentSummary.totalPending > 0 && (
//                         <div className="flex items-center gap-1 text-orange-600">
//                           <DollarSign size={12} />
//                           <span>${bill.paymentSummary.totalPending} pending</span>
//                         </div>
//                       )}
//                     </div>
//                   )}

//                   <div>
//                     {expandedBill === bill.id ? (
//                       <ChevronUp size={20} className="ml-auto text-gray-400" />
//                     ) : (
//                       <ChevronDown size={20} className="ml-auto text-gray-400" />
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Expanded Bill Details */}
//               {expandedBill === bill.id && (
//                 <div className="border-t bg-white">
//                   {/* Bill Summary Section */}
//                   <div className="p-4">
//                     <h3 className="text-lg font-medium mb-4">Bill Summary</h3>

//                     {bill.paymentSummary?.items && (
//                       <div className="space-y-4 mb-4">
//                         {/* Items Summary */}
//                         <div className="bg-white rounded-lg border p-4">
//                           <h4 className="font-medium mb-3">Items</h4>
//                           <div className="space-y-2 mb-4">
//                             {bill.paymentSummary.items.map((item) => (
//                               <div key={item.id} className="flex justify-between text-sm">
//                                 <span>{item.name}</span>
//                                 <span className="font-medium">${Math.round(item.totalAmount || 0)}</span>
//                               </div>
//                             ))}
//                           </div>

//                           <div className="pt-4 border-t">
//                             <div className="flex justify-between font-medium">
//                               <span>Total Amount</span>
//                               <span>${Math.round(bill.totalAmount || 0)}</span>
//                             </div>
//                           </div>
//                         </div>

//                         {/* Each Person Pays Section */}
//                         <div className="bg-white rounded-lg border p-4">
//                           <h4 className="font-medium mb-3">Each Person Pays</h4>
//                           <div className="space-y-3">
//                             {getParticipantSummary(bill).map((summary) => (
//                               <div key={summary.id} className="flex justify-between items-center">
//                                 <div className="flex items-center gap-2">
//                                   <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
//                                     <User size={16} className="text-gray-600" />
//                                   </div>
//                                   <div>
//                                     <span className="font-medium">{summary.name}</span>
//                                     {summary.isCreator && (
//                                       <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">
//                                         Creator
//                                       </span>
//                                     )}
//                                   </div>
//                                 </div>
//                                 <div className="text-right">
//                                   <div className="font-medium">${summary.totalAmount}</div>
//                                   <div className="text-xs">
//                                     {summary.isCreator ? (
//                                       <span className="text-green-600">Fully paid</span>
//                                     ) : summary.pendingAmount > 0 ? (
//                                       <span className="text-orange-600">${summary.pendingAmount} pending</span>
//                                     ) : (
//                                       <span className="text-green-600">Fully paid</span>
//                                     )}
//                                   </div>
//                                 </div>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       </div>
//                     )}
                  
//                     <h3 className="text-lg font-medium mb-4">Payment Details</h3>

//                     {bill.paymentSummary ? (
//                       <div className="space-y-4 mb-4">
//                         {bill.paymentSummary.participants?.map((participant) => {
//                           // Skip showing the creator if they are the current user
//                           if (participant.isCreator && participant.userId === user.id) {
//                             return null;
//                           }

//                           // Determine if we're processing this participant's payment
//                           const isProcessing = updatingPayment !== null;

//                           // Get all pending split IDs for this participant
//                           const pendingSplitIds = [];
//                           bill.paymentSummary.items?.forEach(item => {
//                             item.splits?.forEach(split => {
//                               if (split.participant?.id === participant.id &&
//                                 split.paymentStatus === 'pending') {
//                                 pendingSplitIds.push(split.id);
//                               }
//                             });
//                           });

//                           return (
//                             <div
//                               key={participant.id}
//                               className="border rounded-lg p-4"
//                             >
//                               <div className="flex justify-between items-center">
//                                 <div className="flex items-center gap-3">
//                                   <User size={20} className="text-gray-600" />
//                                   <div>
//                                     <div className="flex items-center gap-2">
//                                       <span className="font-medium">{participant.name}</span>
//                                       {participant.isCreator && (
//                                         <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">Creator</span>
//                                       )}
//                                     </div>
//                                   </div>
//                                 </div>

//                                 <div className="flex items-center gap-3">
//                                   <div className="text-right mr-3">
//                                     <div className="font-medium">
//                                       ${Math.round(participant.totalAmount || 0)}
//                                     </div>
//                                     <div className="text-sm text-gray-500">
//                                       {participant.isCreator ? (
//                                         <span className="text-green-600">Fully paid</span>
//                                       ) : participant.pendingAmount > 0 ? (
//                                         <span className="text-orange-600">
//                                           ${Math.round(participant.pendingAmount)} pending
//                                         </span>
//                                       ) : (
//                                         <span className="text-green-600">Fully paid</span>
//                                       )}
//                                     </div>
//                                   </div>

//                                   {/* Use PaymentStatusPill component here */}
//                                   {participant.isCreator ? (
//                                     <PaymentStatusPill
//                                       status="completed"
//                                       isCreator={true}
//                                     />
//                                   ) : (
//                                     <PaymentStatusPill
//                                       status={participant.pendingAmount > 0 ? "pending" : "completed"}
//                                       isProcessing={isProcessing}
//                                       isCreator={false}
//                                       onClick={() => updatePaymentStatus(pendingSplitIds, 'completed')}
//                                       onUndo={() => {
//                                         // Find all completed split IDs for this participant
//                                         const completedSplitIds = [];
//                                         bill.paymentSummary.items?.forEach(item => {
//                                           item.splits?.forEach(split => {
//                                             if (split.participant?.id === participant.id &&
//                                               split.paymentStatus === 'completed') {
//                                               completedSplitIds.push(split.id);
//                                             }
//                                           });
//                                         });
//                                         // Mark them as pending
//                                         updatePaymentStatus(completedSplitIds, 'pending');
//                                       }}
//                                     />
//                                   )}
//                                 </div>
//                               </div>
//                             </div>
//                           );
//                         })}
//                       </div>
//                     ) : (
//                       <div className="p-4 bg-gray-50 rounded-lg">
//                         <p className="text-gray-600 text-center">Loading payment details...</p>
//                       </div>
//                     )}

//                     <div className="flex justify-end mt-6">
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleViewBillDetails(bill.id);
//                         }}
//                         className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
//                       >
//                         View Bill Details
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// export default Payment;




// import React, { useState, useEffect, useRef } from 'react';
// import { Receipt, User, Clock, ChevronDown, ChevronUp, Check, DollarSign, Tag, ArrowLeftRight } from 'lucide-react';
// import axios from 'axios';
// import { useNavigate, useLocation } from 'react-router';
// import useUserStore from '../stores/userStore';

// function Payment() {
//   const [bills, setBills] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [expandedBill, setExpandedBill] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [updatingPayment, setUpdatingPayment] = useState(null);
//   const [updatingSuccess, setUpdatingSuccess] = useState('');
//   const [initialBillId, setInitialBillId] = useState(null);

//   const { token, user } = useUserStore();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const API_BASE_URL = 'http://localhost:8800';

//   // Fetch bills on component mount and handle hash navigation
//   useEffect(() => {
//     fetchBills();
    
//     // Check if there's a hash in the URL
//     if (location.hash) {
//       // Extract the bill ID from the hash (format: #bill-123)
//       const hashBillId = location.hash.replace('#bill-', '');
//       if (!isNaN(parseInt(hashBillId))) {
//         setInitialBillId(parseInt(hashBillId));
//       }
//     }
//   }, [token, location.hash]);
  
//   // Handle scrolling to and expanding the specific bill
//   useEffect(() => {
//     if (initialBillId && bills.length > 0) {
//       // Find the bill with the matching ID
//       const targetBill = bills.find(bill => bill.id === initialBillId);
      
//       if (targetBill) {
//         // Expand this bill
//         setExpandedBill(initialBillId);
        
//         // Scroll to the bill element with a slight delay to ensure rendering is complete
//         setTimeout(() => {
//           const element = document.getElementById(`bill-${initialBillId}`);
//           if (element) {
//             element.scrollIntoView({ behavior: 'smooth', block: 'start' });
//           }
//         }, 300);
//       }
//     }
//   }, [initialBillId, bills]);

//   // Function to fetch bills (so we can call it after updates too)
//   const fetchBills = async () => {
//     if (!token) return;

//     try {
//       setLoading(true);
//       setError('');

//       // Get all bills
//       const billsResponse = await axios.get(`${API_BASE_URL}/bills`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });

//       // Process bills data
//       let billsData = [];
//       if (billsResponse.data && billsResponse.data.data) {
//         billsData = billsResponse.data.data;
//       } else if (billsResponse.data) {
//         billsData = billsResponse.data;
//       }

//       // Fetch basic payment status for all bills
//       const billsWithStatus = await Promise.all(
//         billsData.map(async (bill) => {
//           try {
//             // Get detailed bill information with participants and items
//             const response = await axios.get(`${API_BASE_URL}/bills/${bill.id}`, {
//               headers: { Authorization: `Bearer ${token}` }
//             });

//             if (response.data) {
//               // Calculate payment summary
//               let totalPaid = 0;
//               let totalPending = 0;

//               if (response.data.participants) {
//                 response.data.participants.forEach(participant => {
//                   // Skip creator in calculations as they're always marked as paid
//                   if (!participant.isCreator) {
//                     totalPaid += Math.round((participant.totalAmount || 0) - (participant.pendingAmount || 0));
//                     totalPending += Math.round(participant.pendingAmount || 0);
//                   }
//                 });
//               }

//               return {
//                 ...bill,
//                 paymentSummary: {
//                   paid: totalPaid,
//                   pending: totalPending,
//                   totalPaid: totalPaid,
//                   totalPending: totalPending,
//                   status: totalPending > 0 ? 'partial' : 'paid',
//                   participants: response.data.participants,
//                   items: response.data.items
//                 }
//               };
//             }
//             return bill;
//           } catch (error) {
//             console.error(`Error fetching details for bill ${bill.id}:`, error);
//             return bill;
//           }
//         })
//       );

//       setBills(billsWithStatus);
//       setLoading(false);

//       // If we had a success message, clear it after 3 seconds
//       if (updatingSuccess) {
//         setTimeout(() => {
//           setUpdatingSuccess('');
//         }, 3000);
//       }
//     } catch (err) {
//       console.error('Error fetching bills:', err);
//       setError(`Failed to load payment data: ${err.response?.data?.message || err.message}`);
//       setLoading(false);
//     }
//   };

//   // Load bill details when expanded
//   const toggleBillExpansion = async (billId) => {
//     if (expandedBill === billId) {
//       setExpandedBill(null);
//       return;
//     }

//     setExpandedBill(billId);

//     try {
//       // Check if we already have detailed data
//       const bill = bills.find(b => b.id === billId);
//       if (bill && bill.paymentSummary && bill.paymentSummary.participants && bill.paymentSummary.items) {
//         // We already have the details, no need to fetch again
//         return;
//       }

//       // Get detailed bill information with participants and items
//       const response = await axios.get(`${API_BASE_URL}/bills/${billId}`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });

//       if (response.data) {
//         // Update the bill with details
//         setBills(prevBills =>
//           prevBills.map(bill =>
//             bill.id === billId ? {
//               ...bill,
//               paymentSummary: {
//                 ...bill.paymentSummary,
//                 participants: response.data.participants,
//                 items: response.data.items
//               }
//             } : bill
//           )
//         );
//       }
//     } catch (err) {
//       console.error('Error fetching bill details:', err);
//       setError(`Failed to load payment details: ${err.response?.data?.message || err.message}`);
//     }
//   };

//   // Update payment status
//   const updatePaymentStatus = async (splitIds, newStatus) => {
//     try {
//       if (!splitIds || splitIds.length === 0) {
//         console.error('No split IDs provided for payment update');
//         return;
//       }

//       setUpdatingPayment(splitIds);

//       await axios.patch(`${API_BASE_URL}/payment`, {
//         splitIds: splitIds,
//         paymentStatus: newStatus
//       }, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       // Show success indicator with appropriate message
//       setUpdatingSuccess(newStatus === 'completed' ? 'marked as paid' : 'marked as unpaid');

//       // Refresh bill data to show updated payment status
//       await fetchBills();

//     } catch (err) {
//       console.error('Error updating payment status:', err);
//       setError(`Failed to update payment: ${err.response?.data?.message || err.message}`);
//     } finally {
//       setUpdatingPayment(null);
//     }
//   };

//   // Navigate to bill details
//   const handleViewBillDetails = (billId) => {
//     navigate(`/dashboard/bills/${billId}`);
//   };

//   // Filter bills based on search term
//   const filteredBills = bills.filter(bill => {
//     // Filter by search term
//     if (searchTerm && !bill.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
//       return false;
//     }
//     return true;
//   });

//   // Format date string
//   const formatDate = (dateString) => {
//     if (!dateString) return '';

//     const date = new Date(dateString);
//     return `${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
//   };

//   // Get the appropriate icon for the bill category
//   const getCategoryIcon = (category) => {
//     switch (category) {
//       case 'dining':
//         return <Receipt className="text-orange-500" />;
//       case 'traveling':
//         return <ArrowLeftRight className="text-blue-500" />;
//       case 'shopping':
//         return <Tag className="text-green-500" />;
//       case 'hangout':
//         return <User className="text-purple-500" />;
//       default:
//         return <Receipt className="text-gray-500" />;
//     }
//   };

//   // Render payment status pill
//   const PaymentStatusPill = ({ status, onClick, onUndo, isProcessing, isCreator }) => {
//     // If this is a creator's payment, it's always paid and unchangeable
//     if (isCreator) {
//       return (
//         <div className="bg-green-100 px-4 py-1 rounded-full text-green-700 flex items-center gap-1">
//           <Check size={16} />
//           Paid
//         </div>
//       );
//     }

//     if (isProcessing) {
//       return (
//         <div className="bg-gray-100 px-4 py-1 rounded-full text-gray-700 flex items-center gap-2">
//           <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
//           Updating...
//         </div>
//       );
//     }

//     // For completed payments, offer option to mark as unpaid
//     if (status === 'completed') {
//       return (
//         <button
//           onClick={onUndo}
//           className="bg-green-100 hover:bg-green-200 px-4 py-1 rounded-full text-green-700 flex items-center gap-1 group"
//         >
//           <Check size={16} />
//           <span>Paid</span>
//           <span className="hidden group-hover:inline ml-1 text-xs">(Undo)</span>
//         </button>
//       );
//     }

//     // For pending payments, offer option to mark as paid
//     return (
//       <button
//         onClick={onClick}
//         className="bg-orange-100 hover:bg-orange-200 px-4 py-1 rounded-full text-orange-700 flex items-center gap-1"
//       >
//         Mark as Paid
//       </button>
//     );
//   };

//   // Calculate participant summary for "Each Person Pays" section
//   const getParticipantSummary = (bill) => {
//     if (!bill || !bill.paymentSummary || !bill.paymentSummary.participants) {
//       return [];
//     }

//     return bill.paymentSummary.participants.map(participant => {
//       // If this participant is the creator, always mark them as fully paid
//       // by setting pendingAmount to 0
//       if (participant.isCreator) {
//         return {
//           id: participant.id,
//           name: participant.name,
//           totalAmount: Math.round(participant.totalAmount || 0),
//           pendingAmount: 0, // Force to 0 for creators
//           paidAmount: Math.round(participant.totalAmount || 0), // Full amount is paid
//           isCreator: true
//         };
//       } else {
//         // For non-creators, use the actual pending amount
//         return {
//           id: participant.id,
//           name: participant.name,
//           totalAmount: Math.round(participant.totalAmount || 0),
//           pendingAmount: Math.round(participant.pendingAmount || 0),
//           paidAmount: Math.round((participant.totalAmount || 0) - (participant.pendingAmount || 0)),
//           isCreator: false
//         };
//       }
//     });
//   };

//   // Get payment status badge for a bill
//   const getPaymentStatusBadge = (bill) => {
//     if (!bill.paymentSummary) {
//       return null;
//     }

//     if (bill.paymentSummary.status === 'paid') {
//       return (
//         <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center">
//           <Check size={12} className="mr-1" />
//           Fully Paid
//         </span>
//       );
//     } else if (bill.paymentSummary.totalPaid > 0) {
//       return (
//         <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full flex items-center">
//           <DollarSign size={12} className="mr-1" />
//           Partially Paid
//         </span>
//       );
//     } else {
//       return (
//         <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full flex items-center">
//           <DollarSign size={12} className="mr-1" />
//           Unpaid
//         </span>
//       );
//     }
//   };

//   if (loading && bills.length === 0) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-5xl mx-auto px-4 py-6">
//       <h1 className="text-2xl font-bold mb-6">Payment Management</h1>

//       {/* Success Message */}
//       {updatingSuccess && (
//         <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg text-green-700 flex items-center">
//           <Check size={20} className="mr-2" />
//           Payment successfully {updatingSuccess}!
//         </div>
//       )}

//       {/* Search Input Only */}
//       <div className="bg-white rounded-lg border p-6 mb-6">
//         <div className="flex flex-col md:flex-row gap-4">
//           <div className="flex-1">
//             <input
//               type="text"
//               placeholder="Search bills..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full px-4 py-2 border rounded-lg"
//             />
//           </div>
//         </div>
//       </div>

//       {/* Error Message */}
//       {error && (
//         <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
//           {error}
//         </div>
//       )}

//       {/* Bills List */}
//       {filteredBills.length === 0 ? (
//         <div className="text-center p-10 bg-gray-50 rounded-lg border">
//           <p className="text-gray-600">No bills found</p>
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {filteredBills.map((bill) => (
//             <div key={bill.id} className="border rounded-lg overflow-hidden" id={`bill-${bill.id}`}>
//               {/* Bill Header */}
//               <div
//                 className="p-4 bg-white flex justify-between items-center cursor-pointer hover:bg-gray-50"
//                 onClick={() => toggleBillExpansion(bill.id)}
//               >
//                 <div className="flex items-start gap-3">
//                   <div className="p-2 bg-purple-100 rounded-lg">
//                     {getCategoryIcon(bill.category)}
//                   </div>
//                   <div>
//                     <div className="flex items-center gap-2">
//                       <h2 className="font-semibold">{bill.name}</h2>
//                       {bill.paymentSummary && getPaymentStatusBadge(bill)}
//                     </div>
//                     <p className="text-sm text-gray-500">
//                       {bill.description || `with ${bill.participants?.find(p => p.userId !== user.id)?.name || 'friends'}`}
//                     </p>
//                     <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
//                       <div className="flex items-center gap-1">
//                         <Clock size={14} />
//                         <span>{formatDate(bill.date || bill.createdAt)}</span>
//                       </div>
//                       <div className="flex items-center gap-1">
//                         <User size={14} />
//                         <span>{bill.participants?.length || 0} participants</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="flex flex-col items-end gap-2">
//                   <p className="font-bold text-lg">${Math.round(bill.totalAmount || 0)}</p>

//                   {/* Payment summary */}
//                   {bill.paymentSummary && (
//                     <div className="flex flex-col items-end text-xs">
//                       {bill.paymentSummary.totalPaid > 0 && (
//                         <div className="flex items-center gap-1 text-green-600">
//                           <DollarSign size={12} />
//                           <span>${bill.paymentSummary.totalPaid || 0} paid</span>
//                         </div>
//                       )}
//                       {bill.paymentSummary.totalPending > 0 && (
//                         <div className="flex items-center gap-1 text-orange-600">
//                           <DollarSign size={12} />
//                           <span>${bill.paymentSummary.totalPending} pending</span>
//                         </div>
//                       )}
//                     </div>
//                   )}

//                   <div>
//                     {expandedBill === bill.id ? (
//                       <ChevronUp size={20} className="ml-auto text-gray-400" />
//                     ) : (
//                       <ChevronDown size={20} className="ml-auto text-gray-400" />
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Expanded Bill Details */}
//               {expandedBill === bill.id && (
//                 <div className="border-t bg-white">
//                   {/* Bill Summary Section */}
//                   <div className="p-4">
//                     <h3 className="text-lg font-medium mb-4">Bill Summary</h3>

//                     {bill.paymentSummary?.items && (
//                       <div className="space-y-4 mb-4">
//                         {/* Items Summary */}
//                         <div className="bg-white rounded-lg border p-4">
//                           <h4 className="font-medium mb-3">Items</h4>
//                           <div className="space-y-2 mb-4">
//                             {bill.paymentSummary.items.map((item) => (
//                               <div key={item.id} className="flex justify-between text-sm">
//                                 <span>{item.name}</span>
//                                 <span className="font-medium">${Math.round(item.totalAmount || 0)}</span>
//                               </div>
//                             ))}
//                           </div>

//                           <div className="pt-4 border-t">
//                             <div className="flex justify-between font-medium">
//                               <span>Total Amount</span>
//                               <span>${Math.round(bill.totalAmount || 0)}</span>
//                             </div>
//                           </div>
//                         </div>

//                         {/* Each Person Pays Section */}
//                         <div className="bg-white rounded-lg border p-4">
//                           <h4 className="font-medium mb-3">Each Person Pays</h4>
//                           <div className="space-y-3">
//                             {getParticipantSummary(bill).map((summary) => (
//                               <div key={summary.id} className="flex justify-between items-center">
//                                 <div className="flex items-center gap-2">
//                                   <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
//                                     <User size={16} className="text-gray-600" />
//                                   </div>
//                                   <div>
//                                     <span className="font-medium">{summary.name}</span>
//                                     {summary.isCreator && (
//                                       <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">
//                                         Creator
//                                       </span>
//                                     )}
//                                   </div>
//                                 </div>
//                                 <div className="text-right">
//                                   <div className="font-medium">${summary.totalAmount}</div>
//                                   <div className="text-xs">
//                                     {summary.isCreator ? (
//                                       <span className="text-green-600">Fully paid</span>
//                                     ) : summary.pendingAmount > 0 ? (
//                                       <span className="text-orange-600">${summary.pendingAmount} pending</span>
//                                     ) : (
//                                       <span className="text-green-600">Fully paid</span>
//                                     )}
//                                   </div>
//                                 </div>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       </div>
//                     )}
                  
//                     <h3 className="text-lg font-medium mb-4">Payment Details</h3>

//                     {bill.paymentSummary ? (
//                       <div className="space-y-4 mb-4">
//                         {bill.paymentSummary.participants?.map((participant) => {
//                           // Skip showing the creator if they are the current user
//                           if (participant.isCreator && participant.userId === user.id) {
//                             return null;
//                           }

//                           // Determine if we're processing this participant's payment
//                           const isProcessing = updatingPayment !== null;

//                           // Get all pending split IDs for this participant
//                           const pendingSplitIds = [];
//                           bill.paymentSummary.items?.forEach(item => {
//                             item.splits?.forEach(split => {
//                               if (split.participant?.id === participant.id &&
//                                 split.paymentStatus === 'pending') {
//                                 pendingSplitIds.push(split.id);
//                               }
//                             });
//                           });

//                           return (
//                             <div
//                               key={participant.id}
//                               className="border rounded-lg p-4"
//                             >
//                               <div className="flex justify-between items-center">
//                                 <div className="flex items-center gap-3">
//                                   <User size={20} className="text-gray-600" />
//                                   <div>
//                                     <div className="flex items-center gap-2">
//                                       <span className="font-medium">{participant.name}</span>
//                                       {participant.isCreator && (
//                                         <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">Creator</span>
//                                       )}
//                                     </div>
//                                   </div>
//                                 </div>

//                                 <div className="flex items-center gap-3">
//                                   <div className="text-right mr-3">
//                                     <div className="font-medium">
//                                       ${Math.round(participant.totalAmount || 0)}
//                                     </div>
//                                     <div className="text-sm text-gray-500">
//                                       {participant.isCreator ? (
//                                         <span className="text-green-600">Fully paid</span>
//                                       ) : participant.pendingAmount > 0 ? (
//                                         <span className="text-orange-600">
//                                           ${Math.round(participant.pendingAmount)} pending
//                                         </span>
//                                       ) : (
//                                         <span className="text-green-600">Fully paid</span>
//                                       )}
//                                     </div>
//                                   </div>

//                                   {/* For creators, always show paid status */}
//                                   {participant.isCreator ? (
//                                     <div className="bg-green-100 px-4 py-2 rounded-lg text-green-700 flex items-center gap-1">
//                                       <Check size={16} />
//                                       Paid
//                                     </div>
//                                   ) : (
//                                     <button
//                                       onClick={() => {
//                                         if (participant.pendingAmount > 0) {
//                                           updatePaymentStatus(pendingSplitIds, 'completed');
//                                         } else {
//                                           // Find all completed split IDs for this participant
//                                           const completedSplitIds = [];
//                                           bill.paymentSummary.items?.forEach(item => {
//                                             item.splits?.forEach(split => {
//                                               if (split.participant?.id === participant.id &&
//                                                 split.paymentStatus === 'completed') {
//                                                 completedSplitIds.push(split.id);
//                                               }
//                                             });
//                                           });
//                                           // Mark them as pending
//                                           updatePaymentStatus(completedSplitIds, 'pending');
//                                         }
//                                       }}
//                                       disabled={isProcessing}
//                                       className={`px-4 py-2 rounded-lg ${
//                                         participant.pendingAmount > 0
//                                           ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
//                                           : 'bg-green-100 text-green-700 hover:bg-green-200'
//                                       }`}
//                                     >
//                                       {isProcessing ? (
//                                         <div className="flex items-center gap-2">
//                                           <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></div>
//                                           Updating...
//                                         </div>
//                                       ) : participant.pendingAmount > 0 ? (
//                                         'Mark as Paid'
//                                       ) : (
//                                         <div className="flex items-center gap-1">
//                                           <Check size={16} />
//                                           <span>Paid</span>
//                                         </div>
//                                       )}
//                                     </button>
//                                   )}
//                                 </div>
//                               </div>
//                             </div>
//                           );
//                         })}
//                       </div>
//                     ) : (
//                       <div className="p-4 bg-gray-50 rounded-lg">
//                         <p className="text-gray-600 text-center">Loading payment details...</p>
//                       </div>
//                     )}

//                     <div className="flex justify-end mt-6">
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleViewBillDetails(bill.id);
//                         }}
//                         className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
//                       >
//                         View Bill Details
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// export default Payment;

// import React, { useState, useEffect, useRef } from 'react';
// import { Receipt, User, Clock, ChevronDown, ChevronUp, Check, DollarSign, Tag, ArrowLeftRight } from 'lucide-react';
// import axios from 'axios';
// import { useNavigate, useLocation } from 'react-router';
// import useUserStore from '../stores/userStore';

// function Payment() {
//   const [bills, setBills] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [expandedBill, setExpandedBill] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [updatingPayment, setUpdatingPayment] = useState(null);
//   const [updatingSuccess, setUpdatingSuccess] = useState('');
//   const [initialBillId, setInitialBillId] = useState(null);

//   const { token, user } = useUserStore();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const API_BASE_URL = 'http://localhost:8800';

//   // Fetch bills on component mount and handle hash navigation
//   useEffect(() => {
//     fetchBills();
    
//     // Check if there's a hash in the URL
//     if (location.hash) {
//       // Extract the bill ID from the hash (format: #bill-123)
//       const hashBillId = location.hash.replace('#bill-', '');
//       if (!isNaN(parseInt(hashBillId))) {
//         setInitialBillId(parseInt(hashBillId));
//       }
//     }
//   }, [token, location.hash]);
  
//   // Handle scrolling to and expanding the specific bill
//   useEffect(() => {
//     if (initialBillId && bills.length > 0) {
//       // Find the bill with the matching ID
//       const targetBill = bills.find(bill => bill.id === initialBillId);
      
//       if (targetBill) {
//         // Expand this bill
//         setExpandedBill(initialBillId);
        
//         // Scroll to the bill element with a slight delay to ensure rendering is complete
//         setTimeout(() => {
//           const element = document.getElementById(`bill-${initialBillId}`);
//           if (element) {
//             element.scrollIntoView({ behavior: 'smooth', block: 'start' });
//           }
//         }, 300);
//       }
//     }
//   }, [initialBillId, bills]);

//   // Function to fetch bills (so we can call it after updates too)
//   const fetchBills = async () => {
//     if (!token) return;

//     try {
//       setLoading(true);
//       setError('');

//       // Get all bills
//       const billsResponse = await axios.get(`${API_BASE_URL}/bills`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });

//       // Process bills data
//       let billsData = [];
//       if (billsResponse.data && billsResponse.data.data) {
//         billsData = billsResponse.data.data;
//       } else if (billsResponse.data) {
//         billsData = billsResponse.data;
//       }

//       // Fetch basic payment status for all bills
//       const billsWithStatus = await Promise.all(
//         billsData.map(async (bill) => {
//           try {
//             // Get detailed bill information with participants and items
//             const response = await axios.get(`${API_BASE_URL}/bills/${bill.id}`, {
//               headers: { Authorization: `Bearer ${token}` }
//             });

//             if (response.data) {
//               // Calculate payment summary
//               let totalPaid = 0;
//               let totalPending = 0;

//               if (response.data.participants) {
//                 response.data.participants.forEach(participant => {
//                   // Skip creator in calculations as they're always marked as paid
//                   if (!participant.isCreator) {
//                     totalPaid += Math.round((participant.totalAmount || 0) - (participant.pendingAmount || 0));
//                     totalPending += Math.round(participant.pendingAmount || 0);
//                   }
//                 });
//               }

//               return {
//                 ...bill,
//                 paymentSummary: {
//                   paid: totalPaid,
//                   pending: totalPending,
//                   totalPaid: totalPaid,
//                   totalPending: totalPending,
//                   status: totalPending > 0 ? 'partial' : 'paid'
//                 }
//               };
//             }
//             return bill;
//           } catch (error) {
//             console.error(`Error fetching details for bill ${bill.id}:`, error);
//             return bill;
//           }
//         })
//       );

//       setBills(billsWithStatus);
//       setLoading(false);

//       // If we had a success message, clear it after 3 seconds
//       if (updatingSuccess) {
//         setTimeout(() => {
//           setUpdatingSuccess('');
//         }, 3000);
//       }
//     } catch (err) {
//       console.error('Error fetching bills:', err);
//       setError(`Failed to load payment data: ${err.response?.data?.message || err.message}`);
//       setLoading(false);
//     }
//   };

//   // Load bill details when expanded
//   const toggleBillExpansion = async (billId) => {
//     if (expandedBill === billId) {
//       setExpandedBill(null);
//       return;
//     }

//     setExpandedBill(billId);

//     try {
//       // Get detailed bill information with participants and items
//       const response = await axios.get(`${API_BASE_URL}/bills/${billId}`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });

//       if (response.data) {
//         // Update the bill with details
//         setBills(prevBills =>
//           prevBills.map(bill =>
//             bill.id === billId ? {
//               ...bill,
//               paymentSummary: {
//                 ...bill.paymentSummary,
//                 participants: response.data.participants,
//                 items: response.data.items
//               }
//             } : bill
//           )
//         );
//       }
//     } catch (err) {
//       console.error('Error fetching bill details:', err);
//       setError(`Failed to load payment details: ${err.response?.data?.message || err.message}`);
//     }
//   };

//   // Update payment status
//   const updatePaymentStatus = async (splitIds, newStatus) => {
//     try {
//       if (!splitIds || splitIds.length === 0) {
//         console.error('No split IDs provided for payment update');
//         return;
//       }

//       setUpdatingPayment(splitIds);

//       await axios.patch(`${API_BASE_URL}/payment`, {
//         splitIds: splitIds,
//         paymentStatus: newStatus
//       }, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       // Show success indicator with appropriate message
//       setUpdatingSuccess(newStatus === 'completed' ? 'marked as paid' : 'marked as unpaid');

//       // Refresh bill data to show updated payment status
//       await fetchBills();

//       // If a bill is expanded, fetch its details again
//       if (expandedBill) {
//         await toggleBillExpansion(expandedBill);
//       }

//     } catch (err) {
//       console.error('Error updating payment status:', err);
//       setError(`Failed to update payment: ${err.response?.data?.message || err.message}`);
//     } finally {
//       setUpdatingPayment(null);
//     }
//   };

//   // Navigate to bill details
//   const handleViewBillDetails = (billId) => {
//     navigate(`/dashboard/bills/${billId}`);
//   };

//   // Filter bills based on search term
//   const filteredBills = bills.filter(bill => {
//     // Filter by search term
//     if (searchTerm && !bill.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
//       return false;
//     }
//     return true;
//   });

//   // Format date string
//   const formatDate = (dateString) => {
//     if (!dateString) return '';

//     const date = new Date(dateString);
//     return `${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
//   };

//   // Get the appropriate icon for the bill category
//   const getCategoryIcon = (category) => {
//     switch (category) {
//       case 'dining':
//         return <Receipt className="text-orange-500" />;
//       case 'traveling':
//         return <ArrowLeftRight className="text-blue-500" />;
//       case 'shopping':
//         return <Tag className="text-green-500" />;
//       case 'hangout':
//         return <User className="text-purple-500" />;
//       default:
//         return <Receipt className="text-gray-500" />;
//     }
//   };

//   // Render payment status pill
//   const PaymentStatusPill = ({ status, onClick, onUndo, isProcessing, isCreator }) => {
//     // If this is a creator's payment, it's always paid and unchangeable
//     if (isCreator) {
//       return (
//         <div className="bg-green-100 px-4 py-1 rounded-full text-green-700 flex items-center gap-1">
//           <Check size={16} />
//           Paid
//         </div>
//       );
//     }

//     if (isProcessing) {
//       return (
//         <div className="bg-gray-100 px-4 py-1 rounded-full text-gray-700 flex items-center gap-2">
//           <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
//           Updating...
//         </div>
//       );
//     }

//     // For completed payments, offer option to mark as unpaid
//     if (status === 'completed') {
//       return (
//         <button
//           onClick={onUndo}
//           className="bg-green-100 hover:bg-green-200 px-4 py-1 rounded-full text-green-700 flex items-center gap-1 group"
//         >
//           <Check size={16} />
//           <span>Paid</span>
//           <span className="hidden group-hover:inline ml-1 text-xs">(Undo)</span>
//         </button>
//       );
//     }

//     // For pending payments, offer option to mark as paid
//     return (
//       <button
//         onClick={onClick}
//         className="bg-orange-100 hover:bg-orange-200 px-4 py-1 rounded-full text-orange-700 flex items-center gap-1"
//       >
//         Mark as Paid
//       </button>
//     );
//   };

//   // Calculate participant summary for "Each Person Pays" section
//   const getParticipantSummary = (bill) => {
//     if (!bill || !bill.paymentSummary || !bill.paymentSummary.participants) {
//       return [];
//     }

//     return bill.paymentSummary.participants.map(participant => {
//       // If this participant is the creator, always mark them as fully paid
//       // by setting pendingAmount to 0
//       if (participant.isCreator) {
//         return {
//           id: participant.id,
//           name: participant.name,
//           totalAmount: Math.round(participant.totalAmount || 0),
//           pendingAmount: 0, // Force to 0 for creators
//           paidAmount: Math.round(participant.totalAmount || 0), // Full amount is paid
//           isCreator: true
//         };
//       } else {
//         // For non-creators, use the actual pending amount
//         return {
//           id: participant.id,
//           name: participant.name,
//           totalAmount: Math.round(participant.totalAmount || 0),
//           pendingAmount: Math.round(participant.pendingAmount || 0),
//           paidAmount: Math.round((participant.totalAmount || 0) - (participant.pendingAmount || 0)),
//           isCreator: false
//         };
//       }
//     });
//   };

//   // Get payment status badge for a bill
//   const getPaymentStatusBadge = (bill) => {
//     if (!bill.paymentSummary) {
//       return null;
//     }

//     if (bill.paymentSummary.status === 'paid') {
//       return (
//         <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center">
//           <Check size={12} className="mr-1" />
//           Fully Paid
//         </span>
//       );
//     } else {
//       return (
//         <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full flex items-center">
//           <DollarSign size={12} className="mr-1" />
//           Partially Paid
//         </span>
//       );
//     }
//   };

//   if (loading && bills.length === 0) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-5xl mx-auto px-4 py-6">
//       <h1 className="text-2xl font-bold mb-6">Payment Management</h1>

//       {/* Success Message */}
//       {updatingSuccess && (
//         <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg text-green-700 flex items-center">
//           <Check size={20} className="mr-2" />
//           Payment successfully {updatingSuccess}!
//         </div>
//       )}

//       {/* Search Input Only */}
//       <div className="bg-white rounded-lg border p-6 mb-6">
//         <div className="flex flex-col md:flex-row gap-4">
//           <div className="flex-1">
//             <input
//               type="text"
//               placeholder="Search bills..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full px-4 py-2 border rounded-lg"
//             />
//           </div>
//         </div>
//       </div>

//       {/* Error Message */}
//       {error && (
//         <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
//           {error}
//         </div>
//       )}

//       {/* Bills List */}
//       {filteredBills.length === 0 ? (
//         <div className="text-center p-10 bg-gray-50 rounded-lg border">
//           <p className="text-gray-600">No bills found</p>
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {filteredBills.map((bill) => (
//             <div key={bill.id} className="border rounded-lg overflow-hidden" id={`bill-${bill.id}`}>
//               {/* Bill Header */}
//               <div
//                 className="p-4 bg-white flex justify-between items-center cursor-pointer hover:bg-gray-50"
//                 onClick={() => toggleBillExpansion(bill.id)}
//               >
//                 <div className="flex items-start gap-3">
//                   <div className="p-2 bg-gray-100 rounded-lg">
//                     {getCategoryIcon(bill.category)}
//                   </div>
//                   <div>
//                     <div className="flex items-center gap-2">
//                       <h2 className="font-semibold">{bill.name}</h2>
//                       {bill.paymentSummary && getPaymentStatusBadge(bill)}
//                     </div>
//                     <p className="text-sm text-gray-500">
//                       {bill.description || `with ${bill.participants?.find(p => p.userId !== user.id)?.name || 'Others'}`}
//                     </p>
//                     <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
//                       <div className="flex items-center gap-1">
//                         <Clock size={14} />
//                         <span>{formatDate(bill.date || bill.createdAt)}</span>
//                       </div>
//                       <div className="flex items-center gap-1">
//                         <User size={14} />
//                         <span>{bill.participants?.length || 0} participants</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="flex flex-col items-end gap-2">
//                   <p className="font-bold text-lg">${Math.round(bill.totalAmount || 0)}</p>

//                   {/* Payment summary */}
//                   {bill.paymentSummary && (
//                     <div className="flex flex-col items-end text-xs">
//                       <div className="flex items-center gap-1 text-green-600">
//                         <DollarSign size={12} />
//                         <span>${bill.paymentSummary.totalPaid || 0} paid</span>
//                       </div>
//                       {bill.paymentSummary.totalPending > 0 && (
//                         <div className="flex items-center gap-1 text-orange-600">
//                           <DollarSign size={12} />
//                           <span>${bill.paymentSummary.totalPending} pending</span>
//                         </div>
//                       )}
//                     </div>
//                   )}

//                   <div>
//                     {expandedBill === bill.id ? (
//                       <ChevronUp size={20} className="ml-auto text-gray-400" />
//                     ) : (
//                       <ChevronDown size={20} className="ml-auto text-gray-400" />
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Expanded Bill Details */}
//               {expandedBill === bill.id && (
//                 <div className="border-t bg-white p-4">
//                   {/* Bill Summary Section */}
//                   <div className="mb-6">
//                     <h3 className="text-lg font-medium mb-4">Bill Summary</h3>

//                     {bill.paymentSummary?.items && (
//                       <div className="space-y-4 mb-4">
//                         {/* Items Summary */}
//                         <div className="bg-white rounded-lg border p-4">
//                           <h4 className="font-medium mb-3">Items</h4>
//                           <div className="space-y-2 mb-4">
//                             {bill.paymentSummary.items.map((item) => (
//                               <div key={item.id} className="flex justify-between text-sm">
//                                 <span>{item.name}</span>
//                                 <span className="font-medium">${Math.round(item.totalAmount || 0)}</span>
//                               </div>
//                             ))}
//                           </div>

//                           <div className="pt-4 border-t">
//                             <div className="flex justify-between font-medium">
//                               <span>Total Amount</span>
//                               <span>${Math.round(bill.totalAmount || 0)}</span>
//                             </div>
//                           </div>
//                         </div>

//                         {/* Each Person Pays Section */}
//                         <div className="bg-white rounded-lg border p-4">
//                           <h4 className="font-medium mb-3">Each Person Pays</h4>
//                           <div className="space-y-3">
//                             {getParticipantSummary(bill).map((summary) => (
//                               <div key={summary.id} className="flex justify-between items-center">
//                                 <div className="flex items-center gap-2">
//                                   <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
//                                     <User size={16} className="text-gray-600" />
//                                   </div>
//                                   <div>
//                                     <span className="font-medium">{summary.name}</span>
//                                     {summary.isCreator && (
//                                       <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">
//                                         Creator
//                                       </span>
//                                     )}
//                                   </div>
//                                 </div>
//                                 <div className="text-right">
//                                   <div className="font-medium">${summary.totalAmount}</div>
//                                   <div className="text-xs">
//                                     {summary.isCreator ? (
//                                       <span className="text-green-600">Fully paid</span>
//                                     ) : summary.pendingAmount > 0 ? (
//                                       <span className="text-orange-600">${summary.pendingAmount} pending</span>
//                                     ) : (
//                                       <span className="text-green-600">Fully paid</span>
//                                     )}
//                                   </div>
//                                 </div>
//                               </div>
//                             ))}


//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </div>

//                   <h3 className="text-lg font-medium mb-4">Payment Details</h3>

//                   {bill.paymentSummary ? (
//                     <div className="space-y-4 mb-4">
//                       {bill.paymentSummary.participants?.map((participant) => {
//                         // Skip showing the creator if they are the current user
//                         if (participant.isCreator && participant.userId === user.id) {
//                           return null;
//                         }

//                         // Determine if we're processing this participant's payment
//                         const isProcessing = participant.pendingAmount > 0 &&
//                           updatingPayment !== null;

//                         // Get all pending split IDs for this participant
//                         const pendingSplitIds = [];
//                         bill.paymentSummary.items?.forEach(item => {
//                           item.splits?.forEach(split => {
//                             if (split.participant?.id === participant.id &&
//                               split.paymentStatus === 'pending') {
//                               pendingSplitIds.push(split.id);
//                             }
//                           });
//                         });

//                         return (
//                           <div
//                             key={participant.id}
//                             className="border rounded-lg p-4"
//                           >
//                             <div className="flex justify-between items-center mb-3">
//                               <div className="flex items-center gap-3">
//                                 <User size={20} className="text-gray-600" />
//                                 <div>
//                                   <div className="flex items-center gap-2">
//                                     <span className="font-medium">{participant.name}</span>
//                                     {participant.isCreator && (
//                                       <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">Creator</span>
//                                     )}
//                                   </div>
//                                 </div>
//                               </div>

//                               <div className="flex items-center gap-3">
//                                 <div className="text-right mr-3">
//                                   <div className="font-medium">
//                                     ${Math.round(participant.totalAmount || 0)}
//                                   </div>
//                                   <div className="text-sm text-gray-500">
//                                     {participant.isCreator ? (
//                                       <span className="text-green-600">Fully paid</span>
//                                     ) : participant.pendingAmount > 0 ? (
//                                       <span className="text-orange-600">
//                                         ${Math.round(participant.pendingAmount)} pending
//                                       </span>
//                                     ) : (
//                                       <span className="text-green-600">Fully paid</span>
//                                     )}
//                                   </div>
//                                 </div>

//                                 {/* For creators, always show paid status */}
//                                 {participant.isCreator ? (
//                                   <PaymentStatusPill
//                                     status="completed"
//                                     isCreator={true}
//                                   />
//                                 ) : (
//                                   <PaymentStatusPill
//                                     status={participant.pendingAmount > 0 ? "pending" : "completed"}
//                                     isProcessing={isProcessing}
//                                     isCreator={participant.isCreator}
//                                     onClick={() => updatePaymentStatus(pendingSplitIds, 'completed')}
//                                     onUndo={() => {
//                                       // Find all completed split IDs for this participant
//                                       const completedSplitIds = [];
//                                       bill.paymentSummary.items?.forEach(item => {
//                                         item.splits?.forEach(split => {
//                                           if (split.participant?.id === participant.id &&
//                                             split.paymentStatus === 'completed') {
//                                             completedSplitIds.push(split.id);
//                                           }
//                                         });
//                                       });
//                                       // Mark them as pending
//                                       updatePaymentStatus(completedSplitIds, 'pending');
//                                     }}
//                                   />
//                                 )}
//                               </div>
//                             </div>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   ) : (
//                     <div className="p-4 bg-gray-50 rounded-lg">
//                       <p className="text-gray-600 text-center">Loading payment details...</p>
//                     </div>
//                   )}

//                   <div className="flex justify-end mt-6">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleViewBillDetails(bill.id);
//                       }}
//                       className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
//                     >
//                       View Bill Details
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// export default Payment;


//reference

// import React, { useState, useEffect } from 'react';
// import { Receipt, User, Clock, ChevronDown, ChevronUp, Check, DollarSign, Tag, ArrowLeftRight } from 'lucide-react';
// import axios from 'axios';
// import { useNavigate } from 'react-router';
// import useUserStore from '../stores/userStore';

// function Payment() {
//   const [bills, setBills] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [expandedBill, setExpandedBill] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [updatingPayment, setUpdatingPayment] = useState(null);
//   const [updatingSuccess, setUpdatingSuccess] = useState('');

//   const { token, user } = useUserStore();
//   const navigate = useNavigate();

//   const API_BASE_URL = 'http://localhost:8800';

//   // Fetch bills on component mount
//   useEffect(() => {
//     fetchBills();
//   }, [token]);

//   // Function to fetch bills (so we can call it after updates too)
//   const fetchBills = async () => {
//     if (!token) return;

//     try {
//       setLoading(true);
//       setError('');

//       // Get all bills
//       const billsResponse = await axios.get(`${API_BASE_URL}/bills`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });

//       // Process bills data
//       let billsData = [];
//       if (billsResponse.data && billsResponse.data.data) {
//         billsData = billsResponse.data.data;
//       } else if (billsResponse.data) {
//         billsData = billsResponse.data;
//       }

//       // Fetch basic payment status for all bills
//       const billsWithStatus = await Promise.all(
//         billsData.map(async (bill) => {
//           try {
//             // Get detailed bill information with participants and items
//             const response = await axios.get(`${API_BASE_URL}/bills/${bill.id}`, {
//               headers: { Authorization: `Bearer ${token}` }
//             });

//             if (response.data) {
//               // Calculate payment summary
//               let totalPaid = 0;
//               let totalPending = 0;

//               if (response.data.participants) {
//                 response.data.participants.forEach(participant => {
//                   // Skip creator in calculations as they're always marked as paid
//                   if (!participant.isCreator) {
//                     totalPaid += Math.round((participant.totalAmount || 0) - (participant.pendingAmount || 0));
//                     totalPending += Math.round(participant.pendingAmount || 0);
//                   }
//                 });
//               }

//               return {
//                 ...bill,
//                 paymentSummary: {
//                   paid: totalPaid,
//                   pending: totalPending,
//                   totalPaid: totalPaid,
//                   totalPending: totalPending,
//                   status: totalPending > 0 ? 'partial' : 'paid'
//                 }
//               };
//             }
//             return bill;
//           } catch (error) {
//             console.error(`Error fetching details for bill ${bill.id}:`, error);
//             return bill;
//           }
//         })
//       );

//       setBills(billsWithStatus);
//       setLoading(false);

//       // If we had a success message, clear it after 3 seconds
//       if (updatingSuccess) {
//         setTimeout(() => {
//           setUpdatingSuccess('');
//         }, 3000);
//       }
//     } catch (err) {
//       console.error('Error fetching bills:', err);
//       setError(`Failed to load payment data: ${err.response?.data?.message || err.message}`);
//       setLoading(false);
//     }
//   };

//   // Load bill details when expanded
//   const toggleBillExpansion = async (billId) => {
//     if (expandedBill === billId) {
//       setExpandedBill(null);
//       return;
//     }

//     setExpandedBill(billId);

//     try {
//       // Get detailed bill information with participants and items
//       const response = await axios.get(`${API_BASE_URL}/bills/${billId}`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });

//       if (response.data) {
//         // Update the bill with details
//         setBills(prevBills =>
//           prevBills.map(bill =>
//             bill.id === billId ? {
//               ...bill,
//               paymentSummary: {
//                 ...bill.paymentSummary,
//                 participants: response.data.participants,
//                 items: response.data.items
//               }
//             } : bill
//           )
//         );
//       }
//     } catch (err) {
//       console.error('Error fetching bill details:', err);
//       setError(`Failed to load payment details: ${err.response?.data?.message || err.message}`);
//     }
//   };

//   // Update payment status
//   const updatePaymentStatus = async (splitIds, newStatus) => {
//     try {
//       if (!splitIds || splitIds.length === 0) {
//         console.error('No split IDs provided for payment update');
//         return;
//       }

//       setUpdatingPayment(splitIds);

//       await axios.patch(`${API_BASE_URL}/payment`, {
//         splitIds: splitIds,
//         paymentStatus: newStatus
//       }, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       // Show success indicator with appropriate message
//       setUpdatingSuccess(newStatus === 'completed' ? 'marked as paid' : 'marked as unpaid');

//       // Refresh bill data to show updated payment status
//       await fetchBills();

//       // If a bill is expanded, fetch its details again
//       if (expandedBill) {
//         await toggleBillExpansion(expandedBill);
//       }

//     } catch (err) {
//       console.error('Error updating payment status:', err);
//       setError(`Failed to update payment: ${err.response?.data?.message || err.message}`);
//     } finally {
//       setUpdatingPayment(null);
//     }
//   };

//   // Navigate to bill details
//   const handleViewBillDetails = (billId) => {
//     navigate(`/dashboard/bills/${billId}`);
//   };

//   // Filter bills based on search term
//   const filteredBills = bills.filter(bill => {
//     // Filter by search term
//     if (searchTerm && !bill.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
//       return false;
//     }
//     return true;
//   });

//   // Format date string
//   const formatDate = (dateString) => {
//     if (!dateString) return '';

//     const date = new Date(dateString);
//     return `${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
//   };

//   // Get the appropriate icon for the bill category
//   const getCategoryIcon = (category) => {
//     switch (category) {
//       case 'dining':
//         return <Receipt className="text-orange-500" />;
//       case 'traveling':
//         return <ArrowLeftRight className="text-blue-500" />;
//       case 'shopping':
//         return <Tag className="text-green-500" />;
//       case 'hangout':
//         return <User className="text-purple-500" />;
//       default:
//         return <Receipt className="text-gray-500" />;
//     }
//   };

//   // Render payment status pill
//   const PaymentStatusPill = ({ status, onClick, onUndo, isProcessing, isCreator }) => {
//     // If this is a creator's payment, it's always paid and unchangeable
//     if (isCreator) {
//       return (
//         <div className="bg-green-100 px-4 py-1 rounded-full text-green-700 flex items-center gap-1">
//           <Check size={16} />
//           Paid
//         </div>
//       );
//     }

//     if (isProcessing) {
//       return (
//         <div className="bg-gray-100 px-4 py-1 rounded-full text-gray-700 flex items-center gap-2">
//           <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
//           Updating...
//         </div>
//       );
//     }

//     // For completed payments, offer option to mark as unpaid
//     if (status === 'completed') {
//       return (
//         <button
//           onClick={onUndo}
//           className="bg-green-100 hover:bg-green-200 px-4 py-1 rounded-full text-green-700 flex items-center gap-1 group"
//         >
//           <Check size={16} />
//           <span>Paid</span>
//           <span className="hidden group-hover:inline ml-1 text-xs">(Undo)</span>
//         </button>
//       );
//     }

//     // For pending payments, offer option to mark as paid
//     return (
//       <button
//         onClick={onClick}
//         className="bg-orange-100 hover:bg-orange-200 px-4 py-1 rounded-full text-orange-700 flex items-center gap-1"
//       >
//         Mark as Paid
//       </button>
//     );
//   };

//   // Calculate participant summary for "Each Person Pays" section
//   const getParticipantSummary = (bill) => {
//     if (!bill || !bill.paymentSummary || !bill.paymentSummary.participants) {
//       return [];
//     }

//     return bill.paymentSummary.participants.map(participant => {
//       // If this participant is the creator, always mark them as fully paid
//       // by setting pendingAmount to 0
//       if (participant.isCreator) {
//         return {
//           id: participant.id,
//           name: participant.name,
//           totalAmount: Math.round(participant.totalAmount || 0),
//           pendingAmount: 0, // Force to 0 for creators
//           paidAmount: Math.round(participant.totalAmount || 0), // Full amount is paid
//           isCreator: true
//         };
//       } else {
//         // For non-creators, use the actual pending amount
//         return {
//           id: participant.id,
//           name: participant.name,
//           totalAmount: Math.round(participant.totalAmount || 0),
//           pendingAmount: Math.round(participant.pendingAmount || 0),
//           paidAmount: Math.round((participant.totalAmount || 0) - (participant.pendingAmount || 0)),
//           isCreator: false
//         };
//       }
//     });
//   };

//   // Get payment status badge for a bill
//   const getPaymentStatusBadge = (bill) => {
//     if (!bill.paymentSummary) {
//       return null;
//     }

//     if (bill.paymentSummary.status === 'paid') {
//       return (
//         <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center">
//           <Check size={12} className="mr-1" />
//           Fully Paid
//         </span>
//       );
//     } else {
//       return (
//         <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full flex items-center">
//           <DollarSign size={12} className="mr-1" />
//           Partially Paid
//         </span>
//       );
//     }
//   };

//   if (loading && bills.length === 0) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-5xl mx-auto px-4 py-6">
//       <h1 className="text-2xl font-bold mb-6">Payment Management</h1>

//       {/* Success Message */}
//       {updatingSuccess && (
//         <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg text-green-700 flex items-center">
//           <Check size={20} className="mr-2" />
//           Payment successfully {updatingSuccess}!
//         </div>
//       )}

//       {/* Search Input Only */}
//       <div className="bg-white rounded-lg border p-6 mb-6">
//         <div className="flex flex-col md:flex-row gap-4">
//           <div className="flex-1">
//             <input
//               type="text"
//               placeholder="Search bills..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full px-4 py-2 border rounded-lg"
//             />
//           </div>
//         </div>
//       </div>

//       {/* Error Message */}
//       {error && (
//         <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
//           {error}
//         </div>
//       )}

//       {/* Bills List */}
//       {filteredBills.length === 0 ? (
//         <div className="text-center p-10 bg-gray-50 rounded-lg border">
//           <p className="text-gray-600">No bills found</p>
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {filteredBills.map((bill) => (
//             <div key={bill.id} className="border rounded-lg overflow-hidden">
//               {/* Bill Header */}
//               <div
//                 className="p-4 bg-white flex justify-between items-center cursor-pointer hover:bg-gray-50"
//                 onClick={() => toggleBillExpansion(bill.id)}
//               >
//                 <div className="flex items-start gap-3">
//                   <div className="p-2 bg-gray-100 rounded-lg">
//                     {getCategoryIcon(bill.category)}
//                   </div>
//                   <div>
//                     <div className="flex items-center gap-2">
//                       <h2 className="font-semibold">{bill.name}</h2>
//                       {bill.paymentSummary && getPaymentStatusBadge(bill)}
//                     </div>
//                     <p className="text-sm text-gray-500">
//                       {bill.description || `with ${bill.participants?.find(p => p.userId !== user.id)?.name || 'Others'}`}
//                     </p>
//                     <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
//                       <div className="flex items-center gap-1">
//                         <Clock size={14} />
//                         <span>{formatDate(bill.date || bill.createdAt)}</span>
//                       </div>
//                       <div className="flex items-center gap-1">
//                         <User size={14} />
//                         <span>{bill.participants?.length || 0} participants</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="flex flex-col items-end gap-2">
//                   <p className="font-bold text-lg">${Math.round(bill.totalAmount || 0)}</p>

//                   {/* Payment summary */}
//                   {bill.paymentSummary && (
//                     <div className="flex flex-col items-end text-xs">
//                       <div className="flex items-center gap-1 text-green-600">
//                         <DollarSign size={12} />
//                         <span>${bill.paymentSummary.totalPaid || 0} paid</span>
//                       </div>
//                       {bill.paymentSummary.totalPending > 0 && (
//                         <div className="flex items-center gap-1 text-orange-600">
//                           <DollarSign size={12} />
//                           <span>${bill.paymentSummary.totalPending} pending</span>
//                         </div>
//                       )}
//                     </div>
//                   )}

//                   <div>
//                     {expandedBill === bill.id ? (
//                       <ChevronUp size={20} className="ml-auto text-gray-400" />
//                     ) : (
//                       <ChevronDown size={20} className="ml-auto text-gray-400" />
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Expanded Bill Details */}
//               {expandedBill === bill.id && (
//                 <div className="border-t bg-white p-4">
//                   {/* Bill Summary Section */}
//                   <div className="mb-6">
//                     <h3 className="text-lg font-medium mb-4">Bill Summary</h3>

//                     {bill.paymentSummary?.items && (
//                       <div className="space-y-4 mb-4">
//                         {/* Items Summary */}
//                         <div className="bg-white rounded-lg border p-4">
//                           <h4 className="font-medium mb-3">Items</h4>
//                           <div className="space-y-2 mb-4">
//                             {bill.paymentSummary.items.map((item) => (
//                               <div key={item.id} className="flex justify-between text-sm">
//                                 <span>{item.name}</span>
//                                 <span className="font-medium">${Math.round(item.totalAmount || 0)}</span>
//                               </div>
//                             ))}
//                           </div>

//                           <div className="pt-4 border-t">
//                             <div className="flex justify-between font-medium">
//                               <span>Total Amount</span>
//                               <span>${Math.round(bill.totalAmount || 0)}</span>
//                             </div>
//                           </div>
//                         </div>

//                         {/* Each Person Pays Section */}
//                         <div className="bg-white rounded-lg border p-4">
//                           <h4 className="font-medium mb-3">Each Person Pays</h4>
//                           <div className="space-y-3">
//                             {getParticipantSummary(bill).map((summary) => (
//                               <div key={summary.id} className="flex justify-between items-center">
//                                 <div className="flex items-center gap-2">
//                                   <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
//                                     <User size={16} className="text-gray-600" />
//                                   </div>
//                                   <div>
//                                     <span className="font-medium">{summary.name}</span>
//                                     {summary.isCreator && (
//                                       <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">
//                                         Creator
//                                       </span>
//                                     )}
//                                   </div>
//                                 </div>
//                                 <div className="text-right">
//                                   <div className="font-medium">${summary.totalAmount}</div>
//                                   <div className="text-xs">
//                                     {summary.isCreator ? (
//                                       <span className="text-green-600">Fully paid</span>
//                                     ) : summary.pendingAmount > 0 ? (
//                                       <span className="text-orange-600">${summary.pendingAmount} pending</span>
//                                     ) : (
//                                       <span className="text-green-600">Fully paid</span>
//                                     )}
//                                   </div>
//                                 </div>
//                               </div>
//                             ))}


//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </div>

//                   <h3 className="text-lg font-medium mb-4">Payment Details</h3>

//                   {bill.paymentSummary ? (
//                     <div className="space-y-4 mb-4">
//                       {bill.paymentSummary.participants?.map((participant) => {
//                         // Skip showing the creator if they are the current user
//                         if (participant.isCreator && participant.userId === user.id) {
//                           return null;
//                         }

//                         // Determine if we're processing this participant's payment
//                         const isProcessing = participant.pendingAmount > 0 &&
//                           updatingPayment !== null;

//                         // Get all pending split IDs for this participant
//                         const pendingSplitIds = [];
//                         bill.paymentSummary.items?.forEach(item => {
//                           item.splits?.forEach(split => {
//                             if (split.participant?.id === participant.id &&
//                               split.paymentStatus === 'pending') {
//                               pendingSplitIds.push(split.id);
//                             }
//                           });
//                         });

//                         return (
//                           <div
//                             key={participant.id}
//                             className="border rounded-lg p-4"
//                           >
//                             <div className="flex justify-between items-center mb-3">
//                               <div className="flex items-center gap-3">
//                                 <User size={20} className="text-gray-600" />
//                                 <div>
//                                   <div className="flex items-center gap-2">
//                                     <span className="font-medium">{participant.name}</span>
//                                     {participant.isCreator && (
//                                       <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">Creator</span>
//                                     )}
//                                   </div>
//                                 </div>
//                               </div>

//                               <div className="flex items-center gap-3">
//                                 <div className="text-right mr-3">
//                                   <div className="font-medium">
//                                     ${Math.round(participant.totalAmount || 0)}
//                                   </div>
//                                   <div className="text-sm text-gray-500">
//                                     {participant.isCreator ? (
//                                       <span className="text-green-600">Fully paid</span>
//                                     ) : participant.pendingAmount > 0 ? (
//                                       <span className="text-orange-600">
//                                         ${Math.round(participant.pendingAmount)} pending
//                                       </span>
//                                     ) : (
//                                       <span className="text-green-600">Fully paid</span>
//                                     )}
//                                   </div>
//                                 </div>

//                                 {/* For creators, always show paid status */}
//                                 {participant.isCreator ? (
//                                   <PaymentStatusPill
//                                     status="completed"
//                                     isCreator={true}
//                                   />
//                                 ) : (
//                                   <PaymentStatusPill
//                                     status={participant.pendingAmount > 0 ? "pending" : "completed"}
//                                     isProcessing={isProcessing}
//                                     isCreator={participant.isCreator}
//                                     onClick={() => updatePaymentStatus(pendingSplitIds, 'completed')}
//                                     onUndo={() => {
//                                       // Find all completed split IDs for this participant
//                                       const completedSplitIds = [];
//                                       bill.paymentSummary.items?.forEach(item => {
//                                         item.splits?.forEach(split => {
//                                           if (split.participant?.id === participant.id &&
//                                             split.paymentStatus === 'completed') {
//                                             completedSplitIds.push(split.id);
//                                           }
//                                         });
//                                       });
//                                       // Mark them as pending
//                                       updatePaymentStatus(completedSplitIds, 'pending');
//                                     }}
//                                   />
//                                 )}
//                               </div>
//                             </div>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   ) : (
//                     <div className="p-4 bg-gray-50 rounded-lg">
//                       <p className="text-gray-600 text-center">Loading payment details...</p>
//                     </div>
//                   )}

//                   <div className="flex justify-end mt-6">
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleViewBillDetails(bill.id);
//                       }}
//                       className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
//                     >
//                       View Bill Details
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// export default Payment;


