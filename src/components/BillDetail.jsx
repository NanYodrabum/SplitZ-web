// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router';
// import axios from 'axios';
// import { Receipt, User, ArrowLeft, Edit2, Trash2, DollarSign, Calendar, Users, Package } from 'lucide-react';
// import useUserStore from '../stores/userStore';

// function BillDetail() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { token, user } = useUserStore();
//   const [bill, setBill] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [deleteConfirmation, setDeleteConfirmation] = useState(false);

//   const API_BASE_URL = 'http://localhost:8800';

//   useEffect(() => {
//     const fetchBillDetails = async () => {
//       try {
//         setLoading(true);
//         const response = await axios.get(`${API_BASE_URL}/bills/${id}`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });

//         setBill(response.data);
//         setLoading(false);
//       } catch (err) {
//         console.error('Error fetching bill details:', err);
//         setError(err.response?.data?.message || 'Failed to load bill details. Please try again.');
//         setLoading(false);
//       }
//     };

//     if (token && id) {
//       fetchBillDetails();
//     }
//   }, [id, token]);

//   const handleEdit = () => {
//     navigate(`/dashboard/bills/edit/${id}`); // Updated edit navigation
//   };

//   const handleDelete = async () => {
//     try {
//       await axios.delete(`${API_BASE_URL}/bills/${id}`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       navigate('/dashboard/bills');
//     } catch (err) {
//       console.error('Error deleting bill:', err);
//       setError(err.response?.data?.message || 'Failed to delete the bill. Please try again.');
//     }
//   };

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     });
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-center">
//         <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
//         <p className="text-red-600">{error}</p>
//       </div>
//     );
//   }

//   if (!bill) {
//     return (
//       <div className="text-center p-10">
//         <p>Bill not found</p>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-4xl mx-auto px-4 py-6">
//       {/* Header */}
//       <div className="flex items-center justify-between mb-6">
//         <button
//           onClick={() => navigate('/bills')}
//           className="flex items-center text-gray-600 hover:text-gray-900"
//         >
//           <ArrowLeft size={20} className="mr-2 " />
//           Back to Bills
//         </button>
        
//         {bill.userId === user.id && (
//           <div className="flex gap-2">
//             <button
//               onClick={handleEdit}
//               className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg"
//             >
//               <Edit2 size={16} className="mr-2" />
//               Edit
//             </button>
//             <button
//               onClick={() => setDeleteConfirmation(true)}
//               className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg"
//             >
//               <Trash2 size={16} className="mr-2" />
//               Delete
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Delete Confirmation Modal */}
//       {deleteConfirmation && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
//           <div className="bg-white rounded-lg p-6 w-96">
//             <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
//             <p className="text-gray-600 mb-6">Are you sure you want to delete this bill? This action cannot be undone.</p>
//             <div className="flex justify-end gap-4">
//               <button
//                 onClick={() => setDeleteConfirmation(false)}
//                 className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={() => {
//                   setDeleteConfirmation(false);
//                   handleDelete();
//                 }}
//                 className="px-4 py-2 bg-red-600 text-white rounded-lg"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Bill Details */}
//       <div className="bg-white rounded-xl shadow-lg p-6">
//         <div className="flex justify-between items-start mb-6">
//           <div>
//             <h1 className="text-3xl font-bold mb-2">{bill.name}</h1>
//             {bill.description && (
//               <p className="text-gray-600 mb-4">{bill.description}</p>
//             )}
//           </div>
//           <div className="text-right">
//             <div className="text-2xl font-bold text-purple-600">
//               ${bill.totalAmount?.toFixed(2)}
//             </div>
//             <div className="text-sm text-gray-500">Total Amount</div>
//           </div>
//         </div>

//         {/* Bill Meta Information */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
//           <div className="flex items-center p-4 bg-gray-50 rounded-lg">
//             <Calendar className="text-gray-500 mr-3" />
//             <div>
//               <div className="text-sm text-gray-500">Date</div>
//               <div className="font-medium">{formatDate(bill.createdAt)}</div>
//             </div>
//           </div>
          
//           <div className="flex items-center p-4 bg-gray-50 rounded-lg">
//             <Receipt className="text-gray-500 mr-3" />
//             <div>
//               <div className="text-sm text-gray-500">Category</div>
//               <div className="font-medium capitalize">{bill.category || 'Uncategorized'}</div>
//             </div>
//           </div>

