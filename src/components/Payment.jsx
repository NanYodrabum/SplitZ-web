import React, { useState, useEffect } from 'react';
import { Receipt, User, Clock, ChevronDown, ChevronUp, Check, DollarSign, Tag, ArrowLeftRight } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router';
import useUserStore from '../stores/userStore';

function Payment() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedBill, setExpandedBill] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingPayment, setUpdatingPayment] = useState(null);
  const [updatingSuccess, setUpdatingSuccess] = useState('');

  const { token, user } = useUserStore();
  const navigate = useNavigate();

  const API_BASE_URL = 'http://localhost:8800';

  useEffect(() => {
    fetchBills();
  }, [token]);

  const fetchBills = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError('');

      const billsResponse = await axios.get(`${API_BASE_URL}/bills`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let billsData = [];
      if (billsResponse.data && billsResponse.data.data) {
        billsData = billsResponse.data.data;
      } else if (billsResponse.data) {
        billsData = billsResponse.data;
      }
      
      setBills(billsData);
      setLoading(false);
      
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

  const toggleBillExpansion = async (billId) => {
    if (expandedBill === billId) {
      setExpandedBill(null);
      return;
    }

    setExpandedBill(billId);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/bills/${billId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        // Process the data to ensure creator is always shown as fully paid
        if (response.data.participants) {
          response.data.participants = response.data.participants.map(participant => {
            if (participant.isCreator) {
              // Override creator's payment status to always show fully paid
              return {
                ...participant,
                pendingAmount: 0, // Set to 0 to indicate fully paid
              };
            }
            return participant;
          });
        }
        
        setBills(prevBills => 
          prevBills.map(bill => 
            bill.id === billId ? { ...bill, paymentSummary: {
              participants: response.data.participants,
              items: response.data.items
            }} : bill
          )
        );
      }
    } catch (err) {
      console.error('Error fetching bill details:', err);
      setError(`Failed to load payment details: ${err.response?.data?.message || err.message}`);
    }
  };

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
      
      setUpdatingSuccess(newStatus === 'completed' ? 'marked as paid' : 'marked as unpaid');
      
      await fetchBills();
      
      if (expandedBill) {
        await toggleBillExpansion(expandedBill);
      }
      
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError(`Failed to update payment: ${err.response?.data?.message || err.message}`);
    } finally {
      setUpdatingPayment(null);
    }
  };
  
  const handleViewBillDetails = (billId) => {
    navigate(`/dashboard/bills/${billId}`);
  };

  const filteredBills = bills.filter(bill => {
    if (searchTerm && !bill.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return `${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
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
      
      {updatingSuccess && (
        <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg text-green-700 flex items-center">
          <Check size={20} className="mr-2" />
          Payment successfully {updatingSuccess}!
        </div>
      )}
      
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
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
          {error}
        </div>
      )}
      
      {filteredBills.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 rounded-lg border">
          <p className="text-gray-600">No bills found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBills.map((bill) => (
            <div key={bill.id} className="border rounded-lg overflow-hidden">
              <div 
                className="p-4 bg-white flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={() => toggleBillExpansion(bill.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getCategoryIcon(bill.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">{bill.name}</h2>
                    </div>
                    <p className="text-sm text-gray-500">
                      {bill.description || `with ${bill.participants?.find(p => p.userId !== user.id)?.name || 'Others'}`}
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
                    <p className="font-bold text-lg">${Math.round(bill.totalAmount || 0)}</p>
                    {expandedBill === bill.id ? (
                      <ChevronUp size={20} className="ml-auto text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="ml-auto text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
              
              {expandedBill === bill.id && (
                <div className="border-t bg-white p-4">
                  <h3 className="text-lg font-medium mb-4">Payment Details</h3>
                  
                  {bill.paymentSummary ? (
                    <div className="space-y-4 mb-4">
                      {bill.paymentSummary.participants?.map((participant) => {
                        if (participant.isCreator && participant.userId === user.id) {
                          return null;
                        }
                        
                        const isProcessing = participant.pendingAmount > 0 && 
                          updatingPayment !== null;
                        
                        const pendingSplitIds = [];
                        bill.paymentSummary.items?.forEach(item => {
                          item.splits?.forEach(split => {
                            if (split.participant?.id === participant.id && 
                                split.paymentStatus === 'pending') {
                              pendingSplitIds.push(split.id);
                            }
                          });
                        });
                        
                        const completedSplitIds = [];
                        bill.paymentSummary.items?.forEach(item => {
                          item.splits?.forEach(split => {
                            if (split.participant?.id === participant.id && 
                                split.paymentStatus === 'completed') {
                              completedSplitIds.push(split.id);
                            }
                          });
                        });
                        
                        // For creators, override the pending status
                        const isPaid = participant.isCreator ? true : participant.pendingAmount === 0;
                        
                        return (
                          <div 
                            key={participant.id}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-3">
                                <User size={20} className="text-gray-600" />
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
                                
                                {/* Payment Status Button */}
                                {participant.isCreator ? (
                                  <button 
                                    className="border border-green-500 rounded-md px-6 py-1 flex items-center justify-center cursor-default"
                                  >
                                    <Check className="text-green-500 mr-1" size={16} />
                                    <span className="text-green-500">Paid</span>
                                  </button>
                                ) : isPaid ? (
                                  <button 
                                    onClick={() => updatePaymentStatus(completedSplitIds, 'pending')}
                                    className="border border-green-500 rounded-md px-6 py-1 flex items-center justify-center hover:bg-green-50"
                                  >
                                    <Check className="text-green-500 mr-1" size={16} />
                                    <span className="text-green-500">Paid</span>
                                  </button>
                                ) : isProcessing ? (
                                  <div className="border border-gray-300 rounded-md px-6 py-1 text-gray-500">
                                    <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-green-500 rounded-full inline-block mr-2"></div>
                                    Updating...
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => updatePaymentStatus(pendingSplitIds, 'completed')}
                                    className="border border-green-500 rounded-md px-6 py-1 text-green-500 hover:bg-green-50"
                                  >
                                    Mark as Paid
                                  </button>
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
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Payment;





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
//   const [updatingSuccess, setUpdatingSuccess] = useState(false);

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
      
//       setBills(billsData);
//       setLoading(false);
      
//       // If we had a success message, clear it after 3 seconds
//       if (updatingSuccess) {
//         setTimeout(() => {
//           setUpdatingSuccess(false);
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
//             bill.id === billId ? { ...bill, paymentSummary: {
//               participants: response.data.participants,
//               items: response.data.items
//             }} : bill
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
      
//       // Show success indicator
//       setUpdatingSuccess(true);
      
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
//   const PaymentStatusPill = ({ status, onClick, isProcessing }) => {
//     if (isProcessing) {
//       return (
//         <div className="bg-gray-100 px-4 py-1 rounded-full text-gray-700 flex items-center gap-2">
//           <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
//           Updating...
//         </div>
//       );
//     }
    
//     if (status === 'completed') {
//       return (
//         <div className="bg-green-100 px-4 py-1 rounded-full text-green-700 flex items-center gap-1">
//           <Check size={16} />
//           Paid
//         </div>
//       );
//     }
    
//     return (
//       <button
//         onClick={onClick}
//         className="bg-orange-100 hover:bg-orange-200 px-4 py-1 rounded-full text-orange-700 flex items-center gap-1"
//       >
//         Mark as Paid
//       </button>
//     );
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
//           Payment status updated successfully!
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
          
//           {/* Filter buttons removed as requested */}
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
//                 <div className="flex items-center gap-3">
//                   <div className="p-2 bg-gray-100 rounded-lg">
//                     {getCategoryIcon(bill.category)}
//                   </div>
//                   <div>
//                     <div className="flex items-center gap-2">
//                       <h2 className="font-semibold">{bill.name}</h2>
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
//                 <div className="flex items-center gap-4">
//                   <div className="text-right">
//                     <p className="font-bold text-lg">${Math.round(bill.totalAmount || 0)}</p>
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
//                                 split.paymentStatus === 'pending') {
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
//                                     {participant.pendingAmount > 0 ? (
//                                       <span className="text-orange-600">
//                                         ${Math.round(participant.pendingAmount)} pending
//                                       </span>
//                                     ) : (
//                                       <span className="text-green-600">Fully paid</span>
//                                     )}
//                                   </div>
//                                 </div>
                                
//                                 {/* Show payment button if there are pending payments */}
//                                 {participant.pendingAmount > 0 && pendingSplitIds.length > 0 && (
//                                   <PaymentStatusPill
//                                     status="pending"
//                                     isProcessing={isProcessing}
//                                     onClick={() => updatePaymentStatus(pendingSplitIds, 'completed')}
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
//   const [filterType, setFilterType] = useState('all');
//   const [updatingPayment, setUpdatingPayment] = useState(null);
//   const [updatingSuccess, setUpdatingSuccess] = useState(false);

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

//       // Get both the summary and all bills
//       const [summaryResponse, billsResponse] = await Promise.all([
//         axios.get(`${API_BASE_URL}/split`, {
//           headers: { Authorization: `Bearer ${token}` }
//         }),
//         axios.get(`${API_BASE_URL}/bills`, {
//           headers: { Authorization: `Bearer ${token}` }
//         })
//       ]);
      
//       // Process summary data
//       const summaryData = summaryResponse.data;
      
//       // Process bills data
//       let billsData = [];
//       if (billsResponse.data && billsResponse.data.data) {
//         billsData = billsResponse.data.data;
//       } else if (billsResponse.data) {
//         billsData = billsResponse.data;
//       }
      
//       // Merge summary and bills data
//       const processedBills = billsData.map(bill => {
//         // Find people this user owes money to for this bill
//         const peopleUserOwes = (summaryData.peopleUserOwes || [])
//           .filter(person => {
//             // Match people related to this bill
//             // We might need to modify this logic depending on how bills and people are linked
//             return bill.userId === person.userId;
//           });
          
//         // Find people who owe money to this user for this bill
//         const peopleWhoOweUser = (summaryData.peopleWhoOweUser || [])
//           .filter(person => {
//             // Match people related to this bill
//             // This is a simplified approach; adjust as needed
//             return bill.participants?.some(p => p.userId === person.userId);
//           });
          
//         return {
//           ...bill,
//           peopleUserOwes,
//           peopleWhoOweUser
//         };
//       });

//       setBills(processedBills);
//       setLoading(false);
      
//       // If we had a success message, clear it after 3 seconds
//       if (updatingSuccess) {
//         setTimeout(() => {
//           setUpdatingSuccess(false);
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
//       // Get detailed payment summary for this bill
//       const response = await axios.get(`${API_BASE_URL}/payment/${billId}`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
      
//       if (response.data) {
//         // Update the bill with payment summary details
//         setBills(prevBills => 
//           prevBills.map(bill => 
//             bill.id === billId ? { ...bill, paymentSummary: response.data } : bill
//           )
//         );
//       }
//     } catch (err) {
//       console.error('Error fetching payment details:', err);
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
      
//       // Show success indicator
//       setUpdatingSuccess(true);
      
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

//   // Filter bills based on type
//   const filteredBills = bills.filter(bill => {
//     // Filter by search term
//     if (searchTerm && !bill.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
//       return false;
//     }
    
//     // Filter by type
//     if (filterType === 'owed') {
//       return bill.userId === user.id; // Bills where user is creator (is owed money)
//     } else if (filterType === 'owing') {
//       return bill.userId !== user.id; // Bills where user is not creator (owes money)
//     }
    
//     return true; // Show all bills
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
//   const PaymentStatusPill = ({ status, onClick, isProcessing }) => {
//     if (isProcessing) {
//       return (
//         <div className="bg-gray-100 px-4 py-1 rounded-full text-gray-700 flex items-center gap-2">
//           <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
//           Updating...
//         </div>
//       );
//     }
    
//     if (status === 'completed') {
//       return (
//         <div className="bg-green-100 px-4 py-1 rounded-full text-green-700 flex items-center gap-1">
//           <Check size={16} />
//           Paid
//         </div>
//       );
//     }
    
//     return (
//       <button
//         onClick={onClick}
//         className="bg-orange-100 hover:bg-orange-200 px-4 py-1 rounded-full text-orange-700 flex items-center gap-1"
//       >
//         Mark as Paid
//       </button>
//     );
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
//           Payment status updated successfully!
//         </div>
//       )}
      
//       {/* Search and Filter */}
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
          
//           <div className="flex gap-2">
//             <button
//               onClick={() => setFilterType('all')}
//               className={`px-4 py-2 rounded-lg ${
//                 filterType === 'all' 
//                   ? 'bg-purple-600 text-white' 
//                   : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//               }`}
//             >
//               All
//             </button>
//             <button
//               onClick={() => setFilterType('owed')}
//               className={`px-4 py-2 rounded-lg ${
//                 filterType === 'owed' 
//                   ? 'bg-purple-600 text-white' 
//                   : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//               }`}
//             >
//               Money Owed to Me
//             </button>
//             <button
//               onClick={() => setFilterType('owing')}
//               className={`px-4 py-2 rounded-lg ${
//                 filterType === 'owing' 
//                   ? 'bg-purple-600 text-white' 
//                   : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//               }`}
//             >
//               Money I Owe
//             </button>
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
//                 <div className="flex items-center gap-3">
//                   <div className="p-2 bg-gray-100 rounded-lg">
//                     {getCategoryIcon(bill.category)}
//                   </div>
//                   <div>
//                     <div className="flex items-center gap-2">
//                       <h2 className="font-semibold">{bill.name}</h2>
//                       <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
//                         {bill.userId === user.id ? 'You are owed' : 'You owe'}
//                       </span>
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
//                 <div className="flex items-center gap-4">
//                   <div className="text-right">
//                     <p className="font-bold text-lg">${new Intl.NumberFormat().format(bill.totalAmount || 0)}</p>
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
//                   <h3 className="text-lg font-medium mb-4">Payment Details</h3>
                  
//                   {bill.paymentSummary ? (
//                     <div className="space-y-4 mb-4">
//                       {bill.paymentSummary.participants?.map((participant) => {
//                         // Skip showing the current user if this overview is about what others need to pay
//                         if (bill.userId === user.id && participant.userId === user.id) {
//                           return null;
//                         }
                        
//                         // Skip showing other users if this is about what the current user needs to pay
//                         if (bill.userId !== user.id && participant.userId !== user.id) {
//                           return null;
//                         }
                        
//                         // Determine if we're processing this participant's payment
//                         const isProcessing = participant.splits?.some(split => 
//                           updatingPayment && updatingPayment.includes(split.id)
//                         );
                        
//                         // Get all split IDs for this participant that are still pending
//                         const pendingSplitIds = participant.splits
//                           ?.filter(split => split.status === 'pending')
//                           ?.map(split => split.id) || [];
                        
//                         return (
//                           <div 
//                             key={participant.participant.id}
//                             className="border rounded-lg p-4"
//                           >
//                             <div className="flex justify-between items-center mb-3">
//                               <div className="flex items-center gap-3">
//                                 <User size={20} className="text-gray-600" />
//                                 <div>
//                                   <div className="flex items-center gap-2">
//                                     <span className="font-medium">{participant.participant.name}</span>
//                                     {participant.participant.isCreator && (
//                                       <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">Creator</span>
//                                     )}
//                                   </div>
//                                 </div>
//                               </div>
                              
//                               <div className="flex items-center gap-3">
//                                 <div className="text-right mr-3">
//                                   <div className="font-medium">
//                                     ${new Intl.NumberFormat().format(participant.totalAmount || 0)}
//                                   </div>
//                                   <div className="text-sm text-gray-500">
//                                     {participant.pendingAmount > 0 ? (
//                                       <span className="text-orange-600">
//                                         ${new Intl.NumberFormat().format(participant.pendingAmount)} pending
//                                       </span>
//                                     ) : (
//                                       <span className="text-green-600">Fully paid</span>
//                                     )}
//                                   </div>
//                                 </div>
                                
//                                 {/* Show payment button if there are pending payments */}
//                                 {participant.pendingAmount > 0 && pendingSplitIds.length > 0 && (
//                                   <PaymentStatusPill
//                                     status="pending"
//                                     isProcessing={isProcessing}
//                                     onClick={() => updatePaymentStatus(pendingSplitIds, 'completed')}
//                                   />
//                                 )}
//                               </div>
//                             </div>
                            
//                             {/* Item breakdown */}
//                             <div className="pl-8 mt-3 space-y-2">
//                               <div className="text-sm font-medium text-gray-500 mb-1">Item Breakdown:</div>
//                               {participant.splits?.map((split, index) => (
//                                 <div key={index} className="flex justify-between text-sm items-center">
//                                   <div className="flex-1">{split.itemName}</div>
//                                   <div className="flex items-center gap-2">
//                                     <span className="font-medium">${new Intl.NumberFormat().format(split.amount)}</span>
//                                     <span className={`text-xs px-2 py-0.5 rounded-full ${
//                                       split.status === 'completed' 
//                                         ? 'bg-green-100 text-green-600' 
//                                         : 'bg-orange-100 text-orange-600'
//                                     }`}>
//                                       {split.status === 'completed' ? 'Paid' : 'Pending'}
//                                     </span>
//                                   </div>
//                                 </div>
//                               ))}
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


// import React, { useState, useEffect } from 'react';
// import { Receipt, User, Clock, ChevronDown, ChevronUp, Check } from 'lucide-react';
// import axios from 'axios';
// import { useNavigate } from 'react-router';
// import useUserStore from '../stores/userStore';

// function Payment() {
//   const [bills, setBills] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [expandedBill, setExpandedBill] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterType, setFilterType] = useState('all');
//   const [updatingPayment, setUpdatingPayment] = useState(null);

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

//       console.log('Fetching bills...');
//       const response = await axios.get(`${API_BASE_URL}/bills`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });

//       console.log('Bills response:', response.data);
      
//       if (response.data && response.data.data) {
//         setBills(response.data.data);
//       } else if (response.data) {
//         setBills(response.data);
//       }
      
//       setLoading(false);
//     } catch (err) {
//       console.error('Error fetching bills:', err);
//       setError(`Failed to load bills: ${err.response?.data?.message || err.message}`);
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
//       console.log(`Fetching bill details for ${billId}`);
//       const response = await axios.get(`${API_BASE_URL}/bills/${billId}`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
      
//       console.log('Bill details response:', response.data);
      
//       // Update bill with detailed information
//       setBills(prevBills => 
//         prevBills.map(bill => 
//           bill.id === billId ? { ...bill, ...response.data } : bill
//         )
//       );
//     } catch (err) {
//       console.error('Error fetching bill details:', err);
//       setError(`Failed to load bill details: ${err.response?.data?.message || err.message}`);
//     }
//   };

//   // Calculate participant totals and payment status
//   const getParticipantSummary = (bill) => {
//     if (!bill.items || !bill.participants) {
//       console.log('Bill missing items or participants data', bill);
//       return [];
//     }
    
//     // Initialize summary for each participant
//     const participantSummary = {};
    
//     bill.participants.forEach(participant => {
//       participantSummary[participant.id] = {
//         participant,
//         totalAmount: 0,
//         paymentStatus: 'completed', // Default to completed, will change if any splits are pending
//         splitIds: [] // Keep track of all split IDs for this participant
//       };
//     });
    
//     // Calculate amounts from item splits
//     bill.items.forEach(item => {
//       if (!item.splits) return;
      
//       item.splits.forEach(split => {
//         const participantId = split.billParticipantId;
//         if (!participantSummary[participantId]) return;
        
//         // Add to total amount
//         participantSummary[participantId].totalAmount += split.shareAmount || 0;
        
//         // Mark as pending if any split is pending
//         if (split.paymentStatus === 'pending') {
//           participantSummary[participantId].paymentStatus = 'pending';
//         }
        
//         // Store split ID
//         participantSummary[participantId].splitIds.push(split.id);
//       });
//     });
    
//     return Object.values(participantSummary);
//   };

//   // Update payment status
//   const updatePaymentStatus = async (participantSummary, newStatus) => {
//     try {
//       if (!participantSummary.splitIds || participantSummary.splitIds.length === 0) {
//         console.error('No splitIds found for participant', participantSummary);
//         return;
//       }
      
//       setUpdatingPayment(participantSummary.participant.id);
      
//       console.log('Updating payment status with data:', {
//         splitIds: participantSummary.splitIds,
//         paymentStatus: newStatus
//       });
      
//       await axios.patch(`${API_BASE_URL}/payment`, {
//         splitIds: participantSummary.splitIds,
//         paymentStatus: newStatus
//       }, {
//         headers: { 
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });
      
//       console.log('Payment status updated successfully');
      
//       // Refresh bill data
//       await fetchBills();
      
//       // Keep expanded bill expanded
//       if (expandedBill) {
//         setTimeout(() => toggleBillExpansion(expandedBill), 100);
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

//   // Filter bills based on type
//   const filteredBills = bills.filter(bill => {
//     // Filter by search term
//     if (searchTerm && !bill.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
//       return false;
//     }
    
//     // Filter by type
//     if (filterType === 'owed') {
//       return bill.userId === user.id; // Bills where user is creator (is owed money)
//     } else if (filterType === 'owing') {
//       return bill.userId !== user.id; // Bills where user is not creator (owes money)
//     }
    
//     return true; // Show all bills
//   });

//   // Format date string
//   const formatDate = (dateString) => {
//     if (!dateString) return '';
    
//     const date = new Date(dateString);
//     return `${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
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
      
//       {/* Search and Filter */}
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
          
//           <div className="flex gap-2">
//             <button
//               onClick={() => setFilterType('all')}
//               className={`px-4 py-2 rounded-lg ${
//                 filterType === 'all' 
//                   ? 'bg-purple-600 text-white' 
//                   : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//               }`}
//             >
//               All
//             </button>
//             <button
//               onClick={() => setFilterType('owed')}
//               className={`px-4 py-2 rounded-lg ${
//                 filterType === 'owed' 
//                   ? 'bg-purple-600 text-white' 
//                   : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//               }`}
//             >
//               Money Owed to Me
//             </button>
//             <button
//               onClick={() => setFilterType('owing')}
//               className={`px-4 py-2 rounded-lg ${
//                 filterType === 'owing' 
//                   ? 'bg-purple-600 text-white' 
//                   : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//               }`}
//             >
//               Money I Owe
//             </button>
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
//                 <div className="flex items-center gap-3">
//                   <div className="p-2 bg-gray-100 rounded-lg">
//                     <Receipt size={20} className="text-gray-600" />
//                   </div>
//                   <div>
//                     <div className="flex items-center gap-2">
//                       <h2 className="font-semibold">{bill.name}</h2>
//                       <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
//                         {bill.userId === user.id ? 'You are owed' : 'You owe'}
//                       </span>
//                     </div>
//                     <p className="text-sm text-gray-500">
//                       with {bill.participants?.find(p => p.userId !== user.id)?.name || 'Others'}
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
//                 <div className="flex items-center gap-4">
//                   <div className="text-right">
//                     <p className="font-bold text-lg">${bill.totalAmount?.toFixed(2) || '0.00'}</p>
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
//                   <h3 className="text-lg font-medium mb-4">Participants</h3>
                  
//                   <div className="space-y-4 mb-4">
//                     {getParticipantSummary(bill).map((participantSummary) => (
//                       <div 
//                         key={participantSummary.participant.id}
//                         className="border rounded-lg p-4"
//                       >
//                         <div className="flex justify-between items-center">
//                           <div className="flex items-center gap-3">
//                             <User size={20} className="text-gray-600" />
//                             <div>
//                               <div className="flex items-center gap-2">
//                                 <span className="font-medium">{participantSummary.participant.name}</span>
//                                 {participantSummary.participant.userId === user.id && (
//                                   <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">You</span>
//                                 )}
//                                 {participantSummary.participant.isCreator && (
//                                   <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">Creator</span>
//                                 )}
//                               </div>
//                               <p className="text-sm text-green-600">
//                                 Total: ${participantSummary.totalAmount.toFixed(2)}
//                               </p>
//                             </div>
//                           </div>
                          
//                           {updatingPayment === participantSummary.participant.id ? (
//                             <div className="bg-gray-100 px-4 py-1 rounded-full text-gray-700 flex items-center gap-2">
//                               <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-green-500 rounded-full"></div>
//                               Updating...
//                             </div>
//                           ) : participantSummary.paymentStatus === 'completed' ? (
//                             <div className="bg-green-100 px-4 py-1 rounded-full text-green-700 flex items-center gap-1">
//                               <Check size={16} />
//                               Paid
//                             </div>
//                           ) : (
//                             <button
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 updatePaymentStatus(participantSummary, 'completed');
//                               }}
//                               className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-full"
//                             >
//                               Mark as Paid
//                             </button>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
                  
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