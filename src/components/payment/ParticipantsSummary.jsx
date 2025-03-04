import React from 'react';
import { User } from 'lucide-react';

function ParticipantsSummary({ bill, getParticipantSummary }) {
  return (
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
  );
}

export default ParticipantsSummary;
