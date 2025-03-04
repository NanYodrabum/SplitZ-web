import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';

function RecentActivity({ activities, onViewPaymentForBill, onViewAllPayments }) {
  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <button 
          onClick={onViewAllPayments}
          className="text-purple-600 text-sm hover:underline"
        >
          View All
        </button>
      </div>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        ) : (
          activities.map(activity => (
            <div 
              key={activity.id} 
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
              onClick={() => onViewPaymentForBill(activity.billId)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">
                    {activity.participantName} paid you
                  </p>
                  <p className="text-sm text-gray-500">
                    For {activity.billName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-600">
                  +${activity.amount}
                </span>
                <ArrowRight size={16} className="text-green-600" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RecentActivity;