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


// import React, { useState, useEffect } from 'react';
// import { Plus, Receipt, ArrowRight, Clock, User, Tag, ArrowLeftRight } from 'lucide-react';
// import { useNavigate } from 'react-router';
// import axios from 'axios';
// import useUserStore from '../stores/userStore';

// function Home() {
//   const { user, token } = useUserStore();
//   const navigate = useNavigate();
  
//   // State for storing data
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [owedToUser, setOwedToUser] = useState(0);
//   const [recentBills, setRecentBills] = useState([]);
//   const [recentActivity, setRecentActivity] = useState([]);
//   const [totalBillsCount, setTotalBillsCount] = useState(0);

//   // API base URL
//   const API_BASE_URL = 'http://localhost:8800';

//   // Fetch data on component mount
//   useEffect(() => {
//     if (token) {
//       fetchData();
//     }
//   }, [token]);

//   // Function to fetch all required data
//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       setError('');
      
//       // Fetch split summary (amounts owed to user)
//       const summaryResponse = await axios.get(`${API_BASE_URL}/split`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
      
//       console.log('Split summary response:', summaryResponse.data);
      
//       // Fetch all bills to get total count and recent bills
//       const billsResponse = await axios.get(`${API_BASE_URL}/bills`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
      
//       // Process summary data
//       if (summaryResponse.data) {
//         // Store the total amount owed to user
//         setOwedToUser(summaryResponse.data.totalOwedToUser || 0);
//       }
      
//       // Process bills data
//       let billsData = [];
//       if (billsResponse.data && billsResponse.data.data) {
//         billsData = billsResponse.data.data;
//       } else if (billsResponse.data) {
//         billsData = billsResponse.data;
//       }
      
//       // Set the total count of bills
//       setTotalBillsCount(billsData.length);
      
//       // Sort bills by date (newest first) and take only the most recent 3
//       const sortedBills = [...billsData]
//         .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
//         .slice(0, 3);
      
//       setRecentBills(sortedBills);
      
//       // Create recent activity data
//       let activities = [];
      
//       // Loop through bills to get payment data
//       for (const bill of billsData) {
//         try {
//           // Get bill details with participants and payments
//           const detailResponse = await axios.get(`${API_BASE_URL}/bills/${bill.id}`, {
//             headers: { Authorization: `Bearer ${token}` }
//           });
          
//           // If this bill has participants with completed payments
//           if (detailResponse.data && detailResponse.data.participants) {
//             // Find recent payments
//             for (const participant of detailResponse.data.participants) {
//               // Skip the creator
//               if (participant.isCreator) continue;
              
//               // If participant has paid something
//               const paidAmount = (participant.totalAmount || 0) - (participant.pendingAmount || 0);
//               if (paidAmount > 0) {
//                 activities.push({
//                   id: `payment-${bill.id}-${participant.id}`,
//                   type: 'payment',
//                   billId: bill.id,
//                   billName: bill.name,
//                   participantName: participant.name,
//                   amount: Math.round(paidAmount),
//                   date: bill.updatedAt || bill.createdAt,
//                   isUserCreator: bill.userId === user.id
//                 });
//               }
//             }
//           }
//         } catch (error) {
//           console.error(`Error fetching details for bill ${bill.id}:`, error);
//         }
//       }
      
//       // Sort activities by date (newest first) and take only the most recent 3
//       const sortedActivities = activities
//         .sort((a, b) => new Date(b.date) - new Date(a.date))
//         .slice(0, 3);
      
//       setRecentActivity(sortedActivities);
//       setLoading(false);
//     } catch (err) {
//       console.error('Error fetching data:', err);
//       setError('Failed to load dashboard data');
//       setLoading(false);
//     }
//   };

//   // Handle navigation
//   const handleAddBill = () => {
//     navigate('/dashboard/bills');
//   };

//   const handleViewBill = (billId) => {
//     navigate(`/dashboard/bills/${billId}`);
//   };
  
//   const handleViewPaymentForBill = (billId) => {
//     // Navigate to the payments page with the billId as a hash parameter
//     // This will allow us to scroll to the specific bill section
//     navigate(`/dashboard/payments#bill-${billId}`);
//   };

//   const handleViewAllBills = () => {
//     navigate('/dashboard/billlist');
//   };

