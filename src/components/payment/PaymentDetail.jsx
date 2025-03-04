import React from 'react';
import { User } from 'lucide-react';
import PaymentStatusPill from './PaymentStatusPill';

function PaymentDetail({ 
  participant, 
  bill, 
  isProcessing, 
  updatePaymentStatus 
}) {
  // Skip showing the creator if they are the current user
  if (participant.isCreator && participant.userId === bill.userId) {
    return null;
  }

  // Get all pending split IDs for this participant
  const pendingSplitIds = [];
  bill.paymentSummary.items?.forEach(item => {
    item.splits?.forEach(split => {
      if (split.participant?.id === participant.id &&
        split.paymentStatus === 'pending') {
        pendingSplitIds.push(split.id);
      }
    });
  });

  // Find all completed split IDs for this participant
  const completedSplitIds = [];
  bill.paymentSummary.items?.forEach(item => {
    item.splits?.forEach(split => {
      if (split.participant?.id === participant.id &&
        split.paymentStatus === 'completed') {
        completedSplitIds.push(split.id);
      }
    });
  });

  return (
    // No borders at all, just padding and margin
    <div className="p-3 mb-3 last:mb-0">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center'>
            <User size={20} className="text-gray-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{participant.name}</span>
              {participant.isCreator && (
                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">Creator</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right mr-3">
            <div className="font-medium">
              ${Math.round(participant.totalAmount || 0)}
            </div>
            <div className="text-sm text-gray-500">
              {participant.isCreator ? (
                <span className="text-green-600">Fully paid</span>
              ) : participant.pendingAmount > 0 ? (
                <span className="text-orange-600">
                  ${Math.round(participant.pendingAmount)} pending
                </span>
              ) : (
                <span className="text-green-600">Fully paid</span>
              )}
            </div>
          </div>

          {/* Use PaymentStatusPill component here */}
          {participant.isCreator ? (
            <PaymentStatusPill
              status="completed"
              isCreator={true}
            />
          ) : (
            <PaymentStatusPill
              status={participant.pendingAmount > 0 ? "pending" : "completed"}
              isProcessing={isProcessing}
              isCreator={false}
              onClick={() => updatePaymentStatus(pendingSplitIds, 'completed')}
              onUndo={() => updatePaymentStatus(completedSplitIds, 'pending')}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentDetail;