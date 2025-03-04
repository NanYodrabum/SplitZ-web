import React, { useState, useEffect } from 'react';
import { Check, DollarSign } from 'lucide-react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router';
import useUserStore from '../stores/userStore';

// Import components
import SearchBar from './billlist/SearchBar';
import EmptyBillList from './payment/EmptyBillList';
import PaymentHeader from './payment/PaymentHeader';
import BillListItem from './payment/BillListItem';
import { formatDate, getCategoryIcon } from './payment/PaymentUtils';

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

  // Filter bills based on search term 
  const filteredBills = bills
    .filter(bill => {
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
    })
    // Sort bills by date (newest first)
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

  // Calculate item total (base + tax + service) with rounding
  const calculateItemTotal = (item) => {
    const base = parseFloat(item.basePrice) || 0;
    const tax = (base * (parseFloat(item.taxPercent) || 0)) / 100;
    const serviceCharge = (base * (parseFloat(item.serviceChargePercent) || 0)) / 100;
    return Math.round(base + tax + serviceCharge);
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
      <PaymentHeader />

      {/* Success Message */}
      {updatingSuccess && (
        <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg text-green-700 flex items-center">
          <Check size={20} className="mr-2" />
          Payment successfully {updatingSuccess}!
        </div>
      )}

      {/* Search Bar */}
      <SearchBar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Bills List */}
      {filteredBills.length === 0 ? (
        <EmptyBillList />
      ) : (
        <div className="space-y-4">
          {filteredBills.map((bill) => (
            <BillListItem
              key={bill.id}
              bill={bill}
              expandedBill={expandedBill}
              onToggleExpand={toggleBillExpansion}
              formatDate={formatDate}
              getCategoryIcon={getCategoryIcon}
              getPaymentStatusBadge={getPaymentStatusBadge}
              calculateItemTotal={calculateItemTotal}
              getParticipantSummary={getParticipantSummary}
              isProcessing={updatingPayment !== null}
              updatePaymentStatus={updatePaymentStatus}
              onViewBillDetails={handleViewBillDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Payment;