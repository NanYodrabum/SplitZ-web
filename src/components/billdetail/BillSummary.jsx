import React from 'react';
import { User } from 'lucide-react';

function BillSummary({ bill }) {
  // Get all participant summaries
  const getParticipantSummary = () => {
    if (!bill || !bill.participants) {
      return [];
    }
    
    // Initialize summary for each participant
    const summary = {};
    bill.participants.forEach(participant => {
      summary[participant.id] = {
        name: participant.name || `Person ${participant.id}`,
        amount: 0,
        isCreator: participant.isCreator
      };
    });
    
    // If no items data, divide total bill amount evenly
    if (!bill.items || bill.items.length === 0) {
      const evenShareAmount = bill.totalAmount / bill.participants.length;
      bill.participants.forEach(participant => {
        summary[participant.id].amount = Math.round(evenShareAmount);
      });
      return Object.values(summary);
    }
    
    // Calculate each participant's share from item splits
    bill.items.forEach(item => {
      // If no splits data for this item or empty splits array
      if (!item.splits || item.splits.length === 0) {
        // Divide item amount evenly among all participants
        const evenShareAmount = item.totalAmount / bill.participants.length;
        bill.participants.forEach(participant => {
          summary[participant.id].amount += Math.round(evenShareAmount);
        });
      } else {
        // Process each split
        item.splits.forEach(split => {
          // First try billParticipantId
          let participantId = split.billParticipantId;
          
          // If that doesn't exist, try participant.id
          if (participantId === undefined && split.participant) {
            participantId = split.participant.id;
          }
          
          // If still undefined, check for other possible property names
          if (participantId === undefined && split.participantId) {
            participantId = split.participantId;
          }
          
          if (participantId !== undefined && summary[participantId]) {
            const amount = parseFloat(split.shareAmount) || 0;
            summary[participantId].amount += Math.round(amount);
          }
        });
      }
    });
    
    return Object.values(summary);
  };

  return (
    <div className="bg-white rounded-xl border p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Bill Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column - Bill Breakdown */}
        <div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Base Total</span>
              <span className="font-medium">
                ${bill.items?.reduce((sum, item) => sum + (item.basePrice || 0), 0) || '0'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax Total</span>
              <span className="font-medium">
                ${bill.items?.reduce((sum, item) => sum + (item.taxAmount || 0), 0) || '0'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Service Total</span>
              <span className="font-medium">
                ${bill.items?.reduce((sum, item) => sum + (item.serviceAmount || 0), 0) || '0'}
              </span>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex justify-between font-semibold">
              <span>Grand Total</span>
              <span>${bill.totalAmount || '0'}</span>
            </div>
          </div>
          
          {/* Custom breakdown section to show total calculations */}
          <div className="mt-4 pt-6 border-t">
            <h3 className="font-medium mb-2">Bill Total Details</h3>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Total Bill Amount</span>
              <span className="font-medium">${Math.round(parseFloat(bill.totalAmount || 0))}</span>
            </div>
            <p className="text-xs text-blue-600 mb-4">
              * Total amounts are calculated based on the bill's total value
            </p>
          </div>
        </div>
        
        {/* Right Column - Each Person Pays */}
        <div>
          <h3 className="font-medium mb-3">Each Person Pays</h3>
          <div className="space-y-3">
            {getParticipantSummary().map((summary) => (
              <div key={summary.name} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <User size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{summary.name}</span>
                        {summary.isCreator && (
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">
                            Creator
                          </span>
                        )}
                      </div>
                      
                      {/* Show payment status indicator */}
                      {summary.isCreator ? (
                        <span className="text-xs text-green-600">Paid</span>
                      ) : (
                        <span className="text-xs text-orange-600">Pending</span>
                      )}
                    </div>
                  </div>
                  <span className="font-semibold">${Math.round(summary.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BillSummary;