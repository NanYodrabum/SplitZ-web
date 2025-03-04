import React from 'react';
import { Clock, User, Receipt, ArrowLeftRight, Tag } from 'lucide-react';

function RecentBills({ bills, onViewBill, onViewAllBills }) {
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get appropriate icon for bill category
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

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Recent Bills</h2>
        <button 
          onClick={onViewAllBills}
          className="text-purple-600 text-sm hover:underline"
        >
          View All
        </button>
      </div>
      <div className="space-y-4">
        {bills.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No bills yet</p>
        ) : (
          bills.map(bill => (
            <div 
              key={bill.id} 
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
              onClick={() => onViewBill(bill.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  {getCategoryIcon(bill.category)}
                </div>
                <div>
                  <p className="font-medium">{bill.name}</p>
                  <p className="text-sm text-gray-500">
                    {bill.participants?.length || 0} {bill.participants?.length === 1 ? 'person' : 'people'} • {formatDate(bill.createdAt)}
                  </p>
                </div>
              </div>
              <span className="font-medium">${Math.round(bill.totalAmount || 0)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RecentBills;