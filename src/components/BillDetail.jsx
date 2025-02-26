import React, { useState, useEffect } from 'react';
import { Receipt, User, ArrowRight, DollarSign, Tag, Clock, ArrowLeftRight } from 'lucide-react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router';
import useUserStore from '../stores/userStore';

function BillDetail() {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { billId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useUserStore();

  useEffect(() => {
    const fetchBillDetails = async () => {
      try {
        setLoading(true);
        // This would be replaced with an actual API call
        // const response = await axios.get(`http://localhost:8800/bills/${billId}`, {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        
        // For demonstration purposes, we'll use mock data
        // In a real application, you would uncomment the axios call and use the response data
        const mockBill = {
          id: billId,
          name: "Dinner at Italian Restaurant",
          description: "Team dinner after project completion",
          category: "dining",
          date: "2025-02-24",
          totalAmount: 156.75,
          creator: {
            id: 1,
            name: "Jane Doe"
          },
          participants: [
            { id: 1, name: "Jane Doe", isCreator: true },
            { id: 2, name: "John Smith", isCreator: false },
            { id: 3, name: "Mike Johnson", isCreator: false }
          ],
          items: [
            {
              id: 1,
              name: "Margherita Pizza",
              basePrice: 12.99,
              taxPercent: 7,
              taxAmount: 0.91,
              servicePercent: 10,
              serviceAmount: 1.30,
              totalAmount: 15.20,
              splits: [
                { participantId: 1, shareAmount: 5.07, paymentStatus: "completed" },
                { participantId: 2, shareAmount: 5.07, paymentStatus: "pending" },
                { participantId: 3, shareAmount: 5.06, paymentStatus: "pending" }
              ]
            },
            {
              id: 2,
              name: "Pasta Carbonara",
              basePrice: 16.50,
              taxPercent: 7,
              taxAmount: 1.16,
              servicePercent: 10,
              serviceAmount: 1.65,
              totalAmount: 19.31,
              splits: [
                { participantId: 1, shareAmount: 19.31, paymentStatus: "completed" }
              ]
            },
            {
              id: 3,
              name: "Tiramisu",
              basePrice: 8.75,
              taxPercent: 7,
              taxAmount: 0.61,
              servicePercent: 10,
              serviceAmount: 0.88,
              totalAmount: 10.24,
              splits: [
                { participantId: 2, shareAmount: 5.12, paymentStatus: "pending" },
                { participantId: 3, shareAmount: 5.12, paymentStatus: "pending" }
              ]
            },
            {
              id: 4,
              name: "Bottle of Wine",
              basePrice: 32.00,
              taxPercent: 7,
              taxAmount: 2.24,
              servicePercent: 10,
              serviceAmount: 3.20,
              totalAmount: 37.44,
              splits: [
                { participantId: 1, shareAmount: 12.48, paymentStatus: "completed" },
                { participantId: 2, shareAmount: 12.48, paymentStatus: "pending" },
                { participantId: 3, shareAmount: 12.48, paymentStatus: "pending" }
              ]
            },
            {
              id: 5,
              name: "Appetizer Platter",
              basePrice: 24.50,
              taxPercent: 7,
              taxAmount: 1.72,
              servicePercent: 10,
              serviceAmount: 2.45,
              totalAmount: 28.67,
              splits: [
                { participantId: 1, shareAmount: 9.56, paymentStatus: "completed" },
                { participantId: 2, shareAmount: 9.56, paymentStatus: "pending" },
                { participantId: 3, shareAmount: 9.55, paymentStatus: "pending" }
              ]
            },
            {
              id: 6,
              name: "Mineral Water",
              basePrice: 4.50,
              taxPercent: 7,
              taxAmount: 0.32,
              servicePercent: 10,
              serviceAmount: 0.45,
              totalAmount: 5.27,
              splits: [
                { participantId: 1, shareAmount: 1.76, paymentStatus: "completed" },
                { participantId: 2, shareAmount: 1.76, paymentStatus: "pending" },
                { participantId: 3, shareAmount: 1.75, paymentStatus: "pending" }
              ]
            }
          ]
        };

        setBill(mockBill);
        setLoading(false);
      } catch (err) {
        setError('Failed to load bill details. Please try again.');
        setLoading(false);
      }
    };

    fetchBillDetails();
  }, [billId, token]);

  const handleGoBack = () => {
    navigate(-1);
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