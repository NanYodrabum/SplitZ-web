import React from 'react';

function SummaryCards({ owedToUser, totalBillsCount }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Money Owed to You */}
      <div className="bg-white p-6 rounded-xl border">
        <p className="text-gray-600 mb-2">Money Owed to You</p>
        <p className="text-2xl font-bold text-green-600">${Math.round(owedToUser || 0)}</p>
        <p className="text-sm text-gray-500 mt-1">
          {owedToUser > 0 ? 'You have pending payments to collect' : 'Everything is settled up'}
        </p>
      </div>
      
      {/* Total Bills Created */}
      <div className="bg-white p-6 rounded-xl border">
        <p className="text-gray-600 mb-2">Total Bills Created</p>
        <p className="text-2xl font-bold text-blue-600">{totalBillsCount}</p>
        <p className="text-sm text-gray-500 mt-1">
          Track all your expenses with friends
        </p>
      </div>
    </div>
  );
}

export default SummaryCards;