//           <div className="flex items-center p-4 bg-gray-50 rounded-lg">
//             <Users className="text-gray-500 mr-3" />
//             <div>
//               <div className="text-sm text-gray-500">Participants</div>
//               <div className="font-medium">{bill.participants?.length || 0} people</div>
//             </div>
//           </div>
//         </div>

//         {/* Participants List */}
//         <div className="mb-8">
//           <h2 className="text-xl font-semibold mb-4">Participants</h2>
//           <div className="space-y-3">
//             {bill.participants?.map((participant) => (
//               <div
//                 key={participant.id}
//                 className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
//               >
//                 <div className="flex items-center">
//                   <User className="text-gray-500 mr-3" />
//                   <div>
//                     <div className="font-medium">{participant.name}</div>
//                     <div className="text-sm text-gray-500">{participant.userId}</div>
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   <div className="font-medium">{participant.isCreator ? 'Creator' : 'Participant'}</div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Items List */}
//         <div>
//           <h2 className="text-xl font-semibold mb-4">Items</h2>
//           <div className="space-y-3">
//             {bill.items?.map((item) => (
//               <div
//                 key={item.id}
//                 className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
//               >
//                 <div className="flex items-center">
//                   <Package className="text-gray-500 mr-3" />
//                   <div>
//                     <div className="font-medium">{item.name}</div>
//                     <div className="text-sm text-gray-500">
//                       Base Price: ${item.basePrice.toFixed(2)}
//                     </div>
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   <div className="font-medium">
//                     Total: ${item.totalAmount.toFixed(2)}
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default BillDetail;

import React, { useState, useEffect } from 'react';
import { Receipt, User, ArrowRight, DollarSign, Tag, Clock, ArrowLeftRight } from 'lucide-react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router';
import useUserStore from '../stores/userStore';

