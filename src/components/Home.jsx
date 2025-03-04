import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import useUserStore from '../stores/userStore';

// Import Dashboard Components
import WelcomeHeader from './dashboard/WelcomeHeader';
import QuickActions from './dashboard/QuickActions';
import SummaryCards from './dashboard/SummaryCards';
import RecentBills from './dashboard/RecentBills';
import RecentActivity from './dashboard/RecentActivity';

function Home() {
  const { user, token } = useUserStore();
  const navigate = useNavigate();
  
  // State for storing data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [owedToUser, setOwedToUser] = useState(0);
  const [recentBills, setRecentBills] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [totalBillsCount, setTotalBillsCount] = useState(0);

  // API base URL
  const API_BASE_URL = 'http://localhost:8800';

  // Fetch data on component mount
  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // Function to fetch all required data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch split summary (amounts owed to user)
      const summaryResponse = await axios.get(`${API_BASE_URL}/split`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch all bills to get total count and recent bills
      const billsResponse = await axios.get(`${API_BASE_URL}/bills`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Process summary data
      if (summaryResponse.data) {
        // Store the total amount owed to user
        setOwedToUser(summaryResponse.data.totalOwedToUser || 0);
      }
      
      // Process bills data
      let billsData = [];
      if (billsResponse.data && billsResponse.data.data) {
        billsData = billsResponse.data.data;
      } else if (billsResponse.data) {
        billsData = billsResponse.data;
      }
      
      // Set the total count of bills
      setTotalBillsCount(billsData.length);
      
      // Sort bills by date (newest first) and take only the most recent 3
      const sortedBills = [...billsData]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);
      
      setRecentBills(sortedBills);
      
      // Create recent activity data
      let activities = [];
      
      // Loop through bills to get payment data
      for (const bill of billsData) {
        try {
          // Get bill details with participants and payments
          const detailResponse = await axios.get(`${API_BASE_URL}/bills/${bill.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // If this bill has participants with completed payments
          if (detailResponse.data && detailResponse.data.participants) {
            // Find recent payments
            for (const participant of detailResponse.data.participants) {
              // Skip the creator
              if (participant.isCreator) continue;
              
              // If participant has paid something
              const paidAmount = (participant.totalAmount || 0) - (participant.pendingAmount || 0);
              if (paidAmount > 0) {
                activities.push({
                  id: `payment-${bill.id}-${participant.id}`,
                  type: 'payment',
                  billId: bill.id,
                  billName: bill.name,
                  participantName: participant.name,
                  amount: Math.round(paidAmount),
                  date: bill.updatedAt || bill.createdAt,
                  isUserCreator: bill.userId === user.id
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching details for bill ${bill.id}:`, error);
        }
      }
      
      // Sort activities by date (newest first) and take only the most recent 3
      const sortedActivities = activities
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);
      
      setRecentActivity(sortedActivities);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  // Handle navigation
  const handleAddBill = () => {
    navigate('/dashboard/bills');
  };

  const handleViewBill = (billId) => {
    navigate(`/dashboard/bills/${billId}`);
  };
  
  const handleViewPaymentForBill = (billId) => {
    // Navigate to the payments page with the billId as a hash parameter
    navigate(`/dashboard/payments#bill-${billId}`);
  };

  const handleViewAllBills = () => {
    navigate('/dashboard/billlist');
  };

  const handleViewPayments = () => {
    navigate('/dashboard/payments');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Main Content */}
      <div className="flex-1">
        {/* Welcome Header */}
        <WelcomeHeader userName={user?.name} />
        
        {/* Quick Actions */}
        <QuickActions 
          onAddBill={handleAddBill} 
          onManageBills={handleViewAllBills} 
        />
        
        {/* Summary Cards */}
        <SummaryCards 
          owedToUser={owedToUser} 
          totalBillsCount={totalBillsCount} 
        />

        {/* Recent Activity and Bills */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bills */}
          <RecentBills 
            bills={recentBills} 
            onViewBill={handleViewBill} 
            onViewAllBills={handleViewAllBills} 
          />

          {/* Recent Activity */}
          <RecentActivity 
            activities={recentActivity} 
            onViewPaymentForBill={handleViewPaymentForBill} 
            onViewAllPayments={handleViewPayments} 
          />
        </div>
      </div>
    </div>
  );
}

export default Home;