//   const handleViewPayments = () => {
//     navigate('/dashboard/payments');
//   };

//   // Format date
//   const formatDate = (dateString) => {
//     if (!dateString) return '';
    
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', { 
//       month: 'short', 
//       day: 'numeric' 
//     });
//   };

//   // Get appropriate icon for bill category
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

//   // Show loading state
//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
//       </div>
//     );
//   }

//   return (
//     <div>
//       {/* Main Content */}
//       <div className="flex-1 p-8 lg:pl-8">
//         {/* Welcome Section */}
//         <div className="mb-8">
//           <h1 className="text-2xl font-semibold mb-2">Welcome back, {user?.name || 'Friend'}</h1>
//           <p className="text-gray-600">Here's your expense overview</p>
//         </div>

//         {/* Quick Actions */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
//           <button 
//             onClick={handleAddBill}
//             className="flex items-center gap-3 p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
//           >
//             <Plus size={24} />
//             <span>Add New Bill</span>
//           </button>
//           <button 
//             onClick={handleViewAllBills}
//             className="flex items-center gap-3 p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
//           >
//             <Receipt size={24} />
//             <span>Manage Bills</span>
//           </button>
//         </div>

//         {/* Summary Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
//           {/* Money Owed to You */}
//           <div className="bg-white p-6 rounded-xl border">
//             <p className="text-gray-600 mb-2">Money Owed to You</p>
//             <p className="text-2xl font-bold text-green-600">${Math.round(owedToUser || 0)}</p>
//             <p className="text-sm text-gray-500 mt-1">
//               {owedToUser > 0 ? 'You have pending payments to collect' : 'Everything is settled up'}
//             </p>
//           </div>
          
//           {/* Total Bills Created */}
//           <div className="bg-white p-6 rounded-xl border">
//             <p className="text-gray-600 mb-2">Total Bills Created</p>
//             <p className="text-2xl font-bold text-blue-600">{totalBillsCount}</p>
//             <p className="text-sm text-gray-500 mt-1">
//               Track all your expenses with friends
//             </p>
//           </div>
//         </div>

//         {/* Recent Activity and Bills */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {/* Recent Bills */}
//           <div className="bg-white rounded-xl border p-6">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-lg font-semibold">Recent Bills</h2>
//               <button 
//                 onClick={handleViewAllBills}
//                 className="text-purple-600 text-sm hover:underline"
//               >
//                 View All
//               </button>
//             </div>
//             <div className="space-y-4">
//               {recentBills.length === 0 ? (
//                 <p className="text-gray-500 text-center py-4">No bills yet</p>
//               ) : (
//                 recentBills.map(bill => (
//                   <div 
//                     key={bill.id} 
//                     className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
//                     onClick={() => handleViewBill(bill.id)}
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
//                         {getCategoryIcon(bill.category)}
//                       </div>
//                       <div>
//                         <p className="font-medium">{bill.name}</p>
//                         <p className="text-sm text-gray-500">
//                           {bill.participants?.length || 0} {bill.participants?.length === 1 ? 'person' : 'people'} • {formatDate(bill.createdAt)}
//                         </p>
//                       </div>
//                     </div>
//                     <span className="font-medium">${Math.round(bill.totalAmount || 0)}</span>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>

//           {/* Recent Activity */}
//           <div className="bg-white rounded-xl border p-6">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-lg font-semibold">Recent Activity</h2>
//               <button 
//                 onClick={handleViewPayments}
//                 className="text-purple-600 text-sm hover:underline"
//               >
//                 View All
//               </button>
//             </div>
//             <div className="space-y-4">
//               {recentActivity.length === 0 ? (
//                 <p className="text-gray-500 text-center py-4">No recent activity</p>
//               ) : (
//                 recentActivity.map(activity => (
//                   <div 
//                     key={activity.id} 
//                     className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
//                     onClick={() => handleViewPaymentForBill(activity.billId)}
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
//                         <Clock size={20} className="text-gray-600" />
//                       </div>
//                       <div>
//                         <p className="font-medium">
//                           {activity.participantName} paid you
//                         </p>
//                         <p className="text-sm text-gray-500">
//                           For {activity.billName}
//                         </p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <span className="font-medium text-green-600">
//                         +${activity.amount}
//                       </span>
//                       <ArrowRight size={16} className="text-green-600" />
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Home;