function BillDetail() {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useUserStore();

  // Define your API base URL - store this in an environment variable in a real application
  const API_BASE_URL = 'http://localhost:8800';

  useEffect(() => {
    const fetchBillDetails = async () => {
      try {
        setLoading(true);
        
        // Check if billId is defined before making the request
        if (!id) {
          throw new Error('Bill ID is missing');
        }
        
        // Get the bill details
        const billResponse = await axios.get(`${API_BASE_URL}/bills/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!billResponse.data) {
          throw new Error('No bill data received');
        }
        
        const billData = billResponse.data;
        
        // Get the bill items
        const itemsResponse = await Promise.all(
          billData.itemIds.map(itemId => 
            axios.get(`${API_BASE_URL}/items/${itemId}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          )
        );
        
        // Extract items data
        const itemsData = itemsResponse.map(response => response.data);
        
        // Get share items for each item
        const itemsWithShares = await Promise.all(
          itemsData.map(async (item) => {
            const shareResponse = await axios.get(`${API_BASE_URL}/share-items/${item.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            return {
              ...item,
              splits: shareResponse.data || []
            };
          })
        );
        
        // Construct the complete bill object
        const completeBill = {
          ...billData,
          items: itemsWithShares
        };
        
        setBill(completeBill);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching bill details:', err);
        setError(err.response?.data?.message || 'Failed to load bill details. Please try again.');
        setLoading(false);
      }
    };

    if (id && token) {
      fetchBillDetails();
    } else if (!id) {
      setError('Bill ID is missing. Please select a valid bill.');
      setLoading(false);
    }
  }, [id, token, API_BASE_URL]);


  // Function to handle bill deletion
  const handleDeleteBill = async () => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      try {
        await axios.delete(`${API_BASE_URL}/bills/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        navigate('/dashboard');
      } catch (err) {
        console.error('Error deleting bill:', err);
        setError(err.response?.data?.message || 'Failed to delete the bill. Please try again.');
      }
    }
  };

  // Function to handle bill editing
  const handleEditBill = () => {
    navigate(`/dashboard/bills/edit/${id}`);
  };

  const handleGoBack = () => {
    navigate("/dashboard/billlist");
  };

  const calculateParticipantOwes = (participantId) => {
    if (!bill) return 0;
    
    return bill.items.reduce((total, item) => {
      const participantSplit = item.splits.find(split => split.participantId === participantId);
      if (participantSplit && participantSplit.paymentStatus === "pending") {
        return total + participantSplit.shareAmount;
      }
      return total;
    }, 0);
  };

  const calculateParticipantPaid = (participantId) => {
    if (!bill) return 0;
    
    return bill.items.reduce((total, item) => {
      const participantSplit = item.splits.find(split => split.participantId === participantId);
      if (participantSplit && participantSplit.paymentStatus === "completed") {
        return total + participantSplit.shareAmount;
      }
      return total;
    }, 0);
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
        <button onClick={handleGoBack} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">Go Back</button>
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
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
                <span>{formatDate(bill.date)}</span>
              </div>
              <div className="flex items-center gap-1">
                <User size={16} />
                <span>Created by {bill.creator.name}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-sm">Total Amount</p>
            <p className="text-3xl font-bold">${bill.totalAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* Action buttons */}
        {bill.creator.id === user.id && (
          <div className="flex gap-3 mt-4 justify-end">
            <button
              onClick={handleEditBill}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Edit Bill
            </button>
            <button
              onClick={handleDeleteBill}
              className="px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              Delete Bill
            </button>
          </div>
        )}
      </div>

      {/* Participants and Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Participants */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Participants</h2>
          
          <div className="space-y-4">
            {bill.participants.map(participant => {
              const owesAmount = calculateParticipantOwes(participant.id);
              const paidAmount = calculateParticipantPaid(participant.id);
              const total = owesAmount + paidAmount;
              
              return (
                <div key={participant.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <User size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {participant.name}
                        {participant.isCreator && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">
                            Creator
                          </span>
                        )}
                      </p>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="flex items-center">
                          <DollarSign size={14} className="text-green-600" />
                          <span className="text-green-600">${paidAmount.toFixed(2)} paid</span>
                        </span>
                        {owesAmount > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center">
                              <DollarSign size={14} className="text-red-600" />
                              <span className="text-red-600">${owesAmount.toFixed(2)} pending</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Share</p>
                    <p className="font-bold">${total.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Bill Summary</h2>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Base Total</span>
              <span className="font-medium">
                ${bill.items.reduce((sum, item) => sum + item.basePrice, 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax Total</span>
              <span className="font-medium">
                ${bill.items.reduce((sum, item) => sum + item.taxAmount, 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Service Total</span>
              <span className="font-medium">
                ${bill.items.reduce((sum, item) => sum + item.serviceAmount, 0).toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex justify-between font-semibold">
              <span>Grand Total</span>
              <span>${bill.totalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium mb-3">Payment Status</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Paid</span>
                <span className="font-medium text-green-600">
                  ${bill.participants.reduce((sum, p) => sum + calculateParticipantPaid(p.id), 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pending</span>
                <span className="font-medium text-red-600">
                  ${bill.participants.reduce((sum, p) => sum + calculateParticipantOwes(p.id), 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bill Items */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Bill Items</h2>
        
        <div className="space-y-6">
          {bill.items.map(item => (
            <div key={item.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <div className="flex gap-3 text-sm text-gray-500 mt-1">
                    <span>Base: ${item.basePrice.toFixed(2)}</span>
                    <span>•</span>
                    <span>Tax: {item.taxPercent}% (${item.taxAmount.toFixed(2)})</span>
                    <span>•</span>
                    <span>Service: {item.servicePercent}% (${item.serviceAmount.toFixed(2)})</span>
                  </div>
                </div>
                <span className="font-bold">${item.totalAmount.toFixed(2)}</span>
              </div>
              
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600 mb-2">Split Between:</p>
                <div className="flex flex-wrap gap-2">
                  {item.splits.map((split, index) => {
                    const participant = bill.participants.find(p => p.id === split.participantId);
                    
                    return (
                      <div 
                        key={index}
                        className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                          split.paymentStatus === "completed"
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        <span>{participant?.name}</span>
                        <span>${split.shareAmount.toFixed(2)}</span>
                        {split.paymentStatus === "completed" && (
                          <span className="text-xs ml-1">(Paid)</span>
                        )}
                        {split.paymentStatus === "pending" && (
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